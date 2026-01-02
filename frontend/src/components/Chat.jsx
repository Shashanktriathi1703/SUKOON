import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const API_URL='https://sukoon-vzwh.onrender.com';

export default function Chat({ userId }) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { refreshUser } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = { type: 'user', text: message, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    setMessage('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/chat`, { 
        userId, 
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
      
      // Refresh user data to update mood history
      refreshUser();
      
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Sorry, I had trouble processing that. Please try again.');
      setChatHistory(prev => [...prev, { 
        type: 'bot', 
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMoodEmoji = (mood) => {
    const emojis = {
      'Motivated': '💪',
      'Neutral': '😊',
      'Stressed': '😰',
      'Burnt Out': '😔',
      'Anxious': '😟'
    };
    return emojis[mood] || '🙂';
  };

  return (
    <div className="flex flex-col h-[600px]">
      <h2 className="text-2xl font-bold text-leaf mb-4 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Chat with MoodAI
      </h2>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-white/50 rounded-2xl p-4 mb-4 space-y-4 scroll-smooth">
        {chatHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="text-6xl mb-4 animate-float">🌿</div>
              <p className="text-gray-600 mb-2">Start a conversation!</p>
              <p className="text-sm text-gray-500">Tell me how you're feeling today...</p>
            </div>
          </div>
        ) : (
          chatHistory.map((msg, i) => (
            <div 
              key={i} 
              className={`chat-bubble max-w-[85%] ${
                msg.type === 'user' ? 'ml-auto' : 'mr-auto'
              }`}
            >
              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl ${
                msg.type === 'user' 
                  ? 'bg-gradient-to-r from-sky to-blue-200 text-gray-800' 
                  : 'bg-gradient-to-r from-serene to-calm text-gray-800'
              }`}>
                {/* Mood Badge for Bot */}
                {msg.type === 'bot' && msg.mood && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getMoodEmoji(msg.mood)}</span>
                    <span className="text-xs font-semibold px-2 py-1 bg-white/50 rounded-full">
                      Detected: {msg.mood}
                    </span>
                  </div>
                )}
                
                {/* Message Text */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/30">
                    <p className="text-xs font-semibold mb-2">💡 Personalized suggestions:</p>
                    <div className="space-y-2">
                      {msg.suggestions.map((s, j) => (
                        <div 
                          key={j} 
                          className="text-xs bg-white/40 p-2 rounded-lg flex items-center gap-2"
                        >
                          <span className="capitalize font-semibold text-leaf">{s.type}:</span>
                          <span>{s.content}</span>
                          {s.duration && <span className="text-gray-600">({s.duration})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <p className={`text-xs text-gray-500 mt-1 ${
                msg.type === 'user' ? 'text-right' : 'text-left'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 animate-pulse">
            <div className="w-2 h-2 bg-leaf rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-leaf rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-leaf rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="text-sm ml-2">MoodAI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-3">
        <textarea
          className="flex-1 px-4 py-3 rounded-xl border-2 border-serene focus:border-leaf outline-none transition bg-white resize-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="How are you feeling today?"
          rows={2}
          disabled={isLoading}
        />
        <button 
          onClick={sendMessage} 
          disabled={isLoading || !message.trim()}
          className="bg-gradient-to-r from-leaf to-forest hover:from-forest hover:to-earth text-white font-bold px-6 py-3 rounded-xl transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed btn-hover"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}