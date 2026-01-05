import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faEye,
    faTrash,
    faTshirt,
    faEdit
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import BASE_URL from '../../../contexts/Api';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const InventoryList = () => {
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

    // Edit modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        category: '',
        reference: '',
        description: '',
        unitPrice: '',
        currentStock: '',
        location: '',
        supplier: ''
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);

    // Delete modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchItems();
    }, [currentPage, activeSearchTerm, categoryFilter, statusFilter]);

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

    const handleEditItem = (item) => {
        setEditItem(item);
        setEditFormData({
            name: item.name || '',
            category: item.category_id?.toString() || '',
            reference: item.reference || '',
            description: item.description || '',
            unitPrice: item.unit_price?.toString() || '',
            currentStock: item.current_stock?.toString() || '',
            location: item.location || '',
            supplier: item.supplier || ''
        });
        setEditError(null);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditItem(null);
        setEditFormData({
            name: '',
            category: '',
            reference: '',
            description: '',
            unitPrice: '',
            currentStock: '',
            location: '',
            supplier: ''
        });
        setEditError(null);
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        if (!editItem) return;

        try {
            setEditLoading(true);
            setEditError(null);

            if (!editFormData.name || !editFormData.category || !editFormData.reference) {
                setEditError('Please fill in all required fields');
                return;
            }

            const itemData = {
                name: editFormData.name.trim(),
                category_id: parseInt(editFormData.category),
                reference: editFormData.reference.trim(),
                description: editFormData.description.trim() || null,
                unit_price: parseFloat(editFormData.unitPrice) || 0,
                current_stock: parseInt(editFormData.currentStock) || 0,
                location: editFormData.location.trim() || null,
                supplier: editFormData.supplier.trim() || null
            };

            const response = await axios.put(`${BASE_URL}/inventory/items/${editItem.id}`, itemData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                handleCloseEditModal();
                fetchItems();
            } else {
                setEditError(response.data.error || 'Failed to update item');
            }
        } catch (err) {
            console.error('Error updating item:', err);
            setEditError(err.response?.data?.error || 'Failed to update item. Please try again.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;

        try {
            setIsDeleting(true);
            const response = await axios.delete(`${BASE_URL}/inventory/items/${itemToDelete.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                handleCloseDeleteModal();
                fetchItems();
            } else {
                setError(response.data.error || 'Failed to delete item');
            }
        } catch (err) {
            console.error('Error deleting item:', err);
            setError(err.response?.data?.error || 'Failed to delete item. Please try again.');
        } finally {
            setIsDeleting(false);
        }
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                                placeholder="Search by name, reference, or category..."
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
                            style={{ minWidth: '180px', width: '180px' }}
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
                            style={{ minWidth: '120px', width: '120px' }}
                        >
                            <option value="">All</option>
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
                                        <td style={{ padding: '4px 10px' }}>{item.name}</td>
                                        <td style={{ padding: '4px 10px' }}>{item.reference || '-'}</td>
                                        <td style={{ padding: '4px 10px' }}>{item.category_name || '-'}</td>
                                        <td style={{ padding: '4px 10px' }}>{item.current_stock || 0}</td>
                                        <td style={{ padding: '4px 10px' }}>{formatCurrency(item.unit_price || 0)}</td>
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
                                                <button
                                                    onClick={() => handleEditItem(item)}
                                                    style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                    title="Edit"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(item)}
                                                    style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                    title="Delete"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
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

            {/* Pagination Footer */}
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
                                ×
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
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {showEditModal && editItem && (
                <div className="modal-overlay" onClick={handleCloseEditModal}>
                    <div
                        className="modal-dialog"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
                    >
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Item</h3>
                            <button className="modal-close-btn" onClick={handleCloseEditModal}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            {editError && (
                                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                                    {editError}
                                </div>
                            )}

                            <form onSubmit={handleUpdateItem} className="modal-form">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    {/* Left Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div className="form-group">
                                            <label className="form-label">
                                                Item Name <span style={{ color: '#dc2626' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={editFormData.name}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                                required
                                                className="form-control"
                                                placeholder="e.g., Primary School Uniform - Boys"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">
                                                Category <span style={{ color: '#dc2626' }}>*</span>
                                            </label>
                                            <select
                                                value={editFormData.category}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                                                required
                                                className="form-control"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>{category.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">
                                                Reference <span style={{ color: '#dc2626' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={editFormData.reference}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, reference: e.target.value }))}
                                                required
                                                className="form-control"
                                                placeholder="e.g., UNI-PRI-B-001"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                value={editFormData.description}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                                                rows="2"
                                                className="form-control"
                                                placeholder="Brief description of the item..."
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">
                                                Unit Price (USD) <span style={{ color: '#dc2626' }}>*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={editFormData.unitPrice}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                                                required
                                                step="0.01"
                                                min="0"
                                                className="form-control"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div className="form-group">
                                            <label className="form-label">
                                                Current Stock <span style={{ color: '#dc2626' }}>*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={editFormData.currentStock}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                                                required
                                                min="0"
                                                className="form-control"
                                                placeholder="0"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Storage Location</label>
                                            <input
                                                type="text"
                                                value={editFormData.location}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                                                className="form-control"
                                                placeholder="e.g., Storage Room A"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Supplier</label>
                                            <input
                                                type="text"
                                                value={editFormData.supplier}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, supplier: e.target.value }))}
                                                className="form-control"
                                                placeholder="e.g., Uniforms Plus Ltd"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                                    <button
                                        type="button"
                                        onClick={handleCloseEditModal}
                                        className="modal-btn modal-btn-cancel"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editLoading}
                                        className="modal-btn modal-btn-primary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        {editLoading ? (
                                            <>
                                                <div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faEdit} style={{ fontSize: '0.7rem' }} />
                                                Update Item
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && itemToDelete && (
                <div className="modal-overlay" onClick={handleCloseDeleteModal}>
                    <div
                        className="modal-dialog"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '500px' }}
                    >
                        <div className="modal-header">
                            <h3 className="modal-title">Confirm Delete</h3>
                            <button className="modal-close-btn" onClick={handleCloseDeleteModal}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: '#fee2e2',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                        Are you sure you want to delete this item?
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                padding: '12px',
                                background: '#f9fafb',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    {itemToDelete.name}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Reference: {itemToDelete.reference || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="modal-btn modal-btn-cancel"
                                onClick={handleCloseDeleteModal}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-btn modal-btn-delete"
                                onClick={handleDeleteItem}
                                disabled={isDeleting}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: '0.7rem' }} />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryList;
