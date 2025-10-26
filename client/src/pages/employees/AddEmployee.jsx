import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faIdCard,
  faMapMarkerAlt,
  faEnvelope,
  faPhone,
  faBuilding,
  faUserTie,
  faCalendarAlt,
  faUniversity,
  faCreditCard,
  faDollarSign,
  faPlus,
  faTrash,
  faStar,
  faCheck,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const AddEmployee = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState({});

  // Dropdown data
  const [departments, setDepartments] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    idNumber: '',
    address: '',
    email: '',
    phoneNumber: '',
    gender: '',
    departmentId: '',
    jobTitleId: '',
    hireDate: '',
    generateEmployeeId: true
  });

  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState([
    { bankName: '', accountNumber: '', currency: '', isPrimary: true }
  ]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      // Fetch departments and job titles
      const configResponse = await axios.get(`${BASE_URL}/configurations/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (configResponse.data.success) {
        setDepartments(configResponse.data.data.departments || []);
        setJobTitles(configResponse.data.data.jobTitles || []);
      }


    } catch (err) {
      console.error('Error fetching dropdown data:', err);
      setError('Failed to load form data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBankAccountChange = (index, field, value) => {
    setBankAccounts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // If setting as primary, remove primary from others
      if (field === 'isPrimary' && value) {
        updated.forEach((account, i) => {
          if (i !== index) {
            account.isPrimary = false;
          }
        });
      }
      
      return updated;
    });
  };

  const addBankAccount = () => {
    setBankAccounts(prev => [
      ...prev,
      { bankName: '', accountNumber: '', currency: '', isPrimary: false }
    ]);
  };

  const removeBankAccount = (index) => {
    if (bankAccounts.length > 1) {
      setBankAccounts(prev => {
        const updated = prev.filter((_, i) => i !== index);
        // If we removed the primary account, make the first one primary
        if (prev[index].isPrimary && updated.length > 0) {
          updated[0].isPrimary = true;
        }
        return updated;
      });
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.idNumber.trim()) {
      setError('ID number is required');
      return false;
    }
    
    // Validate bank accounts
    const validBankAccounts = bankAccounts.filter(account => 
      account.bankName.trim() && account.accountNumber.trim()
    );
    
    if (validBankAccounts.length === 0 && bankAccounts.some(account => 
      account.bankName.trim() || account.accountNumber.trim()
    )) {
      setError('Please complete bank account information or remove incomplete entries');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare data
      const employeeData = {
        ...formData,
        employeeId: formData.generateEmployeeId ? undefined : formData.employeeId,
        departmentId: formData.departmentId || null,
        jobTitleId: formData.jobTitleId || null,
        hireDate: formData.hireDate || null,
        bankAccounts: bankAccounts.filter(account => 
          account.bankName.trim() && account.accountNumber.trim()
        )
      };

      const response = await axios.post(`${BASE_URL}/employees`, employeeData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowSuccessModal(true);
        // Reset form
        setFormData({
          employeeId: '',
          fullName: '',
          idNumber: '',
          address: '',
          email: '',
          phoneNumber: '',
          departmentId: '',
          jobTitleId: '',
          hireDate: '',
          generateEmployeeId: true
        });
        setBankAccounts([
          { bankName: '', accountNumber: '', currency: '', isPrimary: true }
        ]);
      }
    } catch (err) {
      console.error('Error creating employee:', err);
      
      if (err.response?.data?.errorType && err.response?.data?.field) {
        setErrorDetails({
          type: err.response.data.errorType,
          field: err.response.data.field,
          message: err.response.data.error
        });
        setShowErrorModal(true);
      } else {
        setError(err.response?.data?.error || 'Failed to create employee');
      }
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorDetails({});
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">Add New Employee</h1>
        <p className="mt-1 text-xs text-gray-500">
          Create a new employee record with personal and banking information
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 p-3">
          <div className="text-xs text-red-600">{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
            <FontAwesomeIcon icon={faUser} className="mr-2 h-4 w-4 text-gray-400" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee ID Generation */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="generateEmployeeId"
                  name="generateEmployeeId"
                  checked={formData.generateEmployeeId}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
                />
                <label htmlFor="generateEmployeeId" className="ml-2 block text-xs text-gray-600">
                  Auto-generate Employee ID (V + 4 numbers + letter)
                </label>
              </div>
              
              {!formData.generateEmployeeId && (
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    placeholder="e.g., V1234A"
                  />
                </div>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter full name"
              />
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-xs font-medium text-gray-600">
                ID Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="idNumber"
                required
                value={formData.idNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter ID number"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter email address"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter phone number"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter home address"
              />
            </div>
          </div>
        </div>

        {/* Work Information Section */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
            <FontAwesomeIcon icon={faBuilding} className="mr-2 h-4 w-4 text-gray-400" />
            Work Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Department
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Job Title
              </label>
              <select
                name="jobTitleId"
                value={formData.jobTitleId}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">Select Job Title</option>
                {jobTitles.map((title) => (
                  <option key={title.id} value={title.id}>
                    {title.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Hire Date */}
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Hire Date (Optional)
              </label>
              <input
                type="date"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Bank Account Information Section */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faUniversity} className="mr-2 h-4 w-4 text-gray-400" />
              Bank Account Information
            </h2>
            <button
              type="button"
              onClick={addBankAccount}
              className="bg-gray-700 text-white px-3 py-1 text-xs hover:bg-gray-800 flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-1 h-3 w-3" />
              Add Account
            </button>
          </div>

          <div className="space-y-4">
            {bankAccounts.map((account, index) => (
              <div key={index} className="border border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-600">Account {index + 1}</span>
                    {account.isPrimary && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                        <FontAwesomeIcon icon={faStar} className="mr-1 h-3 w-3" />
                        Primary
                      </span>
                    )}
                  </div>
                  {bankAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBankAccount(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={account.bankName}
                      onChange={(e) => handleBankAccountChange(index, 'bankName', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Enter bank name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={account.accountNumber}
                      onChange={(e) => handleBankAccountChange(index, 'accountNumber', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Enter account number"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600">
                      Currency
                    </label>
                    <input
                      type="text"
                      value={account.currency}
                      onChange={(e) => handleBankAccountChange(index, 'currency', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      placeholder="e.g., USD, EUR, GBP"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`isPrimary_${index}`}
                      checked={account.isPrimary}
                      onChange={(e) => handleBankAccountChange(index, 'isPrimary', e.target.checked)}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
                    />
                    <label htmlFor={`isPrimary_${index}`} className="ml-2 block text-xs text-gray-600">
                      Set as primary account
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-start">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 text-xs font-medium text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-800'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Employee...
              </div>
            ) : (
              'Create Employee'
            )}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Employee Created Successfully</h3>
              <p className="text-xs text-gray-500 mb-4">
                The employee has been added to the system successfully.
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Creating Employee</h3>
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

export default AddEmployee;
