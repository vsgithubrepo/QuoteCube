/**
 * catalogue.js - Route: GET /api/catalogue
 *
 * Purpose:
 *   Returns the complete QuoteCube catalogue in a single API call.
 *   The React frontend calls this once on load to populate all
 *   dropdowns, module lists, API options, server packages, and
 *   pricing tiers - replacing the old hardcoded defaults.js file.
 *
 * Why one call instead of many?
 *   The catalogue data is mostly static (changes only when admin
 *   updates pricing). Fetching everything in parallel in one request
 *   is faster and simpler than 10 separate frontend API calls.
 *
 * Returns:
 *   {
 *     module_sections    - 12 sections (EMS, Master Data etc.)
 *     modules            - 110 modules with pricing
 *     api_categories     - 12 API categories
 *     api_services       - individual API services
 *     api_provider_plans - real pricing per provider (3 models)
 *     server_providers   - 6 cloud providers
 *     server_packages    - 36 packages (6 providers x 6 tiers)
 *     volume_tiers       - 6 order volume surcharge bands
 *     settings           - global settings as key-value object
 *     professional_roles - 14 implementation/training roles
 *   }
 *
 * Security:
 *   Uses Supabase service role key (server-side only).
 *   This route is read-only - no data is written here.
 *
 * GST Note:
 *   global_settings includes SAC codes and GST rates.
 *   These are returned as part of settings{} so the frontend
 *   can display them on quotes without hardcoding.
 */

const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');

// ── GET /api/catalogue ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {

    // Fetch all catalogue tables in parallel for maximum performance.
    // Promise.all fires all 10 queries simultaneously instead of one by one.
    const [
      { data: moduleSections,    error: e1  },
      { data: modules,           error: e2  },
      { data: apiCategories,     error: e3  },
      { data: apiServices,       error: e4  },
      { data: apiProviderPlans,  error: e5  },
      { data: serverProviders,   error: e6  },
      { data: serverPackages,    error: e7  },
      { data: volumeTiers,       error: e8  },
      { data: globalSettings,    error: e9  },
      { data: professionalRoles, error: e10 }
    ] = await Promise.all([
      supabase.from('module_sections').select('*').order('display_order'),
      supabase.from('modules').select('*').order('display_order'),
      supabase.from('api_categories').select('*').order('display_order'),
      supabase.from('api_services').select('*').order('name'),
      supabase.from('api_provider_plans').select('*'),
      supabase.from('server_providers').select('*').order('name'),
      supabase.from('server_packages').select('*').order('monthly_price'),
      supabase.from('volume_tiers').select('*').order('min_orders'),
      supabase.from('global_settings').select('key, value'),
      supabase.from('professional_roles').select('*').order('category')
    ]);

    // Collect any errors from the parallel queries.
    // If any single table fails, we return 500 rather than
    // sending partial data that could break the frontend.
    const errors = [e1,e2,e3,e4,e5,e6,e7,e8,e9,e10].filter(Boolean);
    if (errors.length > 0) {
      console.error('Catalogue fetch errors:', errors);
      return res.status(500).json({ error: 'Failed to load catalogue data' });
    }

    // Convert global_settings from array of {key, value} rows
    // into a plain object { key: value } for easier frontend use.
    // e.g. [{ key: 'igst_rate', value: '18' }] → { igst_rate: '18' }
    const settings = globalSettings.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    // Return the full catalogue as a single structured response
    res.json({
      module_sections:    moduleSections,    // for module selection UI
      modules:            modules,           // 110 modules with prices
      api_categories:     apiCategories,     // API grouping for UI
      api_services:       apiServices,       // individual API services
      api_provider_plans: apiProviderPlans,  // real pricing (3 models)
      server_providers:   serverProviders,   // AWS, GCP, Azure etc.
      server_packages:    serverPackages,    // server tier options
      volume_tiers:       volumeTiers,       // order volume surcharges
      settings:           settings,          // GST rates, SAC codes etc.
      professional_roles: professionalRoles  // implementation/training
    });

  } catch (err) {
    // Catch any unexpected runtime errors
    console.error('Catalogue route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
