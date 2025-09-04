import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPlus, faTrophy, faMedal, faAward } from '@fortawesome/free-solid-svg-icons';

const ViewResults = () => {
  const { token } = useAuth();
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


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
      // For now, let's fetch all students in the class first
      const studentsRes = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const students = studentsRes.data.data || [];
      
      // If we have students, try to get their positions for the current term/year
      if (students.length > 0) {
        const currentYear = new Date().getFullYear();
        const currentTerm = '1'; // Default to Term 1, could be made configurable
        
        try {
          const positionsRes = await axios.get(`${BASE_URL}/results/results/class-positions`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { 
              gradelevel_class_id: classId,
              term: currentTerm,
              academic_year: currentYear
            }
          });
          
          const positions = positionsRes.data.data || [];
          
          // Merge student data with position data
          const studentsWithPositions = students.map(student => {
            const positionData = positions.find(p => p.RegNumber === student.RegNumber);
            return {
              ...student,
              position: positionData?.position || 'N/A',
              total_marks: positionData?.total_mark || 'N/A',
              average: positionData?.average || 'N/A',
              grade: positionData?.grade || 'N/A'
            };
          });
          
          setStudents(studentsWithPositions);
        } catch (positionErr) {
          console.log('No position data available, showing students without positions');
          setStudents(students);
        }
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = (student) => {
    navigate(`/dashboard/results/student/${classId}/${student.RegNumber}`);
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
    if (position === 'N/A') return 'bg-gray-100 text-gray-600';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="p-2">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-base font-bold text-gray-900 mb-2">Class Results</h1>
      </div>

      {/* Class Information */}
      {classInfo && (
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Class Name</h3>
              <p className="text-sm text-gray-900">{classInfo.name}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Stage</h3>
              <p className="text-sm text-gray-900">{classInfo.stream_stage || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Stream</h3>
              <p className="text-sm text-gray-900">{classInfo.stream_name || 'N/A'}</p>
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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registration Number
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-3 py-4 text-center text-xs text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-3 py-4 text-center text-xs text-gray-500">
                  No students found in this class
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr key={student.RegNumber} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      {student.position !== 'N/A' && getPositionIcon(student.position)}
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPositionBadge(student.position)}`}>
                        {student.position !== 'N/A' ? student.position : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-bold text-gray-900">
                      {student.Surname} {student.Name}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-900">{student.RegNumber}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <button
                      onClick={() => handleViewStudent(student)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Student Results"
                    >
                      <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>



      {error && (
        <div className="mt-4 text-xs text-red-600">{error}</div>
      )}
    </div>
  );
};

export default ViewResults;
