import { useEffect, useState } from 'react';
import api, { fmt } from '../api';

export default function Loans() {
  const [list, setList] = useState(null);
  const [tab, setTab] = useState('lent');

  const load = () => api.get('/loans').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const addPayment = async (loan) => {
    const v = prompt(`Repayment amount (remaining ${fmt(loan.remaining)})`, loan.remaining);
    if (!v) return;
    try {
      await api.post(`/loans/${loan.id}/payments`, { amount: Number(v) });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const remove = async (id) => {
    if (confirm('Delete this loan and its repayments?')) { await api.delete(`/loans/${id}`); load(); }
  };

  const items = (list || []).filter((l) => l.direction === tab);
  const totalRemaining = items.reduce((s, l) => s + l.remaining, 0);

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">Lent & Borrowed</h1>

      <div className="grid grid-cols-2 gap-2 bg-slate-200 p-1 rounded-xl">
        {[['lent', 'Others owe me'], ['borrowed', 'I owe']].map(([v, label]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`py-2 rounded-lg text-sm ${tab === v ? 'bg-white shadow font-semibold' : 'text-slate-600'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-slate-500">{tab === 'lent' ? 'Total to receive' : 'Total to pay'}</p>
        <p className={`text-2xl font-bold ${tab === 'lent' ? 'text-emerald-600' : 'text-orange-500'}`}>{fmt(totalRemaining)}</p>
      </div>

      {list === null && <p className="text-slate-400 text-sm">Loading...</p>}
      {items.map((l) => {
        const settled = l.remaining <= 0;
        const pct = Math.min(100, Math.round((l.paid / l.amount) * 100));
        return (
          <div key={l.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{l.person}</p>
                <p className="text-xs text-slate-400">{new Date(l.date).toLocaleDateString('en-IN')}{l.note && ` · ${l.note}`}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full h-fit ${settled ? 'bg-green-100 text-green-700' : l.paid > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                {settled ? 'Settled' : l.paid > 0 ? 'Partial' : 'Pending'}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-sm">
              <span>Total {fmt(l.amount)}</span>
              <span>Paid {fmt(l.paid)}</span>
              <span className="font-semibold">Left {fmt(l.remaining)}</span>
            </div>
            <div className="flex justify-between">
              {!settled
                ? <button onClick={() => addPayment(l)} className="text-sm text-indigo-600 font-medium">+ Add repayment</button>
                : <span />}
              <button onClick={() => remove(l.id)} className="text-xs text-slate-400">Delete</button>
            </div>
          </div>
        );
      })}
      {list && items.length === 0 && <p className="text-slate-400 text-sm">No entries here yet.</p>}
    </div>
  );
}