import express from 'express';
import pool from '../db.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

// GET /api/transactions?type=expense&month=2026-10
router.get('/', async (req, res) => {
  const params = [req.userId];
  let sql = 'select * from transactions where user_id=$1';
  if (req.query.type) {
    params.push(req.query.type);
    sql += ` and type=$${params.length}`;
  }
  if (req.query.month) {
    params.push(`${req.query.month}-01`);
    const i = params.length;
    sql += ` and date >= $${i}::date and date < $${i}::date + interval '1 month'`;
  }
  sql += ' order by date desc, id desc limit 500';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

// GET /api/transactions/summary?month=2026-10
router.get('/summary', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const start = `${month}-01`;
  const u = req.userId;

  const [totals, cats, trendQ, loansQ] = await Promise.all([
    pool.query(
      `select type, sum(amount) as total from transactions
       where user_id=$1 and date >= $2::date and date < $2::date + interval '1 month'
       group by type`, [u, start]),
    pool.query(
      `select category as name, sum(amount) as value from transactions
       where user_id=$1 and type='expense'
         and date >= $2::date and date < $2::date + interval '1 month'
       group by category order by value desc`, [u, start]),
    pool.query(
      `select to_char(date_trunc('month', date),'Mon') as label,
              date_trunc('month', date) as m, type, sum(amount) as total
       from transactions
       where user_id=$1 and date >= $2::date - interval '5 months'
         and date < $2::date + interval '1 month'
       group by m, label, type order by m`, [u, start]),
    pool.query(
      `select l.direction, sum(l.amount - coalesce(p.paid,0)) as remaining
       from loans l
       left join (select loan_id, sum(amount) as paid from loan_payments group by loan_id) p
         on p.loan_id = l.id
       where l.user_id=$1 group by l.direction`, [u]),
  ]);

  const get = (rows, key, val) => rows.find((r) => r[key] === val);
  const income = get(totals.rows, 'type', 'income')?.total || 0;
  const expense = get(totals.rows, 'type', 'expense')?.total || 0;

  const trend = [];
  trendQ.rows.forEach((r) => {
    let x = trend.find((i) => i.month === r.label);
    if (!x) { x = { month: r.label, income: 0, expense: 0 }; trend.push(x); }
    x[r.type] = r.total;
  });

  res.json({
    income,
    expense,
    balance: income - expense,
    savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
    youAreOwed: get(loansQ.rows, 'direction', 'lent')?.remaining || 0,
    youOwe: get(loansQ.rows, 'direction', 'borrowed')?.remaining || 0,
    byCategory: cats.rows,
    trend,
  });
});

router.post('/', async (req, res) => {
  const { type, amount, category, payment_method, date, note } = req.body;
  if (!['income', 'expense'].includes(type) || !(amount > 0))
    return res.status(400).json({ message: 'Invalid type or amount' });
  const { rows } = await pool.query(
    `insert into transactions (user_id, type, amount, category, payment_method, date, note)
     values ($1,$2,$3,$4,$5,coalesce($6::date, current_date),$7) returning *`,
    [req.userId, type, amount, category || 'Other', payment_method || 'UPI', date || null, note || null]
  );
  res.status(201).json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('delete from transactions where id=$1 and user_id=$2', [req.params.id, req.userId]);
  res.json({ message: 'Deleted' });
});

export default router;