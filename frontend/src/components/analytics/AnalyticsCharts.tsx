import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

// --- Types ---
export interface FleetHealthData {
  drone_id: string;
  battery_health: number;
  motor_reliability: number;
  range_efficiency: number;
  total_km: number;
}

export interface YieldData {
  category: string;
  revenue: number;
  percentage: number;
}

export interface WeatherCorrelationData {
  timestamp: string;
  revenue: number;
  intensity: number;
}

// --- Components ---

export const WeatherImpactChart: React.FC<{ data: WeatherCorrelationData[] }> = ({ data }) => {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fill: '#666', fontSize: 10 }} 
            axisLine={{ stroke: '#333' }}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: '#00ffcc', fontSize: 10 }} 
            axisLine={{ stroke: '#333' }}
            label={{ value: 'Revenue (KES)', angle: -90, position: 'insideLeft', fill: '#00ffcc', fontSize: 10 }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#fff', fontSize: 10 }} 
            axisLine={{ stroke: '#333' }}
            label={{ value: 'Storm Intensity', angle: 90, position: 'insideRight', fill: '#fff', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
          
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="revenue" 
            fill="url(#colorRev)" 
            stroke="#00ffcc" 
            name="Network Yield"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="intensity" 
            stroke="#fff" 
            strokeWidth={3}
            dot={{ fill: '#fff' }}
            name="Storm Intensity"
          />

          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00ffcc" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export const FleetHealthRadar: React.FC<{ data: FleetHealthData[] }> = ({ data }) => {
  // Transform data for Radar Chart (each drone gets a radar path)
  const colors = ["#00ffcc", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="drone_id" tick={{ fill: '#666', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          
          <Radar
            name="Battery"
            dataKey="battery_health"
            stroke="#00ffcc"
            fill="#00ffcc"
            fillOpacity={0.2}
          />
          <Radar
            name="Motor"
            dataKey="motor_reliability"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
          />
          <Radar
            name="Range"
            dataKey="range_efficiency"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.2}
          />
          
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '12px' }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const NetworkYieldDonut: React.FC<{ data: YieldData[] }> = ({ data }) => {
  const COLORS = ['#00ffcc', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={5}
            dataKey="revenue"
            nameKey="category"
          >
            {(data || []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '12px' }}
            formatter={(value: any) => `KES ${value.toLocaleString()}`}
          />
          <Legend verticalAlign="bottom" align="center" iconType="diamond" wrapperStyle={{ fontSize: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
