import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faEye, 
  faEdit, 
  faTrash,
  faWarehouse,
  faTimes,
  faDollarSign,
  faCalendarAlt,
  faMapMarkerAlt,
  faCog,
  faBox
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const FixedAssets = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [limit] = useState(25);

  // Add Asset Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [dynamicFields, setDynamicFields] = useState([]);

  // Configurations Modal states
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState(null);
  const [configSuccess, setConfigSuccess] = useState(null);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: '',
    chart_of_account_id: '',
    depreciation_account_id: '',
    expense_account_id: '',
    requires_registration: false,
    requires_serial_number: false,
    icon: 'faBox'
  });
  const [formData, setFormData] = useState({
    asset_type_id: '',
    asset_name: '',
    description: '',
    purchase_date: '',
    total_cost: '',
    supplier_name: '',
    registration_number: '',
    location: '',
    serial_number: '',
    status: 'Active',
    condition: '',
    custom_fields: {},
    enable_depreciation: false,
    depreciation_method: 'Straight Line',
    useful_life_years: '',
    salvage_value: '0',
    is_opening_balance: false,
    opening_balance_date: '',
    amount_paid: '0',
    payment_method: 'Bank Transfer'
  });

  useEffect(() => {
    fetchAssetTypes();
  }, []);

  useEffect(() => {
    if (showConfigModal) {
      fetchChartOfAccounts();
    }
  }, [showConfigModal]);

  useEffect(() => {
    fetchAssets();
  }, [currentPage, activeSearchTerm, typeFilter, statusFilter]);

  useEffect(() => {
    if (formData.asset_type_id) {
      const type = assetTypes.find(t => t.id === parseInt(formData.asset_type_id));
      setSelectedAssetType(type);
    } else {
      setSelectedAssetType(null);
    }
  }, [formData.asset_type_id, assetTypes]);

  const fetchAssetTypes = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/assets/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAssetTypes(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching asset types:', err);
    }
  };

  const fetchChartOfAccounts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/chart-of-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setChartOfAccounts(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching chart of accounts:', err);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: limit
      };

      if (activeSearchTerm) {
        params.search = activeSearchTerm;
      }
      if (typeFilter) {
        params.asset_type_id = typeFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await axios.get(`${BASE_URL}/assets`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setAssets(response.data.data || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalAssets(response.data.pagination?.total_items || response.data.data?.length || 0);
      } else {
        setError(response.data.error || 'Failed to fetch assets');
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err.response?.data?.error || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleClearTypeFilter = () => {
    setTypeFilter('');
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleClearStatusFilter = () => {
    setStatusFilter('');
    setCurrentPage(1);
  };

  const handleViewAsset = (assetId) => {
    navigate(`/dashboard/assets/${assetId}`);
  };

  const handleEditAsset = (assetId) => {
    navigate(`/dashboard/assets/${assetId}/edit`);
  };

  // Add Asset Modal functions
  const handleOpenModal = () => {
    setShowAddModal(true);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setIsLoading(false);
    setFormError(null);
    setDynamicFields([]);
    setFormData({
      asset_type_id: '',
      asset_name: '',
      description: '',
      purchase_date: '',
      total_cost: '',
      supplier_name: '',
      registration_number: '',
      location: '',
      serial_number: '',
      status: 'Active',
      condition: '',
      custom_fields: {},
      enable_depreciation: false,
      depreciation_method: 'Straight Line',
      useful_life_years: '',
      salvage_value: '0',
      is_opening_balance: false,
      opening_balance_date: '',
      amount_paid: '0',
      payment_method: 'Bank Transfer'
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addDynamicField = () => {
    setDynamicFields([...dynamicFields, { name: '', value: '' }]);
  };

  const updateDynamicField = (index, field, value) => {
    const updated = [...dynamicFields];
    updated[index][field] = value;
    setDynamicFields(updated);
    
    const customFields = {};
    updated.forEach(f => {
      if (f.name && f.value) {
        customFields[f.name] = f.value;
      }
    });
    setFormData(prev => ({
      ...prev,
      custom_fields: { ...prev.custom_fields, ...customFields }
    }));
  };

  const removeDynamicField = (index) => {
    const updated = dynamicFields.filter((_, i) => i !== index);
    setDynamicFields(updated);
    
    const customFields = {};
    updated.forEach(f => {
      if (f.name && f.value) {
        customFields[f.name] = f.value;
      }
    });
    setFormData(prev => ({
      ...prev,
      custom_fields: customFields
    }));
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldName]: value
      }
    }));
  };

  const renderCustomField = (field) => {
    const value = formData.custom_fields[field.field_name] || '';

    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="form-control"
            required={field.is_required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="form-control"
            required={field.is_required}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="form-control"
            required={field.is_required}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="form-control"
            rows="3"
            required={field.is_required}
          />
        );
      case 'select':
        const options = field.field_options ? JSON.parse(field.field_options) : [];
        return (
          <select
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="form-control"
            required={field.is_required}
          >
            <option value="">Select...</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value === true || value === 'true'}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
        );
      default:
        return null;
    }
  };

  const isFormValid = () => {
    return formData.asset_type_id && formData.asset_name && formData.purchase_date && formData.total_cost;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const submitData = {
        ...formData,
        total_cost: parseFloat(formData.total_cost),
        amount_paid: parseFloat(formData.amount_paid || 0),
        useful_life_years: formData.enable_depreciation ? parseInt(formData.useful_life_years) : null,
        salvage_value: formData.enable_depreciation ? parseFloat(formData.salvage_value || 0) : 0
      };

      const response = await axios.post(`${BASE_URL}/assets`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        await fetchAssets();
        handleCloseModal();
      } else {
        setFormError(response.data.error || 'Failed to create asset');
      }
    } catch (err) {
      console.error('Error creating asset:', err);
      let errorMessage = 'An unexpected error occurred';
      
      if (err.response) {
        const errorData = err.response.data;
        if (errorData?.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = errorData?.message || `Server Error (${err.response.status})`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Configurations Modal functions
  const handleOpenConfigModal = () => {
    setShowConfigModal(true);
    setConfigLoading(true);
    setTimeout(() => {
      setConfigLoading(false);
    }, 300);
  };

  const handleCloseConfigModal = () => {
    setShowConfigModal(false);
    setConfigLoading(false);
    setConfigError(null);
    setConfigSuccess(null);
    setShowAddTypeModal(false);
    setEditingType(null);
    setTypeFormData({
      name: '',
      description: '',
      chart_of_account_id: '',
      depreciation_account_id: '',
      expense_account_id: '',
      requires_registration: false,
      requires_serial_number: false,
      icon: 'faBox'
    });
  };

  const handleTypeInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTypeFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddType = () => {
    setEditingType(null);
    setTypeFormData({
      name: '',
      description: '',
      chart_of_account_id: '',
      depreciation_account_id: '',
      expense_account_id: '',
      requires_registration: false,
      requires_serial_number: false,
      icon: 'faBox'
    });
    setShowAddTypeModal(true);
    setConfigError(null);
    setConfigSuccess(null);
  };

  const handleEditType = (type) => {
    setEditingType(type);
    setTypeFormData({
      name: type.name || '',
      description: type.description || '',
      chart_of_account_id: type.chart_of_account_id || '',
      depreciation_account_id: type.depreciation_account_id || '',
      expense_account_id: type.expense_account_id || '',
      requires_registration: type.requires_registration || false,
      requires_serial_number: type.requires_serial_number || false,
      icon: type.icon || 'faBox'
    });
    setShowAddTypeModal(true);
    setConfigError(null);
    setConfigSuccess(null);
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    setConfigLoading(true);
    setConfigError(null);
    setConfigSuccess(null);

    try {
      const url = editingType
        ? `${BASE_URL}/assets/types/${editingType.id}`
        : `${BASE_URL}/assets/types`;
      
      const method = editingType ? 'put' : 'post';
      
      const response = await axios[method](url, typeFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setConfigSuccess(editingType ? 'Asset type updated successfully' : 'Asset type created successfully');
        setShowAddTypeModal(false);
        setEditingType(null);
        await fetchAssetTypes();
        setTimeout(() => setConfigSuccess(null), 3000);
      } else {
        setConfigError(response.data.error || 'Failed to save asset type');
      }
    } catch (err) {
      console.error('Error saving asset type:', err);
      let errorMessage = 'An unexpected error occurred';
      
      if (err.response) {
        const errorData = err.response.data;
        if (errorData?.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = errorData?.message || `Server Error (${err.response.status})`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setConfigError(errorMessage);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset type? This action cannot be undone.')) {
      return;
    }

    try {
      setConfigLoading(true);
      setConfigError(null);
      setConfigSuccess(null);

      const response = await axios.delete(`${BASE_URL}/assets/types/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setConfigSuccess('Asset type deleted successfully');
        await fetchAssetTypes();
        setTimeout(() => setConfigSuccess(null), 3000);
      } else {
        setConfigError(response.data.error || 'Failed to delete asset type');
      }
    } catch (err) {
      console.error('Error deleting asset type:', err);
      setConfigError(err.response?.data?.error || 'Failed to delete asset type');
    } finally {
      setConfigLoading(false);
    }
  };

  const getAssetAccounts = () => {
    return chartOfAccounts.filter(acc => 
      acc.type === 'Asset' && acc.is_active
    );
  };

  const getExpenseAccounts = () => {
    return chartOfAccounts.filter(acc => 
      acc.type === 'Expense' && acc.is_active
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': { background: '#d1fae5', color: '#065f46' },
      'Disposed': { background: '#f3f4f6', color: '#374151' },
      'Lost': { background: '#fee2e2', color: '#991b1b' },
      'Damaged': { background: '#fed7aa', color: '#9a3412' },
      'Under Repair': { background: '#fef3c7', color: '#92400e' }
    };
    return colors[status] || { background: '#f3f4f6', color: '#374151' };
  };

  const displayStart = assets.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalAssets);

  if (loading && assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading assets...</div>
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
          <h2 className="report-title">Fixed Assets</h2>
          <p className="report-subtitle">Manage school property, vehicles, and equipment.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenConfigModal}
            className="modal-btn modal-btn-secondary"
            style={{ marginRight: '8px' }}
          >
            <FontAwesomeIcon icon={faCog} />
            Configurations
          </button>
          <button
            onClick={handleOpenModal}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Asset
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by asset code, name, or registration number..."
                className="filter-input search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveSearchTerm('');
                    setCurrentPage(1);
                  }}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    padding: '4px 6px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
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
          </form>
          
          {/* Asset Type Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Type:</label>
            <select
              value={typeFilter}
              onChange={handleTypeFilterChange}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px' }}
            >
              <option value="">All Types</option>
              {assetTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {typeFilter && (
              <button
                onClick={handleClearTypeFilter}
                style={{
                  marginLeft: '8px',
                  padding: '6px 10px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)'
                }}
                title="Clear type filter"
              >
                ×
              </button>
            )}
          </div>
          
          {/* Status Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Status:</label>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px' }}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Disposed">Disposed</option>
              <option value="Lost">Lost</option>
              <option value="Damaged">Damaged</option>
              <option value="Under Repair">Under Repair</option>
            </select>
            {statusFilter && (
              <button
                onClick={handleClearStatusFilter}
                style={{
                  marginLeft: '8px',
                  padding: '6px 10px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)'
                }}
                title="Clear status filter"
              >
                ×
              </button>
            )}
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
        {loading && assets.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading assets...
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
                <th style={{ padding: '6px 10px' }}>ASSET CODE</th>
                <th style={{ padding: '6px 10px' }}>ASSET NAME</th>
                <th style={{ padding: '6px 10px' }}>TYPE</th>
                <th style={{ padding: '6px 10px' }}>PURCHASE DATE</th>
                <th style={{ padding: '6px 10px' }}>TOTAL COST</th>
                <th style={{ padding: '6px 10px' }}>PAID</th>
                <th style={{ padding: '6px 10px' }}>OUTSTANDING</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, index) => (
                <tr 
                  key={asset.id} 
                  style={{ 
                    height: '32px', 
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                    {asset.asset_code}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ fontWeight: 500 }}>{asset.asset_name}</div>
                    {asset.registration_number && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Reg: {asset.registration_number}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {asset.asset_type_name || '-'}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {formatDate(asset.purchase_date)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {formatCurrency(asset.total_cost)}
                  </td>
                  <td style={{ padding: '4px 10px', color: '#10b981' }}>
                    {formatCurrency(asset.amount_paid)}
                  </td>
                  <td style={{ padding: '4px 10px', color: '#f59e0b' }}>
                    {formatCurrency(asset.outstanding_balance)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        ...getStatusColor(asset.status)
                      }}
                    >
                      {asset.status || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewAsset(asset.id)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleEditAsset(asset.id)}
                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, 25 - assets.length) }).map((_, index) => (
                <tr 
                  key={`empty-${index}`}
                  style={{ 
                    height: '32px', 
                    backgroundColor: (assets.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
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

      {/* Pagination Footer - Separate Container */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {totalAssets || 0} results.
        </div>
        <div className="table-footer-right">
          {!activeSearchTerm && totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
          {!activeSearchTerm && totalPages <= 1 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              All data displayed
            </div>
          )}
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '800px', minHeight: isLoading ? '400px' : 'auto', maxHeight: '95vh', overflowY: 'auto' }}
          >
            {isLoading ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ height: '32px', width: '100px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Add Asset</h3>
                  <button className="modal-close-btn" onClick={handleCloseModal}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  {formError && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {formError}
                    </div>
                  )}
                  
                  <form onSubmit={handleSave} className="modal-form">
                    {/* Asset Information Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faWarehouse} style={{ color: '#2563eb' }} />
                        Asset Information
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Asset Type <span className="required">*</span>
                          </label>
                          <select
                            name="asset_type_id"
                            className="form-control"
                            value={formData.asset_type_id}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select Asset Type</option>
                            {assetTypes.map(type => (
                              <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Asset Name <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            name="asset_name"
                            className="form-control"
                            placeholder="e.g., Toyota Hilux ABC-1234"
                            value={formData.asset_name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Description</label>
                          <textarea
                            name="description"
                            className="form-control"
                            rows="2"
                            placeholder="Additional details about the asset..."
                            value={formData.description}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Purchase Details Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
                        Purchase Details
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Purchase Date <span className="required">*</span>
                          </label>
                          <input
                            type="date"
                            name="purchase_date"
                            className="form-control"
                            value={formData.purchase_date}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Total Cost (USD) <span className="required">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            name="total_cost"
                            className="form-control"
                            placeholder="0.00"
                            value={formData.total_cost}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Supplier Name</label>
                          <input
                            type="text"
                            name="supplier_name"
                            className="form-control"
                            placeholder="Name of supplier/vendor"
                            value={formData.supplier_name}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Asset Details Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#6366f1' }} />
                        Asset Details
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        {selectedAssetType?.requires_registration && (
                          <div className="form-group">
                            <label className="form-label">Registration Number</label>
                            <input
                              type="text"
                              name="registration_number"
                              className="form-control"
                              placeholder="e.g., ABC-1234"
                              value={formData.registration_number}
                              onChange={handleInputChange}
                            />
                          </div>
                        )}

                        {selectedAssetType?.requires_serial_number && (
                          <div className="form-group">
                            <label className="form-label">Serial Number</label>
                            <input
                              type="text"
                              name="serial_number"
                              className="form-control"
                              placeholder="e.g., SN123456789"
                              value={formData.serial_number}
                              onChange={handleInputChange}
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label className="form-label">Location</label>
                          <input
                            type="text"
                            name="location"
                            className="form-control"
                            placeholder="Where is this asset located?"
                            value={formData.location}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Status</label>
                          <select
                            name="status"
                            className="form-control"
                            value={formData.status}
                            onChange={handleInputChange}
                          >
                            <option value="Active">Active</option>
                            <option value="Disposed">Disposed</option>
                            <option value="Lost">Lost</option>
                            <option value="Damaged">Damaged</option>
                            <option value="Under Repair">Under Repair</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Condition</label>
                          <select
                            name="condition"
                            className="form-control"
                            value={formData.condition}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Condition</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Custom Details Section */}
                    {dynamicFields.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Custom Details
                          </h4>
                          <button
                            type="button"
                            onClick={addDynamicField}
                            className="modal-btn"
                            style={{ background: '#2563eb', color: 'white', padding: '6px 12px', fontSize: '0.7rem' }}
                          >
                            <FontAwesomeIcon icon={faPlus} style={{ marginRight: '4px' }} />
                            Add Field
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {dynamicFields.map((field, index) => (
                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) => updateDynamicField(index, 'name', e.target.value)}
                                placeholder="Field name (e.g., Color)"
                                className="form-control"
                              />
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => updateDynamicField(index, 'value', e.target.value)}
                                placeholder="Value (e.g., Red)"
                                className="form-control"
                              />
                              <button
                                type="button"
                                onClick={() => removeDynamicField(index)}
                                style={{ 
                                  background: '#dc2626', 
                                  color: 'white', 
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem'
                                }}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Fields from Asset Type */}
                    {selectedAssetType && selectedAssetType.custom_fields && selectedAssetType.custom_fields.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Additional Information
                        </h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                          {selectedAssetType.custom_fields.map(field => (
                            <div key={field.id} className={field.field_type === 'textarea' ? 'form-group' : 'form-group'} style={field.field_type === 'textarea' ? { gridColumn: '1 / -1' } : {}}>
                              <label className="form-label">
                                {field.field_label}
                                {field.is_required && <span className="required">*</span>}
                              </label>
                              {renderCustomField(field)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Opening Balance Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <input
                          type="checkbox"
                          name="is_opening_balance"
                          checked={formData.is_opening_balance}
                          onChange={handleInputChange}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <label className="form-label" style={{ margin: 0 }}>
                          This is a historical asset (opening balance)
                        </label>
                      </div>

                      {formData.is_opening_balance && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', padding: '16px', background: '#eff6ff', borderRadius: '4px' }}>
                          <div className="form-group">
                            <label className="form-label">Opening Balance Date</label>
                            <input
                              type="date"
                              name="opening_balance_date"
                              className="form-control"
                              value={formData.opening_balance_date}
                              onChange={handleInputChange}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Amount Already Paid (USD)</label>
                            <input
                              type="number"
                              step="0.01"
                              name="amount_paid"
                              className="form-control"
                              placeholder="0.00"
                              value={formData.amount_paid}
                              onChange={handleInputChange}
                            />
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Outstanding: ${(parseFloat(formData.total_cost || 0) - parseFloat(formData.amount_paid || 0)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Depreciation Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <input
                          type="checkbox"
                          name="enable_depreciation"
                          checked={formData.enable_depreciation}
                          onChange={handleInputChange}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <label className="form-label" style={{ margin: 0 }}>
                          Enable depreciation tracking (optional)
                        </label>
                      </div>

                      {formData.enable_depreciation && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '16px', background: '#f9fafb', borderRadius: '4px' }}>
                          <div className="form-group">
                            <label className="form-label">Depreciation Method</label>
                            <select
                              name="depreciation_method"
                              className="form-control"
                              value={formData.depreciation_method}
                              onChange={handleInputChange}
                            >
                              <option value="Straight Line">Straight Line</option>
                              <option value="Declining Balance">Declining Balance</option>
                              <option value="Units of Production">Units of Production</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Useful Life (years)</label>
                            <input
                              type="number"
                              name="useful_life_years"
                              className="form-control"
                              placeholder="e.g., 5"
                              value={formData.useful_life_years}
                              onChange={handleInputChange}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Salvage Value (USD)</label>
                            <input
                              type="number"
                              step="0.01"
                              name="salvage_value"
                              className="form-control"
                              placeholder="0.00"
                              value={formData.salvage_value}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
                
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button 
                    className="modal-btn modal-btn-confirm" 
                    onClick={handleSave}
                    disabled={!isFormValid() || isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Asset'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Configurations Modal */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={handleCloseConfigModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '900px', width: '90vw', maxHeight: '95vh', overflowY: 'auto' }}
          >
            {configLoading && !showAddTypeModal ? (
              // Loading State
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ height: '20px', width: '200px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                  <div style={{ width: '18px', height: '18px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
                <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: '1', minHeight: '300px' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading...</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ height: '32px', width: '80px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </div>
              </>
            ) : (
              // Content State
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Fixed Assets Configuration</h3>
                  <button className="modal-close-btn" onClick={handleCloseConfigModal}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  {configError && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {configError}
                    </div>
                  )}

                  {configSuccess && (
                    <div style={{ padding: '10px', background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {configSuccess}
                    </div>
                  )}

                  {!showAddTypeModal ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Manage asset types and their settings
                        </p>
                        <button
                          onClick={handleAddType}
                          className="btn-checklist"
                          style={{ fontSize: '0.7rem', padding: '6px 12px' }}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          Add Asset Type
                        </button>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                          <thead style={{ 
                            position: 'sticky', 
                            top: 0, 
                            zIndex: 10, 
                            background: 'var(--sidebar-bg)' 
                          }}>
                            <tr>
                              <th style={{ padding: '6px 10px' }}>NAME</th>
                              <th style={{ padding: '6px 10px' }}>DESCRIPTION</th>
                              <th style={{ padding: '6px 10px' }}>CHART OF ACCOUNT</th>
                              <th style={{ padding: '6px 10px' }}>REQUIRES REGISTRATION</th>
                              <th style={{ padding: '6px 10px' }}>REQUIRES SERIAL #</th>
                              <th style={{ padding: '6px 10px' }}>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assetTypes.length === 0 ? (
                              <tr>
                                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                  No asset types found. Click "Add Asset Type" to create one.
                                </td>
                              </tr>
                            ) : (
                              assetTypes.map((type, index) => (
                                <tr 
                                  key={type.id}
                                  style={{ 
                                    height: '32px', 
                                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                                  }}
                                >
                                  <td style={{ padding: '4px 10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <FontAwesomeIcon icon={faBox} style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }} />
                                      <span style={{ fontWeight: 500 }}>{type.name}</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '4px 10px' }}>
                                    {type.description || '-'}
                                  </td>
                                  <td style={{ padding: '4px 10px' }}>
                                    {type.account_code} - {type.account_name}
                                  </td>
                                  <td style={{ padding: '4px 10px' }}>
                                    <span
                                      style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: 500,
                                        background: type.requires_registration ? '#d1fae5' : '#f3f4f6',
                                        color: type.requires_registration ? '#065f46' : '#374151'
                                      }}
                                    >
                                      {type.requires_registration ? 'Yes' : 'No'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '4px 10px' }}>
                                    <span
                                      style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: 500,
                                        background: type.requires_serial_number ? '#d1fae5' : '#f3f4f6',
                                        color: type.requires_serial_number ? '#065f46' : '#374151'
                                      }}
                                    >
                                      {type.requires_serial_number ? 'Yes' : 'No'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '4px 10px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                      <button
                                        onClick={() => handleEditType(type)}
                                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        title="Edit"
                                      >
                                        <FontAwesomeIcon icon={faEdit} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteType(type.id)}
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
                    </>
                  ) : (
                    <form onSubmit={handleSaveType} className="modal-form">
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FontAwesomeIcon icon={faCog} style={{ color: '#2563eb' }} />
                          {editingType ? 'Edit Asset Type' : 'Add New Asset Type'}
                        </h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label className="form-label">
                              Name <span className="required">*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              className="form-control"
                              placeholder="e.g., Vehicles, Equipment"
                              value={typeFormData.name}
                              onChange={handleTypeInputChange}
                              required
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Icon</label>
                            <input
                              type="text"
                              name="icon"
                              className="form-control"
                              placeholder="faBox"
                              value={typeFormData.icon}
                              onChange={handleTypeInputChange}
                            />
                          </div>
                          
                          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Description</label>
                            <textarea
                              name="description"
                              className="form-control"
                              rows="2"
                              placeholder="Brief description of this asset type"
                              value={typeFormData.description}
                              onChange={handleTypeInputChange}
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">
                              Chart of Account <span className="required">*</span>
                            </label>
                            <select
                              name="chart_of_account_id"
                              className="form-control"
                              value={typeFormData.chart_of_account_id}
                              onChange={handleTypeInputChange}
                              required
                            >
                              <option value="">Select Account</option>
                              {getAssetAccounts().map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Depreciation Account</label>
                            <select
                              name="depreciation_account_id"
                              className="form-control"
                              value={typeFormData.depreciation_account_id}
                              onChange={handleTypeInputChange}
                            >
                              <option value="">Select Account (Optional)</option>
                              {getExpenseAccounts().map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Expense Account</label>
                            <select
                              name="expense_account_id"
                              className="form-control"
                              value={typeFormData.expense_account_id}
                              onChange={handleTypeInputChange}
                            >
                              <option value="">Select Account (Optional)</option>
                              {getExpenseAccounts().map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  name="requires_registration"
                                  checked={typeFormData.requires_registration}
                                  onChange={handleTypeInputChange}
                                  style={{ width: '16px', height: '16px' }}
                                />
                                <span className="form-label" style={{ margin: 0 }}>Requires Registration Number</span>
                              </label>
                              
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  name="requires_serial_number"
                                  checked={typeFormData.requires_serial_number}
                                  onChange={handleTypeInputChange}
                                  style={{ width: '16px', height: '16px' }}
                                />
                                <span className="form-label" style={{ margin: 0 }}>Requires Serial Number</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
                
                <div className="modal-footer">
                  {showAddTypeModal ? (
                    <>
                      <button className="modal-btn modal-btn-cancel" onClick={() => {
                        setShowAddTypeModal(false);
                        setEditingType(null);
                      }}>
                        Cancel
                      </button>
                      <button 
                        className="modal-btn modal-btn-confirm" 
                        onClick={handleSaveType}
                        disabled={!typeFormData.name || !typeFormData.chart_of_account_id || configLoading}
                      >
                        {configLoading ? 'Saving...' : editingType ? 'Update' : 'Create'}
                      </button>
                    </>
                  ) : (
                    <button className="modal-btn modal-btn-secondary" onClick={handleCloseConfigModal}>
                      Close
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedAssets;
