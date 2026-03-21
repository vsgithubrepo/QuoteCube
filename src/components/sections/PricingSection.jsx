import { useState } from 'react';
import './PricingSection.css';

const CheckIcon = () => (
  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 6l3 3 5-5"/>
  </svg>
);

const PLANS = [
  { name: 'Starter',      monthly: 4999,  annual: 3999,  desc: 'For small logistics operations getting started with digital ERP.', featured: false, features: ['Up to 50 modules','5 API integrations','1 cloud provider','PDF quotes','Email support'] },
  { name: 'Professional', monthly: 9999,  annual: 7999,  desc: 'For growing fleets that need the complete Logistics Cube platform.', featured: true,  features: ['All 125 modules','32 API integrations','All 6 cloud providers','PDF + Excel export','GST auto-calculation','Priority support'] },
  { name: 'Enterprise',   monthly: null,  annual: null,  desc: 'Custom pricing for large fleets and multi-branch operations.', featured: false, features: ['Custom modules','Dedicated APIs','White-label option','SLA guarantee','Onsite implementation','Dedicated account manager'] },
];

export default function PricingSection({ isAuthenticated, onSignIn }) {
  const [annual, setAnnual] = useState(true);

  if (!isAuthenticated) {
    return (
      <section className="pricing section" id="pricing" aria-labelledby="pricing-heading">
        <div className="container">
          <div className="pricing__header">
            <div className="section-overline">Pricing</div>
            <h2 id="pricing-heading" className="section-title">Simple, transparent pricing</h2>
          </div>
          <div className="pricing__gate">
            <div className="pricing__gate-icon" aria-hidden="true">🔒</div>
            <h3 className="pricing__gate-title">Sign in to view pricing</h3>
            <p className="pricing__gate-desc">
              Our pricing is tailored for logistics companies.
              Sign in to view plans, generate accurate quotes, and get started.
            </p>
            <button className="btn btn-amber btn-lg" onClick={onSignIn}>
              Sign in to view pricing
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pricing section" id="pricing" aria-labelledby="pricing-heading">
      <div className="container">
        <div className="pricing__header">
          <div className="section-overline">Pricing</div>
          <h2 id="pricing-heading" className="section-title">Simple, transparent pricing</h2>
          <p className="section-subtitle">All plans include GST-compliant invoicing, server-side calculations, and full audit trail.</p>
          <div className="pricing__toggle" role="group" aria-label="Billing period">
            <button className={`pricing__toggle-btn ${!annual ? 'pricing__toggle-btn--active' : ''}`} onClick={() => setAnnual(false)}>Monthly</button>
            <button className={`pricing__toggle-btn ${annual ? 'pricing__toggle-btn--active' : ''}`} onClick={() => setAnnual(true)}>Annual</button>
            {annual && <span className="pricing__save">Save 20%</span>}
          </div>
        </div>
        <div className="pricing__grid">
          {PLANS.map(p => (
            <div key={p.name} className={`pricing__card ${p.featured ? 'pricing__card--featured' : ''}`}>
              <div className="pricing__card-top">
                {p.featured && <div className="pricing__popular">Most Popular</div>}
                <div className="pricing__plan">{p.name}</div>
                <div className="pricing__amount-row">
                  {p.monthly ? (
                    <>
                      <span className="pricing__currency">₹</span>
                      <span className="pricing__amount">{(annual ? p.annual : p.monthly).toLocaleString('en-IN')}</span>
                      <span className="pricing__period">/mo</span>
                    </>
                  ) : (
                    <span className="pricing__amount" style={{fontSize:'1.8rem'}}>Custom</span>
                  )}
                </div>
                <p className="pricing__desc">{p.desc}</p>
              </div>
              <ul className="pricing__features-list" aria-label={`${p.name} features`}>
                {p.features.map(f => (
                  <li key={f} className="pricing__feature">
                    <span className="pricing__check"><CheckIcon/></span>{f}
                  </li>
                ))}
              </ul>
              <div className="pricing__card-foot">
                <button className={`pricing__cta ${p.featured ? 'pricing__cta--featured' : 'pricing__cta--default'}`}>
                  {p.monthly ? 'Get Started' : 'Contact Sales'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="pricing__note">All prices exclude 18% GST · Annual billing in INR · Cancel anytime</p>
      </div>
    </section>
  );
}
