import { useEffect, useState } from 'react';
import api, { fmt } from '../api';

export default function Transactions() {
  const [list, setList] = useState(null);
  const [type, setType] = useState('');
  const [month, setMonth] = useState('');

  const load = () => {
    const q = new URLSearchParams();
    if (type) q.set('type', type);
    if (month) q.set('month', month);
    api.get(`/transactions?${q}`).then((r) => setList(r.data));
  };
  useEffect(load, [type, month]);

  const remove = async (id) => {
    if (confirm('Delete this entry?')) { await api.delete(`/transactions/${id}`); load(); }
  };

  const box = 'border border-slate-200 rounded-xl px-3 py-2 bg-white text-sm';

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">History</h1>
      <div className="flex gap-2">
        <select className={box} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        <input type="month" className={box} value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      {list === null && <p className="text-slate-400 text-sm">Loading...</p>}
      {list?.map((t) => (
        <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center">
          <div>
            <p className="font-medium">{t.category}</p>
            <p className="text-xs text-slate-400">
              {new Date(t.date).toLocaleDateString('en-IN')} · {t.payment_method}{t.note && ` · ${t.note}`}
            </p>
          </div>
          <div className="text-right">
            <p className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
            </p>
            <button onClick={() => remove(t.id)} className="text-xs text-slate-400">Delete</button>
          </div>
        </div>
      ))}
      {list?.length === 0 && <p className="text-slate-400 text-sm">Nothing here yet. Tap + to add one.</p>}
    </div>
  );
}