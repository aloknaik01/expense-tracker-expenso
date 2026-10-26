import express from 'express';
import pool from '../db.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

const LIST_SQL = `
  select l.*, coalesce(p.paid,0) as paid, l.amount - coalesce(p.paid,0) as remaining
  from loans l
  left join (select loan_id, sum(amount) as paid from loan_payments group by loan_id) p
    on p.loan_id = l.id
  where l.user_id=$1
  order by (l.amount - coalesce(p.paid,0) <= 0), l.date desc, l.id desc`;

router.get('/', async (req, res) => {
  const { rows } = await pool.query(LIST_SQL, [req.userId]);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { direction, person, amount, date, note } = req.body;
  if (!['lent', 'borrowed'].includes(direction) || !person || !(amount > 0))
    return res.status(400).json({ message: 'Invalid data' });
  const { rows } = await pool.query(
    `insert into loans (user_id, direction, person, amount, date, note)
     values ($1,$2,$3,$4,coalesce($5::date, current_date),$6) returning *`,
    [req.userId, direction, person, amount, date || null, note || null]
  );
  res.status(201).json(rows[0]);
});

// Add a (partial) repayment
router.post('/:id/payments', async (req, res) => {
  const { amount, date } = req.body;
  const { rows } = await pool.query(
    `select l.amount - coalesce((select sum(amount) from loan_payments where loan_id=l.id),0) as remaining
     from loans l where l.id=$1 and l.user_id=$2`, [req.params.id, req.userId]);
  if (!rows.length) return res.status(404).json({ message: 'Not found' });
  if (!(amount > 0) || amount > rows[0].remaining)
    return res.status(400).json({ message: `Amount must be between 1 and ${rows[0].remaining}` });

  await pool.query(
    'insert into loan_payments (loan_id, amount, date) values ($1,$2,coalesce($3::date, current_date))',
    [req.params.id, amount, date || null]
  );
  res.json({ message: 'Payment added' });
});

router.delete('/:id', async (req, res) => {
  await pool.query('delete from loans where id=$1 and user_id=$2', [req.params.id, req.userId]);
  res.json({ message: 'Deleted' });
});

export default router;