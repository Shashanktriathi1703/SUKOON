import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previousChats, setPreviousChats] = useState([]);

  useEffect(() => {
    if (user) {
      // Group mood history by date for previous chats
      const grouped = user.moodHistory.reduce((acc, entry) => {
        const date = new Date(entry.date).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
      }, {});
      setPreviousChats(Object.entries(grouped).map(([date, entries]) => ({ date, entries })));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMsg = { type: 'user', text: message, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    setMessage('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/chat`, { 
        userId: user._id, 
        message 
      }, {
        withCredentials: true
      });

      const botMsg = {
        type: 'bot',
        mood: res.data.mood,
        text: res.data.response,
        suggestions: res.data.suggestedActions || [],
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, botMsg]);
      
      // Refresh user data without full page reload
      if (refreshUser) {
        await refreshUser();
      }
      
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory(prev => [...prev, { 
        type: 'bot', 
        text: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBookConsultation = async () => {
    const scriptLoaded = await loadRazorpayScript();
    
    if (!scriptLoaded) {
      alert('Failed to load Razorpay SDK. Please check your internet connection.');
      return;
    }

    try {
      // Create order on backend
      const orderRes = await axios.post(`${API_URL}/api/payment/create-order`, {
        amount: 99900, // ₹999 in paise
        userId: user._id
      }, {
        withCredentials: true
      });

      const { orderId, amount, currency } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'Sukoon Wellness',
        description: '60-Minute Consultation Session',
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyRes = await axios.post(`${API_URL}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user._id,
              amount: 999,
              username: user.username,
              email: user.email
            }, {
              withCredentials: true
            });

            if (verifyRes.data.success) {
              alert('🎉 Consultation booked successfully! Check your email for confirmation.');
              
              // Refresh user data
              if (refreshUser) {
                await refreshUser();
              }
              
              // Switch to bookings tab
              setActiveTab('bookings');
            }
          } catch (err) {
            console.error('Payment verification failed:', err);
            alert('Payment verification failed. Please contact support with your payment ID.');
          }
        },
        prefill: {
          name: user.username,
          email: user.email
        },
        theme: {
          color: '#10b981'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Booking error:', err);
      alert('Failed to initiate booking. Please try again.');
    }
  };

  const viewMyBookings = () => {
    navigate('/consultations');
  };

  const chartData = user?.moodHistory?.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: entry.mood === 'Motivated' ? 100 : entry.mood === 'Neutral' ? 60 : entry.mood === 'Stressed' ? 30 : entry.mood === 'Anxious' ? 40 : 10,
    mood: entry.mood
  })) || [];

  const getMoodColor = (mood) => {
    const colors = {
      'Motivated': '#10b981',
      'Neutral': '#3b82f6',
      'Stressed': '#f59e0b',
      'Burnt Out': '#ef4444',
      'Anxious': '#8b5cf6'
    };
    return colors[mood] || '#6b7280';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sukoon</h1>
                <p className="text-xs text-gray-500">Your Wellness Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.username}! 👋</h2>
          <p className="text-emerald-50 text-lg">How are you feeling today? Let's check in on your wellness journey.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === 'chat'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📜 Chat History
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab('consultation')}
            className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === 'consultation'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🩺 Book Consultation
          </button>
          <button
            onClick={viewMyBookings}
            className="px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap border-transparent text-gray-600 hover:text-gray-900"
          >
            📋 My Bookings
          </button>
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeTab === 'chat' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <h3 className="text-xl font-bold text-gray-900">AI Wellness Chat</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online
                  </span>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <div>
                        <div className="text-6xl mb-4">🌿</div>
                        <p className="text-gray-600 font-medium mb-2">Start a conversation!</p>
                        <p className="text-sm text-gray-500">Tell me how you're feeling today...</p>
                      </div>
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] ${msg.type === 'user' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl p-4 shadow`}>
                          {msg.type === 'bot' && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">🤖</span>
                              </div>
                              <span className="text-xs font-semibold text-gray-600">Sukoon AI</span>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {msg.suggestions.map((s, i) => (
                                <div key={i} className="bg-white/50 rounded-lg p-2 text-xs mt-2">
                                  <span className="font-semibold text-emerald-600">{s.type}:</span> {s.content} ({s.duration})
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs opacity-70 mt-2">
                            {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl p-4 shadow">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <span className="text-sm text-gray-600 ml-2">Sukoon is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="How are you feeling today?"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition"
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={isLoading || !message.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Previous Conversations</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {previousChats.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📜</div>
                      <p className="text-gray-600 font-medium mb-2">No chat history yet</p>
                      <p className="text-sm text-gray-500">Start chatting to see your previous conversations here</p>
                    </div>
                  ) : (
                    previousChats.map((chat, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-gray-900">{chat.date}</span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                            {chat.entries.length} messages
                          </span>
                        </div>
                        <div className="space-y-2">
                          {chat.entries.map((entry, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getMoodColor(entry.mood) }}></span>
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700">{entry.mood}</span>
                                <p className="text-xs text-gray-500 truncate">{entry.message}</p>
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(entry.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Your Mood Journey</h3>
                {chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis ticks={[0, 25, 50, 75, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
                      </AreaChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Total Check-ins</p>
                        <p className="text-3xl font-bold text-emerald-600">{user.moodHistory?.length || 0}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Current Mood</p>
                        <p className="text-3xl font-bold text-blue-600">{user.moodHistory?.[user.moodHistory.length - 1]?.mood || 'N/A'}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-600 font-medium mb-2">No mood data yet</p>
                    <p className="text-sm text-gray-500">Start chatting to see your mood analytics</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'consultation' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-3xl">🩺</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Book 1-on-1 Consultation</h3>
                  <p className="text-gray-600">Connect with a certified wellness consultant</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">60-Minute Private Session</p>
                      <p className="text-sm text-gray-600">Personalized guidance tailored to your needs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Certified Professionals</p>
                      <p className="text-sm text-gray-600">Licensed therapists & wellness coaches</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl mb-6 border-2 border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Session Price</p>
                      <p className="text-4xl font-bold text-amber-600">₹999</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">One-time payment</p>
                      <p className="text-xs text-gray-600">Email confirmation</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleBookConsultation}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-xl transition font-bold text-lg"
                >
                  Book Now with Razorpay
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="font-bold text-gray-900 mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm text-gray-700">Total Chats</span>
                  <span className="font-bold text-emerald-600">{user.moodHistory?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">This Week</span>
                  <span className="font-bold text-blue-600">
                    {user.moodHistory?.filter(m => new Date(m.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-700">Consultations</span>
                  <span className="font-bold text-purple-600">{user.consultations?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Mood Legend */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="font-bold text-gray-900 mb-4">Mood Guide</h4>
              <div className="space-y-2">
                {['Motivated', 'Neutral', 'Anxious', 'Stressed', 'Burnt Out'].map(mood => (
                  <div key={mood} className="flex items-center gap-3 p-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMoodColor(mood) }}></div>
                    <span className="text-sm text-gray-700">{mood}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
              <h4 className="font-bold mb-2">Need Help?</h4>
              <p className="text-sm text-purple-50 mb-4">Our team is here 24/7</p>
              <button className="w-full py-2 bg-white text-purple-600 rounded-lg hover:shadow-lg transition font-semibold text-sm">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}