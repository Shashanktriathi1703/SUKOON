import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previousChats, setPreviousChats] = useState([]);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    if (user) {
      const grouped = user.moodHistory.reduce((acc, entry) => {
        const date = new Date(entry.date).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
      }, {});
      setPreviousChats(
        Object.entries(grouped)
          .map(([date, entries]) => ({ date, entries }))
          .reverse()
      );
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMsg = { type: "user", text: message, timestamp: new Date() };
    setChatHistory((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/chat`,
        {
          userId: user._id,
          message,
        },
        {
          withCredentials: true,
        }
      );

      const botMsg = {
        type: "bot",
        mood: res.data.mood,
        text: res.data.response,
        suggestions: res.data.suggestedActions || [],
        timestamp: new Date(),
      };

      setChatHistory((prev) => [...prev, botMsg]);

      // Refresh user data WITHOUT page reload
      await refreshUser();
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          type: "bot",
          text: "I'm having trouble connecting right now. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBookConsultation = async () => {
    setIsLoading(true);

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load");
        setIsLoading(false);
        return;
      }

      const orderResponse = await axios.post(
        `${API_URL}/api/payment/create-order`,
        {
          amount: 999,
          currency: "INR",
        },
        {
          withCredentials: true,
        }
      );

      const { orderId, amount, currency, key } = orderResponse.data;

      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: "MoodAI Wellness",
        description: "1-on-1 Wellness Consultation",
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyResponse = await axios.post(
              `${API_URL}/api/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user._id,
                username: user.username,
                email: user.email,
                amount: amount,
              },
              {
                withCredentials: true,
              }
            );

            if (verifyResponse.data.success) {
              alert("🎉 Consultation booked! Check your email for details.");
              await refreshUser();
              setShowConsultModal(false);
            } else {
              alert("Payment verification failed");
            }
          } catch (error) {
            console.error("Verification error:", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user.username,
          email: user.email,
        },
        theme: {
          color: "#10b981",
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      setIsLoading(false);
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment");
      setIsLoading(false);
    }
  };

  const chartData =
    user?.moodHistory?.map((entry, idx) => ({
      date: new Date(entry.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value:
        entry.mood === "Motivated"
          ? 100
          : entry.mood === "Neutral"
          ? 60
          : entry.mood === "Stressed"
          ? 30
          : entry.mood === "Anxious"
          ? 40
          : 10,
      mood: entry.mood,
    })) || [];

  const getMoodColor = (mood) => {
    const colors = {
      Motivated: "#10b981",
      Neutral: "#3b82f6",
      Stressed: "#f59e0b",
      "Burnt Out": "#ef4444",
      Anxious: "#8b5cf6",
    };
    return colors[mood] || "#6b7280";
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
                <span className="text-white font-bold text-xl">SAI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sukoon</h1>
                <p className="text-xs text-gray-500">Your Wellness Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user.username}! 👋
          </h2>
          <p className="text-emerald-50 text-lg">
            How are you feeling today? Let's check in on your wellness journey.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === "chat"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === "history"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            📜 Chat History
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === "analytics"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === "bookings"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            🩺 My Bookings
          </button>
          <button
            onClick={() => setShowConsultModal(true)}
            className="px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg hover:shadow-lg"
          >
            📅 Book Session
          </button>
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeTab === "chat" && (
              <div className="bg-white rounded-2xl shadow-lg p-6 h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <h3 className="text-xl font-bold text-gray-900">
                    AI Wellness Chat
                  </h3>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <div>
                        <div className="text-6xl mb-4">🌿</div>
                        <p className="text-gray-600 font-medium mb-2">
                          Start a conversation!
                        </p>
                        <p className="text-sm text-gray-500">
                          Tell me how you're feeling today...
                        </p>
                      </div>
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          msg.type === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] ${
                            msg.type === "user"
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          } rounded-2xl p-4 shadow`}
                        >
                          {msg.type === "bot" && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">🤖</span>
                              </div>
                              <span className="text-xs font-semibold text-gray-600">
                                SukoonAI • Detected: {msg.mood}
                              </span>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold mb-2">
                                💡 Suggestions:
                              </p>
                              {msg.suggestions.map((s, i) => (
                                <div
                                  key={i}
                                  className="bg-white/50 rounded-lg p-2 text-xs mt-2"
                                >
                                  <span className="font-semibold text-emerald-600">
                                    {s.type}:
                                  </span>{" "}
                                  {s.content} ({s.duration})
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs opacity-70 mt-2">
                            {new Date(msg.timestamp).toLocaleTimeString(
                              "en-US",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
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
                          <div
                            className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <span className="text-sm text-gray-600 ml-2">
                            SukoonAI is thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
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

            {activeTab === "history" && (
              <div className="bg-white rounded-2xl shadow-lg p-6 max-h-[600px] overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Previous Conversations
                </h3>
                <div className="space-y-4">
                  {previousChats.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📜</div>
                      <p className="text-gray-600 font-medium mb-2">
                        No chat history yet
                      </p>
                      <p className="text-sm text-gray-500">
                        Start chatting to see your previous conversations here
                      </p>
                    </div>
                  ) : (
                    previousChats.map((chat, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-gray-900">
                            {chat.date}
                          </span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                            {chat.entries.length} messages
                          </span>
                        </div>
                        <div className="space-y-2">
                          {chat.entries.map((entry, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: getMoodColor(entry.mood),
                                }}
                              ></span>
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {entry.mood}
                                </span>
                                <p className="text-xs text-gray-500 truncate">
                                  {entry.message}
                                </p>
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(entry.date).toLocaleTimeString(
                                  "en-US",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
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

            {activeTab === "analytics" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Your Mood Journey
                </h3>
                {chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="colorMood"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <YAxis
                          ticks={[0, 25, 50, 75, 100]}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                          domain={[0, 100]}
                        />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#10b981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorMood)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">
                          Total Check-ins
                        </p>
                        <p className="text-3xl font-bold text-emerald-600">
                          {user.moodHistory?.length || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">
                          Current Mood
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          {user.moodHistory?.[user.moodHistory.length - 1]
                            ?.mood || "N/A"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-600 font-medium mb-2">
                      No mood data yet
                    </p>
                    <p className="text-sm text-gray-500">
                      Start chatting to see your mood analytics
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  My Consultation Bookings
                </h3>
                <div className="space-y-4">
                  {user.consultations && user.consultations.length > 0 ? (
                    user.consultations.map((consult, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-gray-200 rounded-xl"
                      >
                        <p className="font-semibold text-gray-900">
                          Consultation #{idx + 1}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: Confirmed
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📅</div>
                      <p className="text-gray-600 font-medium mb-2">
                        No bookings yet
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Book a consultation to get started
                      </p>
                      <button
                        onClick={() => setShowConsultModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition font-semibold"
                      >
                        Book Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - continues in next part... */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="font-bold text-gray-900 mb-4">Quick Stats</h4>
              {/* Add this in the sidebar, after Quick Stats card */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg p-6 text-white">
                <h4 className="font-bold mb-2">📧 Weekly Report</h4>
                <p className="text-sm text-blue-50 mb-4">
                  Get your mood insights via email
                </p>
                <button
                  onClick={async () => {
                    try {
                      const res = await axios.post(
                        `${API_URL}/api/send-report`,
                        {
                          userId: user._id,
                        },
                        {
                          withCredentials: true,
                        }
                      );
                      alert("✅ Report sent to " + user.email);
                    } catch (error) {
                      alert("❌ Failed to send report");
                    }
                  }}
                  className="w-full py-2 bg-white text-blue-600 rounded-lg hover:shadow-lg transition font-semibold text-sm"
                >
                  Send Report Now
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm text-gray-700">Total Chats</span>
                  <span className="font-bold text-emerald-600">
                    {user.moodHistory?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">This Week</span>
                  <span className="font-bold text-blue-600">
                    {user.moodHistory?.filter(
                      (m) =>
                        new Date(m.date) >
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-700">Consultations</span>
                  <span className="font-bold text-purple-600">
                    {user.consultations?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="font-bold text-gray-900 mb-4">Mood Guide</h4>
              <div className="space-y-2">
                {[
                  "Motivated",
                  "Neutral",
                  "Anxious",
                  "Stressed",
                  "Burnt Out",
                ].map((mood) => (
                  <div key={mood} className="flex items-center gap-3 p-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getMoodColor(mood) }}
                    ></div>
                    <span className="text-sm text-gray-700">{mood}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
              <h4 className="font-bold mb-2">Need Immediate Help?</h4>
              <p className="text-sm text-purple-50 mb-4">
                Our team is here 24/7
              </p>
              <button
                onClick={() => setShowConsultModal(true)}
                className="w-full py-2 bg-white text-purple-600 rounded-lg hover:shadow-lg transition font-semibold text-sm"
              >
                Book Consultation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Consultation Modal */}
      {showConsultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 relative">
            <button
              onClick={() => setShowConsultModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">🩺</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Book 1-on-1 Consultation
              </h3>
              <p className="text-gray-600">
                60-minute session with certified wellness expert
              </p>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl mb-6 border-2 border-amber-200">
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
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-xl transition font-bold text-lg disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Book Now with Razorpay"}
            </button>
            <p className="text-xs text-gray-500 text-center mt-4">
              🔒 Secure payment powered by Razorpay
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
