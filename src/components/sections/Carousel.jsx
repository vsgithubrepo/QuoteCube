import { useState } from 'react';
import './Carousel.css';
const T = [
  { quote: "QuoteCube cut our quoting time from 2 hours to 15 minutes. The GST auto-calculation alone saves us from errors every single day.", name: "Rajesh Mehta", role: "Operations Head, FastTrack Logistics", avatar: "🚛" },
  { quote: "Having all modules laid out with pricing confirmation is a game-changer. Our sales team finally speaks the same language as finance.", name: "Priya Sharma", role: "CFO, SaaS Platform India", avatar: "💼" },
  { quote: "The server-side grand total means no more customer disputes about pricing. Everything is locked in and auditable.", name: "Amit Verma", role: "CEO, Rapid Freight Solutions", avatar: "📦" },
];
export default function Carousel() {
  const [i, setI] = useState(0);
  const t = T[i];
  return (
    <section className="testimonials section" aria-labelledby="testimonials-heading">
      <div className="container">
        <div className="testimonials__layout">
          <div>
            <div className="section-overline">Customer Stories</div>
            <h2 id="testimonials-heading" className="section-title">Trusted by logistics teams across India</h2>
            <p className="section-subtitle">From FTL operators to multi-branch cargo companies — QuoteCube delivers accurate quotes every time.</p>
          </div>
          <div>
            <div className="testimonials__card" role="blockquote">
              <p className="testimonials__quote">{t.quote}</p>
              <div className="testimonials__author">
                <div className="testimonials__avatar" aria-hidden="true">{t.avatar}</div>
                <div>
                  <div className="testimonials__name">{t.name}</div>
                  <div className="testimonials__role">{t.role}</div>
                </div>
              </div>
            </div>
            <div className="testimonials__dots">
              {T.map((_, idx) => (
                <button key={idx} className={`testimonials__dot ${idx===i?'testimonials__dot--active':''}`} onClick={() => setI(idx)} aria-label={`Testimonial ${idx+1}`} aria-current={idx===i}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
