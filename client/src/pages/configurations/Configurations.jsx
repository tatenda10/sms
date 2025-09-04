import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBuilding, 
  faUserTie, 
  faCog,
  faPlus,
  faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import DepartmentManagement from './DepartmentManagement';
import JobTitleManagement from './JobTitleManagement';
import CurrencyManagement from './CurrencyManagement';

const Configurations = () => {
  const [activeTab, setActiveTab] = useState('departments');

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Configurations</h1>
            <p className="mt-1 text-xs text-gray-500">
              Manage departments, job titles, and currencies for employee assignments and accounting
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {[
            { id: 'departments', label: 'Departments', icon: faBuilding },
            { id: 'job-titles', label: 'Job Titles', icon: faUserTie },
            { id: 'currencies', label: 'Currencies', icon: faMoneyBillWave }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-xs flex items-center ${
                activeTab === tab.id
                  ? 'border-gray-700 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="mr-2 h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96 mb-12">
        {activeTab === 'departments' && <DepartmentManagement />}
        {activeTab === 'job-titles' && <JobTitleManagement />}
        {activeTab === 'currencies' && <CurrencyManagement />}
      </div>
    </div>
  );
};

export default Configurations;
