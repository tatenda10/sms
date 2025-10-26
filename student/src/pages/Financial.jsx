import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import BASE_URL from '../contexts/Api';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Calendar,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

const Financial = () => {
  const { student, token } = useStudentAuth();
  const [financialData, setFinancialData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch financial summary
      const summaryResponse = await fetch(`${BASE_URL}/student-financial/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to fetch financial summary');
      }

      const summaryData = await summaryResponse.json();
      setFinancialData(summaryData.data);

      // Fetch transaction history
      const transactionsResponse = await fetch(`${BASE_URL}/student-financial/payments?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setPayments(transactionsData.data.transactions);
      }

    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError(err.message || 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBalanceStatus = (balance) => {
    if (balance > 0) {
      return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
    } else if (balance < 0) {
      return { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle };
    } else {
      return { color: 'text-gray-600', bg: 'bg-gray-50', icon: Clock };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Financial Data</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchFinancialData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const balanceStatus = getBalanceStatus(financialData?.current_balance);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Information</h1>
        <p className="text-gray-600">View your account balance and payment history</p>
      </div>


      {/* Balance Display */}
      {financialData && (
        <div className="mb-6">
          <div className="bg-gray-50 p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 font-medium">Current Balance</div>
                <div className={`text-lg font-bold ${(financialData.current_balance || 0) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {formatCurrency(financialData.current_balance || 0)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {financialData.current_balance >= 0 ? 'CR' : 'DR'}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {financialData.current_balance >= 0 ? 'Credit Balance' : 'Debit Balance'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Financial Statement ({payments.length} records)
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading transactions...</div>
          </div>
        ) : payments.length > 0 ? (
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
                {payments.map((transaction, index) => (
                  <tr key={transaction.id || index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 border border-gray-200">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap border border-gray-200">
                      <div className="flex items-center">
                        <span className={`text-xs font-medium capitalize ${
                          transaction.transaction_type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.transaction_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 border border-gray-200">
                      {transaction.description || `${transaction.transaction_type} transaction`}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-right border border-gray-200">
                      {transaction.transaction_type === 'DEBIT' ? (
                        <span className="text-red-600 font-medium">
                          {formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-right border border-gray-200">
                      {transaction.transaction_type === 'CREDIT' ? (
                        <span className="text-green-600 font-medium">
                          {formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-medium border border-gray-200">
                      <span className={transaction.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(transaction.running_balance || 0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-sm">No transactions found</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Financial;
