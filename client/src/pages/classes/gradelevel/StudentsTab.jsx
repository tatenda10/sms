import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../../contexts/Api';
import { useAuth } from '../../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUser, faSearch, faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons';

const StudentsTab = ({ classId }) => {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add student modal state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [addLoadingId, setAddLoadingId] = useState(null);
  const [addError, setAddError] = useState('');

  // De-enroll student state
  const [deEnrollingId, setDeEnrollingId] = useState(null);
  const [showConfirmId, setShowConfirmId] = useState(null);
  const [deEnrollError, setDeEnrollError] = useState('');

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line
  }, [classId]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-enrollments`, {
        params: { gradelevel_class_id: classId },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStudents(response.data.data || []);
      } else {
        setError('Failed to load students.');
      }
    } catch (err) {
      setError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  // Search students for modal
  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const response = await axios.get(`${BASE_URL}/students/search`, {
        params: { query: searchTerm },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSearchResults(response.data.data || []);
      } else {
        setSearchError('Failed to search students.');
      }
    } catch (err) {
      setSearchError('Failed to search students.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Add student to class
  const handleAddStudent = async (student) => {
    setAddLoadingId(student.RegNumber);
    setAddError('');
    try {
      const response = await axios.post(`${BASE_URL}/classes/gradelevel-enrollments`, {
        student_regnumber: student.RegNumber,
        gradelevel_class_id: classId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setShowAddModal(false);
        setSearchTerm('');
        setSearchResults([]);
        fetchStudents();
      } else {
        setAddError(response.data.message || 'Failed to add student.');
      }
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add student.');
    } finally {
      setAddLoadingId(null);
    }
  };

  // De-enroll student
  const handleDeEnroll = async (enrollment) => {
    setDeEnrollingId(enrollment.id);
    setDeEnrollError('');
    try {
      await axios.delete(`${BASE_URL}/classes/gradelevel-enrollments/${enrollment.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStudents();
      setShowConfirmId(null);
    } catch (err) {
      setDeEnrollError('Failed to de-enroll student.');
    } finally {
      setDeEnrollingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-gray-700 flex items-center">
          <FontAwesomeIcon icon={faUser} className="mr-2 h-4 w-4 text-gray-400" />
          Students Enrolled
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium text-white bg-gray-900  hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1 h-3 w-3" />
          Add Student
        </button>
      </div>
      {loading ? (
        <div className="text-xs text-gray-500">Loading students...</div>
      ) : error ? (
        <div className="text-xs text-red-600">{error}</div>
      ) : students.length === 0 ? (
        <div className="text-xs text-gray-500">No students enrolled in this class.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left font-medium tracking-wider">Student Name</th>
                <th className="px-3 py-2 text-left font-medium tracking-wider">Student ID</th>
                <th className="px-3 py-2 text-left font-medium tracking-wider">Actions</th>
              </tr>
            </thead> 
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.RegNumber}>
                  <td className="px-3 py-2 whitespace-nowrap">{student.Name} {student.Surname}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{student.RegNumber}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => setShowConfirmId(student.id)}
                      className="inline-flex items-center px-2 py-1 text-xs text-red-600 hover:text-white border border-red-200 hover:bg-red-600 rounded"
                      disabled={deEnrollingId === student.id}
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-3 w-3 mr-1" />
                      De-enroll
                    </button>
                    {/* Confirm dialog */}
                    {showConfirmId === student.id && (
                      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded shadow w-full max-w-md">
                          <div className="text-base text-gray-900 mb-4">Are you sure you want to de-enroll this student?</div>
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => setShowConfirmId(null)}
                              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeEnroll(student)}
                              className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center"
                              disabled={deEnrollingId === student.id}
                            >
                              {deEnrollingId === student.id ? <FontAwesomeIcon icon={faSpinner} spin className="h-4 w-4 mr-2" /> : <FontAwesomeIcon icon={faTrash} className="h-4 w-4 mr-2" />}
                              De-enroll
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow w-full max-w-2xl">
            <h3 className="text-base font-medium text-gray-900 mb-4">Add Student to Class</h3>
            <form onSubmit={handleSearch} className="flex mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or reg number..."
                className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 flex items-center"
                disabled={searchLoading}
              >
                {searchLoading ? <FontAwesomeIcon icon={faSpinner} spin className="h-4 w-4" /> : <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />}
                <span className="ml-2">Search</span>
              </button>
            </form>
            {searchError && <div className="text-xs text-red-600 mb-2">{searchError}</div>}
            {addError && <div className="text-xs text-red-600 mb-2">{addError}</div>}
            <div className="max-h-80 overflow-y-auto">
              {searchResults.length === 0 && !searchLoading && (
                <div className="text-xs text-gray-500">No students found.</div>
              )}
              {searchResults.map(student => (
                <div key={student.RegNumber} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <span className="text-sm text-gray-900">{student.Name} {student.Surname}</span>
                    <span className="ml-2 text-xs text-gray-500">{student.RegNumber}</span>
                  </div>
                  <button
                    onClick={() => handleAddStudent(student)}
                    className="ml-2 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 flex items-center"
                    disabled={addLoadingId === student.RegNumber}
                  >
                    {addLoadingId === student.RegNumber ? <FontAwesomeIcon icon={faSpinner} spin className="h-4 w-4" /> : <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />}
                    <span className="ml-2">Add</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsTab;
