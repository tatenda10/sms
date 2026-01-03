import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxes,
  faPlus,
  faTshirt,
  faCogs,
  faColumns
} from '@fortawesome/free-solid-svg-icons';

// Import components
import InventoryList from './components/InventoryList';
import AddItem from './AddItem';
import IssueUniform from './IssueUniform';
import Configurations from './Configurations';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: faColumns },
    { id: 'add-item', name: 'Add Item', icon: faPlus },
    { id: 'issue-uniform', name: 'Issue Uniform', icon: faTshirt },
    { id: 'categories', name: 'Categories', icon: faCogs }
  ];

  const renderContent = () => {
    const content = (() => {
      switch (activeTab) {
        case 'dashboard':
          return <InventoryList />;
        case 'add-item':
          return <AddItem />;
        case 'issue-uniform':
          return <IssueUniform />;
        case 'categories':
          return <Configurations />;
        default:
          return <InventoryList />;
      }
    })();

    return (
      <div className="h-full overflow-hidden">
        {content}
      </div>
    );
  };

  return (
    <div className="reports-container" style={{
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      background: '#f9fafb'
    }}>
      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0, padding: '15px 30px' }}>
        <div className="report-header-content">
          <h2 className="report-title">Inventory Management</h2>
          <p className="report-subtitle">Manage school uniforms, supplies, and stock levels.</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="report-filters" style={{ flexShrink: 0, padding: '0 30px 10px 30px' }}>
        <div className="report-filters-left" style={{ overflowX: 'auto', paddingBottom: '0' }}>
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                                    flex items-center px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors duration-200
                                    ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                                `}
              >
                <FontAwesomeIcon icon={tab.icon} className={`mr-2 h-3.5 w-3.5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto" style={{
        padding: '0 30px 20px 30px'
      }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default Inventory;
