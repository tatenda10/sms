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

const IssueUniform = ({ onClose, onUniformIssued }) => {
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
  };

  const handleStudentSearch = (e) => {
    const searchValue = e.target.value;
    setStudentSearchTerm(searchValue);
  };

  // Auto-search items with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (itemSearchTerm.trim().length >= 1) {
        setShowItemResults(true);
      } else {
        setShowItemResults(false);
      }
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [itemSearchTerm]);

  // Auto-search students with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (studentSearchTerm.trim().length >= 2) {
        performStudentSearch(studentSearchTerm);
      } else {
        setStudents([]);
        setShowStudentResults(false);
      }
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentSearchTerm]);

  const performStudentSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setStudents([]);
      setShowStudentResults(false);
      return;
    }

    setLoadingStudents(true);
    try {
      console.log('🔍 Searching students with term:', searchTerm);

      // First try to get exact match by registration number
      try {
        const exactResponse = await axios.get(`${BASE_URL}/students/${searchTerm.trim()}`, {
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
      const response = await axios.get(`${BASE_URL}/students/search?query=${searchTerm}`, {
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

      // Refresh inventory list if callback provided
      if (onUniformIssued) {
        onUniformIssued();
      }

      // Reset form and close modal after 2 seconds
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
        if (onClose) {
          onClose();
        }
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
    <div>
      {error && (
        <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="modal-form">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Item Selection */}
        <div className="form-group search-container">
          <label className="form-label">
            Search Uniform <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ position: 'relative' }}>
              <FontAwesomeIcon
                icon={faSearch}
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#9ca3af',
                  fontSize: '0.75rem'
                }}
              />
              <input
                type="text"
                placeholder={loadingItems ? "Loading items..." : "Search uniforms by name or reference..."}
                value={itemSearchTerm}
                onChange={handleItemSearch}
                disabled={loadingItems}
                className="form-control"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* Item Search Results */}
          {showItemResults && (
            <div style={{
              marginBottom: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #e5e7eb',
              background: '#fff',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      handleItemSelect(item);
                      setShowItemResults(false);
                      setItemSearchTerm('');
                    }}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: '#dbeafe', padding: '8px', borderRadius: '4px' }}>
                        <FontAwesomeIcon icon={faTshirt} style={{ color: '#2563eb', fontSize: '0.75rem' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#111827', margin: 0 }}>
                          {item.name || 'N/A'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0' }}>
                          Ref: {item.reference || 'N/A'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                            Stock: {item.current_stock || 0}
                          </span>
                          {getStatusBadge(getStockStatus(item.current_stock || 0))}
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#059669', marginTop: '4px', margin: '4px 0 0 0' }}>
                          {formatCurrency(item.unit_price || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '0.75rem' }}>
                  No items found matching "{itemSearchTerm}"
                </div>
              )}
            </div>
          )}

          {selectedItem && (
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#dbeafe', padding: '8px', borderRadius: '4px' }}>
                  <FontAwesomeIcon icon={faTshirt} style={{ color: '#2563eb', fontSize: '0.75rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#111827', margin: 0 }}>
                    {selectedItem.name || 'N/A'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0' }}>
                    Ref: {selectedItem.reference || 'N/A'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                      Stock: {selectedItem.current_stock || 0}
                    </span>
                    {getStatusBadge(getStockStatus(selectedItem.current_stock || 0))}
                  </div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#059669', marginTop: '4px', margin: '4px 0 0 0' }}>
                    {formatCurrency(selectedItem.unit_price || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Student Selection */}
        <div className="form-group search-container">
          <label className="form-label">
            Search Student <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ position: 'relative' }}>
              <FontAwesomeIcon
                icon={faUserGraduate}
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#9ca3af',
                  fontSize: '0.75rem'
                }}
              />
              <input
                type="text"
                placeholder={loadingStudents ? "Loading students..." : "Search by name or registration number (type at least 2 characters)..."}
                value={studentSearchTerm}
                onChange={handleStudentSearch}
                disabled={loadingStudents}
                className="form-control"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* Student Search Results */}
          {showStudentResults && (
            <div style={{
              marginBottom: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #e5e7eb',
              background: '#fff',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div
                    key={student.RegNumber}
                    onClick={() => {
                      handleStudentSelect(student);
                      setShowStudentResults(false);
                      setStudentSearchTerm('');
                    }}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: '#d1fae5', padding: '8px', borderRadius: '4px' }}>
                        <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#059669', fontSize: '0.75rem' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#111827', margin: 0 }}>
                          {student.Name || ''} {student.Surname || ''}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0' }}>
                          ID: {student.RegNumber || 'N/A'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: '2px 0 0 0' }}>
                          {student.Class || 'No class'} • {student.Gender || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '0.75rem' }}>
                  No students found matching "{studentSearchTerm}"
                </div>
              )}
            </div>
          )}

          {selectedStudent && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#d1fae5', padding: '8px', borderRadius: '4px' }}>
                  <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#059669', fontSize: '0.75rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#111827', margin: 0 }}>
                    {selectedStudent.Name || ''} {selectedStudent.Surname || ''}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0' }}>
                    ID: {selectedStudent.RegNumber || 'N/A'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: '2px 0 0 0' }}>
                    {selectedStudent.Class || 'No class'} • {selectedStudent.Gender || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Issue Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">
              Quantity <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={issueForm.quantity}
              onChange={handleInputChange}
              required
              min="1"
              max={selectedItem?.current_stock || 1}
              className="form-control"
            />
            {selectedItem && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', margin: '4px 0 0 0' }}>
                Available: {selectedItem.current_stock}
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Issue Date</label>
            <input
              type="date"
              name="issueDate"
              value={issueForm.issueDate}
              onChange={handleInputChange}
              className="form-control"
            />
          </div>
        </div>

        {/* Payment Information */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: '16px' }}>
            Payment Details
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Amount <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={issueForm.amount}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="form-control"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Currency <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                name="currency_id"
                value={issueForm.currency_id}
                onChange={handleInputChange}
                required
                className="form-control"
              >
                <option value="">Select Currency</option>
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                name="paymentMethod"
                value={issueForm.paymentMethod}
                onChange={handleInputChange}
                className="form-control"
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Status</label>
              <select
                name="paymentStatus"
                value={issueForm.paymentStatus}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial Payment</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Reference Number</label>
              <input
                type="text"
                name="reference"
                value={issueForm.reference}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter reference number (optional)"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            name="notes"
            value={issueForm.notes}
            onChange={handleInputChange}
            rows="3"
            className="form-control"
            placeholder="Additional notes about the issue..."
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Summary */}
        {selectedItem && selectedStudent && (
          <div style={{
            background: '#f9fafb',
            padding: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px'
          }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: '12px' }}>
              Issue Summary
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '0.75rem' }}>
              <div>
                <span style={{ color: '#4b5563' }}>Student:</span>
                <span style={{ marginLeft: '8px', fontWeight: 500, color: '#111827', display: 'block', marginTop: '2px' }}>
                  {selectedStudent.Name || ''} {selectedStudent.Surname || ''} ({selectedStudent.RegNumber || 'N/A'})
                </span>
              </div>
              <div>
                <span style={{ color: '#4b5563' }}>Uniform:</span>
                <span style={{ marginLeft: '8px', fontWeight: 500, color: '#111827', display: 'block', marginTop: '2px' }}>
                  {selectedItem.name || 'N/A'}
                </span>
              </div>
              <div>
                <span style={{ color: '#4b5563' }}>Total Amount:</span>
                <span style={{ marginLeft: '8px', fontWeight: 500, color: '#111827', display: 'block', marginTop: '2px' }}>
                  {formatCurrency((parseFloat(issueForm.quantity) || 0) * (parseFloat(issueForm.amount) || 0))}
                </span>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Form Actions */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
          <button
            type="button"
            onClick={onClose}
            className="modal-btn modal-btn-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedItem || !selectedStudent}
            className="modal-btn modal-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                Issuing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUserGraduate} style={{ fontSize: '0.7rem' }} />
                Issue Uniform
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Message */}
      {success && (
        <div style={{ 
          padding: '10px', 
          background: '#d1fae5', 
          color: '#065f46', 
          fontSize: '0.75rem', 
          marginTop: '16px',
          borderRadius: '4px'
        }}>
          {success}
        </div>
      )}
    </div>
  );
};

export default IssueUniform;
