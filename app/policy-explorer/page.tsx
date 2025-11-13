'use client';

import { useEffect, useState } from 'react';
import { Policy } from '@/types/policy';
import { formatDate } from '@/lib/utils';
import { Search, Filter, Download, ExternalLink, ChevronDown } from 'lucide-react';

export default function PolicyExplorer() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filters, setFilters] = useState({
    dept: '',
    policyType: '',
    priority: '',
    sector: '',
    aiApplication: '',
    dateFrom: '',
    dateTo: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [policies, searchTerm, filters]);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/policies');
      const result = await response.json();
      setPolicies(result.data);
      setFilteredPolicies(result.data);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...policies];

    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.title?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.ai_summary?.toLowerCase().includes(term) ||
        p.key_topics?.toLowerCase().includes(term)
      );
    }

    // Department filter
    if (filters.dept) {
      result = result.filter(p => p.dept === filters.dept);
    }

    // Policy type filter
    if (filters.policyType) {
      result = result.filter(p => p.policy_type === filters.policyType);
    }

    // Priority filter
    if (filters.priority) {
      result = result.filter(p => p.priority_category === filters.priority);
    }

    // Sector filter
    if (filters.sector) {
      result = result.filter(p => p.sector_focus === filters.sector);
    }

    // AI Application filter
    if (filters.aiApplication) {
      result = result.filter(p => p.ai_application === filters.aiApplication);
    }

    // Date range filter
    if (filters.dateFrom) {
      result = result.filter(p => new Date(p.published_date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      result = result.filter(p => new Date(p.published_date) <= new Date(filters.dateTo));
    }

    // Apply sorting
    result = sortPolicies(result);

    setFilteredPolicies(result);
    setCurrentPage(1);
  };

  const sortPolicies = (policies: Policy[]) => {
    const [field, order] = sortBy.split('-');
    return [...policies].sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.published_date).getTime() - new Date(b.published_date).getTime();
          break;
        case 'department':
          comparison = a.dept.localeCompare(b.dept);
          break;
        case 'priority':
          const priorityOrder = { '1-Critical': 4, '2-High': 3, '3-Medium': 2, '4-Low': 1, '5-Minimal': 0 };
          comparison = (priorityOrder[a.priority_category as keyof typeof priorityOrder] || 0) - 
                      (priorityOrder[b.priority_category as keyof typeof priorityOrder] || 0);
          break;
        default:
          comparison = 0;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      dept: '',
      policyType: '',
      priority: '',
      sector: '',
      aiApplication: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const exportResults = () => {
    const csv = [
      Object.keys(filteredPolicies[0]).join(','),
      ...filteredPolicies.map(p => Object.values(p).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'policy-export.csv';
    a.click();
  };

  const getPriorityColor = (priority: string) => {
    if (priority.includes('Critical')) return 'bg-red-100 text-red-800';
    if (priority.includes('High')) return 'bg-orange-100 text-orange-800';
    if (priority.includes('Medium')) return 'bg-yellow-100 text-yellow-800';
    if (priority.includes('Low')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Get unique values for filters
  const departments = [...new Set(policies.map(p => p.dept))].sort();
  const policyTypes = [...new Set(policies.map(p => p.policy_type))].sort();
  const priorities = ['1-Critical', '2-High', '3-Medium', '4-Low', '5-Minimal'];
  const sectors = [...new Set(policies.map(p => p.sector_focus))].sort();
  const aiApplications = [...new Set(policies.map(p => p.ai_application))].sort();

  // Pagination
  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPolicies = filteredPolicies.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search policies by title, description, summary, or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={exportResults}
            disabled={filteredPolicies.length === 0}
            className="px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Policy Explorer</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date-desc">Sort by: Newest First</option>
              <option value="date-asc">Sort by: Oldest First</option>
              <option value="title-asc">Sort by: Title (A-Z)</option>
              <option value="title-desc">Sort by: Title (Z-A)</option>
              <option value="department-asc">Sort by: Department (A-Z)</option>
              <option value="priority-desc">Sort by: Priority (High to Low)</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
          <button
            onClick={exportResults}
            disabled={filteredPolicies.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
          </h3>
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filters.dept}
              onChange={(e) => setFilters({ ...filters, dept: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Policy Type</label>
            <select
              value={filters.policyType}
              onChange={(e) => setFilters({ ...filters, policyType: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All</option>
              {policyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All</option>
              {priorities.map(priority => (
                <option key={priority} value={priority}>
                  {priority.replace(/^\d+-/, '')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
            <select
              value={filters.sector}
              onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Application</label>
            <select
              value={filters.aiApplication}
              onChange={(e) => setFilters({ ...filters, aiApplication: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All</option>
              {aiApplications.map(app => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">
          Showing <strong>{filteredPolicies.length}</strong> {filteredPolicies.length === 1 ? 'policy' : 'policies'}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>

      {/* Policy Cards */}
      <div className="space-y-4">
        {currentPolicies.map((policy, index) => (
          <div key={index} className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{policy.title}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {policy.dept}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded font-semibold ${getPriorityColor(policy.priority_category)}`}>
                    {policy.priority_category.replace(/^\d+-/, '')}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {policy.policy_type}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                    {policy.ai_application}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>{formatDate(policy.published_date)}</div>
                <div className="font-semibold text-primary-600 mt-1">Score: {policy.relevance_score.toFixed(1)}</div>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm mb-3">{policy.ai_summary}</p>
            
            {policy.key_topics && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Topics: </span>
                <span className="text-sm text-gray-600">{policy.key_topics}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex gap-4 text-sm text-gray-600">
                <span><strong>Sector:</strong> {policy.sector_focus}</span>
                <span><strong>Stage:</strong> {policy.stage}</span>
                <span><strong>Impact:</strong> {policy.business_impact}</span>
              </div>
              <a
                href={policy.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View Document <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
