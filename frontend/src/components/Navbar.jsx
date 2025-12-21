import { Link } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-serene/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-leaf to-forest rounded-xl flex items-center justify-center transform transition group-hover:scale-110">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold text-leaf">MoodAI</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-leaf font-medium transition"
            >
              Dashboard
            </Link>
            <Link 
              to="/consultations" 
              className="text-gray-700 hover:text-leaf font-medium transition"
            >
              My Bookings
            </Link>
            
            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}