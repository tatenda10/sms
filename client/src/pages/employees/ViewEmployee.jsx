import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  faStar
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const ViewEmployee = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(`${BASE_URL}/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setEmployee(response.data.data);
      } else {
        setError('Employee not found');
      }
    } catch (err) {
      console.error('Error fetching employee:', err);
      setError('Failed to load employee information');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="text-xs text-gray-500">Loading employee information...</div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="text-xs text-red-600">{error || 'Employee not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{employee.full_name}</h1>
            <p className="mt-1 text-xs text-gray-500">
              Employee ID: {employee.employee_id} • {employee.department_name || 'No Department'} • {employee.job_title || 'No Job Title'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold ${
              employee.is_active 
                ? 'bg-gray-100 text-gray-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {employee.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {[
            { id: 'personal', label: 'Personal Information', icon: faUser },
            { id: 'banking', label: 'Banking', icon: faUniversity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-xs flex items-center ${
                activeTab === tab.id
                  ? 'border-gray-700 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="mr-2 h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faUser} className="mr-2 h-4 w-4 text-gray-400" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Full Name</label>
                  <div className="mt-1 text-sm text-gray-900">{employee.full_name}</div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600">Employee ID</label>
                  <div className="mt-1 text-sm text-gray-900">{employee.employee_id}</div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600">ID Number</label>
                  <div className="mt-1 text-sm text-gray-900 flex items-center">
                    <FontAwesomeIcon icon={faIdCard} className="mr-2 h-4 w-4 text-gray-400" />
                    {employee.id_number}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600">Gender</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      {employee.gender || 'Not specified'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600">Email Address</label>
                  <div className="mt-1 text-sm text-gray-900 flex items-center">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 h-4 w-4 text-gray-400" />
                    {employee.email || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600">Phone Number</label>
                  <div className="mt-1 text-sm text-gray-900 flex items-center">
                    <FontAwesomeIcon icon={faPhone} className="mr-2 h-4 w-4 text-gray-400" />
                    {employee.phone_number || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600">Hire Date</label>
                  <div className="mt-1 text-sm text-gray-900 flex items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 h-4 w-4 text-gray-400" />
                    {formatDate(employee.hire_date)}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600">Address</label>
                  <div className="mt-1 text-sm text-gray-900 flex items-start">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                    {employee.address || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faBuilding} className="mr-2 h-4 w-4 text-gray-400" />
                Work Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Department</label>
                  <div className="mt-1 text-sm text-gray-900 flex items-center">
                    <FontAwesomeIcon icon={faBuilding} className="mr-2 h-4 w-4 text-gray-400" />
                    {employee.department_name || 'Not assigned'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600">Job Title</label>
                  <div className="mt-1 text-sm text-gray-900 flex items-center">
                    <FontAwesomeIcon icon={faUserTie} className="mr-2 h-4 w-4 text-gray-400" />
                    {employee.job_title || 'Not assigned'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600">Employment Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold ${
                      employee.is_active 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600">Date Created</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {formatDate(employee.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banking Tab */}
        {activeTab === 'banking' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faUniversity} className="mr-2 h-4 w-4 text-gray-400" />
                Bank Accounts
              </h2>
              
              {employee.bankAccounts && employee.bankAccounts.length > 0 ? (
                <div className="space-y-4">
                  {employee.bankAccounts.map((account, index) => (
                    <div key={account.id} className="border border-gray-200 p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-xs font-medium text-gray-600">Account {index + 1}</span>
                          {account.is_primary && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                              <FontAwesomeIcon icon={faStar} className="mr-1 h-3 w-3" />
                              Primary
                            </span>
                          )}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold ${
                            account.is_active 
                              ? 'bg-gray-100 text-gray-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {account.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Bank Name</label>
                          <div className="mt-1 text-sm text-gray-900 flex items-center">
                            <FontAwesomeIcon icon={faUniversity} className="mr-2 h-4 w-4 text-gray-400" />
                            {account.bank_name}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600">Account Number</label>
                          <div className="mt-1 text-sm text-gray-900 flex items-center">
                            <FontAwesomeIcon icon={faCreditCard} className="mr-2 h-4 w-4 text-gray-400" />
                            {account.account_number}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600">Currency</label>
                          <div className="mt-1 text-sm text-gray-900 flex items-center">
                            <FontAwesomeIcon icon={faDollarSign} className="mr-2 h-4 w-4 text-gray-400" />
                            {account.currency}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        Added on {formatDate(account.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FontAwesomeIcon icon={faUniversity} className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-xs text-gray-500">No bank accounts found</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ViewEmployee;
