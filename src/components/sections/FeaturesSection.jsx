import './FeaturesSection.css';
const FEATURES = [
  { icon: '🚚', title: 'Bilty & Docket Booking',    desc: 'E-Way Bill integration, auto-save client data, QR codes, barcode tracking, and instant WhatsApp/email dispatch.' },
  { icon: '📍', title: 'Live GPS & SIM Tracking',   desc: 'Real-time vehicle tracking via GPS or SIM. VAHAN validation before every trip. Milestone alerts automated.' },
  { icon: '🧾', title: 'GST-Compliant Billing',     desc: 'Auto-generate invoices with TDS deduction, GST calculation, and instant sharing via email or WhatsApp.' },
  { icon: '📊', title: 'Analytics & Dashboard',     desc: '360° KPI dashboard — EWaybill expiry, Bilty/Challan status, fleet performance, and MIS reports.' },
  { icon: '🏦', title: 'Finance & Reconciliation',  desc: 'Auto ledger creation, bank reconciliation via Excel/API, fund transfers, and voucher entry — fully automated.' },
  { icon: '👥', title: 'Employee Management',       desc: 'Onboarding, attendance, leave management, payslip generation, loan tracking, and role-based access control.' },
  { icon: '🔗', title: '32 API Integrations',       desc: 'PAN, GST, Aadhaar, VAHAN, E-Waybill, WhatsApp, Bank APIs — verified compliance at every touchpoint.' },
  { icon: '☁️', title: 'Cloud-First Architecture',  desc: 'Multi-tenant SaaS on AWS/Azure. REST API + webhooks integrate with ERP, accounting and CRM seamlessly.' },
  { icon: '🤖', title: 'AI-Powered Automation',     desc: 'Automated billing, exception alerts, predictive analytics, and scheduled reports — zero routine manual work.' },
];
export default function FeaturesSection() {
  return (
    <section className="features section" id="features" aria-labelledby="features-heading">
      <div className="container">
        <div className="features__header">
          <div className="section-overline">Platform Modules</div>
          <h2 id="features-heading" className="section-title">Everything logistics needs, in one platform</h2>
          <p className="section-subtitle">23 integrated modules covering every function — from booking to delivery, billing to analytics.</p>
        </div>
        <div className="features__grid" role="list">
          {FEATURES.map(f => (
            <div key={f.title} className="features__card" role="listitem">
              <div className="features__icon" aria-hidden="true">{f.icon}</div>
              <h3 className="features__card-title">{f.title}</h3>
              <p className="features__card-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
