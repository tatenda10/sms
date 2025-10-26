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

const ViewSubjectClass = () => {
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

  // Enrollment modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Results entry state
  const [showResultsEntryModal, setShowResultsEntryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedTerm, setSelectedTerm] = useState('1');
  const [courseworkMark, setCourseworkMark] = useState('');
  const [paperMarks, setPaperMarks] = useState([{ name: 'Paper 1', mark: '' }]);
  const [savingResults, setSavingResults] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [gradingCriteria, setGradingCriteria] = useState([]);

  // Results view/edit state
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [editCourseworkMark, setEditCourseworkMark] = useState('');
  const [editPaperMarks, setEditPaperMarks] = useState([]);
  const [updatingResults, setUpdatingResults] = useState(false);

  useEffect(() => {
    // Fetch grading criteria when component loads
    fetchGradingCriteria();
  }, []);

  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId || hasFetched.current) return;

      try {
        console.log('📚 Fetching subject class data for ID:', classId);
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
        const subjectClass = classData.data.find(cls => 
          cls.id === parseInt(classId) && cls.class_type === 'Subject Class'
        );

        if (!subjectClass) {
          throw new Error('Subject class not found');
        }

        setClassInfo(subjectClass);

        // Fetch students using the employee subject enrollments endpoint
        console.log('🔍 Fetching students for subject class:', classId);
        const studentsResponse = await fetch(`${BASE_URL}/employee-subject-enrollments/class/${classId}`, {
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
            setStudents(studentsData.data || []);
          }
        } else {
          const errorData = await studentsResponse.json();
          console.error('❌ Error fetching students:', errorData);
        }

        setHomework([
          { id: 1, title: 'Algebra Assignment 1', due_date: '2024-01-15', status: 'pending', submissions: 12 },
          { id: 2, title: 'Geometry Quiz', due_date: '2024-01-20', status: 'graded', submissions: 15 },
          { id: 3, title: 'Trigonometry Problems', due_date: '2024-01-25', status: 'pending', submissions: 8 }
        ]);

        setResults([
          { id: 1, student_name: 'John Doe', exam_type: 'Midterm', score: 85, grade: 'A', date: '2024-01-10' },
          { id: 2, student_name: 'Jane Smith', exam_type: 'Midterm', score: 78, grade: 'B+', date: '2024-01-10' },
          { id: 3, student_name: 'Mike Johnson', exam_type: 'Quiz', score: 92, grade: 'A-', date: '2024-01-08' }
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
  }, [classId, employee?.id, token]);

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
      const response = await fetch(`${BASE_URL}/employee-subject-enrollments/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_regnumber: student.RegNumber,
          subject_class_id: classId
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
    if (!classId || !resultsYear || !resultsTerm || !classInfo?.gradelevel_class_id) return;

    setResultsLoading(true);
    try {
      console.log('🔍 Fetching results for subject class:', classId, 'Gradelevel class:', classInfo.gradelevel_class_id, 'Year:', resultsYear, 'Term:', resultsTerm);
      const response = await fetch(`${BASE_URL}/employee-results?subject_class_id=${classId}&gradelevel_class_id=${classInfo.gradelevel_class_id}&academic_year=${resultsYear}&term=${resultsTerm}`, {
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
          setResults(data.data || []);
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

  // Fetch grading criteria
  const fetchGradingCriteria = async () => {
    try {
      const response = await fetch(`${BASE_URL}/employee-grading`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('📊 Grading criteria loaded:', data.data);
          setGradingCriteria(data.data || []);
        }
      } else {
        console.error('❌ Failed to fetch grading criteria:', response.status);
      }
    } catch (error) {
      console.error('Error fetching grading criteria:', error);
    }
  };

  // Add paper mark
  const addPaperMark = () => {
    setPaperMarks([...paperMarks, { name: `Paper ${paperMarks.length + 1}`, mark: '' }]);
  };

  // Remove paper mark
  const removePaperMark = (index) => {
    if (paperMarks.length > 1) {
      const newPaperMarks = paperMarks.filter((_, i) => i !== index);
      setPaperMarks(newPaperMarks);
    }
  };

  // Update paper mark
  const updatePaperMark = (index, field, value) => {
    const newPaperMarks = [...paperMarks];
    newPaperMarks[index][field] = value;
    setPaperMarks(newPaperMarks);
  };

  // Calculate total marks
  const calculateTotalMarks = () => {
    const validPapers = paperMarks.filter(paper => paper.mark && parseFloat(paper.mark) > 0);
    if (validPapers.length === 0) return 0;
    
    const total = validPapers.reduce((sum, paper) => sum + (parseFloat(paper.mark) || 0), 0);
    const average = total / validPapers.length;
    return Math.round(average * 100) / 100;
  };

  // Calculate grade
  const calculateGrade = (totalMarks) => {
    console.log('🔍 Calculating grade for marks:', totalMarks);
    console.log('🔍 Available grading criteria:', gradingCriteria);
    
    const criteria = gradingCriteria.find(c => 
      totalMarks >= c.min_mark && totalMarks <= c.max_mark
    );
    
    console.log('🔍 Found criteria:', criteria);
    
    const result = criteria ? { grade: criteria.grade, points: criteria.points } : { grade: 'N/A', points: 0 };
    console.log('🔍 Grade result:', result);
    
    return result;
  };

  // Save results
  const saveResults = async () => {
    if (!selectedStudent || !selectedYear || !selectedTerm) {
      setResultsError('Please fill in all required fields');
      return;
    }

    setSavingResults(true);
    setResultsError('');

    try {
      const totalMarks = calculateTotalMarks();
      const gradeInfo = calculateGrade(totalMarks);

      // Save coursework mark
      if (courseworkMark) {
        const courseworkData = {
          reg_number: selectedStudent,
          subject_class_id: classId,
          gradelevel_class_id: classInfo?.gradelevel_class_id,
          term: selectedTerm,
          academic_year: selectedYear,
          coursework_mark: parseFloat(courseworkMark)
        };

        await fetch(`${BASE_URL}/employee-results-entry/coursework`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(courseworkData)
        });
      }

      // Save main result
      const resultData = {
        reg_number: selectedStudent,
        subject_class_id: classId,
        gradelevel_class_id: classInfo?.gradelevel_class_id,
        term: selectedTerm,
        academic_year: selectedYear
      };

      const resultResponse = await fetch(`${BASE_URL}/employee-results-entry/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resultData)
      });

      const resultDataResponse = await resultResponse.json();
      const resultId = resultDataResponse.data.id;

      // Save paper marks
      for (let i = 0; i < paperMarks.length; i++) {
        const paper = paperMarks[i];
        if (paper.mark) {
          // Create or get paper
          let paperId = null;
          
          try {
            const paperCreateData = {
              name: paper.name,
              description: `${paper.name} for ${classInfo?.subject_name || 'Subject'}`
            };
            
            const paperResponse = await fetch(`${BASE_URL}/employee-results-entry/papers`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(paperCreateData)
            });

            if (paperResponse.ok) {
              const paperData = await paperResponse.json();
              paperId = paperData.data.id;
            } else {
              // Try to get existing paper
              const existingPapersResponse = await fetch(`${BASE_URL}/employee-results-entry/papers`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (existingPapersResponse.ok) {
                const existingPapersData = await existingPapersResponse.json();
                const existingPaper = existingPapersData.data.find(p => p.name === paper.name);
                if (existingPaper) {
                  paperId = existingPaper.id;
                }
              }
            }
          } catch (paperErr) {
            console.error('Error with paper:', paperErr);
            continue;
          }
          
          if (paperId) {
            const paperMarkData = {
              result_id: resultId,
              paper_id: paperId,
              mark: parseFloat(paper.mark)
            };
            
            await fetch(`${BASE_URL}/employee-results-entry/paper-mark`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(paperMarkData)
            });
          }
        }
      }

      // Update result with calculated grade and total marks
      const updateResultData = {
        total_mark: totalMarks,
        grade: gradeInfo.grade,
        points: gradeInfo.points
      };

      await fetch(`${BASE_URL}/employee-results-entry/${resultId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateResultData)
      });

      // Close modal and refresh results
      setShowResultsEntryModal(false);
      setSelectedStudent('');
      setCourseworkMark('');
      setPaperMarks([{ name: 'Paper 1', mark: '' }]);
      setResultsError('');
      
      // Refresh results
      await fetchResults();

    } catch (error) {
      console.error('Error saving results:', error);
      setResultsError('Failed to save results: ' + error.message);
    } finally {
      setSavingResults(false);
    }
  };

  // View result details
  const viewResult = (result) => {
    setSelectedResult(result);
    setShowViewModal(true);
  };

  // Edit result
  const editResult = (result) => {
    setSelectedResult(result);
    setEditCourseworkMark(result.coursework_mark || '');
    
    // Convert paper marks to editable format
    const paperMarksData = result.paper_marks || [];
    const formattedPaperMarks = paperMarksData.map(paper => ({
      name: paper.paper_name || 'Paper',
      mark: paper.mark || ''
    }));
    
    if (formattedPaperMarks.length === 0) {
      formattedPaperMarks.push({ name: 'Paper 1', mark: '' });
    }
    
    setEditPaperMarks(formattedPaperMarks);
    setShowEditModal(true);
  };

  // Update paper mark in edit mode
  const updateEditPaperMark = (index, field, value) => {
    const newPaperMarks = [...editPaperMarks];
    newPaperMarks[index][field] = value;
    setEditPaperMarks(newPaperMarks);
  };

  // Add paper mark in edit mode
  const addEditPaperMark = () => {
    setEditPaperMarks([...editPaperMarks, { name: `Paper ${editPaperMarks.length + 1}`, mark: '' }]);
  };

  // Remove paper mark in edit mode
  const removeEditPaperMark = (index) => {
    if (editPaperMarks.length > 1) {
      const newPaperMarks = editPaperMarks.filter((_, i) => i !== index);
      setEditPaperMarks(newPaperMarks);
    }
  };

  // Calculate total marks for edit mode
  const calculateEditTotalMarks = () => {
    const validPapers = editPaperMarks.filter(paper => paper.mark && parseFloat(paper.mark) > 0);
    if (validPapers.length === 0) return 0;
    
    const total = validPapers.reduce((sum, paper) => sum + (parseFloat(paper.mark) || 0), 0);
    const average = total / validPapers.length;
    return Math.round(average * 100) / 100;
  };

  // Update results
  const updateResults = async () => {
    if (!selectedResult) return;

    setUpdatingResults(true);
    setResultsError('');

    try {
      const totalMarks = calculateEditTotalMarks();
      const gradeInfo = calculateGrade(totalMarks);

      // Update coursework mark if changed
      if (editCourseworkMark !== (selectedResult.coursework_mark || '')) {
        // Find coursework record and update it
        // This would require a separate API call to update coursework
        console.log('Updating coursework mark:', editCourseworkMark);
      }

      // Update main result
      const resultData = {
        total_mark: totalMarks,
        grade: gradeInfo.grade,
        points: gradeInfo.points
      };

      const response = await fetch(`${BASE_URL}/employee-results-entry/${selectedResult.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resultData)
      });

      if (response.ok) {
        // Close modal and refresh results
        setShowEditModal(false);
        setSelectedResult(null);
        setEditCourseworkMark('');
        setEditPaperMarks([]);
        setResultsError('');
        
        // Refresh results
        await fetchResults();
      } else {
        const errorData = await response.json();
        setResultsError('Failed to update results: ' + (errorData.message || 'Unknown error'));
      }

    } catch (error) {
      console.error('Error updating results:', error);
      setResultsError('Failed to update results: ' + error.message);
    } finally {
      setUpdatingResults(false);
    }
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
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                {classInfo?.subject_name} - {classInfo?.subject_code}
              </h1>
              <p className="text-sm text-gray-500">
                {classInfo?.stream_name} • {classInfo?.gradelevel_class_name || 'All Grades'}
              </p>
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
                  ? 'border-blue-500 text-blue-600'
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
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Results ({results.length})</h3>
              <button
                onClick={() => {
                  setShowResultsEntryModal(true);
                  fetchGradingCriteria();
                }}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Results
              </button>
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
                          Student
                        </th>
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((result) => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {result.student_name} {result.student_surname}
                                </div>
                                <div className="text-sm text-gray-500">{result.RegNumber}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                            <div className="flex space-x-2">
                              <button
                                onClick={() => viewResult(result)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                              >
                                View
                              </button>
                              <button
                                onClick={() => editResult(result)}
                                className="text-green-600 hover:text-green-800 text-xs font-medium"
                              >
                                Edit
                              </button>
                            </div>
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </button>
            </form>

            {enrollError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {enrollError}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded">
                {searchResults.map((student) => (
                  <div
                    key={student.RegNumber}
                    className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    onClick={() => enrollStudent(student)}
                  >
                    <div>
                      <div className="font-medium text-sm">{student.Name} {student.Surname}</div>
                      <div className="text-xs text-gray-500">{student.RegNumber}</div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      disabled={enrollLoading}
                    >
                      {enrollLoading ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setSearchTerm('');
                  setSearchResults([]);
                  setEnrollError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Entry Modal */}
      {showResultsEntryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Student Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Student Selection */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Student Information</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Student *
                    </label>
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a student</option>
                      {students.map((student) => (
                        <option key={student.RegNumber} value={student.RegNumber}>
                          {student.Name} {student.Surname} ({student.RegNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Academic Year *
                    </label>
                    <input
                      type="text"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      placeholder="Enter year (e.g., 2024)"
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Term *
                    </label>
                    <select
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="1">Term 1</option>
                      <option value="2">Term 2</option>
                      <option value="3">Term 3</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column - Marks Entry */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Marks Entry</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Coursework Mark
                    </label>
                    <input
                      type="number"
                      value={courseworkMark}
                      onChange={(e) => setCourseworkMark(e.target.value)}
                      placeholder="Enter coursework mark (0-100)"
                      min="0"
                      max="100"
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Paper Marks
                      </label>
                      <button
                        type="button"
                        onClick={addPaperMark}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Paper
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {paperMarks.map((paper, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={paper.name}
                            onChange={(e) => updatePaperMark(index, 'name', e.target.value)}
                            className="flex-1 border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Paper name"
                          />
                          <input
                            type="number"
                            value={paper.mark}
                            onChange={(e) => updatePaperMark(index, 'mark', e.target.value)}
                            placeholder="Mark"
                            min="0"
                            max="100"
                            className="w-20 border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {paperMarks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePaperMark(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <AlertCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grade Preview */}
                  {calculateTotalMarks() > 0 && (
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600">
                        <div>Total Marks: {calculateTotalMarks()}</div>
                        <div>Grade: {calculateGrade(calculateTotalMarks()).grade}</div>
                        <div>Points: {calculateGrade(calculateTotalMarks()).points}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {resultsError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {resultsError}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowResultsEntryModal(false);
                  setSelectedStudent('');
                  setCourseworkMark('');
                  setPaperMarks([{ name: 'Paper 1', mark: '' }]);
                  setResultsError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveResults}
                disabled={savingResults}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {savingResults ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {savingResults ? 'Saving...' : 'Save Results'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Result Modal */}
      {showViewModal && selectedResult && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Result Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student</label>
                  <p className="text-sm text-gray-900">{selectedResult.student_name} {selectedResult.student_surname}</p>
                  <p className="text-xs text-gray-500">{selectedResult.RegNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <p className="text-sm text-gray-900">{selectedResult.subject_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Mark</label>
                  <p className="text-sm text-gray-900">{selectedResult.total_mark || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Coursework Mark</label>
                  <p className="text-sm text-gray-900">{selectedResult.coursework_mark || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grade</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {selectedResult.grade || 'N/A'}
                  </span>
                </div>
              </div>

              {selectedResult.paper_marks && selectedResult.paper_marks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paper Marks</label>
                  <div className="space-y-2">
                    {selectedResult.paper_marks.map((paper, index) => (
                      <div key={index} className="flex justify-between items-center py-1 border-b border-gray-200">
                        <span className="text-sm text-gray-900">{paper.paper_name}</span>
                        <span className="text-sm font-medium text-gray-900">{paper.mark}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Result Modal */}
      {showEditModal && selectedResult && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Result</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Student Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Student Information</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Student</label>
                    <p className="text-sm text-gray-900">{selectedResult.student_name} {selectedResult.student_surname}</p>
                    <p className="text-xs text-gray-500">{selectedResult.RegNumber}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Subject</label>
                    <p className="text-sm text-gray-900">{selectedResult.subject_name}</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Marks Entry */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Marks Entry</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Coursework Mark
                    </label>
                    <input
                      type="number"
                      value={editCourseworkMark}
                      onChange={(e) => setEditCourseworkMark(e.target.value)}
                      placeholder="Enter coursework mark (0-100)"
                      min="0"
                      max="100"
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Paper Marks
                      </label>
                      <button
                        type="button"
                        onClick={addEditPaperMark}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Paper
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {editPaperMarks.map((paper, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={paper.name}
                            onChange={(e) => updateEditPaperMark(index, 'name', e.target.value)}
                            className="flex-1 border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Paper name"
                          />
                          <input
                            type="number"
                            value={paper.mark}
                            onChange={(e) => updateEditPaperMark(index, 'mark', e.target.value)}
                            placeholder="Mark"
                            min="0"
                            max="100"
                            className="w-20 border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {editPaperMarks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEditPaperMark(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <AlertCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grade Preview */}
                  {calculateEditTotalMarks() > 0 && (
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600">
                        <div>Total Marks: {calculateEditTotalMarks()}</div>
                        <div>Grade: {calculateGrade(calculateEditTotalMarks()).grade}</div>
                        <div>Points: {calculateGrade(calculateEditTotalMarks()).points}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {resultsError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {resultsError}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedResult(null);
                  setEditCourseworkMark('');
                  setEditPaperMarks([]);
                  setResultsError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={updateResults}
                disabled={updatingResults}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {updatingResults ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {updatingResults ? 'Updating...' : 'Update Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewSubjectClass;
