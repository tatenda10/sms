import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGraduationCap, 
  faChartBar,
  faTrophy,
  faUserGraduate,
  faCalendarAlt, 
  faDownload, 
  faPrint,
  faFilter,
  faSpinner,
  faExclamationTriangle,
  faMedal,
  faChartLine,
  faBookOpen,
  faPieChart
} from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const StudentResultsAnalytics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filter states
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    term: '',
    class_id: '',
    subject_id: ''
  });

  // Data states
  const [academicOverview, setAcademicOverview] = useState(null);
  const [gradeDistribution, setGradeDistribution] = useState(null);
  const [performanceTrends, setPerformanceTrends] = useState(null);
  const [topBottomPerformers, setTopBottomPerformers] = useState(null);

  // Additional data for filters
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

  // Fetch academic performance overview
  const fetchAcademicOverview = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.term) params.append('term', filters.term);
      if (filters.class_id) params.append('class_id', filters.class_id);
      if (filters.subject_id) params.append('subject_id', filters.subject_id);

      const response = await axios.get(
        `${BASE_URL}/analytics/student-results/academic-performance?${params}`,
        { headers: authHeaders }
      );
      setAcademicOverview(response.data.data);
    } catch (err) {
      setError('Failed to fetch academic performance overview');
      console.error('Error fetching academic performance overview:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch grade distribution
  const fetchGradeDistribution = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.term) params.append('term', filters.term);
      if (filters.class_id) params.append('class_id', filters.class_id);
      if (filters.subject_id) params.append('subject_id', filters.subject_id);

      const response = await axios.get(
        `${BASE_URL}/analytics/student-results/grade-distribution?${params}`,
        { headers: authHeaders }
      );
      setGradeDistribution(response.data.data);
    } catch (err) {
      setError('Failed to fetch grade distribution');
      console.error('Error fetching grade distribution:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch performance trends
  const fetchPerformanceTrends = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.class_id) params.append('class_id', filters.class_id);
      if (filters.subject_id) params.append('subject_id', filters.subject_id);
      params.append('period', 'monthly');

      const response = await axios.get(
        `${BASE_URL}/analytics/student-results/performance-trends?${params}`,
        { headers: authHeaders }
      );
      setPerformanceTrends(response.data.data);
    } catch (err) {
      setError('Failed to fetch performance trends');
      console.error('Error fetching performance trends:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch top and bottom performers
  const fetchTopBottomPerformers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.term) params.append('term', filters.term);
      if (filters.class_id) params.append('class_id', filters.class_id);
      if (filters.subject_id) params.append('subject_id', filters.subject_id);

      const response = await axios.get(
        `${BASE_URL}/analytics/student-results/top-bottom-performers?${params}`,
        { headers: authHeaders }
      );
      setTopBottomPerformers(response.data.data);
    } catch (err) {
      setError('Failed to fetch top and bottom performers');
      console.error('Error fetching top and bottom performers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch classes and subjects for filters
  const fetchFilterData = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        axios.get(`${BASE_URL}/classes/gradelevel-classes`, { headers: authHeaders }),
        axios.get(`${BASE_URL}/classes/subjects`, { headers: authHeaders })
      ]);
      
      setClasses(classesRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching filter data:', err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle search
  const handleSearch = () => {
    if (activeTab === 'overview') {
      fetchAcademicOverview();
    } else if (activeTab === 'grade-distribution') {
      fetchGradeDistribution();
    } else if (activeTab === 'trends') {
      fetchPerformanceTrends();
    } else if (activeTab === 'performers') {
      fetchTopBottomPerformers();
    }
  };

  // Custom tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-gray-600">
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Load filter data on component mount
  useEffect(() => {
    fetchFilterData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white border border-gray-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faGraduationCap} className="text-gray-600 text-sm" />
              <h1 className="text-lg font-semibold text-gray-900">Student Results Analytics</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                <FontAwesomeIcon icon={faDownload} className="mr-1" />
                Export
              </button>
              <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                <FontAwesomeIcon icon={faPrint} className="mr-1" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400 text-xs" />
              <span className="text-xs font-medium text-gray-700">Year:</span>
              <input 
                type="number"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                className="border border-gray-300 px-2 py-1 text-xs w-20 focus:outline-none focus:border-gray-400"
                placeholder="2024"
                min="2000"
                max="2100"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-700">Term:</span>
              <select 
                value={filters.term}
                onChange={(e) => handleFilterChange('term', e.target.value)}
                className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
              >
                <option value="">All Terms</option>
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-700">Class:</span>
              <select 
                value={filters.class_id}
                onChange={(e) => handleFilterChange('class_id', e.target.value)}
                className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-700">Subject:</span>
              <select 
                value={filters.subject_id}
                onChange={(e) => handleFilterChange('subject_id', e.target.value)}
                className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" />
              ) : (
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
              )}
              Search
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4">
            {[
              { id: 'overview', label: 'Academic Overview', icon: faChartBar },
              { id: 'grade-distribution', label: 'Grade Distribution', icon: faPieChart },
              { id: 'trends', label: 'Performance Trends', icon: faChartLine },
              { id: 'performers', label: 'Top/Bottom Performers', icon: faTrophy }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 text-xs font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="mr-1" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
              {error}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {academicOverview ? (
                <>
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">Total Students</span>
                        <FontAwesomeIcon icon={faUserGraduate} className="text-blue-600" />
                      </div>
                      <div className="text-lg font-bold text-blue-900 mt-1">
                        {academicOverview.overview.total_students}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">Average Marks</span>
                        <FontAwesomeIcon icon={faBookOpen} className="text-green-600" />
                      </div>
                      <div className="text-lg font-bold text-green-900 mt-1">
                        {academicOverview.overview.average_marks}%
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-900">Highest Marks</span>
                        <FontAwesomeIcon icon={faTrophy} className="text-yellow-600" />
                      </div>
                      <div className="text-lg font-bold text-yellow-900 mt-1">
                        {academicOverview.overview.highest_marks}%
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-900">Exam Records</span>
                        <FontAwesomeIcon icon={faChartBar} className="text-purple-600" />
                      </div>
                      <div className="text-lg font-bold text-purple-900 mt-1">
                        {academicOverview.overview.total_exam_records}
                      </div>
                    </div>
                  </div>

                  {/* Performance Distribution */}
                  <div className="bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Performance Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Excellent (80%+)', value: parseFloat(academicOverview.overview.performance_distribution.excellent) },
                            { name: 'Good (60-79%)', value: parseFloat(academicOverview.overview.performance_distribution.good) },
                            { name: 'Average (40-59%)', value: parseFloat(academicOverview.overview.performance_distribution.average) },
                            { name: 'Poor (<40%)', value: parseFloat(academicOverview.overview.performance_distribution.poor) }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[0, 1, 2, 3].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Performance by Class */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Performance by Class</h4>
                    <div className="bg-gray-50 p-4">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={academicOverview.performance_by_class}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="class_name" 
                            tick={{ fontSize: 12 }}
                            height={40}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="average_marks" 
                            fill="#3b82f6" 
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load academic performance overview
                </div>
              )}
            </div>
          )}

          {activeTab === 'grade-distribution' && (
            <div className="space-y-6">
              {gradeDistribution && gradeDistribution.grade_distribution && gradeDistribution.grade_distribution.length > 0 ? (
                <>
                  <div className="bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Grade Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={gradeDistribution.grade_distribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="grade" 
                          tick={{ fontSize: 12 }}
                          height={40}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="count" 
                          fill="#10b981" 
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Grade Details</h4>
                    {gradeDistribution.grade_distribution.map((grade, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <span className="text-xs font-medium text-gray-900">{grade.grade}</span>
                        <div className="text-right">
                          <div className="text-xs font-medium text-gray-900">
                            {grade.count} students
                          </div>
                          <div className="text-xs text-gray-500">
                            {grade.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : gradeDistribution && gradeDistribution.grade_distribution && gradeDistribution.grade_distribution.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No grade distribution data found for the selected filters
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load grade distribution
                </div>
              )}
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-6">
              {performanceTrends ? (
                <>
                  <div className="bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Performance Trends</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceTrends.trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="period_label" 
                          tick={{ fontSize: 12 }}
                          height={40}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="average_marks" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load performance trends
                </div>
              )}
            </div>
          )}

          {activeTab === 'performers' && (
            <div className="space-y-6">
              {topBottomPerformers ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Top Performers</h4>
                      <div className="space-y-2">
                        {topBottomPerformers.top_performers.map((student, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <div>
                              <span className="text-xs font-medium text-gray-900">{student.full_name}</span>
                              <span className="text-xs text-gray-500 ml-2">({student.class_name})</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-medium text-gray-900">
                                {student.average_marks}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {student.exam_count} exams
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Bottom Performers</h4>
                      <div className="space-y-2">
                        {topBottomPerformers.bottom_performers.map((student, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <div>
                              <span className="text-xs font-medium text-gray-900">{student.full_name}</span>
                              <span className="text-xs text-gray-500 ml-2">({student.class_name})</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-medium text-gray-900">
                                {student.average_marks}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {student.exam_count} exams
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Click "Search" to load top and bottom performers
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentResultsAnalytics;
