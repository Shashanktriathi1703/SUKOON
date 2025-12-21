import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      // Error handled by context
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass rounded-3xl shadow-2xl p-8 md:p-10 animate-float">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-leaf/10 rounded-full mb-4">
            <svg className="w-12 h-12 text-leaf" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-leaf mb-2">Welcome Back</h1>
          <p className="text-gray-600">Continue your wellness journey</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-5 py-4 rounded-xl border-2 border-serene focus:border-leaf outline-none transition bg-white"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-5 py-4 rounded-xl border-2 border-serene focus:border-leaf outline-none transition bg-white"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-leaf to-forest hover:from-forest hover:to-earth font-bold py-4 rounded-xl transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed btn-hover text-green-900"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="spinner mr-2 border-white"></div>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-leaf font-bold hover:underline">
            Sign up here
          </Link>
        </p>

        {/* Demo Info */}
        <div className="mt-8 p-4 bg-sky/20 rounded-xl border border-sky">
          <p className="text-sm text-gray-700 text-center">
            <span className="font-semibold">✨ New here?</span> Create an account to start tracking your mood and get personalized wellness recommendations!
          </p>
        </div>
      </div>
    </div>
  );
}