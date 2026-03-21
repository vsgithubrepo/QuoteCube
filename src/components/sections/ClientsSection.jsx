import './ClientsSection.css';
const CLIENTS = [
  'DHTC India Limited', 'Quick India Logistics', 'JK Cargo Services',
  'Byasole', 'Sensitive Supply Chain', 'Aryavart Transport',
  'Sarthi Logistics', 'KM Trans Logistics', 'Calcutta Express', 'ERC Logistics',
];
const METRICS = [
  { val: '50+',  lbl: 'Logistics companies' },
  { val: '6+',   lbl: 'Years of expertise'  },
  { val: '40%',  lbl: 'Avg cost reduction'  },
  { val: '99.9%',lbl: 'Platform uptime'     },
];
export default function ClientsSection() {
  return (
    <section className="clients" id="clients" aria-labelledby="clients-heading">
      <div className="container">
        <div className="clients__header">
          <span className="clients__overline">Trusted By</span>
          <h2 id="clients-heading" className="clients__title">India's leading logistics companies</h2>
          <p className="clients__subtitle">Partnered with logistics and supply chain companies to deliver intelligent, scalable ERP solutions.</p>
        </div>
        <div className="clients__grid" role="list">
          {CLIENTS.map(c => (
            <div key={c} className="clients__card" role="listitem">{c}</div>
          ))}
        </div>
        <div className="clients__bottom">
          {METRICS.map(m => (
            <div key={m.lbl} className="clients__metric">
              <span className="clients__metric-val">{m.val}</span>
              <span className="clients__metric-lbl">{m.lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
