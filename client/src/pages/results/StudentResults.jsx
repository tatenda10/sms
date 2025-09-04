import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faAward, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const StudentResults = () => {
  const { token } = useAuth();
  const { classId, studentId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [studentPosition, setStudentPosition] = useState(null);
  const [studentStreamPosition, setStudentStreamPosition] = useState(null);
  const [courseworkMarks, setCourseworkMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resultToDelete, setResultToDelete] = useState(null);

  useEffect(() => {
    if (classId && studentId) {
      fetchClassInfo();
      fetchStudentInfo();
      fetchStudentResults();
      fetchStudentPosition();
      fetchCourseworkMarks();
    }
  }, [classId, studentId]);

  useEffect(() => {
    if (classInfo && classInfo.stream_id && studentId) {
      fetchStudentStreamPosition();
    }
  }, [classInfo, studentId]);

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

  const fetchStudentInfo = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const student = res.data.data.find(s => s.RegNumber === studentId);
      if (student) {
        setStudentInfo(student);
      }
    } catch (err) {
      console.error('Error fetching student info:', err);
    }
  };

  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();
      const currentTerm = '1'; // Default to Term 1, could be made configurable
      
      const res = await axios.get(`${BASE_URL}/results/results`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          reg_number: studentId,
          gradelevel_class_id: classId,
          term: currentTerm,
          academic_year: currentYear
        }
      });
      setStudentResults(res.data.data || []);
    } catch (err) {
      console.error('Error fetching student results:', err);
      setError('Failed to fetch student results');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentPosition = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const currentTerm = '1'; // Default to Term 1, could be made configurable
      
      const res = await axios.get(`${BASE_URL}/results/results/class-positions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          gradelevel_class_id: classId,
          term: currentTerm,
          academic_year: currentYear
        }
      });
      
      const positions = res.data.data || [];
      const studentPos = positions.find(p => p.RegNumber === studentId);
      if (studentPos) {
        setStudentPosition(studentPos);
      }
    } catch (err) {
      console.error('Error fetching student position:', err);
    }
  };

  const fetchStudentStreamPosition = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const currentTerm = '1'; // Default to Term 1, could be made configurable
      
      // First get the stream_id from class info
      if (classInfo && classInfo.stream_id) {
        const res = await axios.get(`${BASE_URL}/results/results/stream-positions`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            stream_id: classInfo.stream_id,
            term: currentTerm,
            academic_year: currentYear
          }
        });
        
        const positions = res.data.data || [];
        const studentPos = positions.find(p => p.RegNumber === studentId);
        if (studentPos) {
          setStudentStreamPosition(studentPos);
        }
      }
    } catch (err) {
      console.error('Error fetching student stream position:', err);
    }
  };

  const fetchCourseworkMarks = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const currentTerm = '1'; // Default to Term 1, could be made configurable
      
      const res = await axios.get(`${BASE_URL}/results/coursework`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          reg_number: studentId,
          gradelevel_class_id: classId,
          term: currentTerm,
          academic_year: currentYear
        }
      });
      
      setCourseworkMarks(res.data.data || []);
    } catch (err) {
      console.error('Error fetching coursework marks:', err);
    }
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

  const handleEditResult = (result) => {
    navigate(`/dashboard/results/entry/${classId}`, {
      state: {
        editMode: true,
        resultData: result,
        studentId: studentId
      }
    });
  };

  const handleDeleteResult = (result) => {
    setResultToDelete(result);
    setShowDeleteModal(true);
  };

  const confirmDeleteResult = async () => {
    try {
      await axios.delete(`${BASE_URL}/results/results/${resultToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh the results after deletion
      fetchStudentResults();
      fetchStudentPosition();
      fetchStudentStreamPosition();
      setShowDeleteModal(false);
      setResultToDelete(null);
    } catch (err) {
      console.error('Error deleting result:', err);
      setError('Failed to delete result');
    }
  };

  return (
    <div className="p-2">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-base font-bold text-gray-900 mb-2">Student Results</h1>
      </div>

      {/* Student Information */}
      {studentInfo && (
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Student Name</h3>
              <p className="text-sm text-gray-900">{studentInfo.Surname} {studentInfo.Name}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Registration Number</h3>
              <p className="text-sm text-gray-900">{studentInfo.RegNumber}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Class</h3>
              <p className="text-sm text-gray-900">{classInfo?.name}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Grade Level</h3>
              <p className="text-sm text-gray-900">{classInfo?.stream_stage || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Stream</h3>
              <p className="text-sm text-gray-900">{classInfo?.stream_name || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase">Gender</h3>
              <p className="text-sm text-gray-900">{studentInfo.Gender}</p>
            </div>
          </div>
        </div>
      )}

      {/* Term and Year Information */}
      <div className="bg-white border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-600 uppercase">Term</h3>
            <p className="text-sm text-gray-900">Term 1</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-600 uppercase">Academic Year</h3>
            <p className="text-sm text-gray-900">{new Date().getFullYear()}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-600 uppercase">Class Position</h3>
            <p className="text-sm text-gray-900">
              {studentPosition ? (
                <span className="flex items-center">
                  {getPositionIcon(studentPosition.position)}
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPositionBadge(studentPosition.position)}`}>
                    {studentPosition.position}
                  </span>
                </span>
              ) : (
                'N/A'
              )}
            </p>
          </div>
                     <div>
             <h3 className="text-xs font-semibold text-gray-600 uppercase">Stream Position</h3>
             <p className="text-sm text-gray-900">
               {studentStreamPosition ? (
                 <span className="flex items-center">
                   {getPositionIcon(studentStreamPosition.streamPosition)}
                   <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPositionBadge(studentStreamPosition.streamPosition)}`}>
                     {studentStreamPosition.streamPosition}
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
        
        {loading ? (
          <div className="px-4 py-8 text-center text-xs text-gray-500">
            Loading results...
          </div>
        ) : studentResults.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-gray-500">
            No results found for this student
          </div>
        ) : (
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
                    Total
                  </th>
                                     <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Grade
                   </th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Actions
                   </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">{result.subject_name}</div>
                    </td>
                                         <td className="px-3 py-2 whitespace-nowrap">
                       <div className="text-xs text-gray-900">
                         {(() => {
                           const coursework = courseworkMarks.find(cw => cw.subject_class_id === result.subject_class_id);
                           return coursework ? coursework.coursework_mark : 'N/A';
                         })()}
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
                      <div className="text-xs font-medium text-gray-900">{result.total_mark || 'N/A'}</div>
                    </td>
                                         <td className="px-3 py-2 whitespace-nowrap">
                       <div className="text-xs font-medium text-gray-900">{result.grade || 'N/A'}</div>
                     </td>
                     <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                       <div className="flex space-x-2">
                         <button
                           onClick={() => handleEditResult(result)}
                           className="text-blue-600 hover:text-blue-900"
                           title="Edit Result"
                         >
                           <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                         </button>
                         <button
                           onClick={() => handleDeleteResult(result)}
                           className="text-red-600 hover:text-red-900"
                           title="Delete Result"
                         >
                           <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                         </button>
                       </div>
                     </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

             {error && (
         <div className="mt-4 text-xs text-red-600">{error}</div>
       )}

       {/* Delete Confirmation Modal */}
       {showDeleteModal && resultToDelete && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white p-6 w-full max-w-md">
             <div className="mb-4">
               <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Result</h3>
               <p className="text-sm text-gray-600">
                 Are you sure you want to delete the result for{' '}
                 <span className="font-semibold">{resultToDelete.subject_name}</span>?
               </p>
               <p className="text-xs text-gray-500 mt-2">
                 This action cannot be undone.
               </p>
             </div>
             <div className="flex justify-end space-x-3">
               <button
                 onClick={() => {
                   setShowDeleteModal(false);
                   setResultToDelete(null);
                 }}
                 className="px-4 py-2 text-xs bg-gray-300 text-gray-700 hover:bg-gray-400"
               >
                 Cancel
               </button>
               <button
                 onClick={confirmDeleteResult}
                 className="px-4 py-2 text-xs bg-red-600 text-white hover:bg-red-700"
               >
                 Delete
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default StudentResults;
