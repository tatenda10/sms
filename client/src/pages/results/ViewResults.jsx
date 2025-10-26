import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPlus, faArrowLeft, faTrophy, faMedal, faAward } from '@fortawesome/free-solid-svg-icons';

const ViewResults = () => {
  const { token } = useAuth();
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentResults, setStudentResults] = useState([]);

  useEffect(() => {
    if (classId) {
      fetchClassInfo();
      fetchStudents();
    }
  }, [classId]);

  const fetchClassInfo = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassInfo(res.data.data);
    } catch (err) {
      console.error('Error fetching class info:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (student) => {
    try {
      const res = await axios.get(`${BASE_URL}/results/student/${student.RegNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { gradelevel_class_id: classId }
      });
      setStudentResults(res.data.data || []);
      setSelectedStudent(student);
      setShowStudentModal(true);
    } catch (err) {
      console.error('Error fetching student results:', err);
      setError('Failed to fetch student results');
    }
  };

  const handleAddResult = () => {
    navigate(`/dashboard/results/entry/${classId}`);
  };

  const getPositionIcon = (position) => {
    if (position === 1) return <FontAwesomeIcon icon={faTrophy} className="h-3 w-3 text-yellow-500" />;
    if (position === 2) return <FontAwesomeIcon icon={faMedal} className="h-3 w-3 text-gray-400" />;
    if (position === 3) return <FontAwesomeIcon icon={faAward} className="h-3 w-3 text-orange-500" />;
    return null;
  };

  const getPositionBadge = (position) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-800';
    if (position === 2) return 'bg-gray-100 text-gray-800';
    if (position === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="p-2">
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/results')}
          className="flex items-center text-xs text-gray-600 hover:text-gray-900 mb-4"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3 mr-2" />
          Back to Results
        </button>
        <h1 className="text-base font-bold text-gray-900 mb-2">Class Results</h1>
      </div>

      {/* Class Information */}
      {classInfo && (
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Class Name</h3>
              <p className="text-sm text-gray-900">{classInfo.class_name}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Grade Level</h3>
              <p className="text-sm text-gray-900">{classInfo.grade_level}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Stream</h3>
              <p className="text-sm text-gray-900">{classInfo.stream || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Result Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleAddResult}
          className="px-4 py-2 bg-gray-900 text-white text-xs hover:bg-gray-800 flex items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />
          Add Result
        </button>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reg Number
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Marks
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-2 py-4 text-center text-xs text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-2 py-4 text-center text-xs text-gray-500">
                    No students found in this class
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student.RegNumber} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPositionIcon(index + 1)}
                        <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${getPositionBadge(index + 1)}`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-xs font-bold text-gray-900">
                        {student.Surname} {student.Name}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900 font-mono">{student.RegNumber}</div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {student.total_marks || 'N/A'}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {student.average ? `${student.average}%` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {student.grade || 'N/A'}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="View Student Results"
                      >
                        <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Results Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 md:p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm md:text-base font-semibold truncate pr-2">
                {selectedStudent.Surname} {selectedStudent.Name} - Results
              </h2>
              <button
                onClick={() => {
                  setShowStudentModal(false);
                  setSelectedStudent(null);
                  setStudentResults([]);
                }}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <span className="text-lg font-bold">×</span>
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold">Registration Number:</span> {selectedStudent.RegNumber}
                </div>
                <div>
                  <span className="font-semibold">Class:</span> {classInfo?.class_name}
                </div>
              </div>
            </div>

            {studentResults.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-8">
                No results found for this student
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coursework
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paper Marks
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentResults.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">{result.subject_name}</div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{result.coursework_mark || 'N/A'}</div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{result.total_paper_marks || 'N/A'}</div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">{result.total_marks || 'N/A'}</div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">{result.grade || 'N/A'}</div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{result.points || 'N/A'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 text-xs text-red-600">{error}</div>
      )}
    </div>
  );
};

export default ViewResults;
