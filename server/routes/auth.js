import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();
const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ message: 'Fill all fields (password min 6 characters)' });

  const exists = await pool.query('select id from users where email=$1', [email.toLowerCase()]);
  if (exists.rows.length) return res.status(400).json({ message: 'Email already used' });

  const hashed = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'insert into users (name, email, password) values ($1,$2,$3) returning id, name',
    [name, email.toLowerCase(), hashed]
  );
  res.json({ token: makeToken(rows[0].id), name: rows[0].name });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('select * from users where email=$1', [(email || '').toLowerCase()]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(400).json({ message: 'Wrong email or password' });
  res.json({ token: makeToken(user.id), name: user.name });
});

export default router;