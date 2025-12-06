import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Loader2, CheckSquare, Square } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('alice@nexus.corp');
  const [password, setPassword] = useState('secret_password');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{code: string, message: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Frontend validation (Rule 3.1.2)
    if (password.length < 8) {
       setError({ code: 'E-AUTH-001', message: '密碼長度需至少 8 碼' });
       setLoading(false);
       return;
    }

    try {
      const response = await authService.login(email, password, rememberMe);
      login(response);
      navigate('/dashboard');
    } catch (err: any) {
      setError({
        code: err.code || 'UNKNOWN',
        message: err.message || '發生未知錯誤'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 transform -rotate-6">
            <span className="text-white text-3xl font-bold">N</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nexus OS</h1>
          <p className="text-blue-200 text-sm mt-1">人員與權限管理模組</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">使用者登入</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-800">{error.code}</p>
                <p className="text-sm text-red-600">{error.message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email 電子郵件</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-900 placeholder-slate-400"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-700">密碼</label>
                <a href="#" className="text-xs text-blue-600 hover:text-blue-800">忘記密碼？</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
              <button type="button" className="text-blue-600 focus:outline-none">
                 {rememberMe ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-400" />}
              </button>
              <span className="ml-2 text-sm text-slate-600 select-none">記住我 (30天)</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? '驗證中...' : '登入系統'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
               測試帳號: admin@nexus.corp / alice@nexus.corp / bob@nexus.corp <br/>
               密碼請見 mockData.ts (通常為 username + 123)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};