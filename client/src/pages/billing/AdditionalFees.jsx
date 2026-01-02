import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDollarSign,
  faPlus,
  faEdit,
  faTrash,
  faUsers,
  faBook,
  faFileAlt,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faEye,
  faCog,
  faSearch,
  faRefresh,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const AdditionalFees = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('structures');
  const [feeStructures, setFeeStructures] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [formData, setFormData] = useState({
    fee_name: '',
    description: '',
    amount: '',
    currency_id: '',
    fee_type: 'one_time',
    academic_year: selectedYear
  });

  // Load initial data
  useEffect(() => {
    loadFeeStructures();
    loadCurrencies();
  }, [selectedYear]);

  // Update form data when selected year changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      academic_year: selectedYear
    }));
  }, [selectedYear]);

  const loadFeeStructures = async () => {
    try {
      const response = await fetch(`${BASE_URL}/additional-fees/structures?academic_year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFeeStructures(data.data);
      }
    } catch (error) {
      console.error('Error loading fee structures:', error);
    }
  };


  const loadCurrencies = async () => {
    try {
      const response = await fetch(`${BASE_URL}/accounting/currencies`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCurrencies(data.data);
        // Set default currency to USD if available
        const usdCurrency = data.data.find(c => c.code === 'USD');
        if (usdCurrency) {
          setFormData(prev => ({ ...prev, currency_id: usdCurrency.id }));
        }
      }
    } catch (error) {
      console.error('Error loading currencies:', error);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleCreateStructure = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Creating fee structure with data:', formData);

      const response = await fetch(`${BASE_URL}/additional-fees/structures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        alert('Fee structure created successfully');
        setShowCreateModal(false);
        setFormData({
          fee_name: '',
          description: '',
          amount: '',
          currency_id: '',
          fee_type: 'one_time'
        });
        loadFeeStructures();
      } else {
        alert(data.message || 'Failed to create fee structure');
      }
    } catch (error) {
      console.error('Error creating fee structure:', error);
      alert('Error creating fee structure: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleBulkGenerateForStructure = (feeStructureId) => {
    const structure = feeStructures.find(s => s.id === feeStructureId);
    if (!structure) return;

    setSelectedStructure(structure);
    setShowBulkConfirmModal(true);
  };

  const confirmBulkGenerate = async () => {
    if (!selectedStructure) return;

    setLoading(true);
    setShowBulkConfirmModal(false);

    try {
      const bulkData = {
        fee_structure_id: selectedStructure.id,
        academic_year: selectedYear,
        due_date: ''
      };

      const response = await fetch(`${BASE_URL}/additional-fees/assignments/bulk-annual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bulkData)
      });

      const data = await response.json();
      if (data.success) {
        alert(`"${selectedStructure.fee_name}" generated for ${data.data.assignments_created} students`);
        loadFeeStructures(); // Refresh the list
      } else {
        alert(data.message || 'Failed to generate fee assignments');
      }
    } catch (error) {
      console.error('Error generating fee assignments:', error);
      alert('Error generating fee assignments');
    } finally {
      setLoading(false);
      setSelectedStructure(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-success" />;
      case 'pending':
        return <FontAwesomeIcon icon={faClock} className="text-warning" />;
      case 'overdue':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger" />;
      default:
        return <FontAwesomeIcon icon={faClock} className="text-secondary" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: 'bg-success',
      pending: 'bg-warning',
      partial: 'bg-info',
      overdue: 'bg-danger',
      waived: 'bg-secondary'
    };
    return badges[status] || 'bg-secondary';
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-2 md:py-6">
        <div className="w-full px-2 md:px-4 lg:px-8">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">Additional Fees Management</h1>
                <p className="text-xs md:text-sm text-gray-600">Manage textbook, registration, and report book fees</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-medium text-gray-700">Academic Year:</label>
                  <input
                    type="text"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    placeholder="e.g., 2025"
                    className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded w-20"
                  />
                </div>
                <button
                  onClick={() => {
                    loadFeeStructures();
                    loadCurrencies();
                  }}
                  className="bg-gray-600 text-white px-3 py-2 text-xs hover:bg-gray-700 flex items-center w-full sm:w-auto justify-center"
                >
                  <FontAwesomeIcon icon={faRefresh} className="mr-1" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 md:mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-2 md:space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('structures')}
                  className={`py-2 px-1 border-b-2 font-medium text-xs flex items-center space-x-1 whitespace-nowrap ${activeTab === 'structures'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <FontAwesomeIcon icon={faCog} className="text-xs" />
                  <span>Fee Structures</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:gap-6">

            {/* Fee Structures Tab */}
            {activeTab === 'structures' && (
              <div className="report-content-container ecl-table-container" style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflow: 'auto',
                minHeight: 0,
                padding: 0,
                height: '100%'
              }}>
                <div className="px-3 md:px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <h3 className="text-sm md:text-base font-medium text-gray-900">Fee Structures</h3>
                  <button
                    className="btn-checklist"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Fee Structure
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                    <thead style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      background: 'var(--sidebar-bg)'
                    }}>
                      <tr>
                        <th style={{ padding: '6px 10px' }}>Fee Name</th>
                        <th style={{ padding: '6px 10px' }} className="hidden sm:table-cell">Description</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '6px 10px' }} className="hidden md:table-cell">Type</th>
                        <th style={{ padding: '6px 10px' }} className="hidden lg:table-cell">Status</th>
                        <th style={{ padding: '6px 10px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeStructures.map((structure, index) => (
                        <tr
                          key={structure.id}
                          style={{
                            height: '32px',
                            backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                          }}
                        >
                          <td style={{ padding: '4px 10px' }}>
                            <div className="flex items-center">
                              <FontAwesomeIcon
                                icon={structure.fee_type === 'annual' ? faBook : faFileAlt}
                                className="mr-2 text-gray-400"
                              />
                              <div>
                                <div style={{ fontWeight: 500, color: '#111827' }}>{structure.fee_name}</div>
                                <div className="sm:hidden" style={{ color: '#6b7280' }}>{structure.description}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '4px 10px', color: '#111827' }} className="hidden sm:table-cell">{structure.description}</td>
                          <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 500, color: '#111827' }}>
                            ${(parseFloat(structure.amount) || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '4px 10px' }} className="hidden md:table-cell">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${structure.fee_type === 'annual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                              {structure.fee_type}
                            </span>
                          </td>
                          <td style={{ padding: '4px 10px' }} className="hidden lg:table-cell">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${structure.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {structure.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '4px 10px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
                              <button
                                style={{ color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                title="Edit"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                title="Delete"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                              {structure.fee_type === 'annual' && (
                                <button
                                  style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                  onClick={() => handleBulkGenerateForStructure(structure.id)}
                                  title="Generate for all students"
                                >
                                  <FontAwesomeIcon icon={faBook} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Create Fee Structure Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Fee Structure</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCreateStructure} className="modal-form">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Fee Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="fee_name"
                      value={formData.fee_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                    ></textarea>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Currency</label>
                      <select
                        className="form-control"
                        name="currency_id"
                        value={formData.currency_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Currency</option>
                        {currencies.map(currency => (
                          <option key={currency.id} value={currency.id}>
                            {currency.name} ({currency.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Fee Type</label>
                      <select
                        className="form-control"
                        name="fee_type"
                        value={formData.fee_type}
                        onChange={handleInputChange}
                      >
                        <option value="one_time">One Time</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Academic Year</label>
                      <input
                        type="text"
                        className="form-control"
                        name="academic_year"
                        value={formData.academic_year || selectedYear}
                        onChange={handleInputChange}
                        placeholder="e.g., 2025"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Form actions moved to modal-footer but kept inside form context if needed, but standard is outside. 
                    React form submission works with button type="submit" inside form. 
                    Structure requires button in modal-footer. */}
                <div className="modal-footer" style={{ marginTop: '20px' }}>
                  <button
                    type="button"
                    className="modal-btn modal-btn-cancel"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-btn modal-btn-confirm"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Structure'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Generate Confirmation Modal */}
      {showBulkConfirmModal && selectedStructure && (
        <div className="modal-overlay" onClick={() => {
          setShowBulkConfirmModal(false);
          setSelectedStructure(null);
        }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Bulk Generation</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowBulkConfirmModal(false);
                  setSelectedStructure(null);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-xl" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Generate "{selectedStructure.fee_name}" for All Students
                  </h4>
                  <div className="text-xs text-gray-600 space-y-2">
                    <p><strong>Fee Amount:</strong> ${(parseFloat(selectedStructure.amount) || 0).toFixed(2)}</p>
                    <p><strong>Fee Type:</strong> {selectedStructure.fee_type}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <label className="text-xs font-medium text-gray-700">Academic Year:</label>
                      <input
                        type="text"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        placeholder="e.g., 2025"
                        className="form-control"
                        style={{ width: '80px', display: 'inline-block', padding: '2px 6px' }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">
                      <strong>Warning:</strong> This will create fee assignments for <strong>ALL students</strong> in the system.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => {
                  setShowBulkConfirmModal(false);
                  setSelectedStructure(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-confirm"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                onClick={confirmBulkGenerate}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Yes, Generate for All Students'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default AdditionalFees;
