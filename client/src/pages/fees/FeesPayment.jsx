import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faBed, faEllipsisH } from '@fortawesome/free-solid-svg-icons';

// Import fee type components
import TuitionFeesPayment from './components/TuitionFeesPayment';
import BoardingFeesPayment from './components/BoardingFeesPayment';
import OtherFeesPayment from './components/OtherFeesPayment';

const FeesPayment = () => {
  const [activeTab, setActiveTab] = useState('tuition');

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
          <h2 className="report-title">Fees Payment</h2>
          <p className="report-subtitle">Process student fee payments.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          <div className="filter-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  border: `1px solid ${activeTab === tab.id ? '#2563eb' : 'var(--border-color)'}`,
                  borderRadius: '4px',
                  background: activeTab === tab.id ? '#2563eb' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }
                }}
              >
                <FontAwesomeIcon icon={tab.icon} style={{ fontSize: '0.7rem' }} />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="report-content-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        overflow: 'auto', 
        minHeight: 0,
        padding: '20px 30px'
      }}>
        {renderActiveComponent()}
      </div>
    </div>
  );
};

export default FeesPayment;
