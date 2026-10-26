import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, Legend } from 'recharts';
import api, { fmt } from '../api';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#64748b'];

function Card({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [s, setS] = useState(null);

  useEffect(() => {
    setS(null);
    api.get(`/transactions/summary?month=${month}`).then((r) => setS(r.data));
  }, [month]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)}
          className="border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white" />
      </div>

      {!s ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-5 shadow">
            <p className="text-sm opacity-80">Balance this month</p>
            <p className="text-3xl font-bold">{fmt(s.balance)}</p>
            <p className="text-xs opacity-80 mt-1">Savings rate: {s.savingsRate}%</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card label="Income" value={fmt(s.income)} color="text-green-600" />
            <Card label="Spent" value={fmt(s.expense)} color="text-red-500" />
            <Card label="Others owe you" value={fmt(s.youAreOwed)} color="text-emerald-600" />
            <Card label="You owe" value={fmt(s.youOwe)} color="text-orange-500" />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-semibold mb-2">Spending by category</p>
            {s.byCategory.length === 0 ? (
              <p className="text-sm text-slate-400">No expenses this month</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={s.byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85}>
                      {s.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {s.byCategory.map((c, i) => (
                    <div key={c.name} className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        {c.name}
                      </span>
                      <span className="font-medium">{fmt(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-semibold mb-2">Last 6 months</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={s.trend}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Bar dataKey="income" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <button className="text-sm text-slate-400 underline"
        onClick={() => { localStorage.removeItem('token'); location.href = '/login'; }}>
        Log out
      </button>
    </div>
  );
}