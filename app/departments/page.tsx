'use client';

import { useEffect, useState } from 'react';
import { Policy } from '@/types/policy';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, TrendingUp, FileText, Calendar } from 'lucide-react';

export default function DepartmentAnalysis() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('');

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/policies');
      const result = await response.json();
      setPolicies(result.data);
      if (result.data && result.data.length > 0) {
        // Set first department as default
        const depts = [...new Set<string>(
          result.data
            .map((p: Policy) => p.dept)
            .filter((d: unknown): d is string => typeof d === 'string' && d.length > 0)
        )];
          
        if (depts.length > 0) {
          const firstDept = depts[0];
          if (firstDept) {
            setSelectedDept(firstDept);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const departments = [...new Set(policies.map(p => p.dept).filter((d: any): d is string => Boolean(d)))].sort();

  // Department overview stats
  const getDepartmentStats = () => {
    return departments.map(dept => {
      const deptPolicies = policies.filter(p => p.dept === dept);
      const avgScore = deptPolicies.reduce((sum, p) => sum + (p.relevance_score || 0), 0) / Math.max(1, deptPolicies.length);
      const highPriority = deptPolicies.filter(p => (p.relevance_score || 0) >= 7).length;
      
      return {
        dept,
        count: deptPolicies.length,
        avgScore: parseFloat(avgScore.toFixed(1)),
        highPriority,
        percentage: ((deptPolicies.length / policies.length) * 100).toFixed(1)
      };
    }).sort((a, b) => b.count - a.count);
  };

  // Selected department deep dive
  const getSelectedDeptData = () => {
    if (!selectedDept) return null;
    
    const deptPolicies = policies.filter(p => p.dept === selectedDept);
    if (deptPolicies.length === 0) return null;
    
    // Policy types
    const policyTypes = deptPolicies.reduce((acc, p) => {
      if (p.policy_type) {
        acc[p.policy_type] = (acc[p.policy_type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Timeline
    const timeline = deptPolicies.reduce((acc, p) => {
      const period = p.year_month || 'Unknown';
      if (!acc[period]) acc[period] = 0;
      acc[period]++;
      return acc;
    }, {} as Record<string, number>);

    // Sectors
    const sectors = deptPolicies.reduce((acc, p) => {
      if (p.sector_focus) {
        acc[p.sector_focus] = (acc[p.sector_focus] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // AI Applications
    const applications = deptPolicies.reduce((acc, p) => {
      if (p.ai_application) {
        acc[p.ai_application] = (acc[p.ai_application] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total: deptPolicies.length,
      avgScore: (deptPolicies.reduce((sum, p) => sum + (p.relevance_score || 0), 0) / Math.max(1, deptPolicies.length)).toFixed(1),
      highPriority: deptPolicies.filter(p => (p.relevance_score || 0) >= 7).length,
      requiresAction: deptPolicies.filter(p => p.requires_action === 'Yes').length,
      policyTypes: Object.entries(policyTypes).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      timeline: Object.entries(timeline).map(([period, count]) => ({ period, count })).sort((a, b) => a.period.localeCompare(b.period)).slice(-12),
      sectors: Object.entries(sectors).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5),
      applications: Object.entries(applications).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5),
      recent: deptPolicies.filter(p => p.recency === 'Last month' || p.recency === 'Last 3 months').length
    } as const;
  };

  // Department comparison radar
  const getDepartmentComparison = () => {
    return ['DSIT', 'DBT', 'Cabinet_Office', 'Home_Office', 'Treasury'].map(dept => {
      const deptPolicies = policies.filter(p => p.dept === dept);
      if (deptPolicies.length === 0) return null;
      
      const avgScore = deptPolicies.reduce((sum, p) => sum + (p.relevance_score || 0), 0) / deptPolicies.length;
      const highPriorityPct = (deptPolicies.filter(p => (p.relevance_score || 0) >= 7).length / deptPolicies.length) * 100;
      const recentPct = (deptPolicies.filter(p => (p.days_since_published || 0) <= 180).length / deptPolicies.length) * 100;
      
      return {
        department: dept,
        'Avg Score': parseFloat(avgScore.toFixed(1)),
        'High Priority %': parseFloat(highPriorityPct.toFixed(1)),
        'Recent Activity %': parseFloat(recentPct.toFixed(1)),
        'Total Policies': deptPolicies.length
      };
    }).filter((dept): dept is NonNullable<typeof dept> => dept !== null);
  };

  const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const deptStats = getDepartmentStats();
  const selectedData = getSelectedDeptData();
  const comparison = getDepartmentComparison();
  
  if (!selectedData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>No department data available</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Department Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="w-7 h-7 text-primary-600" />
          Department Overview
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Count by Department</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dept" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" name="Policies" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Relevance Score</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 10]} />
                <YAxis dataKey="dept" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" fill="#8b5cf6" name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Comparison Radar */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={comparison}>
            <PolarGrid />
            <PolarAngleAxis dataKey="department" />
            <PolarRadiusAxis />
            <Radar name="Avg Score" dataKey="Avg Score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            <Radar name="High Priority %" dataKey="High Priority %" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
            <Radar name="Recent Activity %" dataKey="Recent Activity %" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Department Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Detailed Department Analysis</h2>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full md:w-1/2 border border-gray-300 rounded-md px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Selected Department Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <FileText className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-900">{selectedData.total}</p>
            <p className="text-sm text-blue-700">Total Policies</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-900">{selectedData.avgScore}</p>
            <p className="text-sm text-purple-700">Avg Score</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <TrendingUp className="w-8 h-8 text-red-600 mb-2" />
            <p className="text-2xl font-bold text-red-900">{selectedData.highPriority}</p>
            <p className="text-sm text-red-700">High Priority</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <Calendar className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-900">{selectedData.recent}</p>
            <p className="text-sm text-green-700">Recent (6m)</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Policy Types */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={selectedData.policyTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.substring(0, 15)}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {selectedData.policyTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Publication Timeline (Last 12 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={selectedData.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Sectors */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Sectors</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={selectedData.sectors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Applications */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Applications</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={selectedData.applications}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
