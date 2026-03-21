const COMPANY_STATE_CODE = '20'; // Jharkhand

function calculateTax(subtotal, customerStateCode, gstRate = 18) {
  const isIntraState = customerStateCode === COMPANY_STATE_CODE;
  const taxAmount    = parseFloat(((subtotal * gstRate) / 100).toFixed(2));

  if (isIntraState) {
    const half = parseFloat((taxAmount / 2).toFixed(2));
    return {
      cgst_amount:     half,
      sgst_amount:     half,
      igst_amount:     0,
      total_gst_amount: taxAmount,
      tax_type:        'CGST+SGST',
      gst_rate:        gstRate
    };
  }

  return {
    cgst_amount:      0,
    sgst_amount:      0,
    igst_amount:      taxAmount,
    total_gst_amount: taxAmount,
    tax_type:         'IGST',
    gst_rate:         gstRate
  };
}

module.exports = { calculateTax };
