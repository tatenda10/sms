import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, 
    faArrowRight, 
    faArrowLeft, 
    faDollarSign, 
    faBuilding,
    faExchangeAlt,
    faMinus,
    faEye,
    faSearch,
    faFilter,
    faChevronLeft,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const CashBank = () => {
    const { token } = useAuth();
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        reference: '',
        currency_id: 1
    });

    useEffect(() => {
        loadBalances();
    }, []);

    const loadBalances = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${BASE_URL}/accounting/cash-bank/balances`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setBalances(response.data.data);
                setError('');
            } else {
                setError('Failed to load account balances');
            }
        } catch (error) {
            console.error('Error loading balances:', error);
            setError('Error loading account balances. Please try again.');
            setBalances([]);
        } finally {
            setLoading(false);
        }
    };

    const loadTransactions = async (accountId, page = 1) => {
        setTransactionsLoading(true);
        try {
            const params = {
                page: page,
                limit: 10,
                search: searchTerm,
                startDate: '',
                endDate: '',
                transactionType: ''
            };

            const response = await axios.get(`${BASE_URL}/accounting/general-ledger/journal-entries/account/${accountId}`, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;
            setTransactions(data.data || []);
            setTotalPages(data.pagination?.total_pages || 1);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setTransactionsLoading(false);
        }
    };

    const viewAccountDetails = (account) => {
        setSelectedAccount(account);
        loadTransactions(account.id);
    };

    const openModal = (type) => {
        setModalType(type);
        setShowModal(true);
        setFormData({
            amount: '',
            description: '',
            reference: '',
            currency_id: 1
        });
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setFormData({
            amount: '',
            description: '',
            reference: '',
            currency_id: 1
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.amount || !formData.description) {
            alert('Amount and description are required');
            return;
        }

        try {
            let endpoint = '';
            switch (modalType) {
                case 'cash-injection':
                    endpoint = '/accounting/cash-bank/cash/injection';
                    break;
                case 'cash-withdrawal':
                    endpoint = '/accounting/cash-bank/cash/withdrawal';
                    break;
                case 'bank-deposit':
                    endpoint = '/accounting/cash-bank/bank/deposit';
                    break;
                case 'bank-withdrawal':
                    endpoint = '/accounting/cash-bank/bank/withdrawal';
                    break;
                case 'cash-to-bank':
                    endpoint = '/accounting/cash-bank/transfer/cash-to-bank';
                    break;
                case 'bank-to-cash':
                    endpoint = '/accounting/cash-bank/transfer/bank-to-cash';
                    break;
                default:
                    return;
            }

            const response = await axios.post(`${BASE_URL}${endpoint}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;
            
            if (data.success) {
                alert('Transaction recorded successfully!');
                closeModal();
                loadBalances();
                if (selectedAccount) {
                    loadTransactions(selectedAccount.id, currentPage);
                }
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error recording transaction:', error);
            alert('Error recording transaction');
        }
    };

    const getModalTitle = () => {
        switch (modalType) {
            case 'cash-injection': return 'Cash Injection';
            case 'cash-withdrawal': return 'Cash Withdrawal';
            case 'bank-deposit': return 'Bank Deposit';
            case 'bank-withdrawal': return 'Bank Withdrawal';
            case 'cash-to-bank': return 'Cash to Bank Transfer';
            case 'bank-to-cash': return 'Bank to Cash Transfer';
            default: return 'Transaction';
        }
    };

    const getModalDescription = () => {
        switch (modalType) {
            case 'cash-injection': return 'Add cash to the business';
            case 'cash-withdrawal': return 'Take cash out of the business';
            case 'bank-deposit': return 'Deposit money into bank account';
            case 'bank-withdrawal': return 'Withdraw money from bank account';
            case 'cash-to-bank': return 'Transfer cash to bank account';
            case 'bank-to-cash': return 'Transfer money from bank to cash';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="px-2 md:px-4 lg:px-8 w-full max-w-full">
            {/* Header */}
            <div className="mb-4 md:mb-8 border-b border-gray-200 pb-3 md:pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                        <div className="text-base md:text-lg font-bold text-gray-900 mb-1">
                            Cash & Bank Management
                        </div>
                        <div className="text-xs text-gray-500">Manage cash and bank operations</div>
                    </div>
                    <button
                        onClick={loadBalances}
                        className="mt-2 md:mt-0 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Quick Actions - Moved to top */}
            <div className="mb-4 md:mb-8">
                <div className="mb-2 text-xs font-semibold text-gray-700">Quick Actions</div>
                <div className="border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 p-3 md:p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            <button
                                onClick={() => openModal('cash-injection')}
                                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-1" />
                                Cash In
                            </button>
                            <button
                                onClick={() => openModal('cash-withdrawal')}
                                className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-xs"
                            >
                                <FontAwesomeIcon icon={faMinus} className="mr-1" />
                                Cash Out
                            </button>
                            <button
                                onClick={() => openModal('bank-deposit')}
                                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-1" />
                                Bank In
                            </button>
                            <button
                                onClick={() => openModal('bank-withdrawal')}
                                className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-xs"
                            >
                                <FontAwesomeIcon icon={faMinus} className="mr-1" />
                                Bank Out
                            </button>
                            <button
                                onClick={() => openModal('cash-to-bank')}
                                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                            >
                                <FontAwesomeIcon icon={faArrowRight} className="mr-1" />
                                Cash→Bank
                            </button>
                            <button
                                onClick={() => openModal('bank-to-cash')}
                                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
                                Bank→Cash
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {!selectedAccount ? (
                <>
                    {/* Error Message */}
                    {error && (
                        <div className="mb-3 md:mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <FontAwesomeIcon icon={faMinus} className="h-4 w-4 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-xs font-medium text-red-800">Error</h3>
                                    <div className="mt-1 text-xs text-red-700">
                                        <p>{error}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account Balances */}
                    <div className="mb-4 md:mb-8">
                        <div className="mb-2 text-xs font-semibold text-gray-700">Cash & Bank Accounts</div>
                        <div className="border border-gray-200 overflow-hidden">
                            {loading ? (
                                <div className="p-3 md:p-4 text-xs text-gray-500">Loading accounts...</div>
                            ) : balances.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full divide-y divide-gray-200 text-xs" style={{ minWidth: '400px' }}>
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider">Account</th>
                                                <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider">Type</th>
                                                <th className="px-2 md:px-3 py-2 text-right font-medium tracking-wider">Balance</th>
                                                <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider">Currency</th>
                                                <th className="px-2 md:px-3 py-2 text-center font-medium tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {balances.map((account) => (
                                                <tr key={account.id} className="hover:bg-gray-50">
                                                    <td className="px-2 md:px-3 py-2 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon 
                                                                icon={account.account_name.toLowerCase().includes('cash') ? faDollarSign : faBuilding}
                                                                className="mr-2 text-blue-600 h-3 w-3 flex-shrink-0"
                                                            />
                                                            <div>
                                                                <div className="text-xs font-medium text-gray-900">{account.account_name}</div>
                                                                <div className="text-xs text-gray-500">{account.code}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 md:px-3 py-2 whitespace-nowrap text-xs text-gray-500">{account.account_type}</td>
                                                    <td className="px-2 md:px-3 py-2 whitespace-nowrap text-right">
                                                        <span className="text-xs font-medium text-gray-900">{account.current_balance.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-2 md:px-3 py-2 whitespace-nowrap text-xs text-gray-500">{account.currency_code}</td>
                                                    <td className="px-2 md:px-3 py-2 whitespace-nowrap text-center">
                                                        <button
                                                            onClick={() => viewAccountDetails(account)}
                                                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                                                        >
                                                            <FontAwesomeIcon icon={faEye} className="mr-1" />
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FontAwesomeIcon icon={faDollarSign} className="mx-auto h-8 w-8 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Cash/Bank Accounts Found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Cash and Bank accounts need to be set up in the Chart of Accounts first.
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                        Please ensure you have accounts with "Cash" or "Bank" in their names in the Chart of Accounts.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </>
            ) : (
                /* Account Details View */
                <div>
                    {/* Account Info Header */}
                    <div className="mb-4 md:mb-8 border-b border-gray-200 pb-3 md:pb-4">
                        <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
                            <div className="flex-1">
                                <div className="flex items-center mb-2">
                                    <FontAwesomeIcon 
                                        icon={selectedAccount.account_name.toLowerCase().includes('cash') ? faDollarSign : faBuilding}
                                        className="text-lg text-blue-600 mr-3"
                                    />
                                    <div>
                                        <div className="text-base md:text-lg font-bold text-gray-900">
                                            {selectedAccount.account_name}
                                        </div>
                                        <div className="text-xs text-gray-500">{selectedAccount.code}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 mb-1">{selectedAccount.account_type}</div>
                                <div className="text-xs text-gray-500">Currency: {selectedAccount.currency_code}</div>
                            </div>
                            <button
                                onClick={() => setSelectedAccount(null)}
                                className="mt-2 md:mt-0 px-3 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-xs"
                            >
                                Back to Overview
                            </button>
                        </div>
                    </div>

                    {/* Account Balance */}
                    <div className="mb-4 md:mb-8">
                        <div className="mb-2 text-xs font-semibold text-gray-700">Account Balance</div>
                        <div className="border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 p-3 md:p-4">
                                <div className="text-center">
                                    <div className="text-2xl md:text-3xl font-bold text-gray-900">
                                        {selectedAccount.current_balance.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-500">Current Balance ({selectedAccount.currency_code})</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Section */}
                    <div className="mb-4 md:mb-8">
                        <div className="mb-3 md:mb-4">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Transaction History</div>
                            <p className="text-xs text-gray-500 mb-4">Transactions affecting this account</p>
                        </div>

                        {/* Search Filter */}
                        <div className="bg-gray-50 p-3 md:p-4 rounded-lg mb-3 md:mb-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                                    <div className="relative">
                                        <FontAwesomeIcon 
                                            icon={faSearch} 
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search transactions..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={() => loadTransactions(selectedAccount.id, 1)}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs"
                                    >
                                        Search
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="border border-gray-200 overflow-hidden">
                            {transactionsLoading ? (
                                <div className="p-3 md:p-4 text-xs text-gray-500">Loading transactions...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full divide-y divide-gray-200 text-xs" style={{ minWidth: '500px' }}>
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider">Date</th>
                                                <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider">Description</th>
                                                <th className="px-2 md:px-3 py-2 text-right font-medium tracking-wider">DR</th>
                                                <th className="px-2 md:px-3 py-2 text-right font-medium tracking-wider">CR</th>
                                                        <th className="px-2 md:px-3 py-2 text-left font-medium tracking-wider">Reference</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-2 md:px-3 py-4 text-center text-gray-500">
                                                        No transactions found
                                                    </td>
                                                </tr>
                                            ) : (
                                                transactions.map((transaction, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-2 md:px-3 py-2 whitespace-nowrap text-gray-900">
                                                            {new Date(transaction.transaction_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-2 md:px-3 py-2 text-gray-900">
                                                            <div className="flex items-center">
                                                                <FontAwesomeIcon 
                                                                    icon={faDollarSign} 
                                                                    className="mr-2 text-gray-400 h-3 w-3 flex-shrink-0" 
                                                                />
                                                                <div>
                                                                    <div className="text-xs font-medium">{transaction.description}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 md:px-3 py-2 whitespace-nowrap text-right font-medium text-red-600">
                                                            {transaction.debit_amount > 0 ? `$${parseFloat(transaction.debit_amount || 0).toFixed(2)}` : '-'}
                                                        </td>
                                                        <td className="px-2 md:px-3 py-2 whitespace-nowrap text-right font-medium text-green-600">
                                                            {transaction.credit_amount > 0 ? `$${parseFloat(transaction.credit_amount || 0).toFixed(2)}` : '-'}
                                                        </td>
                                                        <td className="px-2 md:px-3 py-2 whitespace-nowrap text-gray-500">
                                                            {transaction.reference || '-'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Empty State */}
                            {!transactionsLoading && transactions.length === 0 && (
                                <div className="text-center py-8">
                                    <FontAwesomeIcon icon={faDollarSign} className="mx-auto h-8 w-8 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {searchTerm ? 'Try adjusting your search.' : 'No transactions have been recorded for this account yet.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-3 md:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="text-xs text-gray-700 text-center sm:text-left">
                                    Showing page {currentPage} of {totalPages}
                                </div>
                                <div className="flex justify-center sm:justify-end space-x-2">
                                    <button
                                        onClick={() => loadTransactions(selectedAccount.id, currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => loadTransactions(selectedAccount.id, currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Transaction Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-4 md:p-6">
                            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">{getModalTitle()}</h3>
                            <p className="text-xs text-gray-500 mb-4">{getModalDescription()}</p>
                            
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-3 md:space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Amount *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                                            placeholder="Enter amount"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Description *
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                                            placeholder="Enter description"
                                            rows="3"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Reference Number
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.reference}
                                            onChange={(e) => setFormData({...formData, reference: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                                            placeholder="Enter reference number (optional)"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 md:mt-6">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="w-full sm:w-auto px-3 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs"
                                    >
                                        Record Transaction
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashBank;

