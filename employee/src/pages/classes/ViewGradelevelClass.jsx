import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmployeeAuth } from '../../contexts/EmployeeAuthContext';
import BASE_URL from '../../contexts/Api';
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  ArrowLeft,
  User,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Plus,
  Search,
  Loader2
} from 'lucide-react';

const ViewGradelevelClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { employee, token } = useEmployeeAuth();
  const [activeTab, setActiveTab] = useState('students');
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [homework, setHomework] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);
  
  // Results search state
  const [resultsYear, setResultsYear] = useState(new Date().getFullYear().toString());
  const [resultsTerm, setResultsTerm] = useState('1');
  const [resultsLoading, setResultsLoading] = useState(false);
  
  // Student results view state
  const [showStudentResultsModal, setShowStudentResultsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [studentResultsLoading, setStudentResultsLoading] = useState(false);

  // Enrollment modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState('');


  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId || hasFetched.current) return;

      try {
        console.log('📚 Fetching grade-level class data for ID:', classId);
        setIsLoading(true);
        setError(null);
        hasFetched.current = true;

        // Fetch class information
        const classResponse = await fetch(`${BASE_URL}/employee-classes/${employee.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!classResponse.ok) {
          throw new Error(`Failed to fetch class data: ${classResponse.status}`);
        }

        const classData = await classResponse.json();
        const gradelevelClass = classData.data.find(cls => 
          cls.id === parseInt(classId) && cls.class_type === 'Grade-Level Class'
        );

        if (!gradelevelClass) {
          throw new Error('Grade-level class not found');
        }

        setClassInfo(gradelevelClass);

        // Fetch students using the employee endpoint
        console.log('🔍 Fetching students for class:', classId);
        const studentsResponse = await fetch(`${BASE_URL}/employee-gradelevel-enrollments/class/${classId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📊 Students response status:', studentsResponse.status);
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          console.log('📊 Students data:', studentsData);
          if (studentsData.success) {
            console.log('📊 First student data:', studentsData.data[0]);
            setStudents(studentsData.data || []);
          }
        } else {
          const errorData = await studentsResponse.json();
          console.error('❌ Error fetching students:', errorData);
        }

        setHomework([
          { id: 1, title: 'English Essay', due_date: '2024-01-18', status: 'graded', submissions: 18 },
          { id: 2, title: 'Science Project', due_date: '2024-01-22', status: 'pending', submissions: 15 },
          { id: 3, title: 'History Presentation', due_date: '2024-01-28', status: 'pending', submissions: 12 }
        ]);

        setResults([
          { id: 1, student_name: 'Alice Johnson', exam_type: 'Final Exam', score: 92, grade: 'A+', date: '2024-01-15' },
          { id: 2, student_name: 'Bob Wilson', exam_type: 'Final Exam', score: 76, grade: 'B', date: '2024-01-15' },
          { id: 3, student_name: 'Carol Davis', exam_type: 'Final Exam', score: 88, grade: 'A-', date: '2024-01-15' },
          { id: 4, student_name: 'David Brown', exam_type: 'Final Exam', score: 82, grade: 'B+', date: '2024-01-15' }
        ]);

      } catch (err) {
        console.error('Error fetching class data:', err);
        setError(err.message);
        hasFetched.current = false;
      } finally {
        setIsLoading(false);
      }
    };

    if (employee?.id) {
      fetchClassData();
    }
  }, [classId, employee?.id]);

  // Search students for enrollment
  const searchStudents = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setSearchLoading(true);
    setEnrollError('');
    setSearchResults([]);

    try {
      console.log('🔍 Searching students with query:', searchTerm);
      const response = await fetch(`${BASE_URL}/employee-students/search?query=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Search response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Search data:', data);
        if (data.success) {
          setSearchResults(data.data || []);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Error searching students:', errorData);
      }
    } catch (err) {
      console.error('Error searching students:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Enroll student
  const enrollStudent = async (student) => {
    setEnrollLoading(true);
    setEnrollError('');

    try {
      const response = await fetch(`${BASE_URL}/employee-gradelevel-enrollments/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_regnumber: student.RegNumber,
          gradelevel_class_id: classId
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowEnrollModal(false);
        setSearchTerm('');
        setSearchResults([]);
        // Refresh students list
        window.location.reload();
      } else {
        setEnrollError(data.message || 'Failed to enroll student');
      }
    } catch (err) {
      console.error('Error enrolling student:', err);
      setEnrollError('Failed to enroll student');
    } finally {
      setEnrollLoading(false);
    }
  };

  // Fetch results for the class
  const fetchResults = async () => {
    if (!classId || !resultsYear || !resultsTerm) return;

    setResultsLoading(true);
    try {
      console.log('🔍 Fetching results for class:', classId, 'Year:', resultsYear, 'Term:', resultsTerm);
      const response = await fetch(`${BASE_URL}/employee-results?gradelevel_class_id=${classId}&academic_year=${resultsYear}&term=${resultsTerm}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Results response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Results data:', data);
        if (data.success) {
          // Group results by student and calculate positions
          const studentResultsMap = new Map();
          
          data.data.forEach(result => {
            const studentKey = result.RegNumber;
            if (!studentResultsMap.has(studentKey)) {
              studentResultsMap.set(studentKey, {
                RegNumber: result.RegNumber,
                student_name: result.student_name,
                student_surname: result.student_surname,
                results: [],
                totalPoints: 0,
                averageMark: 0,
                position: 0
              });
            }
            
            const studentData = studentResultsMap.get(studentKey);
            studentData.results.push(result);
            studentData.totalPoints += parseFloat(result.points || 0);
          });
          
          // Calculate average marks and sort by total points
          const studentsWithResults = Array.from(studentResultsMap.values()).map(student => {
            const totalMarks = student.results.reduce((sum, result) => sum + parseFloat(result.total_mark || 0), 0);
            student.averageMark = student.results.length > 0 ? totalMarks / student.results.length : 0;
            student.totalPoints = student.totalPoints || 0; // Ensure totalPoints is defined
            console.log('📊 Student data:', {
              name: student.student_name,
              averageMark: student.averageMark,
              totalPoints: student.totalPoints,
              resultsCount: student.results.length
            });
            return student;
          });
          
          // Sort by total points (descending) and assign positions
          studentsWithResults.sort((a, b) => b.totalPoints - a.totalPoints);
          studentsWithResults.forEach((student, index) => {
            student.position = index + 1;
          });
          
          setResults(studentsWithResults);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Error fetching results:', errorData);
        setResults([]);
      }
    } catch (error) {
      console.error('❌ Error fetching results:', error);
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  };

  // View student results
  const viewStudentResults = async (student) => {
    setSelectedStudent(student);
    setShowStudentResultsModal(true);
    setStudentResults(student.results || []);
  };

  // Close student results modal
  const closeStudentResultsModal = () => {
    setShowStudentResultsModal(false);
    setSelectedStudent(null);
    setStudentResults([]);
  };

  const tabs = [
    { id: 'students', name: 'Students', icon: Users, count: students.length },
    { id: 'homework', name: 'Homework', icon: BookOpen, count: homework.length },
    { id: 'results', name: 'Results', icon: BarChart3, count: results.length }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading class</h3>
            <div className="mt-1 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  {classInfo?.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {classInfo?.stream_name} • Stage: {classInfo?.stream_stage}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Class ID</p>
            <p className="text-sm font-semibold text-gray-900">{classInfo?.id}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
              <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'students' && (
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Students ({students.length})</h3>
              <button
                onClick={() => setShowEnrollModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Student
              </button>
            </div>
            
            {/* Gender Stats */}
            {students.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{students.length}</div>
                    <div className="text-sm text-gray-500">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {students.filter(student => student.Gender === 'Male').length}
                    </div>
                    <div className="text-sm text-gray-500">Male</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600">
                      {students.filter(student => student.Gender === 'Female').length}
                    </div>
                    <div className="text-sm text-gray-500">Female</div>
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gender
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{student.Name} {student.Surname}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.RegNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.Gender || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {students.length > 0 && (
              <div className="px-6 py-4 bg-blue-50 border-t border-gray-200">
                <div className="flex items-center text-sm text-blue-700">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Need to de-enroll a student?</p>
                    <p className="text-blue-600">Please contact the administrator to de-enroll students from this class.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'homework' && (
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Homework Assignments ({homework.length})</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {homework.map((assignment) => (
                  <div key={assignment.id} className="border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{assignment.title}</h4>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Due: {assignment.due_date}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {assignment.submissions} submissions
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.status === 'graded' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {assignment.status === 'graded' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Graded
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Results ({results.length})</h3>
            </div>
            
            {/* Results Search Form */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={resultsYear}
                    onChange={(e) => setResultsYear(e.target.value)}
                    placeholder="Enter year (e.g., 2024)"
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Term
                  </label>
                  <select
                    value={resultsTerm}
                    onChange={(e) => setResultsTerm(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={fetchResults}
                    disabled={resultsLoading}
                    className="w-full bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {resultsLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Search Results
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {resultsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
                  <p className="text-gray-500">Loading results...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Average Mark
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Points
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subjects
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((student) => (
                        <tr key={student.RegNumber} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                (student.position || 0) === 1 ? 'bg-yellow-100 text-yellow-800' :
                                (student.position || 0) === 2 ? 'bg-gray-100 text-gray-800' :
                                (student.position || 0) === 3 ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {student.position || 0}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.student_name} {student.student_surname}
                                </div>
                                <div className="text-sm text-gray-500">{student.RegNumber}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(student.averageMark || 0).toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(student.totalPoints || 0).toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(student.results || []).length} subject{(student.results || []).length !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <button
                              onClick={() => viewStudentResults(student)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              View Results
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No results found for the selected year and term</p>
                  <p className="text-sm">Try selecting different year and term values</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Student to Class</h3>
            
            <form onSubmit={searchStudents} className="flex mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or registration number..."
                className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 flex items-center"
                disabled={searchLoading}
              >
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Search</span>
              </button>
            </form>

            {enrollError && (
              <div className="text-sm text-red-600 mb-4">{enrollError}</div>
            )}

            <div className="max-h-80 overflow-y-auto">
              {searchResults.length === 0 && !searchLoading && searchTerm && (
                <div className="text-sm text-gray-500">No students found.</div>
              )}
              {searchResults.map((student) => (
                <div key={student.RegNumber} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <span className="text-sm text-gray-900">{student.Name} {student.Surname}</span>
                    <span className="ml-2 text-xs text-gray-500">{student.RegNumber}</span>
                    <div className="text-xs text-gray-500">{student.Gender} • {student.DateOfBirth}</div>
                  </div>
                  <button
                    onClick={() => enrollStudent(student)}
                    className="ml-2 px-4 py-2 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 flex items-center"
                    disabled={enrollLoading}
                  >
                    {enrollLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span className="ml-2">Add</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setSearchTerm('');
                  setSearchResults([]);
                  setEnrollError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Results Modal */}
      {showStudentResultsModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Results for {selectedStudent.student_name} {selectedStudent.student_surname}
              </h3>
              <button
                onClick={closeStudentResultsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <AlertCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Registration Number:</span>
                  <p className="text-gray-900">{selectedStudent.RegNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Position:</span>
                  <p className="text-gray-900">#{selectedStudent.position || 0}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Average Mark:</span>
                  <p className="text-gray-900">{(selectedStudent.averageMark || 0).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total Points:</span>
                  <p className="text-gray-900">{(selectedStudent.totalPoints || 0).toFixed(1)}</p>
                </div>
              </div>
            </div>

            {studentResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Mark
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coursework
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentResults.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.subject_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.total_mark || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {result.grade || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.points || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.coursework_mark || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No subject results found for this student</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={closeStudentResultsModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* De-enrollment Confirmation Dialog */}
    </div>
  );
};

export default ViewGradelevelClass;
