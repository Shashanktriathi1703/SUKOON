import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password.length < 6) {
      return;
    }
    
    setIsLoading(true);
    try {
      await signup(form.username, form.email, form.password);
      // Wait 2 seconds to show success message before redirecting
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      // Error handled by context
      console.error('Signup error:', err);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-leaf mb-2">Join MoodAI</h1>
          <p className="text-gray-600">Start your wellness journey today</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
            <input
              type="text"
              placeholder="Choose a username"
              className="w-full px-5 py-4 rounded-xl border-2 border-serene focus:border-leaf outline-none transition bg-white"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              minLength={3}
              required
            />
          </div>

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
            <p className="text-xs text-gray-500 mt-1">📧 You'll receive a welcome email with your account details</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              className="w-full px-5 py-4 rounded-xl border-2 border-serene focus:border-leaf outline-none transition bg-white"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-leaf to-forest hover:from-forest hover:to-earth text-green-900 font-bold py-4 rounded-xl transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed btn-hover"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="spinner mr-2 border-black"></div>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-leaf font-bold hover:underline">
            Login here
          </Link>
        </p>

        {/* Benefits */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-2 h-2 rounded-full bg-leaf"></div>
            <span>AI-powered mood detection & personalized recommendations</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-2 h-2 rounded-full bg-leaf"></div>
            <span>Track your wellness journey with beautiful visualizations</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-2 h-2 rounded-full bg-leaf"></div>
            <span>Book 1-on-1 sessions with certified wellness consultants</span>
          </div>
        </div>
      </div>
    </div>
  );
}