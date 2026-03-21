import './Footer.css';
const LINKS = {
  Product:  [{ l:'Features', h:'#features' },{ l:'Clients', h:'#clients' },{ l:'Pricing', h:'#pricing' },{ l:'Roadmap', h:'#' }],
  Company:  [{ l:'About', h:'#' },{ l:'Blog', h:'#' },{ l:'Careers', h:'#' },{ l:'Contact', h:'#' }],
  Legal:    [{ l:'Privacy', h:'#' },{ l:'Terms', h:'#' },{ l:'Refund Policy', h:'#' },{ l:'GST Policy', h:'#' }],
};
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <a href="/" className="footer__logo" aria-label="eTechCube">
              <img src="/etechcube-logo.jpg" alt="eTechCube"/>
              <span className="footer__logo-name">eTechCube</span>
            </a>
            <p className="footer__tagline">Intelligence Combined with Technology. India's premier Logistics ERP platform since 2020.</p>
            <div className="footer__contact">
              <span className="footer__contact-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                info@etechcube.com
              </span>
              <span className="footer__contact-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .97h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                +91 728 004 4001 / 02 / 03
              </span>
              <span className="footer__contact-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                www.etechcube.com
              </span>
            </div>
          </div>
          <div className="footer__links">
            {Object.entries(LINKS).map(([g, links]) => (
              <div key={g}>
                <h3 className="footer__group-title">{g}</h3>
                <ul className="footer__link-list">
                  {links.map(l => <li key={l.l}><a href={l.h} className="footer__link">{l.l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="footer__bottom">
          <p className="footer__legal">eTechCube LLP · LLPIN: AAV-7244 · GSTIN: 20AAIFE8436A1ZY · Jamshedpur, Jharkhand 831015</p>
          <p className="footer__copy">© {year} eTechCube LLP. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
