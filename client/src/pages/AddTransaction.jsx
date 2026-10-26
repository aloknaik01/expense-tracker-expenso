import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const EXPENSE_CATS = ['Food', 'Rent', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Education', 'Other'];
const INCOME_CATS = ['Salary', 'Freelance', 'Gift', 'Refund', 'Interest', 'Other'];
const TYPES = [
  { v: 'expense', label: 'Expense' },
  { v: 'income', label: 'Income' },
  { v: 'lent', label: 'Lent' },
  { v: 'borrowed', label: 'Borrowed' },
];

export default function AddTransaction() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    type: 'expense', amount: '', category: 'Food',
    date: new Date().toISOString().slice(0, 10),
    payment_method: 'UPI', person: '', note: '',
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const isLoan = f.type === 'lent' || f.type === 'borrowed';

  const changeType = (t) => {
    setF((p) => ({
      ...p, type: t,
      category: t === 'income' ? 'Salary' : 'Food',
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const amount = Number(f.amount);
      if (isLoan) {
        await api.post('/loans', { direction: f.type, person: f.person, amount, date: f.date, note: f.note });
        navigate('/loans');
      } else {
        await api.post('/transactions', {
          type: f.type, amount, category: f.category,
          payment_method: f.payment_method, date: f.date, note: f.note,
        });
        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save');
      setSaving(false);
    }
  };

  const input = 'w-full border border-slate-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-indigo-400';
  const cats = f.type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <form onSubmit={submit} className="p-4 space-y-3">
      <h1 className="text-xl font-bold">Add transaction</h1>

      <div className="grid grid-cols-4 gap-2">
        {TYPES.map((t) => (
          <button type="button" key={t.v} onClick={() => changeType(t.v)}
            className={`py-2 rounded-xl text-sm ${f.type === t.v ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <input className={`${input} text-3xl font-bold`} type="number" inputMode="decimal" min="1" step="0.01"
        placeholder="₹ 0" value={f.amount} onChange={(e) => set('amount', e.target.value)} required autoFocus />

      {!isLoan && (
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button type="button" key={c} onClick={() => set('category', c)}
              className={`px-3 py-1.5 rounded-full text-sm ${f.category === c ? 'bg-indigo-100 text-indigo-700 border border-indigo-400' : 'bg-white border border-slate-200'}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {isLoan && (
        <input className={input} placeholder="Person's name" value={f.person}
          onChange={(e) => set('person', e.target.value)} required />
      )}

      <input className={input} type="date" value={f.date} onChange={(e) => set('date', e.target.value)} />

      {!isLoan && (
        <select className={input} value={f.payment_method} onChange={(e) => set('payment_method', e.target.value)}>
          {['UPI', 'Cash', 'Card', 'Bank'].map((m) => <option key={m}>{m}</option>)}
        </select>
      )}

      <input className={input} placeholder="Note (optional)" value={f.note} onChange={(e) => set('note', e.target.value)} />

      {isLoan && (
        <p className="text-xs text-slate-500">
          Loans are tracked separately and won't affect your income or spending totals.
        </p>
      )}

      <button disabled={saving} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold disabled:opacity-60">
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}