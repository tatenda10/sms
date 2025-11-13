import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faUserGraduate,
  faTshirt,
  faSearch,
  faCheckCircle,
  faClock,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const IssueUniform = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showItemResults, setShowItemResults] = useState(false);
  const [showStudentResults, setShowStudentResults] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [issueForm, setIssueForm] = useState({
    itemId: '',
    studentId: '',
    quantity: 1,
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    amount: '',
    currency_id: '',
    reference: '',
    notes: '',
    issueDate: new Date().toISOString().split('T')[0]
  });

  // Load inventory items and students on component mount
  useEffect(() => {
    if (token) {
      loadInventoryItems();
      loadStudents();
      loadCurrencies();
    }
  }, [token]);

  const loadInventoryItems = async () => {
    try {
      setLoadingItems(true);
      const response = await axios.get(`${BASE_URL}/inventory/items?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setInventoryItems(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error loading inventory items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const loadStudents = async () => {
    // We don't need to load all students upfront, we'll search on demand
    setStudents([]);
  };

  const loadCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const currencyList = response.data.data || [];
      setCurrencies(currencyList);
      
      // Set default currency to base currency
      const baseCurrency = currencyList.find(c => c.base_currency);
      if (baseCurrency) {
        setIssueForm(prev => ({ ...prev, currency_id: baseCurrency.id }));
      }
    } catch (err) {
      console.error('Error loading currencies:', err);
      setError('Failed to load currencies. Please refresh the page.');
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'mobile_money', label: 'Mobile Money' }
  ];

  useEffect(() => {
    // Check if item is pre-selected from URL
    const itemId = searchParams.get('item');
    if (itemId && inventoryItems.length > 0) {
      const item = inventoryItems.find(i => i.id === parseInt(itemId));
      if (item) {
        setSelectedItem(item);
        setIssueForm(prev => ({
          ...prev,
          itemId: item.id.toString(),
          amount: item.unit_price.toString()
        }));
      }
    }
  }, [searchParams, inventoryItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setIssueForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate amount when quantity changes
    if (name === 'quantity' && selectedItem) {
      const newAmount = (parseFloat(value) * selectedItem.unit_price).toFixed(2);
      setIssueForm(prev => ({
        ...prev,
        amount: newAmount
      }));
    }
  };

  const handleItemSearch = (e) => {
    const searchValue = e.target.value;
    setItemSearchTerm(searchValue);
    setShowItemResults(searchValue.length > 0);
  };

  const searchItems = () => {
    setShowItemResults(itemSearchTerm.length > 0);
  };

  const handleStudentSearch = (e) => {
    const searchValue = e.target.value;
    setStudentSearchTerm(searchValue);
    setShowStudentResults(searchValue.length > 0);
  };

  const searchStudents = async () => {
    if (!studentSearchTerm.trim()) {
      setStudents([]);
      setShowStudentResults(false);
      return;
    }

    setLoadingStudents(true);
    try {
      console.log('🔍 Searching students with term:', studentSearchTerm);
      
      // First try to get exact match by registration number
      try {
        const exactResponse = await axios.get(`${BASE_URL}/students/${studentSearchTerm.trim()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (exactResponse.data.success && exactResponse.data.data) {
          console.log('📊 Exact student match found:', exactResponse.data.data);
          setStudents([exactResponse.data.data]);
          setShowStudentResults(true);
          setLoadingStudents(false);
          return;
        }
      } catch (exactError) {
        console.log('🔍 No exact match found, trying search...');
      }
      
      // If no exact match, try the search API
      const response = await axios.get(`${BASE_URL}/students/search?query=${studentSearchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📊 Students search response:', response.data);
      setStudents(response.data.data || []);
      setShowStudentResults(true);
    } catch (error) {
      console.error('❌ Error searching students:', error);
      setStudents([]);
      setShowStudentResults(false);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowItemResults(false);
        setShowStudentResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setIssueForm(prev => ({
      ...prev,
      itemId: item.id.toString(),
      amount: item.unit_price.toString()
    }));
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setIssueForm(prev => ({
      ...prev,
      studentId: student.RegNumber
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!issueForm.itemId || !issueForm.studentId || !issueForm.quantity) {
        setError('Please fill in all required fields');
        return;
      }

      if (parseInt(issueForm.quantity) <= 0) {
        setError('Quantity must be greater than 0');
        return;
      }

      if (parseInt(issueForm.quantity) > selectedItem.current_stock) {
        setError(`Cannot issue more than available stock (${selectedItem.current_stock})`);
        return;
      }

      // Prepare data for API
      const issueData = {
        item_id: parseInt(issueForm.itemId),
        student_reg_number: selectedStudent.RegNumber,
        quantity: parseInt(issueForm.quantity),
        amount: parseFloat(issueForm.amount),
        currency_id: issueForm.currency_id,
        payment_status: issueForm.paymentStatus,
        payment_method: issueForm.paymentMethod,
        reference: issueForm.reference || null,
        notes: issueForm.notes || null,
        issue_date: issueForm.issueDate
      };

      console.log('🎓 Submitting issue data:', issueData);

      // Call the API to create the issue
      const response = await axios.post(`${BASE_URL}/inventory/issues`, issueData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Issue created successfully:', response.data);
      setSuccess('Uniform issued successfully!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        const baseCurrency = currencies.find(c => c.base_currency);
        setIssueForm({
          itemId: '',
          studentId: '',
          quantity: 1,
          paymentStatus: 'pending',
          paymentMethod: 'cash',
          amount: '',
          currency_id: baseCurrency?.id || '',
          reference: '',
          notes: '',
          issueDate: new Date().toISOString().split('T')[0]
        });
        setSelectedItem(null);
        setSelectedStudent(null);
        setSuccess(null);
        navigate('/dashboard/inventory');
      }, 2000);
      
    } catch (err) {
      console.error('❌ Error issuing uniform:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to issue uniforms.');
      } else {
        setError('Failed to issue uniform. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStockStatus = (currentStock) => {
    if (currentStock === 0) return 'Out of Stock';
    if (currentStock <= 5) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Stock':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
            In Stock
          </span>
        );
      case 'Low Stock':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
            <FontAwesomeIcon icon={faClock} className="mr-1" />
            Low Stock
          </span>
        );
      case 'Out of Stock':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
            <FontAwesomeIcon icon={faTimes} className="mr-1" />
            Out of Stock
          </span>
        );
      default:
        return null;
    }
  };

  const filteredItems = inventoryItems.filter(item => {
    const name = (item.name || '').toLowerCase();
    const reference = (item.reference || '').toLowerCase();
    const searchLower = itemSearchTerm.toLowerCase();
    
    return name.includes(searchLower) || reference.includes(searchLower);
  });

  // No need to filter students since we're using the search API
  const filteredStudents = students;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Issue Uniform to Student</h1>
              <p className="text-xs text-gray-600">Select uniform, student, and record payment</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="w-full">
                     <form onSubmit={handleSubmit} className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Uniform Issue Details</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Item Selection */}
              <div className="search-container">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Search Uniform *
                </label>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <FontAwesomeIcon 
                      icon={faSearch} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    />
                    <input
                      type="text"
                      placeholder={loadingItems ? "Loading items..." : "Search uniforms by name or reference..."}
                      value={itemSearchTerm}
                      onChange={handleItemSearch}
                      disabled={loadingItems}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={searchItems}
                    disabled={loadingItems || !itemSearchTerm.trim()}
                    className="px-4 py-2 bg-gray-900 text-white text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Search
                  </button>
                </div>

                {/* Item Search Results */}
                {showItemResults && (
                  <div className="mb-3 max-h-48 overflow-y-auto border border-gray-200 bg-white">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            handleItemSelect(item);
                            setShowItemResults(false);
                            setItemSearchTerm('');
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2">
                              <FontAwesomeIcon icon={faTshirt} className="text-blue-600 text-xs" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-900">{item.name || 'N/A'}</p>
                              <p className="text-xs text-gray-500">Ref: {item.reference || 'N/A'}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-gray-600">Stock: {item.current_stock || 0}</span>
                                {getStatusBadge(getStockStatus(item.current_stock || 0))}
                              </div>
                              <p className="text-xs font-medium text-green-600 mt-1">
                                {formatCurrency(item.unit_price || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 text-xs">
                        No items found matching "{itemSearchTerm}"
                      </div>
                    )}
                  </div>
                )}
                
                {selectedItem && (
                  <div className="bg-blue-50 border border-blue-200 p-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2">
                        <FontAwesomeIcon icon={faTshirt} className="text-blue-600 text-xs" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">{selectedItem.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">Ref: {selectedItem.reference || 'N/A'}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-600">Stock: {selectedItem.current_stock || 0}</span>
                          {getStatusBadge(getStockStatus(selectedItem.current_stock || 0))}
                        </div>
                        <p className="text-xs font-medium text-green-600 mt-1">
                          {formatCurrency(selectedItem.unit_price || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Student Selection */}
              <div className="search-container">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Search Student *
                </label>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <FontAwesomeIcon 
                      icon={faUserGraduate} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    />
                    <input
                      type="text"
                      placeholder={loadingStudents ? "Loading students..." : "Search by name or registration number..."}
                      value={studentSearchTerm}
                      onChange={handleStudentSearch}
                      disabled={loadingStudents}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={searchStudents}
                    disabled={loadingStudents || !studentSearchTerm.trim()}
                    className="px-4 py-2 bg-gray-900 text-white text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Search
                  </button>
                </div>

                {/* Student Search Results */}
                {showStudentResults && (
                  <div className="mb-3 max-h-48 overflow-y-auto border border-gray-200 bg-white">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <div
                          key={student.RegNumber}
                          onClick={() => {
                            handleStudentSelect(student);
                            setShowStudentResults(false);
                            setStudentSearchTerm('');
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-100 p-2">
                              <FontAwesomeIcon icon={faUserGraduate} className="text-green-600 text-xs" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-900">
                                {student.Name || ''} {student.Surname || ''}
                              </p>
                              <p className="text-xs text-gray-500">ID: {student.RegNumber || 'N/A'}</p>
                              <p className="text-xs text-gray-600">
                                {student.Class || 'No class'} • {student.Gender || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 text-xs">
                        No students found matching "{studentSearchTerm}"
                      </div>
                    )}
                  </div>
                )}
                
                {selectedStudent && (
                  <div className="bg-green-50 border border-green-200 p-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2">
                        <FontAwesomeIcon icon={faUserGraduate} className="text-green-600 text-xs" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">
                          {selectedStudent.Name || ''} {selectedStudent.Surname || ''}
                        </p>
                        <p className="text-xs text-gray-500">ID: {selectedStudent.RegNumber || 'N/A'}</p>
                        <p className="text-xs text-gray-600">
                          {selectedStudent.Class || 'No class'} • {selectedStudent.Gender || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Issue Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={issueForm.quantity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max={selectedItem?.current_stock || 1}
                    className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                  {selectedItem && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {selectedItem.current_stock}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    name="issueDate"
                    value={issueForm.issueDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-t pt-6">
                <h4 className="text-xs font-medium text-gray-900 mb-4">Payment Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Amount *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={issueForm.amount}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Currency *
                    </label>
                    <select
                      name="currency_id"
                      value={issueForm.currency_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="">Select Currency</option>
                      {currencies.map((currency) => (
                        <option key={currency.id} value={currency.id}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      name="paymentMethod"
                      value={issueForm.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    >
                      {paymentMethods.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Payment Status
                    </label>
                    <select
                      name="paymentStatus"
                      value={issueForm.paymentStatus}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial Payment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      name="reference"
                      value={issueForm.reference}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Enter reference number (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={issueForm.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Additional notes about the issue..."
                />
              </div>

              {/* Summary */}
              {selectedItem && selectedStudent && (
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h4 className="text-xs font-medium text-gray-900 mb-3">Issue Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">Student:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedStudent.Name || ''} {selectedStudent.Surname || ''} ({selectedStudent.RegNumber || 'N/A'})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Uniform:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedItem.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatCurrency((parseFloat(issueForm.quantity) || 0) * (parseFloat(issueForm.amount) || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/inventory')}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedItem || !selectedStudent}
                className="px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-b-2 border-white mr-2"></div>
                    Issuing...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUserGraduate} className="mr-2" />
                    Issue Uniform
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 shadow-lg z-50 text-xs">
            {success}
          </div>
        )}
        
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 shadow-lg z-50 text-xs">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueUniform;
