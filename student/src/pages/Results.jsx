import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { Search, Calendar, BookOpen, Trophy, Medal, Award, AlertCircle, CheckCircle } from 'lucide-react';
import BASE_URL from '../contexts/Api';

const Results = () => {
  const { student, token } = useStudentAuth();
  const [searchYear, setSearchYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balanceStatus, setBalanceStatus] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [classPosition, setClassPosition] = useState(null);
  const [streamPosition, setStreamPosition] = useState(null);

  useEffect(() => {
    fetchBalanceStatus();
  }, []);


  const fetchBalanceStatus = async () => {
    try {
      const response = await fetch(`${BASE_URL}/student-results/balance-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBalanceStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching balance status:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchYear || !searchTerm) {
      setError('Please select both academic year and term');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await fetch(
        `${BASE_URL}/student-results/results?academic_year=${searchYear}&term=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.status === 403) {
        if (data.access_denied) {
          setError(data.message);
        } else {
          setError('You cannot view results due to outstanding balance. Please clear your account balance first.');
        }
        setResults([]);
        return;
      }

      if (response.ok) {
        setResults(data.data.results || []);
        setClassPosition(data.data.class_position || null);
        setStreamPosition(data.data.stream_position || null);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch results');
        setResults([]);
        setClassPosition(null);
        setStreamPosition(null);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to fetch results');
      setResults([]);
      setClassPosition(null);
      setStreamPosition(null);
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position) => {
    if (position === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (position === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (position === 3) return <Award className="h-4 w-4 text-orange-500" />;
    return null;
  };

  const getPositionBadge = (position) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-800';
    if (position === 2) return 'bg-gray-100 text-gray-800';
    if (position === 3) return 'bg-orange-100 text-orange-800';
    if (position === 'N/A') return 'bg-gray-100 text-gray-600';
    return 'bg-blue-100 text-blue-800';
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Academic Results</h1>
        <p className="text-gray-600">Search and view your published academic results</p>
      </div>

      {/* Balance Status Alert */}
      {balanceStatus && !balanceStatus.can_view_results && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Access Restricted</h3>
              <p className="text-sm text-red-700 mt-1">
                You cannot view results due to outstanding balance. Please clear your account balance first.
              </p>
              <p className="text-xs text-red-600 mt-1">
                Current Balance: {formatCurrency(balanceStatus.current_balance)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year
            </label>
            <input
              type="text"
              placeholder="Enter Year (e.g., 2025)"
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term
            </label>
            <select
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select Term</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || !balanceStatus?.can_view_results}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Searching...' : 'Search Results'}
            </button>
          </div>
        </div>

      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {hasSearched && !loading && results.length > 0 && (
        <div className="space-y-6">
          {/* Student Info and Positions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase">Academic Year</h3>
                <p className="text-lg font-medium text-gray-900">{searchYear}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase">Term</h3>
                <p className="text-lg font-medium text-gray-900">{searchTerm}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase">Class Position</h3>
                <p className="text-lg font-medium text-gray-900">
                  {classPosition ? (
                    <span className="flex items-center">
                      {getPositionIcon(classPosition)}
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPositionBadge(classPosition)}`}>
                        {classPosition}
                      </span>
                    </span>
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase">Stream Position</h3>
                <p className="text-lg font-medium text-gray-900">
                  {streamPosition ? (
                    <span className="flex items-center">
                      {getPositionIcon(streamPosition)}
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPositionBadge(streamPosition)}`}>
                        {streamPosition}
                      </span>
                    </span>
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Subject Results</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coursework
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paper Marks
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">{result.subject_name}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {result.coursework_mark || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {result.paper_marks && result.paper_marks.length > 0 ? (
                            <div>
                              {result.paper_marks.map((paper, index) => (
                                <div key={index} className="text-xs">
                                  {paper.paper_name}: {paper.mark}
                                </div>
                              ))}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">
                          {result.grade || 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {hasSearched && !loading && results.length === 0 && !error && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-600">
            No published results found for {searchYear} - {searchTerm}.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      )}
    </div>
  );
};

export default Results;
