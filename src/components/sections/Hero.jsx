/**
 * Hero.jsx
 * Split layout landing page:
 * Left  — eTechCube / Logistics Cube product intro + stats + feature pills
 * Right — Login card (Google + email/password + remember me + forgot + signup)
 * 
 * Dark diagonal shape on right half creates contrast behind login card.
 * All numbers and quote data hidden until user is authenticated.
 */
import { useState } from 'react';
import './Hero.css';

const STATS = [
  { val: '6+',  unit: '',  lbl: 'Years in Logistics Tech' },
  { val: '50+', unit: '',  lbl: 'ERP Deployments' },
  { val: '20+', unit: '',  lbl: 'Engineers Dedicated' },
  { val: '40',  unit: '%', lbl: 'Avg. Cost Reduction' },
];

const PILLS = [
  'Bilty & Docket Booking',
  'E-Way Bill Integration',
  'Auto GST Invoicing',
  'Fleet Management',
  'Live GPS Tracking',
  'Bank Reconciliation',
  'Employee Management',
  'Analytics Dashboard',
];

const EyeIcon = ({ open }) => open
  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default function Hero({ onSignIn }) {
  const [form,       setForm]       = useState({ email: '', password: '' });
  const [showPass,   setShowPass]   = useState(false);
  const [remember,   setRemember]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    // TODO: Wire to Supabase email/password auth
    setTimeout(() => { setLoading(false); onSignIn(); }, 1000);
  };

  const handleGoogle = () => {
    setLoading(true);
    // TODO: Wire to Supabase Google OAuth
    setTimeout(() => { setLoading(false); onSignIn(); }, 800);
  };

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="container">
        <div className="hero__inner">

          {/* ── Left — Product Intro ───────────────────── */}
          <div className="hero__left">

            <span className="hero__badge">All-In-One ERP for Logistics</span>

            <h1 id="hero-heading" className="hero__headline">
              <span className="hero__headline-block">India's most complete</span>
              <span className="hero__headline-accent"> Logistics ERP</span>
              <span className="hero__headline-block"> for road, air &amp; rail</span>
            </h1>

            <p className="hero__desc">
              Logistics Cube by eTechCube empowers logistics companies
              with AI-powered automation, end-to-end operations management,
              real-time tracking, GST-compliant billing, and intelligent
              data-driven insights — built exclusively for Indian logistics.
            </p>

            {/* Stats */}
            <div className="hero__stats" aria-label="Company statistics">
              {STATS.map(s => (
                <div key={s.lbl}>
                  <div className="hero__stat-val">{s.val}<span>{s.unit}</span></div>
                  <div className="hero__stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Feature pills */}
            <div className="hero__pills" aria-label="Product features">
              {PILLS.map(p => (
                <span key={p} className="hero__pill">
                  <span className="hero__pill-dot" aria-hidden="true"/>
                  {p}
                </span>
              ))}
            </div>

          </div>

          {/* ── Right — Login Card ─────────────────────── */}
          <div className="hero__right">
            <div className="login-card" role="main">

              <div className="login-card__header">
                <div className="login-card__logo">
                  <img src="/etechcube-logo.jpg" alt="eTechCube"/>
                  <span className="login-card__logo-name">eTechCube</span>
                </div>
                <h2 className="login-card__title">Welcome back</h2>
                <p className="login-card__subtitle">
                  Sign in to access your QuoteCube pricing dashboard
                </p>
              </div>

              <div className="login-card__body">

                {/* Google Sign-In */}
                <button className="login-card__google" onClick={handleGoogle} type="button" disabled={loading}>
                  <GoogleIcon/>
                  Continue with Google
                </button>

                <div className="login-card__divider" aria-hidden="true">or</div>

                {/* Email/Password Form */}
                <form onSubmit={handleSubmit} noValidate>
                  <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

                    <div className="login-card__field">
                      <label className="login-card__label" htmlFor="email">Email address</label>
                      <div className="login-card__input-wrap">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <input
                          id="email" name="email" type="email"
                          className="input" placeholder="you@etechcube.com"
                          value={form.email} onChange={handleChange}
                          autoComplete="email" required
                          aria-required="true"
                        />
                      </div>
                    </div>

                    <div className="login-card__field">
                      <label className="login-card__label" htmlFor="password">Password</label>
                      <div className="login-card__input-wrap">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                        <input
                          id="password" name="password"
                          type={showPass ? 'text' : 'password'}
                          className="input" placeholder="Enter your password"
                          value={form.password} onChange={handleChange}
                          autoComplete="current-password" required
                          aria-required="true"
                        />
                        <button
                          type="button" className="login-card__eye"
                          onClick={() => setShowPass(!showPass)}
                          aria-label={showPass ? 'Hide password' : 'Show password'}
                        >
                          <EyeIcon open={showPass}/>
                        </button>
                      </div>
                    </div>

                    {/* Remember + Forgot */}
                    <div className="login-card__row">
                      <label className="login-card__remember">
                        <input
                          type="checkbox" checked={remember}
                          onChange={e => setRemember(e.target.checked)}
                          aria-label="Remember me"
                        />
                        Remember me
                      </label>
                      <a href="/forgot-password" className="login-card__forgot">Forgot password?</a>
                    </div>

                    {error && <div className="login-card__error" role="alert">{error}</div>}

                    <button type="submit" className="login-card__submit" disabled={loading}>
                      {loading ? (
                        <>
                          <div className="spinner" style={{width:16,height:16,borderWidth:2}}/>
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign in to QuoteCube
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </>
                      )}
                    </button>

                  </div>
                </form>

              </div>

              <div className="login-card__footer">
                <p className="login-card__signup-text">
                  New to QuoteCube?{' '}
                  <a href="/signup" className="login-card__signup-link">Request access</a>
                </p>
                <p className="login-card__note">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Secured by Supabase Auth · eTechCube LLP
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
