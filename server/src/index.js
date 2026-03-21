require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const catalogueRoutes = require('./routes/catalogue');
const quotesRoutes    = require('./routes/quotes');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use('/api/catalogue', catalogueRoutes);
app.use('/api/quotes',    quotesRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'quotecube-api' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`QuoteCube API running on port ${PORT}`);
});
