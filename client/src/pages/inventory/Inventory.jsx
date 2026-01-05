import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTshirt, faCogs } from '@fortawesome/free-solid-svg-icons';
import { useInventory } from '../../contexts/InventoryContext';

// Import components
import InventoryList from './components/InventoryList';
import AddItem from './AddItem';
import IssueUniform from './IssueUniform';
import Configurations from './Configurations';

const Inventory = () => {
  const { activeTab, setActiveTab } = useInventory();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showIssueUniformModal, setShowIssueUniformModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const inventoryListRef = useRef(null);

  const handleOpenAddItem = () => {
    setShowAddItemModal(true);
  };

  const handleCloseAddItemModal = () => {
    setShowAddItemModal(false);
  };

  const handleOpenIssueUniform = () => {
    setShowIssueUniformModal(true);
  };

  const handleCloseIssueUniformModal = () => {
    setShowIssueUniformModal(false);
  };

  const handleOpenCategories = () => {
    setShowCategoriesModal(true);
  };

  const handleCloseCategoriesModal = () => {
    setShowCategoriesModal(false);
  };

  const handleItemAdded = () => {
    // Refresh the inventory list when an item is added
    if (inventoryListRef.current && inventoryListRef.current.refreshItems) {
      inventoryListRef.current.refreshItems();
    }
  };

  const handleUniformIssued = () => {
    // Refresh the inventory list when a uniform is issued
    if (inventoryListRef.current && inventoryListRef.current.refreshItems) {
      inventoryListRef.current.refreshItems();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <InventoryList ref={inventoryListRef} />;
      default:
        return <InventoryList ref={inventoryListRef} />;
    }
  };

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
          <h2 className="report-title">Inventory Management</h2>
          <p className="report-subtitle">Manage school uniforms, supplies, and stock levels.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenAddItem}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Item
          </button>
          <button
            onClick={handleOpenIssueUniform}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faTshirt} />
            Issue Uniform
          </button>
          <button
            onClick={handleOpenCategories}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faCogs} />
            Categories
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="report-content-container ecl-table-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        overflow: 'auto', 
        minHeight: 0,
        padding: 0,
        height: '100%'
      }}>
        {renderContent()}
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="modal-overlay" onClick={handleCloseAddItemModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Add Item</h3>
              <button className="modal-close-btn" onClick={handleCloseAddItemModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <AddItem onClose={handleCloseAddItemModal} onItemAdded={handleItemAdded} />
            </div>
          </div>
        </div>
      )}

      {/* Issue Uniform Modal */}
      {showIssueUniformModal && (
        <div className="modal-overlay" onClick={handleCloseIssueUniformModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Issue Uniform</h3>
              <button className="modal-close-btn" onClick={handleCloseIssueUniformModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <IssueUniform onClose={handleCloseIssueUniformModal} onUniformIssued={handleUniformIssued} />
            </div>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {showCategoriesModal && (
        <div className="modal-overlay" onClick={handleCloseCategoriesModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Categories</h3>
              <button className="modal-close-btn" onClick={handleCloseCategoriesModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <Configurations onClose={handleCloseCategoriesModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
