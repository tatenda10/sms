import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, 
    faFilter, 
    faDownload, 
    faPrint,
    faEye,
    faCalendarAlt,
    faDollarSign,
    faCreditCard,
    faMinus,
    faPlus
} from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';

const StudentStatement = () => {
    const { token } = useAuth();
    const [studentRegNumber, setStudentRegNumber] = useState('');
    const [student, setStudent] = useState(null);
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchParams, setSearchParams] = useState({
        start_date: '',
        end_date: '',
        page: 1,
        limit: 50
    });
    const [pagination, setPagination] = useState({});

    // Search for student
    const searchStudent = async () => {
        console.log('🔍 Starting student search for:', studentRegNumber);
        
        if (!studentRegNumber.trim()) {
            setError('Please enter a student registration number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('📡 Making API call to:', `${BASE_URL}/students/search?query=${studentRegNumber}`);
            console.log('📡 Making balance API call to:', `${BASE_URL}/student-balances/${studentRegNumber}`);
            // Get student details
            const studentResponse = await axios.get(`${BASE_URL}/students/search?query=${studentRegNumber}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Student response:', studentResponse.data);
            setStudent(studentResponse.data.data[0]); // Get first student from search results

            // Get student balance
            const balanceResponse = await axios.get(`${BASE_URL}/student-balances/${studentRegNumber}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Balance response:', balanceResponse.data);
            setBalance(balanceResponse.data.data);

            // Get student statement
            await fetchStatement();

        } catch (error) {
            console.error('Error searching student:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            
            let errorMessage = 'Failed to find student';
            if (error.response?.status === 403) {
                errorMessage = 'Access denied. You may not have permission to view student information.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Student not found. Please check the registration number.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            setError(errorMessage);
            setStudent(null);
            setBalance(null);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch student statement
    const fetchStatement = async () => {
        if (!studentRegNumber) return;

        try {
            const params = new URLSearchParams({
                page: searchParams.page,
                limit: searchParams.limit,
                ...(searchParams.start_date && { start_date: searchParams.start_date }),
                ...(searchParams.end_date && { end_date: searchParams.end_date })
            });

            const response = await axios.get(`${BASE_URL}/student-balances/${studentRegNumber}/statement?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(response.data.data.transactions);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error('Error fetching statement:', error);
            setError('Failed to fetch student statement');
        }
    };

    // Handle search params change
    const handleSearchParamsChange = (field, value) => {
        setSearchParams(prev => ({
            ...prev,
            [field]: value,
            page: 1 // Reset to first page when filters change
        }));
    };

    // Apply filters
    const applyFilters = () => {
        fetchStatement();
    };

    // Handle pagination
    const handlePageChange = (newPage) => {
        setSearchParams(prev => ({ ...prev, page: newPage }));
    };

    // Format amount with color
    const formatAmount = (amount, type) => {
        const formattedAmount = parseFloat(amount).toFixed(2);
        const color = type === 'CREDIT' ? 'text-green-600' : 'text-red-600';
        const icon = type === 'CREDIT' ? faPlus : faMinus;
        
        return (
            <span className={`font-semibold ${color} flex items-center gap-1`}>
                <FontAwesomeIcon icon={icon} className="text-xs" />
                ${formattedAmount}
            </span>
        );
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get transaction type color
    const getTransactionTypeColor = (type) => {
        return type === 'CREDIT' 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-red-100 text-red-800 border-red-200';
    };

    useEffect(() => {
        if (studentRegNumber && student) {
            fetchStatement();
        }
    }, [searchParams.page, searchParams.limit]);

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Student Statement</h1>

                {/* Student Search */}
                <div className="mb-6">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Student Registration Number
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={studentRegNumber}
                                    onChange={(e) => setStudentRegNumber(e.target.value)}
                                    placeholder="Enter registration number"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={searchStudent}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <FontAwesomeIcon icon={faSearch} className="mr-2" />
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {/* Student Info and Balance */}
                {student && balance && (
                    <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Student Info */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-blue-800 mb-2">Student Information</h3>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Name:</span> {student.Name} {student.Surname}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Reg No:</span> {student.RegNumber}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Gender:</span> {student.Gender}
                                </p>
                            </div>

                            {/* Current Balance */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-800 mb-2">Current Balance</h3>
                                <div className={`text-2xl font-bold ${balance.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${parseFloat(balance.current_balance).toFixed(2)}
                                </div>
                                <p className="text-sm text-gray-500">
                                    {balance.current_balance >= 0 ? 'Credit Balance' : 'Outstanding Balance'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Last updated: {formatDate(balance.last_updated)}
                                </p>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-green-800 mb-2">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button className="w-full px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                                        <FontAwesomeIcon icon={faDownload} className="mr-1" />
                                        Download Statement
                                    </button>
                                    <button className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                        <FontAwesomeIcon icon={faPrint} className="mr-1" />
                                        Print Statement
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                {student && (
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-3">Filter Transactions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={searchParams.start_date}
                                    onChange={(e) => handleSearchParamsChange('start_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={searchParams.end_date}
                                    onChange={(e) => handleSearchParamsChange('end_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Records per page</label>
                                <select
                                    value={searchParams.limit}
                                    onChange={(e) => handleSearchParamsChange('limit', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={applyFilters}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <FontAwesomeIcon icon={faFilter} className="mr-2" />
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transactions Table */}
                {student && transactions.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Term/Year
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Class/Hostel
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {formatDate(transaction.transaction_date)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getTransactionTypeColor(transaction.transaction_type)}`}>
                                                {transaction.transaction_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {formatAmount(transaction.amount, transaction.transaction_type)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                                            {transaction.description}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {transaction.term && transaction.academic_year 
                                                ? `${transaction.term} ${transaction.academic_year}`
                                                : '-'
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {transaction.class_name || transaction.hostel_name || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-1 text-sm text-gray-700">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* No transactions message */}
                {student && transactions.length === 0 && !loading && (
                    <div className="text-center py-8">
                        <FontAwesomeIcon icon={faEye} className="text-4xl text-gray-400 mb-4" />
                        <p className="text-gray-500">No transactions found for this student.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentStatement;
