import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import txRoutes from './routes/transactions.js';
import loanRoutes from './routes/loans.js';

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL?.split(',') }));
app.use(express.json());

app.get('/', (req, res) => res.send('API running'));
app.use('/api/auth', authRoutes);
app.use('/api/transactions', txRoutes);
app.use('/api/loans', loanRoutes);

// Catches errors from async routes (Express 5 forwards them automatically)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

const port = process.env.PORT || 5000;
pool.query('select 1')
  .then(() => app.listen(port, () => console.log(`Server running on ${port}, DB connected`)))
  .catch((e) => console.error('DB connection failed:', e.message));