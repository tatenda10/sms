import { useState, useEffect } from 'react';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';
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
  const { employee, token } = useEmployeeAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Main state
  const [selectedClass, setSelectedClass] = useState('');
  const [tests, setTests] = useState([]);
  const [testMarks, setTestMarks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Modal states
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [showAddMarksModal, setShowAddMarksModal] = useState(false);
  const [showViewMarksModal, setShowViewMarksModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Form data
  const [testFormData, setTestFormData] = useState({
    test_name: '',
    test_type: 'quiz',
    total_marks: '',
    test_date: new Date().toISOString().split('T')[0],
    academic_year: new Date().getFullYear().toString(),
    term: '1',
    subject_class_id: '',
    description: '',
    instructions: ''
  });

  const [marksFormData, setMarksFormData] = useState({
    student_reg_number: '',
    marks_obtained: '',
    comments: ''
  });
  
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
    if (employee?.id) {
      fetchClasses();
    }
  }, [employee?.id]);

  useEffect(() => {
    if (selectedClass) {
      fetchTests();
      fetchStudents();
    }
  }, [selectedClass, filters]);

  const fetchClasses = async () => {
    try {
      console.log('📚 Fetching classes for employee:', employee?.id);
      const response = await fetch(`${BASE_URL}/employee-classes/${employee?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Classes data:', data);
        console.log('✅ Classes data structure:', data.data?.map(cls => ({
          id: cls.id,
          class_type: cls.class_type,
          subject_name: cls.subject_name,
          gradelevel_class_id: cls.gradelevel_class_id,
          gradelevel_class_name: cls.gradelevel_class_name,
          stream_name: cls.stream_name,
          allKeys: Object.keys(cls)
        })));
        setClasses(data.data || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Classes response error:', errorText);
        setError('Failed to fetch classes');
      }
    } catch (error) {
      console.error('❌ Error fetching classes:', error);
      setError('Failed to fetch classes');
    }
  };

  const fetchStudents = async () => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }

    try {
      console.log('👥 Fetching students for class:', selectedClass);
      const response = await fetch(`${BASE_URL}/employee-subject-enrollments/class/${selectedClass}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Students data:', data);
        setStudents(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('❌ Error fetching students:', errorData);
        setError('Failed to fetch students');
      }
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      setError('Failed to fetch students');
    }
  };

  const fetchTests = async () => {
    if (!selectedClass) return;

    setIsLoading(true);
    setError('');
    
    try {
      let url = `${BASE_URL}/employee-tests/class/${selectedClass}`;
      const params = new URLSearchParams();
      
      params.append('class_type', 'subject');
      
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
      const response = await fetch(`${BASE_URL}/employee-test-marks/test/${testId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestMarks(data.data || []);
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

  const handleCreateTest = async (e) => {
    e.preventDefault();
    
    const requestData = {
      ...testFormData,
      subject_class_id: selectedClass
    };
    
    console.log('🚀 Frontend - Creating test with data:', JSON.stringify(requestData, null, 2));
    console.log('🚀 Frontend - Selected class:', selectedClass);
    console.log('🚀 Frontend - Available classes:', classes);
    const selectedClassData = classes.find(c => c.id === selectedClass);
    console.log('🚀 Frontend - Selected class data:', selectedClassData);
    console.log('🚀 Frontend - Found gradelevel_class_id:', selectedClassData?.gradelevel_class_id);
    console.log('🚀 Frontend - All class properties:', selectedClassData ? Object.keys(selectedClassData) : 'No class found');
    
    try {
      const response = await fetch(`${BASE_URL}/employee-tests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        const successData = await response.json();
        console.log('✅ Frontend - Test created successfully:', successData);
        setShowCreateTestModal(false);
        setTestFormData({
          test_name: '',
          test_type: 'quiz',
          total_marks: '',
          test_date: new Date().toISOString().split('T')[0],
          academic_year: new Date().getFullYear().toString(),
          term: '1',
          subject_class_id: '',
          description: '',
          instructions: ''
        });
        fetchTests();
        alert('Test created successfully!');
      } else {
        const errorData = await response.json();
        console.log('❌ Frontend - Error creating test:', errorData);
        setError(errorData.message || 'Failed to create test');
      }
    } catch (error) {
      console.error('Error creating test:', error);
      setError('Failed to create test');
    }
  };

  const handleAddMarks = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${BASE_URL}/employee-test-marks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...marksFormData,
          test_id: selectedTest.id
        })
      });
      
      if (response.ok) {
        setShowAddMarksModal(false);
        setMarksFormData({
          student_reg_number: '',
          marks_obtained: '',
          comments: ''
        });
        fetchTestMarks(selectedTest.id);
        alert('Marks added successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add marks');
      }
    } catch (error) {
      console.error('Error adding marks:', error);
      setError('Failed to add marks');
    }
  };

  const handleViewMarks = async (test) => {
    setSelectedTest(test);
    setShowViewMarksModal(true);
    await fetchTestMarks(test.id);
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test? This will also delete all associated marks.')) return;
    
    try {
      const response = await fetch(`${BASE_URL}/employee-tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchTests();
        alert('Test deleted successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete test');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      setError('Failed to delete test');
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Test Marks Management</h1>
        <p className="text-gray-600">Create tests and manage student marks</p>
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

      {/* Class Selection */}
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
              {classes.filter(c => c.class_type === 'Subject Class').map(cls => (
                <option key={cls.id} value={cls.id}>
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

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateTestModal(true)}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  Create Test
                </button>
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
                      Total Marks
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
                        {test.total_marks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTest(test);
                              setShowAddMarksModal(true);
                            }}
                            className="text-green-600 hover:text-green-800"
                            title="Add Marks"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleViewMarks(test)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Marks"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Test"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
                <p className="text-gray-500">Create your first test to get started.</p>
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

      {/* Create Test Modal */}
      {showCreateTestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Test</h3>
              <button
                onClick={() => setShowCreateTestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Name *</label>
                  <input
                    type="text"
                    name="test_name"
                    value={testFormData.test_name}
                    onChange={(e) => setTestFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Chapter 5 Quiz"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Type *</label>
                  <select
                    name="test_type"
                    value={testFormData.test_type}
                    onChange={(e) => setTestFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="test">Test</option>
                    <option value="exam">Exam</option>
                    <option value="project">Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
                  <input
                    type="number"
                    name="total_marks"
                    value={testFormData.total_marks}
                    onChange={(e) => setTestFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                    required
                    min="1"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Date *</label>
                  <input
                    type="date"
                    name="test_date"
                    value={testFormData.test_date}
                    onChange={(e) => setTestFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                  <input
                    type="text"
                    name="academic_year"
                    value={testFormData.academic_year}
                    onChange={(e) => setTestFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
                  <select
                    name="term"
                    value={testFormData.term}
                    onChange={(e) => setTestFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={testFormData.description}
                  onChange={(e) => setTestFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional test description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea
                  name="instructions"
                  value={testFormData.instructions}
                  onChange={(e) => setTestFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional test instructions..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateTestModal(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Create Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Marks Modal */}
      {showAddMarksModal && selectedTest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add Marks: {selectedTest.test_name}
              </h3>
              <button
                onClick={() => setShowAddMarksModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddMarks} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  name="student_reg_number"
                  value={marksFormData.student_reg_number}
                  onChange={(e) => setMarksFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.RegNumber} value={student.RegNumber}>
                      {student.Name} {student.Surname} ({student.RegNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marks Obtained * (Max: {selectedTest.total_marks})
                </label>
                <input
                  type="number"
                  name="marks_obtained"
                  value={marksFormData.marks_obtained}
                  onChange={(e) => setMarksFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                  required
                  min="0"
                  max={selectedTest.total_marks}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Max: ${selectedTest.total_marks}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea
                  name="comments"
                  value={marksFormData.comments}
                  onChange={(e) => setMarksFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional comments..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMarksModal(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Add Marks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Marks Modal */}
      {showViewMarksModal && selectedTest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Test Marks: {selectedTest.test_name}
              </h3>
              <button
                onClick={() => setShowViewMarksModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {testMarks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {testMarks.map((mark) => (
                      <tr key={mark.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {mark.student_name} {mark.student_surname}
                              </div>
                              <div className="text-sm text-gray-500">{mark.student_reg_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {mark.marks_obtained} / {mark.total_marks}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {mark.comments || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No marks entered yet</h3>
                <p className="text-gray-500">Add marks for students to see them here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestMarks;