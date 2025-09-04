import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUserGraduate, 
  faDollarSign,
  faFileInvoice,
  faReceipt,
  faEye,
  faTimes,
  faCheck,
  faExclamationTriangle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';
import axios from 'axios';
import ErrorModal from '../../../components/ErrorModal';

const StudentFinancialRecord = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentFinancialData();
    }
  }, [selectedStudent]);

  const searchStudents = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/students/search?query=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error searching students:', error);
      setStudents([]);
      setErrorMessage('Failed to search students');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudents([]);
    setSearchTerm('');
    setFinancialData(null);
    setTransactions([]);
  };

  const fetchStudentFinancialData = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    try {
      // Fetch financial summary
      const summaryResponse = await axios.get(
        `${BASE_URL}/student-financial-records/${selectedStudent.RegNumber}/summary`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Fetch all transactions
      const transactionsResponse = await axios.get(
        `${BASE_URL}/student-financial-records/${selectedStudent.RegNumber}/transactions`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Financial Summary:', summaryResponse.data.data);
      console.log('Transactions:', transactionsResponse.data.data);
      
      // Debug: Log boarding transactions specifically
      if (transactionsResponse.data.data && Array.isArray(transactionsResponse.data.data)) {
        const boardingTransactions = transactionsResponse.data.data.filter(t => t.fee_type === 'boarding');
        console.log('Boarding transactions found:', boardingTransactions.length);
        boardingTransactions.forEach((transaction, index) => {
          console.log(`Boarding transaction ${index + 1}:`, {
            id: transaction.id,
            amount: transaction.amount,
            transaction_type: transaction.transaction_type,
            notes: transaction.notes,
            fee_type: transaction.fee_type
          });
        });
      }
      
      // Detailed logging for transactions
      if (transactionsResponse.data.data && Array.isArray(transactionsResponse.data.data)) {
        console.log('=== DETAILED TRANSACTION ANALYSIS ===');
        console.log('Total transactions received:', transactionsResponse.data.data.length);
        
        // Log each transaction with its key fields
        transactionsResponse.data.data.forEach((transaction, index) => {
          console.log(`Transaction ${index + 1}:`, {
            id: transaction.id,
            transaction_type: transaction.transaction_type,
            amount: transaction.amount,
            fee_type: transaction.fee_type,
            notes: transaction.notes,
            payment_date: transaction.payment_date,
            running_balance: transaction.running_balance
          });
        });
        
        // Check for transaction_type field
        const hasTransactionType = transactionsResponse.data.data.every(t => t.transaction_type !== undefined);
        console.log('All transactions have transaction_type field:', hasTransactionType);
        
        // Count transaction types
        const typeCounts = transactionsResponse.data.data.reduce((acc, t) => {
          acc[t.transaction_type] = (acc[t.transaction_type] || 0) + 1;
          return acc;
        }, {});
        console.log('Transaction type counts:', typeCounts);
        
        // Check for DEBIT and CREDIT transactions
        const debitTransactions = transactionsResponse.data.data.filter(t => t.transaction_type === 'DEBIT');
        const creditTransactions = transactionsResponse.data.data.filter(t => t.transaction_type === 'CREDIT');
        console.log('DEBIT transactions count:', debitTransactions.length);
        console.log('CREDIT transactions count:', creditTransactions.length);
        console.log('=== END ANALYSIS ===');
      } else {
        console.log('No transactions data or not an array:', transactionsResponse.data.data);
      }

      setFinancialData(summaryResponse.data.data || {});
      setTransactions(transactionsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error URL:', error.config?.url);
      setErrorMessage(`Failed to fetch financial data: ${error.response?.data?.message || error.message}`);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'tuition':
        return faFileInvoice;
      case 'boarding':
        return faUserGraduate;
      case 'other':
        return faReceipt;
      default:
        return faDollarSign;
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'tuition':
        return 'text-blue-600';
      case 'boarding':
        return 'text-green-600';
      case 'other':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <style>
        {`
          @media print {
            body { margin: 0; }
            .print-break { page-break-before: always; }
            table { page-break-inside: avoid; }
            .print-header { display: block !important; }
            .print-hidden { display: none !important; }
          }
        `}
      </style>
      <div className="bg-white border border-gray-200 p-4 print:p-0">
        {/* Print Header */}
        <div className="hidden print:block mb-6 border-b border-gray-300 pb-4">
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Student Financial Statement</h1>
            <p className="text-xs text-gray-600 mt-1">Generated on {new Date().toLocaleDateString()}</p>
          </div>
          {selectedStudent && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium">Student:</span> {selectedStudent.Name} {selectedStudent.Surname}
              </div>
              <div>
                <span className="font-medium">Registration No:</span> {selectedStudent.RegNumber}
              </div>
              <div>
                <span className="font-medium">Class:</span> {selectedStudent.ClassName || 'Not Assigned'}
              </div>
              <div>
                <span className="font-medium">Academic Year:</span> 2025
              </div>
            </div>
          )}
        </div>

        <h2 className="text-sm font-medium text-gray-900 mb-4 print:text-base print:hidden">Student Financial Record</h2>

        {/* Student Search */}
        <div className="mb-6 print:hidden">
          <h3 className="text-xs font-medium text-gray-900 mb-2">Search Student</h3>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter student name or registration number..."
                className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
            <button
              type="button"
              onClick={searchStudents}
              disabled={loading}
              className="bg-gray-600 text-white px-3 py-1.5 text-xs hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {students.length > 0 && (
            <div className="mt-2 border border-gray-200 max-h-32 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.RegNumber}
                  onClick={() => selectStudent(student)}
                  className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 text-xs">
                    {student.Name} {student.Surname}
                  </div>
                  <div className="text-xs text-gray-500">
                    Reg: {student.RegNumber} | Class: {student.ClassName || 'Not Assigned'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedStudent && (
            <div className="mt-3 bg-gray-50 p-3 border border-gray-200">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-1 font-medium">{selectedStudent.Name} {selectedStudent.Surname}</span>
                </div>
                <div>
                  <span className="text-gray-600">Registration No:</span>
                  <span className="ml-1 font-medium">{selectedStudent.RegNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Class:</span>
                  <span className="ml-1 font-medium">{selectedStudent.ClassName || 'Not Assigned'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Academic Year:</span>
                  <span className="ml-1 font-medium">2025</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Balance Display */}
        {financialData && (
          <div className="mb-6">
            <div className="bg-gray-50 p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-600 font-medium">Current Balance</div>
                  <div className={`text-lg font-bold ${(financialData.balance || 0) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {formatCurrency(financialData.balance || 0)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">
                    {financialData.balance >= 0 ? 'CR' : 'DR'}
                  </div>
                  <div className="text-xs font-medium text-gray-900">
                    {financialData.balance >= 0 ? 'Credit Balance' : 'Debit Balance'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {selectedStudent && (
          <div>
            <h3 className="text-xs font-medium text-gray-900 mb-3">
              Financial Statement ({transactions.length} records)
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading transactions...</div>
              </div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        Description
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        DR
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        CR
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => (
                      <tr key={transaction.id || index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 border border-gray-200">
                          {new Date(transaction.payment_date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border border-gray-200">
                          <div className="flex items-center">
                            <FontAwesomeIcon 
                              icon={getTransactionTypeIcon(transaction.fee_type)} 
                              className={`text-xs mr-1 ${getTransactionTypeColor(transaction.fee_type)}`} 
                            />
                            <span className={`text-xs font-medium capitalize ${getTransactionTypeColor(transaction.fee_type)}`}>
                              {transaction.fee_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-900 border border-gray-200">
                          {transaction.notes || `${transaction.fee_type} payment`}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right border border-gray-200">
                          {/* DR: Charges/Invoices (what student owes) */}
                          {(() => {
                            console.log('Rendering DR column for transaction:', {
                              id: transaction.id,
                              transaction_type: transaction.transaction_type,
                              amount: transaction.amount,
                              isDebit: transaction.transaction_type === 'DEBIT'
                            });
                            return transaction.transaction_type === 'DEBIT' ? (
                              <span className="text-red-600 font-medium">
                                {formatCurrency(Math.abs(transaction.amount), transaction.currency_symbol)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right border border-gray-200">
                          {/* CR: Payments (what student has paid) */}
                          {(() => {
                            console.log('Rendering CR column for transaction:', {
                              id: transaction.id,
                              transaction_type: transaction.transaction_type,
                              amount: transaction.amount,
                              isCredit: transaction.transaction_type === 'CREDIT'
                            });
                            return transaction.transaction_type === 'CREDIT' ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(Math.abs(transaction.amount), transaction.currency_symbol)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-medium border border-gray-200">
                          <span className={transaction.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(transaction.running_balance || 0, transaction.currency_symbol)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faInfoCircle} className="text-gray-400 text-2xl mb-2" />
                <div className="text-gray-500 text-sm">No transactions found</div>
              </div>
            )}
          </div>
        )}

        {/* Error Modal */}
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          message={errorMessage}
        />
      </div>
    </>
  );
};

export default StudentFinancialRecord;
