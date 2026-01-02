import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

const AddStudent = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatingRegNumber, setGeneratingRegNumber] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addedStudent, setAddedStudent] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearForm = () => {
    setFormData({
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
    setError(null);
  };

  const generateRegNumber = () => {
    // Generate format: R + 4 digits + 1 letter (e.g., R0000A)
    const digits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = letters[Math.floor(Math.random() * letters.length)];
    return `R${digits}${letter}`;
  };

  const checkRegNumberExists = async (regNumber) => {
    try {
      const response = await axios.get(`${BASE_URL}/students/${regNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.status === 200; // If we get a response, reg number exists
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return false; // Reg number doesn't exist, which is good
      }
      throw err; // Re-throw other errors
    }
  };

  const handleGenerateRegNumber = async () => {
    setGeneratingRegNumber(true);
    setError(null);
    
    try {
      let regNumber;
      let attempts = 0;
      const maxAttempts = 10;
      
      // Try to generate a unique reg number
      do {
        regNumber = generateRegNumber();
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new Error('Unable to generate unique registration number. Please try again.');
        }
        
      } while (await checkRegNumberExists(regNumber));
      
      // Set the generated reg number
      setFormData(prev => ({
        ...prev,
        regNumber: regNumber
      }));
      
    } catch (err) {
      console.error('Error generating registration number:', err);
      setError(`Error generating registration number: ${err.message}`);
    } finally {
      setGeneratingRegNumber(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${BASE_URL}/students`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      setAddedStudent(data.data);
      setShowSuccessModal(true);
      clearForm();
    } catch (err) {
      console.error('Error adding student:', err);
      
      let errorMessage = 'An unexpected error occurred';
      let errorType = 'general';
      let fieldName = '';
      
      if (err.response) {
        const errorData = err.response.data;
        const status = err.response.status;
        
        // Use server-provided error details if available
        if (errorData?.errorType && errorData?.error) {
          errorMessage = errorData.error;
          errorType = errorData.errorType;
          
          // Map server field names to display names
          if (errorData.field === 'regNumber') {
            fieldName = 'Registration Number';
          } else if (errorData.field === 'nationalIDNumber') {
            fieldName = 'National ID Number';
          } else if (errorData.field) {
            fieldName = errorData.field;
          }
        } else {
          // Fallback to previous error detection for backwards compatibility
          if (status === 500 && errorData?.error) {
            const errorMsg = errorData.error.toLowerCase();
            
            // Handle duplicate entry errors
            if (errorMsg.includes('duplicate entry') && errorMsg.includes('regnumber')) {
              errorMessage = 'A student with this registration number already exists. Please use a different registration number.';
              errorType = 'duplicate';
              fieldName = 'Registration Number';
            } else if (errorMsg.includes('duplicate entry') && errorMsg.includes('nationalidnumber')) {
              errorMessage = 'National ID number already exists. A student with this National ID is already registered.';
              errorType = 'duplicate';
              fieldName = 'National ID Number';
            } else if (errorMsg.includes('duplicate entry')) {
              errorMessage = 'This information already exists in the system. Please check your entries and try again.';
              errorType = 'duplicate';
              fieldName = 'Duplicate Data';
            } else {
              errorMessage = errorData.error || 'Database error occurred';
              errorType = 'database';
            }
          } else {
            errorMessage = errorData?.error || `Server Error (${status}): ${err.response.statusText}`;
            errorType = 'server';
          }
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection and try again.';
        errorType = 'network';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
        errorType = 'general';
      }
      
      setErrorDetails({
        message: errorMessage,
        type: errorType,
        field: fieldName,
        originalError: err.response?.data?.error || err.message
      });
      setShowErrorModal(true);
    } finally {
      setLoading(false);
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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 bg-green-100 rounded-full">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Student Added Successfully!</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-xs text-gray-500">
                  Student <strong>{addedStudent?.name} {addedStudent?.surname}</strong> has been successfully registered with registration number <strong>{addedStudent?.regNumber}</strong>.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white text-xs font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 w-full"
                >
                  Add Another Student
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/dashboard/students');
                  }}
                  className="mt-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 w-full"
                >
                  View All Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 bg-red-100 rounded-full">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                {errorDetails?.type === 'duplicate' ? 'Duplicate Information' : 
                 errorDetails?.type === 'network' ? 'Connection Error' :
                 errorDetails?.type === 'database' ? 'Database Error' :
                 'Error Adding Student'}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-xs text-gray-700 mb-3">
                  {errorDetails?.message}
                </p>
                {errorDetails?.field && (
                  <p className="text-xs text-red-600 font-medium">
                    Field: {errorDetails.field}
                  </p>
                )}
                {errorDetails?.type === 'duplicate' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Please check your information and try again.
                  </p>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    setErrorDetails(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-xs font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
                >
                  Close
                </button>
                {errorDetails?.type === 'duplicate' && errorDetails?.field === 'Registration Number' && (
                  <button
                    onClick={() => {
                      setShowErrorModal(false);
                      setErrorDetails(null);
                      handleGenerateRegNumber();
                    }}
                    className="mt-2 px-4 py-2 bg-gray-700 text-white text-xs font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 w-full"
                  >
                    Generate New Registration Number
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Add New Student</h1>
            <p className="mt-2 text-xs text-gray-700">
              Register a new student with guardian information
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Student Information */}
        <div className="bg-white overflow-hidden border border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
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
                  <div className="mt-1 flex">
                    <input
                      type="text"
                      name="regNumber"
                      id="regNumber"
                      required
                      value={formData.regNumber}
                      onChange={handleChange}
                      className="flex-1 border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                      placeholder="Enter manually or generate"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRegNumber}
                      disabled={generatingRegNumber}
                      className="ml-2 inline-flex items-center justify-center border border-transparent bg-gray-700 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingRegNumber ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
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
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
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
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
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
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
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
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
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
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
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
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                    placeholder="Full address"
                  />
                </div>




              </div>
            </div>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="bg-white overflow-hidden border border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
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
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
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
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                    placeholder="Guardian surname"
                  />
                </div>



                <div className="sm:col-span-2">
                  <label htmlFor="guardianNationalIDNumber" className="block text-xs font-medium text-gray-600">
                    Guardian National ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="guardianNationalIDNumber"
                    id="guardianNationalIDNumber"
                    value={formData.guardianNationalIDNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                    placeholder="Guardian national ID"
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
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                    placeholder="e.g., Father, Mother, Uncle, Aunt"
                  />
                </div>



                <div className="sm:col-span-3">
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
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Link
            to="/dashboard/students"
            className="inline-flex items-center justify-center border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
          >
            <FontAwesomeIcon icon={faTimes} className="mr-2" />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className="inline-flex items-center justify-center border border-transparent bg-gray-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faSave} className="mr-2" />
            {loading ? 'Saving...' : 'Save Student'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudent;
