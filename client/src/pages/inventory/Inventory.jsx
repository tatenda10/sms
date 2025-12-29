import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBoxes, 
  faPlus,
  faSearch,
  faEye,
  faEdit,
  faTrash,
  faUserGraduate,
  faTimes,
  faTshirt,
  faDollarSign,
  faCalendarAlt,
  faCheckCircle,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const Inventory = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(25);

  // View modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Issue Uniform Modal states
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState(null);
  const [issueSuccess, setIssueSuccess] = useState(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showItemResults, setShowItemResults] = useState(false);
  const [showStudentResults, setShowStudentResults] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedIssueItem, setSelectedIssueItem] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [allInventoryItems, setAllInventoryItems] = useState([]);
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

  // Add Item Modal states
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemLoading, setAddItemLoading] = useState(false);
  const [addItemError, setAddItemError] = useState(null);
  const [addItemSuccess, setAddItemSuccess] = useState(null);
  const [itemFormData, setItemFormData] = useState({
    name: '',
    category: '',
    reference: '',
    description: '',
    unitPrice: '',
    currentStock: '',
    location: '',
    supplier: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [currentPage, activeSearchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    if (showIssueModal) {
      loadInventoryItems();
      loadCurrencies();
    }
  }, [showIssueModal]);

  useEffect(() => {
    if (showAddItemModal) {
      fetchCategories();
    }
  }, [showAddItemModal]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/inventory/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchItems = async () => {
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
      if (categoryFilter) {
        params.category_id = categoryFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await axios.get(`${BASE_URL}/inventory/items`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setInventoryItems(response.data.data || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalItems(response.data.pagination?.total_items || response.data.data?.length || 0);
      } else {
        setError(response.data.error || 'Failed to fetch inventory items');
      }
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      setError(err.response?.data?.error || 'Failed to fetch inventory items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleClearCategoryFilter = () => {
    setCategoryFilter('');
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

  const getStockStatus = (currentStock) => {
    if (currentStock === 0) return 'Out of Stock';
    if (currentStock <= 5) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusColor = (status) => {
    const colors = {
      'In Stock': { background: '#d1fae5', color: '#065f46' },
      'Low Stock': { background: '#fef3c7', color: '#92400e' },
      'Out of Stock': { background: '#fee2e2', color: '#991b1b' }
    };
    return colors[status] || { background: '#f3f4f6', color: '#374151' };
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedItem(null);
  };

  // Issue Uniform Modal functions
  const handleOpenIssueModal = () => {
    setShowIssueModal(true);
    setIssueLoading(true);
    setTimeout(() => {
      setIssueLoading(false);
    }, 300);
  };

  const handleCloseIssueModal = () => {
    setShowIssueModal(false);
    setIssueLoading(false);
    setIssueError(null);
    setIssueSuccess(null);
    setItemSearchTerm('');
    setStudentSearchTerm('');
    setShowItemResults(false);
    setShowStudentResults(false);
    setSelectedIssueItem(null);
    setSelectedStudent(null);
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
  };

  const loadInventoryItems = async () => {
    try {
      setLoadingItems(true);
      const response = await axios.get(`${BASE_URL}/inventory/items?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAllInventoryItems(response.data.data || []);
      }
    } catch (err) {
      console.error('Error loading inventory items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currencyList = response.data.data || [];
      setCurrencies(currencyList);
      const baseCurrency = currencyList.find(c => c.base_currency);
      if (baseCurrency) {
        setIssueForm(prev => ({ ...prev, currency_id: baseCurrency.id }));
      }
    } catch (err) {
      console.error('Error loading currencies:', err);
    }
  };

  const handleItemSearch = (e) => {
    const searchValue = e.target.value;
    setItemSearchTerm(searchValue);
    setShowItemResults(searchValue.length > 0);
  };

  const searchStudents = async () => {
    if (!studentSearchTerm.trim()) {
      setStudents([]);
      setShowStudentResults(false);
      return;
    }

    setLoadingStudents(true);
    try {
      try {
        const exactResponse = await axios.get(`${BASE_URL}/students/${studentSearchTerm.trim()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (exactResponse.data.success && exactResponse.data.data) {
          setStudents([exactResponse.data.data]);
          setShowStudentResults(true);
          setLoadingStudents(false);
          return;
        }
      } catch (exactError) {
        // Continue to search API
      }
      
      const response = await axios.get(`${BASE_URL}/students/search?query=${studentSearchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.data || []);
      setShowStudentResults(true);
    } catch (error) {
      console.error('Error searching students:', error);
      setStudents([]);
      setShowStudentResults(false);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleIssueInputChange = (e) => {
    const { name, value } = e.target;
    setIssueForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'quantity' && selectedIssueItem) {
      const newAmount = (parseFloat(value) * selectedIssueItem.unit_price).toFixed(2);
      setIssueForm(prev => ({
        ...prev,
        amount: newAmount
      }));
    }
  };

  const handleItemSelect = (item) => {
    setSelectedIssueItem(item);
    setIssueForm(prev => ({
      ...prev,
      itemId: item.id.toString(),
      amount: item.unit_price.toString()
    }));
    setShowItemResults(false);
    setItemSearchTerm('');
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setIssueForm(prev => ({
      ...prev,
      studentId: student.RegNumber
    }));
    setShowStudentResults(false);
    setStudentSearchTerm('');
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIssueLoading(true);
      setIssueError(null);
      
      if (!issueForm.itemId || !issueForm.studentId || !issueForm.quantity) {
        setIssueError('Please fill in all required fields');
        return;
      }

      if (parseInt(issueForm.quantity) <= 0) {
        setIssueError('Quantity must be greater than 0');
        return;
      }

      if (parseInt(issueForm.quantity) > selectedIssueItem.current_stock) {
        setIssueError(`Cannot issue more than available stock (${selectedIssueItem.current_stock})`);
        return;
      }

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

      const response = await axios.post(`${BASE_URL}/inventory/issues`, issueData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setIssueSuccess('Uniform issued successfully!');
        await fetchItems();
        setTimeout(() => {
          handleCloseIssueModal();
        }, 1500);
      } else {
        setIssueError(response.data.message || 'Failed to issue uniform');
      }
    } catch (err) {
      console.error('Error issuing uniform:', err);
      setIssueError(err.response?.data?.message || 'Failed to issue uniform');
    } finally {
      setIssueLoading(false);
    }
  };

  const filteredIssueItems = allInventoryItems.filter(item => {
    const name = (item.name || '').toLowerCase();
    const reference = (item.reference || '').toLowerCase();
    const searchLower = itemSearchTerm.toLowerCase();
    return name.includes(searchLower) || reference.includes(searchLower);
  });

  // Add Item Modal functions
  const handleOpenAddItemModal = () => {
    setShowAddItemModal(true);
    setAddItemLoading(true);
    setTimeout(() => {
      setAddItemLoading(false);
    }, 300);
  };

  const handleCloseAddItemModal = () => {
    setShowAddItemModal(false);
    setAddItemLoading(false);
    setAddItemError(null);
    setAddItemSuccess(null);
    setItemFormData({
      name: '',
      category: '',
      reference: '',
      description: '',
      unitPrice: '',
      currentStock: '',
      location: '',
      supplier: ''
    });
  };

  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateReference = () => {
    const category = itemFormData.category || 'GEN';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const newReference = `${category.substring(0, 3).toUpperCase()}-${timestamp}-${random}`;
    setItemFormData(prev => ({
      ...prev,
      reference: newReference
    }));
  };

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setAddItemLoading(true);
      setAddItemError(null);
      
      if (!itemFormData.name || !itemFormData.category || !itemFormData.reference) {
        setAddItemError('Please fill in all required fields');
        return;
      }

      if (parseFloat(itemFormData.unitPrice) < 0) {
        setAddItemError('Unit price cannot be negative');
        return;
      }

      if (parseInt(itemFormData.currentStock) < 0) {
        setAddItemError('Current stock cannot be negative');
        return;
      }

      const itemData = {
        name: itemFormData.name.trim(),
        category_id: parseInt(itemFormData.category),
        reference: itemFormData.reference.trim(),
        description: itemFormData.description.trim() || null,
        unit_price: parseFloat(itemFormData.unitPrice) || 0,
        current_stock: parseInt(itemFormData.currentStock) || 0,
        location: itemFormData.location.trim() || null,
        supplier: itemFormData.supplier.trim() || null
      };

      const response = await axios.post(`${BASE_URL}/inventory/items`, itemData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAddItemSuccess('Item added successfully!');
        await fetchItems();
        setTimeout(() => {
          handleCloseAddItemModal();
        }, 1500);
      } else {
        setAddItemError(response.data.message || 'Failed to add item');
      }
    } catch (err) {
      console.error('Error adding item:', err);
      setAddItemError(err.response?.data?.message || 'Failed to add item');
    } finally {
      setAddItemLoading(false);
    }
  };

  const isIssueFormValid = () => {
    return issueForm.itemId && issueForm.studentId && issueForm.quantity && issueForm.amount && issueForm.currency_id;
  };

  const isAddItemFormValid = () => {
    return itemFormData.name && itemFormData.category && itemFormData.reference;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const displayStart = inventoryItems.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalItems);

  if (loading && inventoryItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading inventory items...</div>
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
          <h2 className="report-title">Inventory</h2>
          <p className="report-subtitle">Manage uniforms, track stock levels, and issue items to students.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenIssueModal}
            className="modal-btn modal-btn-secondary"
            style={{ marginRight: '8px' }}
          >
            <FontAwesomeIcon icon={faUserGraduate} />
            Issue Uniform
          </button>
          <button
            onClick={handleOpenAddItemModal}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Item
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
                placeholder="Search by item name or reference..."
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
          
          {/* Category Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Category:</label>
            <select
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px' }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            {categoryFilter && (
              <button
                onClick={handleClearCategoryFilter}
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
                title="Clear category filter"
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
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
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
        {loading && inventoryItems.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading inventory items...
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
                <th style={{ padding: '6px 10px' }}>ITEM NAME</th>
                <th style={{ padding: '6px 10px' }}>REFERENCE</th>
                <th style={{ padding: '6px 10px' }}>CATEGORY</th>
                <th style={{ padding: '6px 10px' }}>STOCK</th>
                <th style={{ padding: '6px 10px' }}>UNIT PRICE</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item, index) => {
                const status = getStockStatus(item.current_stock || 0);
                return (
                  <tr 
                    key={item.id} 
                    style={{ 
                      height: '32px', 
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                    }}
                  >
                    <td style={{ padding: '4px 10px' }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {item.reference || '-'}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {item.category_name || '-'}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {item.current_stock || 0}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      {formatCurrency(item.unit_price || 0)}
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          ...getStatusColor(status)
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td style={{ padding: '4px 10px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleViewItem(item)}
                          style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="View"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, 25 - inventoryItems.length) }).map((_, index) => (
                <tr 
                  key={`empty-${index}`}
                  style={{ 
                    height: '32px', 
                    backgroundColor: (inventoryItems.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
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
          Showing {displayStart} to {displayEnd} of {totalItems || 0} results.
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

      {/* View Item Modal */}
      {showViewModal && selectedItem && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Item Details</h3>
              <button className="modal-close-btn" onClick={handleCloseViewModal}>
                <FontAwesomeIcon icon={faTrash} style={{ display: 'none' }} />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'grid', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                    {selectedItem.name}
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Reference</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                      {selectedItem.reference || '-'}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                      {selectedItem.category_name || 'No category'}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Current Stock</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                      {selectedItem.current_stock || 0}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Unit Price</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                      {formatCurrency(selectedItem.unit_price || 0)}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Total Value</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                      {formatCurrency((selectedItem.current_stock || 0) * (selectedItem.unit_price || 0))}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <div style={{ padding: '8px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          ...getStatusColor(getStockStatus(selectedItem.current_stock || 0))
                        }}
                      >
                        {getStockStatus(selectedItem.current_stock || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px', minHeight: '40px' }}>
                    {selectedItem.description || 'No description'}
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                      {selectedItem.location || 'No location'}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Supplier</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                      {selectedItem.supplier || 'No supplier'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="modal-btn modal-btn-secondary" onClick={handleCloseViewModal}>
                Close
              </button>
              <button 
                className="modal-btn modal-btn-primary"
                onClick={() => {
                  handleCloseViewModal();
                  navigate(`/dashboard/inventory/issue-uniform?item=${selectedItem.id}`);
                }}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none'
                }}
              >
                Issue Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Uniform Modal */}
      {showIssueModal && (
        <div className="modal-overlay" onClick={handleCloseIssueModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', width: '90vw', maxHeight: '95vh', overflowY: 'auto' }}
          >
            {issueLoading && !selectedIssueItem ? (
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
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Issue Uniform</h3>
                  <button className="modal-close-btn" onClick={handleCloseIssueModal}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  {issueError && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {issueError}
                    </div>
                  )}

                  {issueSuccess && (
                    <div style={{ padding: '10px', background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {issueSuccess}
                    </div>
                  )}
                  
                  <form onSubmit={handleIssueSubmit} className="modal-form">
                    {/* Item Selection Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faTshirt} style={{ color: '#2563eb' }} />
                        Uniform Selection
                      </h4>
                      
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">Search Uniform <span className="required">*</span></label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.7rem' }} />
                            <input
                              type="text"
                              className="form-control"
                              style={{ paddingLeft: '32px' }}
                              placeholder="Search uniforms by name or reference..."
                              value={itemSearchTerm}
                              onChange={handleItemSearch}
                              disabled={loadingItems}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowItemResults(itemSearchTerm.length > 0)}
                            disabled={loadingItems || !itemSearchTerm.trim()}
                            className="modal-btn"
                            style={{ background: '#6b7280', color: 'white', padding: '6px 12px', whiteSpace: 'nowrap', fontSize: '0.7rem' }}
                          >
                            Search
                          </button>
                        </div>
                        
                        {showItemResults && (
                          <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'white' }}>
                            {filteredIssueItems.length > 0 ? (
                              filteredIssueItems.map((item) => {
                                const status = getStockStatus(item.current_stock || 0);
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => handleItemSelect(item)}
                                    style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                  >
                                    <div style={{ padding: '8px', background: '#dbeafe', borderRadius: '4px' }}>
                                      <FontAwesomeIcon icon={faTshirt} style={{ color: '#2563eb', fontSize: '0.7rem' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>{item.name}</div>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ref: {item.reference || 'N/A'}</div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Stock: {item.current_stock || 0}</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#10b981' }}>
                                          {formatCurrency(item.unit_price || 0)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                                No items found
                              </div>
                            )}
                          </div>
                        )}
                        
                        {selectedIssueItem && (
                          <div style={{ marginTop: '12px', padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ padding: '8px', background: '#dbeafe', borderRadius: '4px' }}>
                                <FontAwesomeIcon icon={faTshirt} style={{ color: '#2563eb', fontSize: '0.7rem' }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>{selectedIssueItem.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ref: {selectedIssueItem.reference || 'N/A'}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Stock: {selectedIssueItem.current_stock || 0}</span>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#10b981' }}>
                                    {formatCurrency(selectedIssueItem.unit_price || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Student Selection Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#10b981' }} />
                        Student Selection
                      </h4>
                      
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">Search Student <span className="required">*</span></label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <FontAwesomeIcon icon={faUserGraduate} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.7rem' }} />
                            <input
                              type="text"
                              className="form-control"
                              style={{ paddingLeft: '32px' }}
                              placeholder="Search by name or registration number..."
                              value={studentSearchTerm}
                              onChange={(e) => setStudentSearchTerm(e.target.value)}
                              disabled={loadingStudents}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={searchStudents}
                            disabled={loadingStudents || !studentSearchTerm.trim()}
                            className="modal-btn"
                            style={{ background: '#6b7280', color: 'white', padding: '6px 12px', whiteSpace: 'nowrap', fontSize: '0.7rem' }}
                          >
                            Search
                          </button>
                        </div>
                        
                        {showStudentResults && (
                          <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'white' }}>
                            {students.length > 0 ? (
                              students.map((student) => (
                                <div
                                  key={student.RegNumber}
                                  onClick={() => handleStudentSelect(student)}
                                  style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                >
                                  <div style={{ padding: '8px', background: '#d1fae5', borderRadius: '4px' }}>
                                    <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#10b981', fontSize: '0.7rem' }} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                      {student.Name || ''} {student.Surname || ''}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: {student.RegNumber || 'N/A'}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                      {student.Class || 'No class'} • {student.Gender || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                                No students found
                              </div>
                            )}
                          </div>
                        )}
                        
                        {selectedStudent && (
                          <div style={{ marginTop: '12px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ padding: '8px', background: '#d1fae5', borderRadius: '4px' }}>
                                <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#10b981', fontSize: '0.7rem' }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                  {selectedStudent.Name || ''} {selectedStudent.Surname || ''}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: {selectedStudent.RegNumber || 'N/A'}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                  {selectedStudent.Class || 'No class'} • {selectedStudent.Gender || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Issue Details Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#6366f1' }} />
                        Issue Details
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Quantity <span className="required">*</span>
                          </label>
                          <input
                            type="number"
                            name="quantity"
                            className="form-control"
                            value={issueForm.quantity}
                            onChange={handleIssueInputChange}
                            required
                            min="1"
                            max={selectedIssueItem?.current_stock || 1}
                          />
                          {selectedIssueItem && (
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Available: {selectedIssueItem.current_stock}
                            </p>
                          )}
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Issue Date</label>
                          <input
                            type="date"
                            name="issueDate"
                            className="form-control"
                            value={issueForm.issueDate}
                            onChange={handleIssueInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment Information Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faDollarSign} style={{ color: '#f59e0b' }} />
                        Payment Details
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Amount <span className="required">*</span>
                          </label>
                          <input
                            type="number"
                            name="amount"
                            className="form-control"
                            value={issueForm.amount}
                            onChange={handleIssueInputChange}
                            required
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Currency <span className="required">*</span>
                          </label>
                          <select
                            name="currency_id"
                            className="form-control"
                            value={issueForm.currency_id}
                            onChange={handleIssueInputChange}
                            required
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
                            className="form-control"
                            value={issueForm.paymentMethod}
                            onChange={handleIssueInputChange}
                          >
                            <option value="cash">Cash</option>
                            <option value="card">Credit/Debit Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="check">Check</option>
                            <option value="mobile_money">Mobile Money</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Payment Status</label>
                          <select
                            name="paymentStatus"
                            className="form-control"
                            value={issueForm.paymentStatus}
                            onChange={handleIssueInputChange}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial Payment</option>
                          </select>
                        </div>
                        
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Reference Number</label>
                          <input
                            type="text"
                            name="reference"
                            className="form-control"
                            value={issueForm.reference}
                            onChange={handleIssueInputChange}
                            placeholder="Enter reference number (optional)"
                          />
                        </div>
                        
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Notes</label>
                          <textarea
                            name="notes"
                            className="form-control"
                            rows="3"
                            value={issueForm.notes}
                            onChange={handleIssueInputChange}
                            placeholder="Additional notes about the issue..."
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseIssueModal}>
                    Cancel
                  </button>
                  <button 
                    className="modal-btn modal-btn-confirm" 
                    onClick={handleIssueSubmit}
                    disabled={!isIssueFormValid() || issueLoading}
                  >
                    {issueLoading ? 'Issuing...' : 'Issue Uniform'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="modal-overlay" onClick={handleCloseAddItemModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', minHeight: addItemLoading ? '400px' : 'auto' }}
          >
            {addItemLoading ? (
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
              <>
                <div className="modal-header">
                  <h3 className="modal-title">Add Item</h3>
                  <button className="modal-close-btn" onClick={handleCloseAddItemModal}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  {addItemError && (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {addItemError}
                    </div>
                  )}

                  {addItemSuccess && (
                    <div style={{ padding: '10px', background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                      {addItemSuccess}
                    </div>
                  )}
                  
                  <form onSubmit={handleAddItemSubmit} className="modal-form">
                    {/* Item Information Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faBoxes} style={{ color: '#2563eb' }} />
                        Item Information
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">
                            Item Name <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="e.g., Primary School Uniform - Boys"
                            value={itemFormData.name}
                            onChange={handleItemFormChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Category <span className="required">*</span>
                          </label>
                          <select
                            name="category"
                            className="form-control"
                            value={itemFormData.category}
                            onChange={handleItemFormChange}
                            required
                          >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            Reference <span className="required">*</span>
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              name="reference"
                              className="form-control"
                              placeholder="e.g., UNI-PRI-B-001"
                              value={itemFormData.reference}
                              onChange={handleItemFormChange}
                              required
                            />
                            <button
                              type="button"
                              onClick={generateReference}
                              className="modal-btn"
                              style={{ 
                                background: '#6b7280', 
                                color: 'white', 
                                padding: '6px 12px',
                                whiteSpace: 'nowrap',
                                fontSize: '0.7rem'
                              }}
                            >
                              Auto
                            </button>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Unit Price (USD) <span className="required">*</span></label>
                          <input
                            type="number"
                            name="unitPrice"
                            className="form-control"
                            placeholder="0.00"
                            value={itemFormData.unitPrice}
                            onChange={handleItemFormChange}
                            required
                            step="0.01"
                            min="0"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Current Stock <span className="required">*</span></label>
                          <input
                            type="number"
                            name="currentStock"
                            className="form-control"
                            placeholder="0"
                            value={itemFormData.currentStock}
                            onChange={handleItemFormChange}
                            required
                            min="0"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Storage Location</label>
                          <input
                            type="text"
                            name="location"
                            className="form-control"
                            placeholder="e.g., Storage Room A"
                            value={itemFormData.location}
                            onChange={handleItemFormChange}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Supplier</label>
                          <input
                            type="text"
                            name="supplier"
                            className="form-control"
                            placeholder="e.g., Uniforms Plus Ltd"
                            value={itemFormData.supplier}
                            onChange={handleItemFormChange}
                          />
                        </div>
                        
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Description</label>
                          <textarea
                            name="description"
                            className="form-control"
                            rows="2"
                            placeholder="Brief description of the item..."
                            value={itemFormData.description}
                            onChange={handleItemFormChange}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                
                <div className="modal-footer">
                  <button className="modal-btn modal-btn-cancel" onClick={handleCloseAddItemModal}>
                    Cancel
                  </button>
                  <button 
                    className="modal-btn modal-btn-confirm" 
                    onClick={handleAddItemSubmit}
                    disabled={!isAddItemFormValid() || addItemLoading}
                  >
                    {addItemLoading ? 'Adding...' : 'Add Item'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
