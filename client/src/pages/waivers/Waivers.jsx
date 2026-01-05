import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTag } from '@fortawesome/free-solid-svg-icons';

// Import waiver components
import WaiverManagement from './WaiverManagement';
import ProcessWaiver from './ProcessWaiver';
import WaiverCategories from './WaiverCategories';

const Waivers = () => {
  const processWaiverRef = useRef(null);
  const waiverCategoriesRef = useRef(null);
  const waiverManagementRef = useRef(null);

  const handleWaiverProcessed = () => {
    // Refresh the waiver table
    if (waiverManagementRef.current) {
      waiverManagementRef.current.refresh();
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
          <h2 className="report-title">Waivers</h2>
          <p className="report-subtitle">Manage student fee waivers and categories.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              if (waiverCategoriesRef.current) {
                waiverCategoriesRef.current.openModal();
              }
            }}
            className="btn-checklist"
            style={{ backgroundColor: '#475569' }}
          >
            <FontAwesomeIcon icon={faTag} />
            Categories
          </button>
          <button
            onClick={() => {
              if (processWaiverRef.current) {
                processWaiverRef.current.openModal();
              }
            }}
            className="btn-checklist"
          >
            <FontAwesomeIcon icon={faPlus} />
            Process Waiver
          </button>
        </div>
      </div>

      {/* Main Content - Waiver Management Table */}
      <WaiverManagement ref={waiverManagementRef} />
      
      {/* Process Waiver Modal */}
      <ProcessWaiver ref={processWaiverRef} onWaiverProcessed={handleWaiverProcessed} />
      
      {/* Waiver Categories Modal */}
      <WaiverCategories ref={waiverCategoriesRef} />
    </div>
  );
};

export default Waivers;
