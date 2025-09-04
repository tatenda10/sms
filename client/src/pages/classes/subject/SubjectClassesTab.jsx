import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faBook, faSpinner, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';
import axios from 'axios';
import { Link } from 'react-router-dom';

const SubjectClassesTab = ({ classId, streamId }) => {
  const { token } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    subject_id: '',
    employee_number: '',
    capacity: ''
  });
  const [subjectQuery, setSubjectQuery] = useState('');
  const [subjectResults, setSubjectResults] = useState([]);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [teacherQuery, setTeacherQuery] = useState('');
  const [teacherResults, setTeacherResults] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState({});
  const [subjectClasses, setSubjectClasses] = useState([]);
  const [subjectClassesLoading, setSubjectClassesLoading] = useState(false);
  const [subjectClassesError, setSubjectClassesError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModalId, setShowDeleteModalId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // Subject search
  React.useEffect(() => {
    if (!subjectQuery.trim()) {
      setSubjectResults([]);
      return;
    }
    setSubjectLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await axios.get(`${BASE_URL}/classes/subjects/search`, {
          params: { q: subjectQuery },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setSubjectResults(response.data.data || []);
        }
      } catch {
        setSubjectResults([]);
      } finally {
        setSubjectLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [subjectQuery, token]);

  // Teacher search
  React.useEffect(() => {
    if (!teacherQuery.trim()) {
      setTeacherResults([]);
      return;
    }
    setTeacherLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await axios.get(`${BASE_URL}/employees/search`, {
          params: { query: teacherQuery },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setTeacherResults(response.data.data || []);
        }
      } catch {
        setTeacherResults([]);
      } finally {
        setTeacherLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [teacherQuery, token]);

  // Fetch subject classes for this gradelevel class
  React.useEffect(() => {
    if (!classId) return;
    setSubjectClassesLoading(true);
    setSubjectClassesError('');
    axios.get(`${BASE_URL}/classes/subject-classes`, {
      params: { gradelevel_class_id: classId },
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => {
        if (response.data.success) {
          setSubjectClasses(response.data.data || []);
        } else {
          setSubjectClassesError('Failed to load subject classes.');
        }
      })
      .catch(() => setSubjectClassesError('Failed to load subject classes.'))
      .finally(() => setSubjectClassesLoading(false));
  }, [classId, showAddModal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectInputChange = (e) => {
    setSubjectQuery(e.target.value);
    setSubjectDropdownOpen(true);
  };
  const handleSubjectSelect = (subject) => {
    setFormData((prev) => ({ ...prev, subject_id: subject.id }));
    setSubjectQuery(`${subject.name} (${subject.code})`);
    setSubjectDropdownOpen(false);
  };
  const handleTeacherInputChange = (e) => {
    setTeacherQuery(e.target.value);
    setTeacherDropdownOpen(true);
  };
  const handleTeacherSelect = (employee) => {
    setFormData((prev) => ({ ...prev, employee_number: employee.employee_id }));
    setTeacherQuery(`${employee.full_name} (${employee.employee_id})`);
    setTeacherDropdownOpen(false);
  };

  const validateForm = () => {
    if (!formData.subject_id) {
      setError('Subject is required');
      return false;
    }
    if (!formData.employee_number) {
      setError('Teacher is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    try {
      setLoading(true);
      const payload = {
        ...formData,
        gradelevel_class_id: classId,
        stream_id: streamId,
        capacity: formData.capacity ? Number(formData.capacity) : null
      };
      const response = await axios.post(`${BASE_URL}/classes/subject-classes`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setShowSuccessModal(true);
        setFormData({ subject_id: '', employee_number: '', capacity: '' });
        setSubjectQuery('');
        setTeacherQuery('');
        setShowAddModal(false);
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setErrorDetails({ message: err.response.data.message });
        setShowErrorModal(true);
      } else {
        setError('Failed to create subject class');
      }
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => setShowSuccessModal(false);
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorDetails({});
  };

  // Delete subject class
  const handleDeleteSubjectClass = async (subjectClass) => {
    setDeletingId(subjectClass.id);
    setDeleteError('');
    try {
      await axios.delete(`${BASE_URL}/classes/subject-classes/${subjectClass.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowDeleteModalId(null);
      // Refresh list
      setSubjectClasses((prev) => prev.filter((sc) => sc.id !== subjectClass.id));
    } catch (err) {
      setDeleteError('Failed to delete subject class.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm text-gray-700 flex items-center">
          <FontAwesomeIcon icon={faBook} className="mr-2 h-4 w-4 text-gray-400" />
          Subject Classes
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1 h-3 w-3" />
          Add Subject Class
        </button>
      </div>
      {/* List of Subject Classes */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-900 mb-2">Subject Classes</h3>
        {subjectClassesLoading ? (
          <div className="text-xs text-gray-500">Loading subject classes...</div>
        ) : subjectClassesError ? (
          <div className="text-xs text-red-600">{subjectClassesError}</div>
        ) : subjectClasses.length === 0 ? (
          <div className="text-xs text-gray-500">No subject classes found for this class.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Subject Name</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Code</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Teacher</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Capacity</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjectClasses.map((sc) => (
                  <tr key={sc.id}>
                    <td className="px-3 py-2 whitespace-nowrap">{sc.subject_name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{sc.subject_code}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{sc.employee_number || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{sc.capacity || 'Unlimited'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Link
                          to={`/dashboard/classes/subject-classes/view/${sc.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          View
                        </Link>
                        <button
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                          onClick={() => setShowDeleteModalId(sc.id)}
                        >
                          Delete
                        </button>
                        {/* Delete Confirmation Modal */}
                        {showDeleteModalId === sc.id && (
                          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-8 rounded shadow w-full max-w-md">
                              <div className="text-base text-gray-900 mb-4">Are you sure you want to delete this subject class?</div>
                              {deleteError && <div className="text-xs text-red-600 mb-2">{deleteError}</div>}
                              <div className="flex justify-end space-x-3">
                                <button
                                  onClick={() => setShowDeleteModalId(null)}
                                  className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDeleteSubjectClass(sc)}
                                  className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center"
                                  disabled={deletingId === sc.id}
                                >
                                  {deletingId === sc.id ? (
                                    <FontAwesomeIcon icon={faSpinner} spin className="h-4 w-4 mr-2" />
                                  ) : null}
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Add Subject Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow w-full max-w-2xl">
            <h3 className="text-base font-medium text-gray-900 mb-4">Add Subject Class</h3>
            {error && <div className="mb-2 bg-red-50 border border-red-200 p-2 text-xs text-red-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600">Subject <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="subject_search"
                    value={subjectQuery}
                    onChange={handleSubjectInputChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Type to search..."
                    autoComplete="off"
                    onFocus={() => setSubjectDropdownOpen(true)}
                  />
                  {subjectDropdownOpen && subjectQuery && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-48 overflow-y-auto">
                      {subjectLoading ? (
                        <div className="p-2 text-xs text-gray-500 flex items-center"><FontAwesomeIcon icon={faSpinner} spin className="mr-2" />Searching...</div>
                      ) : subjectResults.length === 0 ? (
                        <div className="p-2 text-xs text-gray-500">No subjects found.</div>
                      ) : (
                        subjectResults.map((subj) => (
                          <div
                            key={subj.id}
                            className="p-2 text-xs cursor-pointer hover:bg-blue-50"
                            onClick={() => handleSubjectSelect(subj)}
                          >
                            <span className="font-medium text-gray-900">{subj.name}</span> <span className="text-gray-500">({subj.code})</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600">Teacher <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="teacher_search"
                    value={teacherQuery}
                    onChange={handleTeacherInputChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Type to search..."
                    autoComplete="off"
                    onFocus={() => setTeacherDropdownOpen(true)}
                  />
                  {teacherDropdownOpen && teacherQuery && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-48 overflow-y-auto">
                      {teacherLoading ? (
                        <div className="p-2 text-xs text-gray-500 flex items-center"><FontAwesomeIcon icon={faSpinner} spin className="mr-2" />Searching...</div>
                      ) : teacherResults.length === 0 ? (
                        <div className="p-2 text-xs text-gray-500">No employees found.</div>
                      ) : (
                        teacherResults.map((emp) => (
                          <div
                            key={emp.employee_id}
                            className="p-2 text-xs cursor-pointer hover:bg-blue-50"
                            onClick={() => handleTeacherSelect(emp)}
                          >
                            <span className="font-medium text-gray-900">{emp.full_name}</span> <span className="text-gray-500">({emp.employee_id})</span>
                            {emp.job_title && <span className="ml-2 text-gray-400">{emp.job_title}</span>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 40"
                    min="1"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 text-xs font-medium text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-800'}`}
                >
                  {loading ? 'Creating...' : 'Create Subject Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 bg-green-100 mb-4">
                <FontAwesomeIcon icon={faCheck} className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Subject Class Created Successfully</h3>
              <p className="text-xs text-gray-500 mb-4">
                The subject class has been added to the system successfully.
              </p>
              <button
                onClick={closeSuccessModal}
                className="px-4 py-2 bg-gray-700 text-white text-xs hover:bg-gray-800"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 bg-red-100 mb-4">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Creating Subject Class</h3>
              <p className="text-xs text-gray-500 mb-4">
                {errorDetails.message}
              </p>
              <button
                onClick={closeErrorModal}
                className="px-4 py-2 bg-red-600 text-white text-xs hover:bg-red-700"
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

export default SubjectClassesTab;
