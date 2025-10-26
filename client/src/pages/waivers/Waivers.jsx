import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTag, 
  faFileAlt, 
  faList,
  faCog
} from '@fortawesome/free-solid-svg-icons';

// Import waiver components
import WaiverCategories from './WaiverCategories';
import ProcessWaiver from './ProcessWaiver';
import WaiverManagement from './WaiverManagement';

const Waivers = () => {
  const [activeTab, setActiveTab] = useState('process');

  const tabs = [
    { id: 'process', name: 'Process Waiver', icon: faFileAlt },
    { id: 'management', name: 'View Waivers', icon: faList },
    { id: 'categories', name: 'Categories', icon: faTag }
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'process':
        return <ProcessWaiver />;
      case 'management':
        return <WaiverManagement />;
      case 'categories':
        return <WaiverCategories />;
      default:
        return <ProcessWaiver />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-2">
      <div className="w-full px-2 md:px-4">
        {/* Header */}
        <div className="mb-3">
          <div>
            <h1 className="text-base font-bold text-gray-900">Waiver Management</h1>
            <p className="text-xs text-gray-600">Manage student fee waivers and categories</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-3">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap space-x-2 md:space-x-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-xs flex items-center space-x-1 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FontAwesomeIcon icon={tab.icon} className="text-xs" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Content - Full Width */}
          <div>
            {renderActiveComponent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waivers;
