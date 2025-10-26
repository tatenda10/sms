import { useState, useEffect } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import BASE_URL from '../contexts/Api';
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Calendar,
  BookOpen,
  Users,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  Award
} from 'lucide-react';

const TestMarks = () => {
  const { student, token } = useStudentAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Main state
  const [selectedClass, setSelectedClass] = useState('');
  const [tests, setTests] = useState([]);
  const [testMarks, setTestMarks] = useState([]);
  const [subjectClasses, setSubjectClasses] = useState([]);
  
  // Modal states
  const [showViewMarksModal, setShowViewMarksModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    academic_year: new Date().getFullYear().toString(),
    term: '1',
    test_type: ''
  });
  
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (student?.RegNumber) {
      fetchSubjectClasses();
    }
  }, [student?.RegNumber]);

  useEffect(() => {
    if (selectedClass) {
      fetchTests();
    }
  }, [selectedClass, filters]);

  const fetchSubjectClasses = async () => {
    try {
      console.log('📚 Fetching subject classes for student:', student?.RegNumber);
      const response = await fetch(`${BASE_URL}/student-enrollments/subject-classes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Subject classes data:', data);
        setSubjectClasses(data.data || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Subject classes response error:', errorText);
        setError('Failed to fetch subject classes');
      }
    } catch (error) {
      console.error('❌ Error fetching subject classes:', error);
      setError('Failed to fetch subject classes');
    }
  };

  const fetchTests = async () => {
    if (!selectedClass) return;

    setIsLoading(true);
    setError('');
    
    try {
      let url = `${BASE_URL}/student-enrollments/subject-classes/${selectedClass}/tests`;
      const params = new URLSearchParams();
      
      if (filters.academic_year) params.append('academic_year', filters.academic_year);
      if (filters.term) params.append('term', filters.term);
      if (filters.test_type) params.append('test_type', filters.test_type);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('🔍 Fetching tests for class:', selectedClass);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Tests data:', data);
        console.log('📊 Tests count:', data.data?.length || 0);
        setTests(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('❌ Error fetching tests:', errorData);
        setError(errorData.message || 'Failed to fetch tests');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      setError('Failed to fetch tests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTestMarks = async (testId) => {
    try {
      const response = await fetch(`${BASE_URL}/student-enrollments/tests/${testId}/marks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Test marks data:', data);
        console.log('📊 Test marks count:', data.data?.marks?.length || 0);
        setTestMarks(data.data?.marks || []);
      } else {
        const errorData = await response.json();
        console.error('❌ Error fetching test marks:', errorData);
        setError(errorData.message || 'Failed to fetch test marks');
      }
    } catch (error) {
      console.error('Error fetching test marks:', error);
      setError('Failed to fetch test marks');
    }
  };

  const handleViewMarks = async (test) => {
    setSelectedTest(test);
    setShowViewMarksModal(true);
    await fetchTestMarks(test.id);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter tests based on search term
  const filteredTests = tests.filter(test => {
    const matchesSearch = !searchTerm || 
      test.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.test_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTests = filteredTests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Test Marks</h1>
        <p className="text-gray-600">View your test scores and performance</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Subject Class Selection */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Subject Class</h2>
          <div className="flex gap-4">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a Subject Class</option>
              {subjectClasses.map(cls => (
                <option key={cls.subject_class_id} value={cls.subject_class_id}>
                  {cls.subject_name} - {cls.gradelevel_class_name || cls.stream_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tests Section */}
      {selectedClass && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search tests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <select
                  name="academic_year"
                  value={filters.academic_year}
                  onChange={handleFilterChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Years</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>

                <select
                  name="term"
                  value={filters.term}
                  onChange={handleFilterChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Terms</option>
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </select>

                <select
                  name="test_type"
                  value={filters.test_type}
                  onChange={handleFilterChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="test">Test</option>
                  <option value="exam">Exam</option>
                  <option value="project">Project</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tests Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading tests...</span>
              </div>
            ) : paginatedTests.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Your Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{test.test_name}</div>
                            <div className="text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                test.test_type === 'quiz' ? 'bg-blue-100 text-blue-800' :
                                test.test_type === 'assignment' ? 'bg-green-100 text-green-800' :
                                test.test_type === 'test' ? 'bg-yellow-100 text-yellow-800' :
                                test.test_type === 'exam' ? 'bg-red-100 text-red-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {test.test_type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(test.test_date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">{test.academic_year} - Term {test.term}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.has_marks ? (
                          <div>
                            <div className="font-medium">{test.marks_obtained} / {test.total_marks}</div>
                            {test.comments && (
                              <div className="text-xs text-gray-400 mt-1">{test.comments}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Not marked yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {test.has_marks && (
                            <button
                              onClick={() => handleViewMarks(test)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
                <p className="text-gray-500">No tests have been created for this subject class yet.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTests.length)} of {filteredTests.length} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Marks Modal */}
      {showViewMarksModal && selectedTest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Test Details: {selectedTest.test_name}
              </h3>
              <button
                onClick={() => setShowViewMarksModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Test Information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Test Type:</span>
                  <p className="text-sm text-gray-900 capitalize">{selectedTest.test_type}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Date:</span>
                  <p className="text-sm text-gray-900">{new Date(selectedTest.test_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Academic Year:</span>
                  <p className="text-sm text-gray-900">{selectedTest.academic_year} - Term {selectedTest.term}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Total Marks:</span>
                  <p className="text-sm text-gray-900">{selectedTest.total_marks}</p>
                </div>
              </div>
              {selectedTest.description && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-500">Description:</span>
                  <p className="text-sm text-gray-900 mt-1">{selectedTest.description}</p>
                </div>
              )}
            </div>

            {/* Your Marks */}
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Your Performance</h4>
              {selectedTest.has_marks ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-green-800">
                        {selectedTest.marks_obtained} / {selectedTest.total_marks}
                      </p>
                    </div>
                  </div>
                  {selectedTest.comments && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-green-700">Teacher Comments:</p>
                      <p className="text-sm text-green-600 mt-1">{selectedTest.comments}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">Your marks for this test have not been entered yet.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default TestMarks;