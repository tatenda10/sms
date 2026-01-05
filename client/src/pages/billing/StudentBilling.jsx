import React, { useRef } from 'react';
import { useBilling } from '../../contexts/BillingContext';

// Import components
import TuitionFeesPayment from '../fees/components/TuitionFeesPayment'; // Used directly
import BoardingFeesPayment from '../fees/components/BoardingFeesPayment';
import StudentBalances from '../students/StudentBalances';
import ManualBalanceUpdate from '../students/ManualBalanceUpdate'; // For Student Opening Balance
import AdditionalFees from './AdditionalFees';
import Waivers from '../waivers/Waivers';
import InvoiceStructures from '../fees/InvoiceStructures';
import StudentFinancialRecord from '../fees/StudentFinancialRecord';

const StudentBilling = () => {
    const { activeTab } = useBilling();
    const tuitionPaymentRef = useRef(null);
    const openingBalanceRef = useRef(null);

    const renderContent = () => {
        switch (activeTab) {
            case 'record-payment':
                return <TuitionFeesPayment ref={tuitionPaymentRef} />;
            case 'boarding-fees':
                return <BoardingFeesPayment onPaymentSuccess={() => { }} />;
            case 'outstanding-balance':
                return <StudentBalances />;
            case 'opening-balance':
                return <ManualBalanceUpdate ref={openingBalanceRef} />;
            case 'additional-fees':
                return <AdditionalFees />;
            case 'waivers':
                return <Waivers />;
            case 'invoice-structures':
                return <InvoiceStructures />;
            case 'financial-record':
                return <StudentFinancialRecord />;
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
            {/* Record Payment Button - Only show for record-payment tab */}
            {activeTab === 'record-payment' && (
                <div className="report-header" style={{ flexShrink: 0 }}>
                    <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                        <button
                            onClick={() => {
                                if (tuitionPaymentRef.current) {
                                    tuitionPaymentRef.current.openModal();
                                }
                            }}
                            className="btn-checklist"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Record Payment
                        </button>
                    </div>
                </div>
            )}

            {/* Render Content - Each component handles its own layout */}
            {renderContent()}
        </div>
    );
};

export default StudentBilling;
