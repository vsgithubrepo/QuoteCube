/**
 * quotes.js - Routes: /api/quotes
 *
 * Purpose:
 *   Handles all quote creation, retrieval, and updates.
 *   This is the core transactional part of QuoteCube.
 *
 * Key design rule:
 *   grand_total is NEVER accepted from the frontend.
 *   It is ALWAYS calculated server-side by calculateQuoteTotal()
 *   after line items are saved. This prevents price manipulation.
 *
 * Routes:
 *   POST   /api/quotes          - create new quote + line items
 *   GET    /api/quotes          - paginated list of all quotes
 *   GET    /api/quotes/:id      - single quote with all line items
 *   PUT    /api/quotes/:id      - update quote, recalculate total
 *
 * GST behaviour:
 *   - Customer state code is saved on the quote
 *   - calculateQuoteTotal() determines IGST vs CGST+SGST automatically
 *   - All tax amounts are stored on the quote record
 *
 * Database tables used:
 *   quotes           - quote header (one row per quote)
 *   quote_line_items - individual items (many rows per quote)
 *   quote_events     - immutable audit log (every action recorded)
 */

const express                                       = require('express');
const router                                        = express.Router();
const supabase                                      = require('../config/supabase');
const { calculateQuoteTotal }                       = require('../services/pricing');

// ── POST /api/quotes - Create a new quote ─────────────────────────────────
//
// Expected request body:
// {
//   customer_name       : 'Acme Logistics',
//   customer_email      : 'contact@acme.com',
//   customer_gstin      : '27XXXXX',           // optional
//   customer_state      : 'Maharashtra',
//   customer_state_code : '27',
//   billing_cycle       : 'annual',            // or 'monthly'
//   line_items: [
//     {
//       item_type    : 'module',               // module | api | server | role
//       item_id      : 'uuid-of-item',
//       item_name    : 'EMS Module',
//       quantity     : 1,
//       unit_price   : 5000,
//       line_total   : 5000,
//       sac_code     : '998314',
//       gst_rate     : 18
//     }
//   ]
// }
router.post('/', async (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_gstin,
    customer_state,
    customer_state_code,
    billing_cycle,
    line_items
  } = req.body;

  // Validate required fields before touching the database
  if (!customer_name || !customer_state_code || !billing_cycle) {
    return res.status(400).json({
      error: 'customer_name, customer_state_code, and billing_cycle are required'
    });
  }

  if (!line_items || line_items.length === 0) {
    return res.status(400).json({ error: 'At least one line item is required' });
  }

  try {
    // Step 1: Create the quote header with zero totals.
    // Totals will be calculated and updated after line items are saved.
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        customer_name,
        customer_email,
        customer_gstin,
        customer_state,
        customer_state_code,
        billing_cycle,
        status:           'draft',
        subtotal:         0,
        igst_amount:      0,
        cgst_amount:      0,
        sgst_amount:      0,
        total_gst_amount: 0,
        grand_total:      0
      })
      .select()
      .single();

    if (quoteError) throw new Error('Failed to create quote: ' + quoteError.message);

    // Step 2: Attach the quote_id to every line item and insert them all.
    const itemsToInsert = line_items.map(item => ({
      ...item,
      quote_id: quote.id
    }));

    const { error: itemsError } = await supabase
      .from('quote_line_items')
      .insert(itemsToInsert);

    if (itemsError) throw new Error('Failed to save line items: ' + itemsError.message);

    // Step 3: Calculate totals server-side.
    // This reads line items from DB, applies GST, and writes
    // subtotal + tax breakdown + grand_total back to the quote.
    const totals = await calculateQuoteTotal(quote.id);

    // Step 4: Log this action in the audit trail
    await supabase.from('quote_events').insert({
      quote_id:   quote.id,
      event_type: 'created',
      metadata:   { line_item_count: line_items.length, grand_total: totals.grand_total }
    });

    // Return the created quote with calculated totals
    res.status(201).json({
      id:          quote.id,
      ...totals,
      message:     'Quote created successfully'
    });

  } catch (err) {
    console.error('Create quote error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ── GET /api/quotes - Paginated list of all quotes ────────────────────────
//
// Query params:
//   page  (default: 1)
//   limit (default: 20)
//   status (optional): draft | sent | accepted | rejected
router.get('/', async (req, res) => {
  const page   = parseInt(req.query.page)   || 1;
  const limit  = parseInt(req.query.limit)  || 20;
  const status = req.query.status           || null;
  const offset = (page - 1) * limit;

  try {
    // Build the query - filter by status if provided
    let query = supabase
      .from('quotes')
      .select('id, customer_name, customer_email, customer_state, billing_cycle, status, grand_total, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;

    if (error) throw new Error('Failed to fetch quotes: ' + error.message);

    res.json({
      quotes:      data,
      total:       count,
      page:        page,
      limit:       limit,
      total_pages: Math.ceil(count / limit)
    });

  } catch (err) {
    console.error('List quotes error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ── GET /api/quotes/:id - Single quote with all line items ────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch quote header and line items in parallel
    const [
      { data: quote,     error: quoteError },
      { data: lineItems, error: itemsError }
    ] = await Promise.all([
      supabase.from('quotes').select('*').eq('id', id).single(),
      supabase.from('quote_line_items').select('*').eq('quote_id', id).order('created_at')
    ]);

    if (quoteError) throw new Error('Quote not found: ' + quoteError.message);
    if (itemsError) throw new Error('Failed to fetch line items: ' + itemsError.message);

    res.json({
      ...quote,
      line_items: lineItems
    });

  } catch (err) {
    console.error('Get quote error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ── PUT /api/quotes/:id - Update quote and recalculate totals ─────────────
//
// Can update: customer details, billing_cycle, line_items
// grand_total is always recalculated - never accepted from frontend
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    customer_name,
    customer_email,
    customer_gstin,
    customer_state,
    customer_state_code,
    billing_cycle,
    status,
    line_items
  } = req.body;

  try {
    // Step 1: Update quote header fields
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        customer_name,
        customer_email,
        customer_gstin,
        customer_state,
        customer_state_code,
        billing_cycle,
        status
      })
      .eq('id', id);

    if (updateError) throw new Error('Failed to update quote: ' + updateError.message);

    // Step 2: If line items are provided, replace them all.
    // Delete existing items and insert the new set.
    if (line_items && line_items.length > 0) {
      const { error: deleteError } = await supabase
        .from('quote_line_items')
        .delete()
        .eq('quote_id', id);

      if (deleteError) throw new Error('Failed to clear line items: ' + deleteError.message);

      const itemsToInsert = line_items.map(item => ({
        ...item,
        quote_id: id
      }));

      const { error: insertError } = await supabase
        .from('quote_line_items')
        .insert(itemsToInsert);

      if (insertError) throw new Error('Failed to insert line items: ' + insertError.message);
    }

    // Step 3: Recalculate totals server-side after any change
    const totals = await calculateQuoteTotal(id);

    // Step 4: Log the update in the audit trail
    await supabase.from('quote_events').insert({
      quote_id:   id,
      event_type: 'updated',
      metadata:   { grand_total: totals.grand_total, status }
    });

    res.json({
      id,
      ...totals,
      message: 'Quote updated successfully'
    });

  } catch (err) {
    console.error('Update quote error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
