import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMoneyBillWave,
    faBed,
    faBalanceScale,
    faHistory,
    faFileInvoiceDollar,
    faHandHoldingUsd,
    faFileContract,
    faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';

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
    const [activeTab, setActiveTab] = useState('record-payment');
    const navigate = useNavigate();
    const location = useLocation();

    // Handle initial tab from state or URL logic if needed
    // For now, simple state-based switching

    const tabs = [
        { id: 'record-payment', name: 'Record Payment', icon: faMoneyBillWave },
        { id: 'boarding-fees', name: 'Boarding Fee Payments', icon: faBed },
        { id: 'outstanding-balance', name: 'Outstanding Balance', icon: faBalanceScale },
        { id: 'opening-balance', name: 'Student Opening Balance', icon: faHistory },
        { id: 'additional-fees', name: 'Additional Fees', icon: faFileInvoiceDollar },
        { id: 'waivers', name: 'Waivers', icon: faHandHoldingUsd },
        { id: 'invoice-structures', name: 'Invoice Structures', icon: faFileContract },
        { id: 'financial-record', name: 'Student Financial Record', icon: faClipboardList }
    ];

    const renderContent = () => {
        const content = (() => {
            switch (activeTab) {
                case 'record-payment':
                    return <TuitionFeesPayment />;
                case 'boarding-fees':
                    return <BoardingFeesPayment onPaymentSuccess={() => { }} />;
                case 'outstanding-balance':
                    return <StudentBalances />;
                case 'opening-balance':
                    return <ManualBalanceUpdate />;
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
        })();

        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full overflow-auto">
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
            position: 'relative'
        }}>
            {/* Report Header */}
            <div className="report-header" style={{ flexShrink: 0 }}>
                <div className="report-header-content">
                    <h2 className="report-title">Student Billing</h2>
                    <p className="report-subtitle">Manage student fee payments, balances, and financial records.</p>
                </div>
            </div>

            {/* Navigation Tabs (Acting as Filters) */}
            <div className="report-filters" style={{ flexShrink: 0, paddingBottom: '0' }}>
                <div className="report-filters-left" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                    <div className="flex space-x-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors duration-200
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
                paddingTop: '10px' // Gap requested by user earlier
            }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default StudentBilling;
