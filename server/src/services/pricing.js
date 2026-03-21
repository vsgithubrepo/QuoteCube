const supabase          = require('../config/supabase');
const { calculateTax }  = require('./tax');

// ── Select EWB plan based on monthly order volume ──────────
function selectEwbPlan(monthlyOrders, plans) {
  const sorted = plans
    .filter(p => p.pricing_model === 'annual_volume_plan')
    .sort((a, b) => a.monthly_cap - b.monthly_cap);

  const match = sorted.find(p => monthlyOrders <= p.monthly_cap);
  return match || sorted[sorted.length - 1];
}

// ── Calculate cost for a single API line ───────────────────
function calculateApiLineCost(plan, monthlyHits) {
  const annualHits = monthlyHits * 12;

  if (plan.pricing_model === 'pay_per_hit') {
    return {
      annual_cost:  parseFloat((annualHits * plan.per_hit_price).toFixed(2)),
      monthly_cost: parseFloat((monthlyHits * plan.per_hit_price).toFixed(2)),
      model:        'pay_per_hit'
    };
  }

  if (plan.pricing_model === 'annual_volume_plan') {
    return {
      annual_cost:  parseFloat(plan.annual_price.toFixed(2)),
      monthly_cost: parseFloat((plan.annual_price / 12).toFixed(2)),
      model:        'annual_volume_plan'
    };
  }

  if (plan.pricing_model === 'subscription_with_overage') {
    const includedHits  = plan.included_hits_per_year || 0;
    const overageHits   = Math.max(0, annualHits - includedHits);
    const overageCost   = parseFloat((overageHits * plan.per_hit_price).toFixed(2));
    const annualCost    = parseFloat((plan.annual_price + overageCost).toFixed(2));
    return {
      annual_cost:   annualCost,
      monthly_cost:  parseFloat((annualCost / 12).toFixed(2)),
      overage_hits:  overageHits,
      overage_cost:  overageCost,
      model:         'subscription_with_overage'
    };
  }

  return { annual_cost: 0, monthly_cost: 0, model: 'unknown' };
}

// ── Calculate full quote total ─────────────────────────────
async function calculateQuoteTotal(quoteId) {
  // 1. Fetch all line items for this quote
  const { data: lineItems, error: lineError } = await supabase
    .from('quote_line_items')
    .select('*')
    .eq('quote_id', quoteId);

  if (lineError) throw new Error('Failed to fetch line items: ' + lineError.message);
  if (!lineItems || lineItems.length === 0) throw new Error('No line items found for quote');

  // 2. Fetch quote header for customer state
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('customer_state_code, billing_cycle')
    .eq('id', quoteId)
    .single();

  if (quoteError) throw new Error('Failed to fetch quote: ' + quoteError.message);

  // 3. Sum all line items
  const subtotal = lineItems.reduce((sum, item) => {
    return parseFloat((sum + parseFloat(item.line_total || 0)).toFixed(2));
  }, 0);

  // 4. Calculate GST
  const tax = calculateTax(subtotal, quote.customer_state_code);

  // 5. Calculate grand total
  const grandTotal = parseFloat((subtotal + tax.total_gst_amount).toFixed(2));

  // 6. Update quote with calculated totals
  const { error: updateError } = await supabase
    .from('quotes')
    .update({
      subtotal:         subtotal,
      igst_amount:      tax.igst_amount,
      cgst_amount:      tax.cgst_amount,
      sgst_amount:      tax.sgst_amount,
      total_gst_amount: tax.total_gst_amount,
      grand_total:      grandTotal
    })
    .eq('id', quoteId);

  if (updateError) throw new Error('Failed to update quote totals: ' + updateError.message);

  return {
    subtotal,
    ...tax,
    grand_total: grandTotal
  };
}

module.exports = { selectEwbPlan, calculateApiLineCost, calculateQuoteTotal };
