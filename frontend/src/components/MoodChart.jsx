import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, getMoodColor }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass p-3 rounded-xl shadow-lg border border-serene">
        <p className="font-semibold text-leaf">{data.date} at {data.time}</p>
        <p className="text-sm text-gray-700">
          Mood: <span className="font-bold" style={{ color: getMoodColor(data.mood) }}>
            {data.mood}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function MoodChart({ moodHistory }) {
  // Transform mood data for chart
  const chartData = moodHistory
    .slice()
    .reverse()
    .map((entry, index) => ({
      date: format(new Date(entry.date), 'MMM dd'),
      shortDate: format(new Date(entry.date), 'MM/dd'),
      time: format(new Date(entry.date), 'HH:mm'),
      mood: entry.mood,
      value: getMoodValue(entry.mood),
      index
    }));

  function getMoodValue(mood) {
    const values = {
      'Motivated': 100,
      'Neutral': 60,
      'Anxious': 40,
      'Stressed': 30,
      'Burnt Out': 10
    };
    return values[mood] || 50;
  }

  const getMoodColor = (mood) => {
    const colors = {
      'Motivated': '#10b981',
      'Neutral': '#60a5fa',
      'Anxious': '#8b5cf6',
      'Stressed': '#f59e0b',
      'Burnt Out': '#ef4444'
    };
    return colors[mood] || '#94a3b8';
  };

  return (
    <div className="h-full">
      <h2 className="text-2xl font-bold text-leaf mb-6 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Your Mood Journey
      </h2>

      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="shortDate" 
                tick={{ fill: '#666', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fill: '#666', fontSize: 12 }}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip getMoodColor={getMoodColor} />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMood)"
                dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Mood Legend */}
          <div className="flex justify-center gap-4 mt-6 flex-wrap">
            {['Motivated', 'Neutral', 'Anxious', 'Stressed', 'Burnt Out'].map(mood => (
              <div key={mood} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getMoodColor(mood) }}
                ></div>
                <span className="text-xs text-gray-700 font-medium">{mood}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-calm to-serene p-4 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Total Check-ins</p>
              <p className="text-2xl font-bold text-leaf">{moodHistory.length}</p>
            </div>
            <div className="bg-gradient-to-r from-sky to-blue-200 p-4 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Most Recent</p>
              <p className="text-2xl font-bold text-blue-600">
                {moodHistory[moodHistory.length - 1]?.mood || 'N/A'}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="h-64 flex items-center justify-center text-center">
          <div>
            <div className="text-6xl mb-4 animate-float">📊</div>
            <p className="text-gray-600 font-medium mb-2">No mood data yet</p>
            <p className="text-sm text-gray-500">Start chatting to see your mood trend</p>
          </div>
        </div>
      )}
    </div>
  );
}