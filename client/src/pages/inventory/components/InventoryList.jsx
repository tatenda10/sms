import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faEye,
    faTrash,
    faTshirt
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Filters Section */}
            <div style={{
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                flexWrap: 'wrap',
                padding: '10px 0',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '15px'
            }}>
                {/* Search Bar */}
                <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '250px' }}>
                        <FontAwesomeIcon icon={faSearch} className="search-icon" style={{ position: 'absolute', left: '10px', color: '#64748b' }} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search tests..."
                            className="filter-input search-input"
                            style={{ paddingLeft: '35px', width: '100%', height: '36px', fontSize: '0.75rem' }}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm('');
                                    setActiveSearchTerm('');
                                    setCurrentPage(1);
                                }}
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748b'
                                }}
                            >
                                ×
                            </button>
                        )}
                    </div>
                </form>

                {/* Category Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Category:</label>
                    <select
                        value={categoryFilter}
                        onChange={handleCategoryFilterChange}
                        className="filter-input"
                        style={{ minWidth: '150px', height: '36px', fontSize: '0.75rem' }}
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Status:</label>
                    <select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        className="filter-input"
                        style={{ minWidth: '150px', height: '36px', fontSize: '0.75rem' }}
                    >
                        <option value="">All Status</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                    </select>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '10px' }}>
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
                padding: 0
            }}>
                <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
                    <thead>
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
                                        <button
                                            onClick={() => handleViewItem(item)}
                                            style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                            title="View"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {/* Empty rows if needed to fill space */}
                        {Array.from({ length: Math.max(0, 15 - inventoryItems.length) }).map((_, index) => (
                            <tr
                                key={`empty-${index}`}
                                style={{
                                    height: '32px',
                                    backgroundColor: (inventoryItems.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6'
                                }}
                            >
                                <td colSpan="7" style={{ padding: '4px 10px' }}>&nbsp;</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="ecl-table-footer" style={{ flexShrink: 0, marginTop: '10px' }}>
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
        </div>
    );
};

export default InventoryList;
