import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faBed, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

// Import fee type components
import TuitionFeesPayment from './components/TuitionFeesPayment';
import BoardingFeesPayment from './components/BoardingFeesPayment';
import OtherFeesPayment from './components/OtherFeesPayment';

const FeesPayment = () => {
  const [activeTab, setActiveTab] = useState('tuition');
  const navigate = useNavigate();

  const tabs = [
    { id: 'tuition', name: 'Tuition Fee Payments', icon: faGraduationCap },
    { id: 'boarding', name: 'Boarding Fee Payments', icon: faBed },
    { id: 'other', name: 'Other Payments', icon: faEllipsisH }
  ];

  const handlePaymentSuccess = (receiptData) => {
    // Receipt is now handled by individual components
    console.log('Payment successful:', receiptData);
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'tuition':
        return <TuitionFeesPayment />;
      case 'boarding':
        return <BoardingFeesPayment onPaymentSuccess={handlePaymentSuccess} />;
      case 'other':
        return <OtherFeesPayment />;
      default:
        return <TuitionFeesPayment />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-2 md:py-6">
      <div className="w-full px-2 md:px-4 lg:px-8">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">Fees Payment</h1>
            <p className="text-xs md:text-sm text-gray-600">Process student fee payments</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 md:mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap space-x-2 md:space-x-8 overflow-x-auto">
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

        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {/* Payment Form - Full Width */}
          <div>
            {renderActiveComponent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeesPayment;
