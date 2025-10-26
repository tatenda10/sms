import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCheck, faExclamationTriangle, faUsers, faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const EditGradelevelClass = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState({});

  // Employee search state
  const [teacherQuery, setTeacherQuery] = useState('');
  const [teacherResults, setTeacherResults] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherError, setTeacherError] = useState('');
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    stream_id: '',
    name: '',
    homeroom_teacher_employee_number: '',
    capacity: ''
  });

  useEffect(() => {
    fetchStreams();
    fetchClassData();
  }, [id]);

  // Debounced employee search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (teacherQuery.trim().length >= 2) {
        searchEmployees(teacherQuery.trim());
      } else {
        setTeacherResults([]);
        setTeacherError('');
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [teacherQuery]);

  const fetchStreams = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/classes/streams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStreams(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching streams:', err);
    }
  };

  const fetchClassData = async () => {
    try {
      setInitialLoading(true);
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const classData = response.data.data;
        setFormData({
          stream_id: classData.stream_id || '',
          name: classData.name || '',
          homeroom_teacher_employee_number: classData.homeroom_teacher_employee_number || '',
          capacity: classData.capacity || ''
        });
        // Set teacher query for display
        if (classData.teacher_name) {
          setTeacherQuery(`${classData.teacher_name} (${classData.homeroom_teacher_employee_number})`);
        }
      } else {
        setError('Failed to load class information.');
      }
    } catch (err) {
      setError('Failed to load class information.');
    } finally {
      setInitialLoading(false);
    }
  };

  const searchEmployees = async (query) => {
    try {
      setTeacherLoading(true);
      setTeacherError('');
      const response = await axios.get(`${BASE_URL}/employees/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTeacherResults(response.data.data);
      } else {
        setTeacherError('Failed to search employees');
      }
    } catch (err) {
      setTeacherError('Failed to search employees');
    } finally {
      setTeacherLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTeacherInputChange = (e) => {
    setTeacherQuery(e.target.value);
    setTeacherDropdownOpen(true);
  };

  const handleTeacherSelect = (employee) => {
    setFormData(prev => ({
      ...prev,
      homeroom_teacher_employee_number: employee.employee_id
    }));
    setTeacherQuery(`${employee.full_name} (${employee.employee_id})`);
    setTeacherDropdownOpen(false);
  };

  const validateForm = () => {
    if (!formData.stream_id) {
      setError('Stream is required');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Class name is required');
      return false;
    }
    if (formData.capacity && isNaN(Number(formData.capacity))) {
      setError('Capacity must be a number');
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
        capacity: formData.capacity ? Number(formData.capacity) : null,
        homeroom_teacher_employee_number: formData.homeroom_teacher_employee_number || null
      };
      const response = await axios.put(`${BASE_URL}/classes/gradelevel-classes/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setShowSuccessModal(true);
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setErrorDetails({ message: err.response.data.message });
        setShowErrorModal(true);
      } else {
        setError('Failed to update class');
      }
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/dashboard/classes');
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorDetails({});
  };

  if (initialLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} spin className="h-8 w-8 text-gray-400 mb-4" />
            <div className="text-sm text-gray-500">Loading class information...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/dashboard/classes')}
            className="mr-3 p-2 text-gray-400 hover:text-gray-600"
            title="Back to Classes"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex items-center">
            <FontAwesomeIcon icon={faEdit} className="mr-2 h-5 w-5 text-gray-400" />
            Edit Gradelevel Class
          </h1>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Update the gradelevel class information.
        </p>
      </div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 p-3">
          <div className="text-xs text-red-600">{error}</div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Stream <span className="text-red-500">*</span>
              </label>
              <select
                name="stream_id"
                value={formData.stream_id}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Stream</option>
                {streams.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name} ({stream.stage})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Class Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 1A, 2B, Form 1"
                required
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600">
                Homeroom Teacher <span className="text-gray-400">(search by name or ID)</span>
              </label>
              <input
                type="text"
                name="homeroom_teacher_search"
                value={teacherQuery}
                onChange={handleTeacherInputChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type to search..."
                autoComplete="off"
                onFocus={() => setTeacherDropdownOpen(true)}
              />
              {/* Dropdown */}
              {teacherDropdownOpen && teacherQuery && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-48 overflow-y-auto">
                  {teacherLoading ? (
                    <div className="p-2 text-xs text-gray-500 flex items-center"><FontAwesomeIcon icon={faSpinner} spin className="mr-2" />Searching...</div>
                  ) : teacherError ? (
                    <div className="p-2 text-xs text-red-600">{teacherError}</div>
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
              <label className="block text-xs font-medium text-gray-600">
                Capacity
              </label>
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
        </div>
        <div className="flex justify-start space-x-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/classes')}
            className="px-6 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 text-xs font-medium text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-800'}`}
          >
            {loading ? 'Updating...' : 'Update Class'}
          </button>
        </div>
      </form>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 bg-green-100 mb-4">
                <FontAwesomeIcon icon={faCheck} className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Class Updated Successfully</h3>
              <p className="text-xs text-gray-500 mb-4">
                The gradelevel class has been updated successfully.
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Updating Class</h3>
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

export default EditGradelevelClass;
