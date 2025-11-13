'use client';

import { useEffect, useState } from 'react';
import { Policy } from '@/types/policy';
import { formatDate } from '@/lib/utils';
import { AlertCircle, CheckCircle, Clock, ExternalLink, Filter } from 'lucide-react';

export default function ComplianceTracker() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('critical');

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

  const getFilteredPolicies = () => {
    switch (filter) {
      case 'critical':
        return policies.filter(p => p.priority_category === '1-Critical');
      case 'high':
        return policies.filter(p => p.priority_category === '2-High');
      default:
        return policies.filter(p => 
          p.priority_category === '1-Critical' || 
          p.priority_category === '2-High'
        );
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority.includes('Critical')) return 'bg-red-100 text-red-800 border-red-200';
    if (priority.includes('High')) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getPriorityIcon = (priority: string) => {
    if (priority.includes('Critical')) return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (priority.includes('High')) return <Clock className="w-5 h-5 text-orange-600" />;
    return <CheckCircle className="w-5 h-5 text-yellow-600" />;
  };

  const getRecencyColor = (recency: string) => {
    if (recency === 'Last month') return 'text-red-600';
    if (recency === 'Last 3 months') return 'text-orange-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const filteredPolicies = getFilteredPolicies();
  const criticalCount = policies.filter(p => p.priority_category === '1-Critical').length;
  const highCount = policies.filter(p => p.priority_category === '2-High').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Priority</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{criticalCount}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{highCount}</p>
            </div>
            <Clock className="w-12 h-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6 border border-gray-200">
        <div className="flex items-center gap-2 p-4 border-b border-gray-200">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
        </div>
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setFilter('critical')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'critical'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'high'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            High Priority ({highCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All High-Priority ({criticalCount + highCount})
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {filteredPolicies.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <p className="text-yellow-800 font-medium">
                {filteredPolicies.length} {filteredPolicies.length === 1 ? 'policy requires' : 'policies require'} your attention
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Review these policies and take appropriate action based on their relevance to your business operations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Policy List */}
      <div className="space-y-4">
        {filteredPolicies.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-600">No policies in this category require immediate attention.</p>
          </div>
        ) : (
          filteredPolicies
            .sort((a, b) => b.relevance_score - a.relevance_score)
            .map((policy, index) => (
              <div key={index} className={`bg-white rounded-lg shadow border-l-4 p-6 ${
                policy.priority_category === '1-Critical' ? 'border-red-500' :
                policy.priority_category === '2-High' ? 'border-orange-500' : 'border-yellow-500'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getPriorityIcon(policy.priority_category)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{policy.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getPriorityColor(policy.priority_category)}`}>
                          {policy.priority_category.replace(/^\d+-/, '')} Priority
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          {policy.dept}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                          {policy.policy_type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-primary-600">{policy.relevance_score.toFixed(1)}</div>
                    <div className="text-sm text-gray-500">Relevance</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Summary</h4>
                  <p className="text-gray-700 text-sm">{policy.ai_summary}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Published</p>
                    <p className={`text-sm font-semibold ${getRecencyColor(policy.recency)}`}>
                      {formatDate(policy.published_date)}
                    </p>
                    <p className="text-xs text-gray-500">{policy.recency}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Business Impact</p>
                    <p className="text-sm font-semibold text-gray-900">{policy.business_impact}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Sector Focus</p>
                    <p className="text-sm font-semibold text-gray-900">{policy.sector_focus}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Stage</p>
                    <p className="text-sm font-semibold text-gray-900">{policy.stage}</p>
                  </div>
                </div>

                {policy.key_topics && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Key Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {policy.key_topics.split(',').slice(0, 5).map((topic, i) => (
                        <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                          {topic.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>AI Application:</strong> {policy.ai_application}
                  </p>
                  <a
                    href={policy.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                  >
                    View Full Document <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
