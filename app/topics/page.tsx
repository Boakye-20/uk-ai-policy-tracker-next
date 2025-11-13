'use client';

import { useEffect, useState } from 'react';
import { Policy } from '@/types/policy';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap } from 'recharts';
import { Tag, TrendingUp, Search } from 'lucide-react';

export default function TopicIntelligence() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

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

  // Extract all topics and count frequencies
  const getTopicFrequencies = () => {
    const topicCount: Record<string, number> = {};
    
    policies.forEach(policy => {
      if (policy.key_topics) {
        const topics = policy.key_topics.split(',').map(t => t.trim().toLowerCase());
        topics.forEach(topic => {
          topicCount[topic] = (topicCount[topic] || 0) + 1;
        });
      }
    });

    return Object.entries(topicCount)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Topic co-occurrence (topics that appear together)
  const getTopicCooccurrence = (mainTopic: string) => {
    const cooccurrence: Record<string, number> = {};
    
    policies.forEach(policy => {
      if (policy.key_topics && policy.key_topics.toLowerCase().includes(mainTopic.toLowerCase())) {
        const topics = policy.key_topics.split(',').map(t => t.trim().toLowerCase());
        topics.forEach(topic => {
          if (topic !== mainTopic.toLowerCase()) {
            cooccurrence[topic] = (cooccurrence[topic] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(cooccurrence)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // Topics by department
  const getTopicsByDepartment = () => {
    const deptTopics: Record<string, Record<string, number>> = {};
    
    policies.forEach(policy => {
      const dept = policy.dept;
      if (!deptTopics[dept]) deptTopics[dept] = {};
      
      if (policy.key_topics) {
        const topics = policy.key_topics.split(',').map(t => t.trim().toLowerCase());
        topics.forEach(topic => {
          deptTopics[dept][topic] = (deptTopics[dept][topic] || 0) + 1;
        });
      }
    });

    // Get top topic for each department
    return Object.entries(deptTopics).map(([dept, topics]) => {
      const topTopic = Object.entries(topics).sort((a, b) => b[1] - a[1])[0];
      return {
        dept,
        topTopic: topTopic[0],
        count: topTopic[1],
        totalTopics: Object.keys(topics).length
      };
    });
  };

  // Topic trends over time
  const getTopicTrends = (topic: string) => {
    const timeline: Record<string, number> = {};
    
    policies.forEach(policy => {
      if (policy.key_topics && policy.key_topics.toLowerCase().includes(topic.toLowerCase())) {
        const period = policy.year_month;
        timeline[period] = (timeline[period] || 0) + 1;
      }
    });

    return Object.entries(timeline)
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-12); // Last 12 months
  };

  // Filter topics by search
  const getFilteredTopics = () => {
    const allTopics = getTopicFrequencies();
    if (!searchTerm) return allTopics.slice(0, 50);
    
    return allTopics.filter(t => 
      t.topic.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50);
  };

  // Get policies for selected topic
  const getTopicPolicies = (topic: string) => {
    return policies
      .filter(p => p.key_topics && p.key_topics.toLowerCase().includes(topic.toLowerCase()))
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const topicFrequencies = getFilteredTopics();
  const deptTopics = getTopicsByDepartment();
  const topicTrends = selectedTopic ? getTopicTrends(selectedTopic) : [];
  const cooccurrence = selectedTopic ? getTopicCooccurrence(selectedTopic) : [];
  const topicPolicies = selectedTopic ? getTopicPolicies(selectedTopic) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Unique Topics</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {getTopicFrequencies().length}
              </p>
            </div>
            <Tag className="w-12 h-12 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Most Common Topic</p>
              <p className="text-xl font-bold text-gray-900 mt-2">
                {topicFrequencies[0]?.topic || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">{topicFrequencies[0]?.count || 0} mentions</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Topics per Policy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(policies.reduce((sum, p) => sum + (p.topics_count || 0), 0) / policies.length).toFixed(1)}
              </p>
            </div>
            <Tag className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search Topics */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Topic Cloud/Grid */}
        <div className="flex flex-wrap gap-2">
          {topicFrequencies.slice(0, 100).map(({ topic, count }) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTopic === topic
                  ? 'bg-primary-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                fontSize: `${Math.min(16, 10 + count / 5)}px`
              }}
            >
              {topic} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Top Topics Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 20 Topics</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topicFrequencies.slice(0, 20)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="topic" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#0ea5e9" name="Frequency" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Department Topic Focus */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Topic by Department</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptTopics.map(({ dept, topTopic, count, totalTopics }) => (
            <div key={dept} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">{dept}</h4>
              <p className="text-sm text-gray-600 mb-1">
                Top Topic: <span className="font-medium text-primary-600">{topTopic}</span>
              </p>
              <p className="text-xs text-gray-500">
                {count} mentions • {totalTopics} unique topics
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Topic Analysis */}
      {selectedTopic && (
        <div className="space-y-8">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-primary-900 mb-2">
              Analyzing: "{selectedTopic}"
            </h2>
            <p className="text-primary-700">
              Found in {topicPolicies.length} policies
            </p>
          </div>

          {/* Topic Trend */}
          {topicTrends.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Topic Trend Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topicTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Related Topics */}
          {cooccurrence.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Topics (Co-occurrence)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cooccurrence} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="topic" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Policies with this Topic */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Policies Mentioning "{selectedTopic}"
            </h3>
            <div className="space-y-3">
              {topicPolicies.map((policy, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{policy.title}</h4>
                      <div className="flex gap-2 mb-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {policy.dept}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {policy.policy_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{policy.ai_summary}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-lg font-bold text-primary-600">{policy.relevance_score.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
