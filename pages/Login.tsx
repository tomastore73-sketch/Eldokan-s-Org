import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      
      if (data.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (data.role === 'VENDOR') {
        navigate('/vendor');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-8 text-center bg-stone-900 text-white">
          <Store className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <h2 className="text-3xl font-bold font-serif mb-2">Eldokan Portal</h2>
          <p className="text-stone-400 text-sm">Vendor & Administration Access</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              required
            />
          </div>
          <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-xl transition-colors">
            Secure Login
          </button>
        </form>

        <div className="p-6 bg-stone-50 border-t border-stone-100 flex items-center justify-center gap-2 text-stone-500 text-sm">
          <Shield className="w-4 h-4" />
          Restricted Area
        </div>
      </motion.div>
    </div>
  );
}
