import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Loans from './pages/Loans';

const tab = ({ isActive }) =>
  `flex flex-col items-center text-xs px-3 ${isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`;

function Protected({ children }) {
  if (!localStorage.getItem('token')) return <Navigate to="/login" />;
  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 bg-slate-50">
      {children}
      <nav className="fixed bottom-0 inset-x-0 max-w-md mx-auto bg-white border-t flex justify-around py-2">
        <NavLink to="/" end className={tab}><span className="text-xl">🏠</span>Home</NavLink>
        <NavLink to="/transactions" className={tab}><span className="text-xl">📋</span>History</NavLink>
        <NavLink to="/add" className="-mt-6 bg-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg">+</NavLink>
        <NavLink to="/loans" className={tab}><span className="text-xl">🤝</span>Loans</NavLink>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/add" element={<Protected><AddTransaction /></Protected>} />
        <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
        <Route path="/loans" element={<Protected><Loans /></Protected>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}