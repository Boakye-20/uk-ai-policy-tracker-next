'use client';

import { useEffect, useState } from 'react';
import { Policy } from '@/types/policy';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function Analytics() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/policies');
      const result = await response.json();
      setPolicies(result.data);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Timeline data - publications over time
  const getTimelineData = () => {
    const grouped = policies.reduce((acc, policy) => {
      const yearMonth = policy.year_month || 'Unknown';
      if (!acc[yearMonth]) {
        acc[yearMonth] = { period: yearMonth, count: 0, totalScore: 0, policies: [] };
      }
      acc[yearMonth].count++;
      acc[yearMonth].totalScore += policy.relevance_score || 0;
      acc[yearMonth].policies.push(policy);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped)
      .map((item: any) => ({
        period: item.period,
        count: item.count,
        avgScore: (item.totalScore / item.count).toFixed(1),
      }))
      .sort((a: any, b: any) => a.period.localeCompare(b.period))
      .slice(-24); // Last 24 months
  };

  // Policy types over time
  const getPolicyTypeTimeline = () => {
    const types = [...new Set(policies.map(p => p.policy_type))];
    const periods = [...new Set(policies.map(p => p.year_month))].sort().slice(-12);
    
    return periods.map(period => {
      const periodData: any = { period };
      types.forEach(type => {
        periodData[type] = policies.filter(p => p.year_month === period && p.policy_type === type).length;
      });
      return periodData;
    });
  };

  // Department activity over time
  const getDepartmentActivity = () => {
    const depts = [...new Set(policies.map(p => p.dept))].slice(0, 6); // Top 6 departments
    const periods = [...new Set(policies.map(p => p.year_month))].sort().slice(-12);
    
    return periods.map(period => {
      const periodData: any = { period };
      depts.forEach(dept => {
        periodData[dept] = policies.filter(p => p.year_month === period && p.dept === dept).length;
      });
      return periodData;
    });
  };

  // Relevance score distribution
  const getScoreDistribution = () => {
    const distribution = [
      { range: '0-2', count: 0 },
      { range: '2-4', count: 0 },
      { range: '4-6', count: 0 },
      { range: '6-8', count: 0 },
      { range: '8-10', count: 0 },
    ];

    policies.forEach(policy => {
      const score = policy.relevance_score;
      if (score < 2) distribution[0].count++;
      else if (score < 4) distribution[1].count++;
      else if (score < 6) distribution[2].count++;
      else if (score < 8) distribution[3].count++;
      else distribution[4].count++;
    });

    return distribution;
  };

  // Sector trends
  const getSectorTrends = () => {
    const sectors = policies.reduce((acc, policy) => {
      const sector = policy.sector_focus || 'Unknown';
      if (!acc[sector]) {
        acc[sector] = { sector, count: 0, avgScore: 0, totalScore: 0 };
      }
      acc[sector].count++;
      acc[sector].totalScore += policy.relevance_score || 0;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(sectors)
      .map((item: any) => ({
        sector: item.sector,
        count: item.count,
        avgScore: parseFloat((item.totalScore / item.count).toFixed(1)),
      }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
  };

  // Calculate trends
  const calculateTrend = () => {
    const timeline = getTimelineData();
    if (timeline.length < 2) return { direction: 'stable', percentage: 0 };
    
    const recent = timeline.slice(-3).reduce((sum, item) => sum + item.count, 0);
    const previous = timeline.slice(-6, -3).reduce((sum, item) => sum + item.count, 0);
    
    if (previous === 0) return { direction: 'up', percentage: 100 };
    
    const change = ((recent - previous) / previous) * 100;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs(Math.round(change)),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const timelineData = getTimelineData();
  const policyTypeTimeline = getPolicyTypeTimeline();
  const departmentActivity = getDepartmentActivity();
  const scoreDistribution = getScoreDistribution();
  const sectorTrends = getSectorTrends();
  const trend = calculateTrend();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Trend Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Publication Trend</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}{trend.percentage}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Last 3 months vs previous 3</p>
            </div>
            <div className={`p-3 rounded-full ${trend.direction === 'up' ? 'bg-green-100' : trend.direction === 'down' ? 'bg-red-100' : 'bg-gray-100'}`}>
              {trend.direction === 'up' ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : trend.direction === 'down' ? (
                <TrendingDown className="w-8 h-8 text-red-600" />
              ) : (
                <Activity className="w-8 h-8 text-gray-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Most Active Department</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {[...new Set(policies.map(p => p.dept))].reduce((max, dept) => {
              const count = policies.filter(p => p.dept === dept).length;
              return count > (policies.filter(p => p.dept === max).length) ? dept : max;
            })}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {Math.max(...[...new Set(policies.map(p => p.dept))].map(dept => 
              policies.filter(p => p.dept === dept).length
            ))} policies published
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Average Relevance Score</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {(policies.reduce((sum, p) => sum + p.relevance_score, 0) / policies.length).toFixed(1)}/10
          </p>
          <p className="text-sm text-gray-500 mt-1">Across all {policies.length} policies</p>
        </div>
      </div>

      {/* Publications Timeline */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Publications Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timelineData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="count" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCount)" name="Publications" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Score Timeline */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Relevance Score Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" angle={-45} textAnchor="end" height={100} />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgScore" stroke="#8b5cf6" strokeWidth={2} name="Avg Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Department Activity */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Activity Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={departmentActivity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(departmentActivity[0] || {}).filter(key => key !== 'period').map((dept, index) => (
              <Line key={dept} type="monotone" dataKey={dept} stroke={`hsl(${index * 60}, 70%, 50%)`} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Score Distribution & Sector Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Relevance Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Policies" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Sectors by Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorTrends} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="sector" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#f59e0b" name="Policies" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Key Insights</h3>
        <ul className="space-y-2 text-blue-800">
          <li>• Publication activity has {trend.direction === 'up' ? 'increased' : trend.direction === 'down' ? 'decreased' : 'remained stable'} by {trend.percentage}% in recent months</li>
          <li>• {sectorTrends[0]?.sector} is the most active sector with {sectorTrends[0]?.count} policies</li>
          <li>• Average relevance score is {(policies.reduce((sum, p) => sum + p.relevance_score, 0) / policies.length).toFixed(1)}/10 across all policies</li>
          <li>• {policies.filter(p => p.relevance_score >= 7).length} policies are high priority (score ≥ 7)</li>
        </ul>
      </div>
    </div>
  );
}
