import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Consultations() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/payment/consultations/${user._id}`, {
          withCredentials: true
        });
        setConsultations(res.data);
      } catch (error) {
        console.error('Failed to fetch consultations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchConsultations();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-blue-100 text-blue-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pb-12">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Header */}
        <div className="glass rounded-3xl p-8 mb-8 animate-slideUp">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-leaf" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h1 className="text-4xl font-bold text-leaf">My Consultations</h1>
          </div>
          <p className="text-gray-600">View all your booked wellness sessions</p>
        </div>

        {/* Consultations List */}
        <div className="glass rounded-3xl p-8 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your bookings...</p>
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-600 text-lg mb-2">No consultations booked yet</p>
              <p className="text-sm text-gray-500 mb-6">Book your first session to get personalized wellness guidance</p>
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-leaf to-forest hover:from-forest hover:to-earth text-white px-6 py-3 rounded-xl font-semibold transition transform hover:scale-105 btn-hover"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <div 
                  key={consultation._id}
                  className="bg-gradient-to-r from-calm to-serene p-6 rounded-2xl border-l-4 border-leaf"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Left Side */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(consultation.status)}`}>
                          {consultation.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-600">
                          Booking ID: {consultation._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        1-on-1 Wellness Consultation
                      </h3>
                      
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Booked by: <strong>{consultation.username}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>{consultation.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>
                            {new Date(consultation.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="md:text-right">
                      <div className="bg-white/60 p-4 rounded-xl inline-block">
                        <p className="text-xs text-gray-600 mb-1">Amount Paid</p>
                        <p className="text-3xl font-bold text-leaf">₹{consultation.amount}</p>
                        <p className="text-xs text-gray-500 mt-1">Payment ID: {consultation.paymentId.slice(-12)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {consultation.notes && (
                    <div className="mt-4 pt-4 border-t border-white/50">
                      <p className="text-sm text-gray-700">
                        <strong>Notes:</strong> {consultation.notes}
                      </p>
                    </div>
                  )}

                  {/* Action Info */}
                  {consultation.status === 'confirmed' && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-sm text-amber-800">
                        ✉️ <strong>Next Step:</strong> Our consultant will contact you within 24 hours to schedule your session.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}