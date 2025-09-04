import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUser, 
  faMoneyBillWave, 
  faPlus, 
  faMinus,
  faSave,
  faTimes,
  faExclamationTriangle,
  faCheckCircle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const ManualBalanceUpdate = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [formData, setFormData] = useState({
    adjustment_type: 'debit', // debit or credit
    amount: '',
    description: '',
    reference: ''
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a registration number to search');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/students/search?query=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data.data || []);
      setError(null);
    } catch (error) {
      console.error('Error searching students:', error);
      setError('Failed to search for student');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = async (student) => {
    try {
      setLoading(true);
      setError(null);
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Get current balance
      const balanceResponse = await axios.get(
        `${BASE_URL}/students/${student.RegNumber}/balance`,
        { headers: authHeaders }
      );
      
      setSelectedStudent(student);
      setCurrentBalance(balanceResponse.data.balance || 0);
      setFormData({
        adjustment_type: 'debit',
        amount: '',
        description: '',
        reference: ''
      });
      setSearchResults([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Error getting student balance:', error);
      setError(error.response?.data?.error || 'Failed to load student balance');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateReference = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({
      ...prev,
      reference: `MBU-${timestamp}-${random}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      setError('Please select a student first');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please enter a description for this adjustment');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      
      const adjustmentData = {
        student_id: selectedStudent.RegNumber,
        adjustment_type: formData.adjustment_type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        reference: formData.reference || `MBU-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };
      
      await axios.post(`${BASE_URL}/students/manual-balance-adjustment`, adjustmentData, { headers: authHeaders });
      
      setSuccess('Balance adjustment recorded successfully!');
      
      // Small delay to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh student balance
      console.log('🔄 Refreshing balance for student:', selectedStudent.RegNumber);
      const balanceResponse = await axios.get(
        `${BASE_URL}/students/${selectedStudent.RegNumber}/balance`,
        { headers: authHeaders }
      );
      console.log('🔄 Balance response:', balanceResponse.data);
      setCurrentBalance(balanceResponse.data.balance || 0);
      
      // Reset form
      setFormData({
        adjustment_type: 'debit',
        amount: '',
        description: '',
        reference: ''
      });
      
    } catch (error) {
      console.error('Error updating balance:', error);
      setError(error.response?.data?.error || 'Failed to update student balance');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedStudent(null);
    setCurrentBalance(0);
    setFormData({
      adjustment_type: 'debit',
      amount: '',
      description: '',
      reference: ''
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Manual Balance Update</h1>
              <p className="text-xs text-gray-600">Manually adjust student account balances</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Student Search */}
          <div className="bg-white border border-gray-200 shadow">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Search Student</h3>
            </div>
            
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter registration number"
                  className="flex-1 px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-xs font-medium flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  ) : (
                    <FontAwesomeIcon icon={faSearch} className="mr-2" />
                  )}
                  Search
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-700">Search Results:</h4>
                  {searchResults.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => selectStudent(student)}
                      className="p-3 border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{student.Name} {student.Surname}</p>
                          <p className="text-gray-600">Reg: {student.RegNumber}</p>
                        </div>
                        <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Student */}
              {selectedStudent && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900 text-xs">
                        {selectedStudent.Name} {selectedStudent.Surname}
                      </p>
                      <p className="text-blue-700 text-xs">Reg: {selectedStudent.RegNumber}</p>
                      <p className="text-blue-700 text-xs">
                        Current Balance: 
                        <span className={`font-bold ml-1 ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${Math.abs(currentBalance).toFixed(2)} {currentBalance >= 0 ? 'Credit' : 'Debit'}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={clearSelection}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Balance Adjustment Form */}
          <div className="bg-white border border-gray-200 shadow">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Balance Adjustment</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4">
              {/* Success/Error Messages */}
              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 text-xs">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  {success}
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-xs">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                  {error}
                </div>
              )}

              {!selectedStudent && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-200 text-yellow-700 text-xs">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                  Please search and select a student first
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Adjustment Type *
                  </label>
                  <select
                    name="adjustment_type"
                    value={formData.adjustment_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="debit">Debit (Increase what student owes)</option>
                    <option value="credit">Credit (Decrease what student owes)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder="Enter reason for this adjustment"
                    className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reference
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="reference"
                      value={formData.reference}
                      onChange={handleInputChange}
                      placeholder="Auto-generated if left empty"
                      className="flex-1 px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                    <button
                      type="button"
                      onClick={generateReference}
                      className="px-3 py-2 bg-gray-600 text-white hover:bg-gray-700 text-xs font-medium"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={clearSelection}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 text-xs font-medium border border-gray-300"
                >
                  Clear
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !selectedStudent}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  ) : (
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                  )}
                  {loading ? 'Processing...' : 'Record Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualBalanceUpdate;
