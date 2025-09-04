import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faUserGraduate,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const EditStudent = () => {
  const { id: regNumber } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    // Student Information
    regNumber: '',
    name: '',
    surname: '',
    dateOfBirth: '',
    nationalIDNumber: '',
    address: '',
    gender: '',
    active: 'Yes',
    
    // Guardian Information
    guardianName: '',
    guardianSurname: '',
    guardianNationalIDNumber: '',
    guardianPhoneNumber: '',
    relationshipToStudent: ''
  });

  useEffect(() => {
    fetchStudent();
  }, [regNumber]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching student for edit with regNumber:', regNumber);
      const response = await axios.get(`${BASE_URL}/students/${regNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      console.log('✏️ Student data for edit:', data.data);
      setStudent(data.data);
      
      // Populate form with existing data
      const studentData = data.data;
      const guardian = studentData.guardians?.[0]; // Get first guardian
      
      setFormData({
        regNumber: studentData.RegNumber || '',
        name: studentData.Name || '',
        surname: studentData.Surname || '',
        dateOfBirth: studentData.DateOfBirth ? studentData.DateOfBirth.split('T')[0] : '',
        nationalIDNumber: studentData.NationalIDNumber || '',
        address: studentData.Address || '',
        gender: studentData.Gender || '',
        active: studentData.Active || 'Yes',
        
        // Guardian Information (from guardians array)
        guardianName: guardian?.Name || '',
        guardianSurname: guardian?.Surname || '',
        guardianNationalIDNumber: guardian?.NationalIDNumber || '',
        guardianPhoneNumber: guardian?.PhoneNumber || '',
        relationshipToStudent: guardian?.RelationshipToStudent || ''
      });
    } catch (err) {
      console.error('Error fetching student for edit:', err);
      if (err.response) {
        if (err.response.status === 404) {
          setError('Student not found');
        } else {
          setError(`Error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
        }
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      console.log('💾 Saving student data:', formData);
      const response = await axios.put(`${BASE_URL}/students/${regNumber}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Student updated successfully:', response.data);
      // Show success modal
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error updating student:', err);
      if (err.response) {
        const errorData = err.response.data;
        setError(errorData?.error || `Failed to update student: ${err.response.status}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.regNumber &&
      formData.name &&
      formData.surname &&
      formData.dateOfBirth &&
      formData.gender &&
      formData.guardianName &&
      formData.guardianSurname &&
      formData.guardianPhoneNumber
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading student information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 p-4">
          <div className="text-sm text-red-600">{error}</div>

        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-gray-500">Student not found</div>

        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Edit Student</h1>
            <p className="text-xs text-gray-500">
              {student.Name} {student.Surname} - {student.RegNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Student Information */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 sm:px-6">
            <h3 className="text-sm leading-6 font-medium text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faUserGraduate} className="mr-2 text-blue-600" />
              Student Information
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <label htmlFor="regNumber" className="block text-xs font-medium text-gray-600">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="regNumber"
                    id="regNumber"
                    required
                    value={formData.regNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    placeholder="e.g., ST001"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-xs font-medium text-gray-600">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    placeholder="First name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="surname" className="block text-xs font-medium text-gray-600">
                    Surname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="surname"
                    id="surname"
                    required
                    value={formData.surname}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    placeholder="Surname"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="dateOfBirth" className="block text-xs font-medium text-gray-600">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    id="dateOfBirth"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="nationalIDNumber" className="block text-xs font-medium text-gray-600">
                    National ID Number
                  </label>
                  <input
                    type="text"
                    name="nationalIDNumber"
                    id="nationalIDNumber"
                    value={formData.nationalIDNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    placeholder="National ID"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="gender" className="block text-xs font-medium text-gray-600">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="address" className="block text-xs font-medium text-gray-600">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    placeholder="Full address"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="active" className="block text-xs font-medium text-gray-600">
                    Status
                  </label>
                  <select
                    name="active"
                    id="active"
                    value={formData.active}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                  >
                    <option value="Yes">Active</option>
                    <option value="No">Inactive</option>
                  </select>
                </div>


              </div>
            </div>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 sm:px-6">
            <h3 className="text-sm leading-6 font-medium text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faUserGraduate} className="mr-2 text-green-600" />
              Guardian Information
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="guardianName" className="block text-xs font-medium text-gray-600">
                    Guardian First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="guardianName"
                    id="guardianName"
                    required
                    value={formData.guardianName}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    placeholder="Guardian first name"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="guardianSurname" className="block text-xs font-medium text-gray-600">
                    Guardian Surname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="guardianSurname"
                    id="guardianSurname"
                    required
                    value={formData.guardianSurname}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    placeholder="Guardian surname"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="guardianNationalIDNumber" className="block text-xs font-medium text-gray-600">
                    Guardian National ID <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="guardianNationalIDNumber"
                    id="guardianNationalIDNumber"
                    value={formData.guardianNationalIDNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    placeholder="Guardian national ID"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="guardianPhoneNumber" className="block text-xs font-medium text-gray-600">
                    Guardian Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="guardianPhoneNumber"
                    id="guardianPhoneNumber"
                    required
                    value={formData.guardianPhoneNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    placeholder="Phone number"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="relationshipToStudent" className="block text-xs font-medium text-gray-600">
                    Relationship to Student
                  </label>
                  <input
                    type="text"
                    name="relationshipToStudent"
                    id="relationshipToStudent"
                    value={formData.relationshipToStudent}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-1.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    placeholder="e.g., Mother, Father, Guardian"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Link
            to={`/dashboard/students/view/${regNumber}`}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <FontAwesomeIcon icon={faTimes} className="mr-2" />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!isFormValid() || saving}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faSave} className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Student Information Successfully Updated!</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-xs text-gray-500">
                  The information for <strong>{student?.Name} {student?.Surname}</strong> has been successfully updated.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate(`/dashboard/students/view/${regNumber}`);
                  }}
                  className="px-4 py-2 bg-gray-700 text-white text-xs font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 w-full"
                >
                  View Student Details
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/dashboard/students');
                  }}
                  className="mt-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 w-full"
                >
                  Back to Students List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditStudent;
