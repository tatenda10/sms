import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSearch,
  faEye,
  faEdit,
  faTrash,
  faDollarSign,
  faList,
  faCalendarAlt,
  faGraduationCap,
  faTimes,
  faExclamationTriangle,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const InvoiceStructures = () => {
  const { token } = useAuth();
  const [invoiceStructures, setInvoiceStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalStructures: 0,
    limit: 25,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    gradelevel_class_id: '',
    term: '',
    academic_year: '',
    currency_id: '',
    invoice_items: [
      { item_name: '', amount: '' }
    ]
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Live search effect with debouncing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setActiveSearchTerm(searchTerm);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchClasses();
    fetchCurrencies();
    fetchInvoiceStructures();
  }, []);

  useEffect(() => {
    fetchInvoiceStructures();
  }, [pagination.currentPage, activeSearchTerm]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInvoiceStructures();
    }, 30000);
    return () => clearInterval(interval);
  }, [activeSearchTerm]); // Restart interval if search term changes

  const fetchInvoiceStructures = async () => {
    try {
      setTableLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit
      });

      if (activeSearchTerm) {
        params.append('search', activeSearchTerm.trim());
      }

      const response = await axios.get(`${BASE_URL}/fees/invoice-structures?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setInvoiceStructures(response.data.data || []);
        // Update pagination if available from response
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            totalPages: response.data.pagination.totalPages || 1,
            totalStructures: response.data.pagination.total || 0,
            hasNextPage: response.data.pagination.page < response.data.pagination.totalPages,
            hasPreviousPage: response.data.pagination.page > 1
          }));
        } else {
          // Fallback: calculate pagination from data length
          const total = response.data.data?.length || 0;
          setPagination(prev => ({
            ...prev,
            totalPages: Math.ceil(total / prev.limit) || 1,
            totalStructures: total,
            hasNextPage: pagination.currentPage < Math.ceil(total / prev.limit),
            hasPreviousPage: pagination.currentPage > 1
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching invoice structures:', error);
      setError('Failed to fetch invoice structures');
      setInvoiceStructures([]);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrencies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      invoice_items: [...prev.invoice_items, { item_name: '', amount: '' }]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      invoice_items: prev.invoice_items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      invoice_items: prev.invoice_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotal = () => {
    return formData.invoice_items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage('');

    // Filter out empty items
    const validItems = formData.invoice_items.filter(item => item.item_name && item.amount);

    if (validItems.length === 0) {
      setErrorMessage('Please add at least one invoice item');
      setIsProcessing(false);
      return;
    }

    const submitData = {
      ...formData,
      total_amount: calculateTotal(),
      invoice_items: validItems
    };

    try {
      if (selectedStructure) {
        await axios.put(`${BASE_URL}/fees/invoice-structures/${selectedStructure.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Invoice structure updated successfully');
      } else {
        await axios.post(`${BASE_URL}/fees/invoice-structures`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Invoice structure created successfully');
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchInvoiceStructures();
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving invoice structure:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to save invoice structure');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleView = (structure) => {
    setSelectedStructure(structure);
    setShowViewModal(true);
  };

  const handleEdit = (structure) => {
    setSelectedStructure(structure);
    setFormData({
      gradelevel_class_id: structure.gradelevel_class_id,
      term: structure.term,
      academic_year: structure.academic_year,
      currency_id: structure.currency_id,
      invoice_items: structure.invoice_items?.length > 0 ? structure.invoice_items : [
        { item_name: '', amount: '' }
      ]
    });
    setShowEditModal(true);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleDelete = async () => {
    if (!selectedStructure) return;

    setIsProcessing(true);
    try {
      await axios.delete(`${BASE_URL}/fees/invoice-structures/${selectedStructure.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Invoice structure deleted successfully');
      setShowDeleteModal(false);
      fetchInvoiceStructures();
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting invoice structure:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to delete invoice structure');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      gradelevel_class_id: '',
      term: '',
      academic_year: '',
      currency_id: '',
      invoice_items: [
        { item_name: '', amount: '' }
      ]
    });
    setSelectedStructure(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowDeleteModal(false);
    resetForm();
  };

  const formatCurrency = (amount, symbol) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount || 0)).replace('USD', symbol || '');
  };

  const displayStart = invoiceStructures.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0;
  const displayEnd = Math.min(pagination.currentPage * pagination.limit, pagination.totalStructures);

  if (loading && invoiceStructures.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading invoice structures...</div>
      </div>
    );
  }

  return (
    <div className="reports-container" style={{
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Invoice Structures</h2>
          <p className="report-subtitle">Manage tuition fee structures with itemized breakdowns.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenAddModal}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Invoice Structure
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0, borderTop: 'none' }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <div className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by class name, term, or year..."
                className="filter-input search-input"
                style={{ width: '300px' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    padding: '4px 6px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
                  }}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="report-content-container ecl-table-container" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: 0,
        height: '100%'
      }}>
        {tableLoading && invoiceStructures.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading invoice structures...
          </div>
        ) : (
          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: 'var(--sidebar-bg)'
            }}>
              <tr>
                <th style={{ padding: '6px 10px' }}>CLASS</th>
                <th style={{ padding: '6px 10px' }}>TERM</th>
                <th style={{ padding: '6px 10px' }}>ACADEMIC YEAR</th>
                <th style={{ padding: '6px 10px', textAlign: 'right' }}>TOTAL AMOUNT</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {invoiceStructures.map((structure, index) => (
                <tr
                  key={structure.id}
                  style={{
                    height: '32px',
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px', fontWeight: 600 }}>
                    {structure.class_name}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {structure.term}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {structure.academic_year}
                  </td>
                  <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 700 }}>
                    {structure.total_amount} {structure.currency_symbol}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleView(structure)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleEdit(structure)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStructure(structure);
                          setShowDeleteModal(true);
                        }}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, pagination.limit - invoiceStructures.length) }).map((_, index) => (
                <tr
                  key={`empty-${index}`}
                  style={{
                    height: '32px',
                    backgroundColor: (invoiceStructures.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {pagination.totalStructures || 0} results.
        </div>
        <div className="table-footer-right">
          {pagination.totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
              >
                Previous
              </button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedStructure ? 'Edit Invoice Structure' : 'Add Invoice Structure'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseModals}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              {/* Success/Error Messages */}
              {successMessage && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#065f46' }}>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    {successMessage}
                  </div>
                </div>
              )}

              {errorMessage && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#dc2626' }}>
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {errorMessage}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="modal-form">
                {/* Structure Details Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faList} style={{ color: '#2563eb' }} />
                    Structure Details
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Class <span className="required">*</span>
                      </label>
                      <select
                        value={formData.gradelevel_class_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, gradelevel_class_id: e.target.value }))}
                        className="form-control"
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Term <span className="required">*</span>
                      </label>
                      <select
                        value={formData.term}
                        onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
                        className="form-control"
                        required
                      >
                        <option value="">Select Term</option>
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Academic Year <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.academic_year}
                        onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                        placeholder="e.g., 2025"
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Currency <span className="required">*</span>
                      </label>
                      <select
                        value={formData.currency_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency_id: e.target.value }))}
                        className="form-control"
                        required
                      >
                        <option value="">Select Currency</option>
                        {currencies.map((currency) => (
                          <option key={currency.id} value={currency.id}>
                            {currency.name} ({currency.symbol})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Invoice Items Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
                      Invoice Items
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="modal-btn"
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: '0.75rem',
                        padding: '6px 12px',
                        border: '1px solid #bfdbfe'
                      }}
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.invoice_items.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                            placeholder="Item name (e.g., Tuition Fee)"
                            className="form-control"
                            required
                          />
                        </div>
                        <div style={{ width: '150px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                            placeholder="Amount"
                            className="form-control"
                            required
                          />
                        </div>

                        {formData.invoice_items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            style={{
                              color: '#ef4444',
                              padding: '8px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            title="Remove item"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Calculated Total */}
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Total Amount
                    </label>
                    <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={handleCloseModals}
                    className="modal-btn modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="modal-btn modal-btn-confirm"
                  >
                    {isProcessing ? 'Processing...' : (selectedStructure ? 'Update Structure' : 'Create Structure')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedStructure && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Invoice Structure Details</h3>
              <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label className="form-label" style={{ marginBottom: '4px' }}>Class</label>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {selectedStructure.class_name}
                    </p>
                  </div>
                  <div>
                    <label className="form-label" style={{ marginBottom: '4px' }}>Term</label>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {selectedStructure.term}
                    </p>
                  </div>
                  <div>
                    <label className="form-label" style={{ marginBottom: '4px' }}>Academic Year</label>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {selectedStructure.academic_year}
                    </p>
                  </div>
                  <div>
                    <label className="form-label" style={{ marginBottom: '4px' }}>Total Amount</label>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {selectedStructure.total_amount} {selectedStructure.currency_symbol}
                    </p>
                  </div>
                </div>
              </div>

              {selectedStructure.invoice_items && selectedStructure.invoice_items.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>Invoice Items</h4>
                  <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 10px' }}>ITEM</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStructure.invoice_items.map((item, index) => (
                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' }}>
                          <td style={{ padding: '8px 10px' }}>{item.item_name}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 500 }}>
                            {item.amount} {selectedStructure.currency_symbol}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowViewModal(false)} className="modal-btn modal-btn-cancel">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStructure && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Invoice Structure</h3>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              {errorMessage && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#dc2626' }}>
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {errorMessage}
                  </div>
                </div>
              )}
              <p style={{ fontSize: '0.875rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete the invoice structure for <strong>{selectedStructure.class_name}</strong> - {selectedStructure.term} {selectedStructure.academic_year}?
              </p>
              <p style={{ fontSize: '0.75rem', color: '#dc2626', marginBottom: '16px' }}>
                This action cannot be undone.
              </p>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => setShowDeleteModal(false)} className="modal-btn modal-btn-cancel">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={isProcessing} className="modal-btn modal-btn-delete">
                  {isProcessing ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceStructures;
