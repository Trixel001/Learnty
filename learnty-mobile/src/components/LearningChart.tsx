import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface LearningChartProps {
  data: Array<{ day: string; minutes: number }>
  title: string
}

export default function LearningChart({ data, title }: LearningChartProps) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        {/* @ts-ignore - Recharts type compatibility issue with React 18 */}
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          {/* @ts-ignore */}
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          {/* @ts-ignore */}
          <XAxis 
            dataKey="day" 
            stroke="#9ca3af"
            style={{ fontSize: '12px' } as React.CSSProperties}
          />
          {/* @ts-ignore */}
          <YAxis 
            stroke="#9ca3af"
            style={{ fontSize: '12px' } as React.CSSProperties}
          />
          {/* @ts-ignore */}
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: 'none', 
              borderRadius: '8px',
              color: '#fff'
            } as React.CSSProperties}
            formatter={(value: any) => [`${value} min`, 'Learning Time']}
          />
          {/* @ts-ignore */}
          <Area 
            type="monotone" 
            dataKey="minutes" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorMinutes)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
