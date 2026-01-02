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
  faGraduationCap
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';

const InvoiceStructures = () => {
  const { token } = useAuth();
  const [invoiceStructures, setInvoiceStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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

  // Success/Error modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (isSearching) {
      fetchInvoiceStructures();
    }
  }, [isSearching, activeSearchTerm]);

  const fetchInvoiceStructures = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/fees/invoice-structures?${activeSearchTerm ? `search=${activeSearchTerm}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoiceStructures(response.data.data || []);
    } catch (error) {
      console.error('Error fetching invoice structures:', error);
      setError('Failed to fetch invoice structures');
    } finally {
      setLoading(false);
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

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setIsSearching(true);
  };

  const handleFilterSearch = () => {
    setActiveSearchTerm('');
    setIsSearching(true);
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

    // Filter out empty items
    const validItems = formData.invoice_items.filter(item => item.item_name && item.amount);

    const submitData = {
      ...formData,
      total_amount: calculateTotal(),
      invoice_items: validItems
    };

    try {
      if (selectedStructure) {
        // Update
        await axios.put(`${BASE_URL}/fees/invoice-structures/${selectedStructure.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Invoice structure updated successfully');
      } else {
        // Create
        await axios.post(`${BASE_URL}/fees/invoice-structures`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMessage('Invoice structure created successfully');
      }

      setShowSuccessModal(true);
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchInvoiceStructures();
    } catch (error) {
      console.error('Error saving invoice structure:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to save invoice structure');
      setShowErrorModal(true);
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
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/fees/invoice-structures/${selectedStructure.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Invoice structure deleted successfully');
      setShowSuccessModal(true);
      setShowDeleteModal(false);
      fetchInvoiceStructures();
    } catch (error) {
      console.error('Error deleting invoice structure:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to delete invoice structure');
      setShowErrorModal(true);
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
  };

  const filteredStructures = invoiceStructures.filter(structure => {
    const searchLower = activeSearchTerm.toLowerCase();
    const matchesSearch = !activeSearchTerm || (
      structure.class_name?.toLowerCase().includes(searchLower) ||
      structure.term?.toLowerCase().includes(searchLower) ||
      structure.academic_year?.toLowerCase().includes(searchLower)
    );

    const matchesYear = !selectedYear || structure.academic_year === selectedYear;
    const matchesTerm = !selectedTerm || structure.term === selectedTerm;

    return matchesSearch && matchesYear && matchesTerm;
  });

  return (
    <div className="p-2 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">Invoice Structures</h1>
            <p className="text-xs md:text-sm text-gray-500">Manage tuition fee structures with itemized breakdowns</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Invoice Structure
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter Year (e.g., 2025)"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex-1">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Select Term</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
          <button
            onClick={handleFilterSearch}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-full sm:w-auto justify-center"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Invoice Structures Table */}
      <div className="report-content-container ecl-table-container" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: 0,
        height: '100%'
      }}>
        <div className="overflow-x-auto">
          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: 'var(--sidebar-bg)'
            }}>
              <tr>
                <th style={{ padding: '6px 10px' }}>Class</th>
                <th style={{ padding: '6px 10px' }}>Term</th>
                <th style={{ padding: '6px 10px' }}>Year</th>
                <th style={{ padding: '6px 10px' }}>Total Amount</th>
                <th style={{ padding: '6px 10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    Loading...
                  </td>
                </tr>
              ) : filteredStructures.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    No invoice structures found
                  </td>
                </tr>
              ) : (
                filteredStructures.map((structure, index) => (
                  <tr
                    key={structure.id}
                    style={{
                      height: '32px',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6'
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>
                      <div style={{ fontWeight: 500, color: '#111827' }}>
                        {structure.class_name}
                      </div>
                      <div className="sm:hidden" style={{ color: '#6b7280' }}>
                        {structure.term} • {structure.academic_year}
                      </div>
                    </td>
                    <td style={{ padding: '4px 10px' }} className="hidden sm:table-cell">
                      <div style={{ fontWeight: 500, color: '#111827' }}>
                        {structure.term}
                      </div>
                    </td>
                    <td style={{ padding: '4px 10px' }} className="hidden md:table-cell">
                      <div style={{ fontWeight: 500, color: '#111827' }}>
                        {structure.academic_year}
                      </div>
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      <div style={{ fontWeight: 500, color: '#111827' }}>
                        {structure.total_amount} {structure.currency_symbol}
                      </div>
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedStructure ? 'Edit Invoice Structure' : 'Add Invoice Structure'}
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
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
                            placeholder="Item name (e.g., Levy)"
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
              </form>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-confirm"
                onClick={handleSubmit}
              >
                {selectedStructure ? 'Update Structure' : 'Create Structure'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedStructure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 p-3 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm md:text-base font-bold mb-3 md:mb-4">Invoice Structure Details</h2>

            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Class</label>
                  <p className="text-xs text-gray-900">{selectedStructure.class_name}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Term</label>
                  <p className="text-xs text-gray-900">{selectedStructure.term}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Academic Year</label>
                  <p className="text-xs text-gray-900">{selectedStructure.academic_year}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Total Amount</label>
                  <p className="text-xs text-gray-900">
                    {selectedStructure.total_amount} {selectedStructure.currency_symbol}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold ${selectedStructure.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {selectedStructure.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>



              {selectedStructure.invoice_items && selectedStructure.invoice_items.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Invoice Items</label>
                  <div className="border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedStructure.invoice_items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-xs text-gray-900">{item.item_name}</td>
                            <td className="px-4 py-2 text-xs text-gray-900">
                              {item.amount} {selectedStructure.currency_symbol}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowViewModal(false)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-full sm:w-auto justify-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStructure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 p-3 md:p-6 w-full max-w-md">
            <h2 className="text-sm md:text-base font-bold mb-3 md:mb-4">Delete Invoice Structure</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete the invoice structure for {selectedStructure.class_name} - {selectedStructure.term} {selectedStructure.academic_year}?
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-full sm:w-auto justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto justify-center"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default InvoiceStructures;
