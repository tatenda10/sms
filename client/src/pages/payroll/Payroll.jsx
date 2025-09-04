import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faFileInvoiceDollar, 
  faCalendarAlt, 
  faDownload,
  faPrint,
  faPlus,
  faEye,
  faCheck,
  faTimes,
  faMoneyBillWave,
  faCalculator,
  faPlay
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const Payroll = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for payroll data
  const [payrollSummary, setPayrollSummary] = useState({
    total_employees: 0,
    current_month_payroll: 0,
    pending_payslips: 0,
    processed_payslips: 0
  });
  
  const [recentPayrolls, setRecentPayrolls] = useState([]);
  const [showRunPayrollModal, setShowRunPayrollModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Run payroll form
  const [runPayrollForm, setRunPayrollForm] = useState({
    pay_period: new Date().toISOString().slice(0, 7),
    pay_date: new Date().toISOString().split('T')[0],
    bank_account_id: '',
    payment_method: 'Bank Transfer',
    reference: '',
    notes: ''
  });

  // Generate auto reference
  const generateReference = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    return `PAY-${year}${month}${day}-${time}`;
  };

  const [bankAccounts, setBankAccounts] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    loadPayrollData();
    loadBankAccounts();
    loadPayslips();
  }, []);

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${BASE_URL}/payroll/summary`, {
        headers: authHeaders
      });
      
             if (response.data.success) {
         setPayrollSummary({
           total_employees: response.data.data.total_employees,
           current_month_payroll: response.data.data.current_month_payroll,
           pending_payslips: response.data.data.pending_payslips,
           processed_payslips: response.data.data.processed_payslips
         });
         
         setRecentPayrolls(response.data.data.recent_payrolls || []);
         setCurrencies(response.data.data.currencies || []);
       } else {
         setError('Failed to load payroll data');
       }
    } catch (err) {
      console.error('Error loading payroll data:', err);
      setError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };



  const loadBankAccounts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/payroll/bank-accounts`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setBankAccounts(response.data.data);
      } else {
        setError('Failed to load bank accounts');
      }
    } catch (err) {
      console.error('Error loading bank accounts:', err);
      setError('Failed to load bank accounts');
    }
  };

  const loadPayslips = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/payroll/payslips?limit=5`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setPayslips(response.data.data);
      } else {
        setError('Failed to load payslips');
      }
    } catch (err) {
      console.error('Error loading payslips:', err);
      setError('Failed to load payslips');
    }
  };





  const handleRunPayroll = async () => {
    try {
      if (!runPayrollForm.bank_account_id) {
        setError('Please select a bank account');
        return;
      }

      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${BASE_URL}/payroll/runs/run`, runPayrollForm, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setShowRunPayrollModal(false);
        setSuccessData(response.data.data);
        setShowSuccessModal(true);
        loadPayrollData();
        loadPayslips();
      } else {
        setError(response.data.message || 'Failed to run payroll');
      }
    } catch (err) {
      console.error('Error running payroll:', err);
      setError('Failed to run payroll');
    } finally {
      setLoading(false);
    }
  };



  const formatCurrency = (amount, currencyCode = 'USD') => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0
      }).format(amount);
    }
    
    // Use default locale based on currency code
    let locale = 'en-US'; // default
    if (currencyCode === 'USD') locale = 'en-US';
    else if (currencyCode === 'EUR') locale = 'en-EU';
    else if (currencyCode === 'GBP') locale = 'en-GB';
    else if (currencyCode === 'KES') locale = 'en-KE';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-medium text-gray-900">Payroll Management</h1>
            <p className="text-xs text-gray-500 mt-1">Create payslips and process payroll</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate('/dashboard/payroll/create')}
              className="bg-blue-600 text-white px-3 py-1.5 text-xs hover:bg-blue-700 flex items-center space-x-1"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              <span>Create Payslip</span>
            </button>
                         <button 
               onClick={() => {
                 setRunPayrollForm(prev => ({
                   ...prev,
                   reference: generateReference()
                 }));
                 setShowRunPayrollModal(true);
               }}
               className="bg-green-600 text-white px-3 py-1.5 text-xs hover:bg-green-700 flex items-center space-x-1"
             >
              <FontAwesomeIcon icon={faPlay} className="text-xs" />
              <span>Run Payroll</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Total Employees</p>
              <p className="text-lg font-semibold text-gray-900">{payrollSummary.total_employees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-600 text-xs" />
            </div>
                         <div className="ml-3">
               <p className="text-xs text-gray-500">Current Month</p>
               <p className="text-lg font-semibold text-gray-900">{formatCurrency(payrollSummary.current_month_payroll, 'USD')}</p>
             </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-yellow-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Pending Payslips</p>
              <p className="text-lg font-semibold text-gray-900">{payrollSummary.pending_payslips}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faCheck} className="text-green-600 text-xs" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-500">Processed</p>
              <p className="text-lg font-semibold text-gray-900">{payrollSummary.processed_payslips}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => navigate('/dashboard/payroll/create')}
          className="bg-white border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faPlus} className="text-blue-600 text-sm" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Create Payslip</h3>
              <p className="text-xs text-gray-500">Enter employee details and salary components</p>
            </div>
          </div>
        </div>

                 <div 
           onClick={() => {
             setRunPayrollForm(prev => ({
               ...prev,
               reference: generateReference()
             }));
             setShowRunPayrollModal(true);
           }}
           className="bg-white border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
         >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faPlay} className="text-green-600 text-sm" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Run Payroll</h3>
              <p className="text-xs text-gray-500">Process payments and update accounts</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/dashboard/payroll/payslips')}
          className="bg-white border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-purple-600 text-sm" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">View Payslips</h3>
              <p className="text-xs text-gray-500">View and manage all payslips</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payslips */}
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">Pending Payslips</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pay Period</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payslips.filter(p => p.status === 'pending').map((payslip) => (
                <tr key={payslip.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div>
                      <div className="text-xs font-medium text-gray-900">{payslip.employee_name}</div>
                      <div className="text-xs text-gray-500">{payslip.employee_id}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-900">{payslip.pay_period}</td>
                                     <td className="px-4 py-2 text-xs text-gray-900">{formatCurrency(payslip.total_earnings, payslip.currency)}</td>
                   <td className="px-4 py-2 text-xs text-red-600">{formatCurrency(payslip.total_deductions, payslip.currency)}</td>
                   <td className="px-4 py-2 text-xs font-medium text-green-600">{formatCurrency(payslip.net_pay, payslip.currency)}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => navigate(`/dashboard/payroll/payslips/${payslip.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                        title="View Details"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



      {/* Run Payroll Modal */}
      {showRunPayrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Run Payroll</h2>
              <button
                onClick={() => setShowRunPayrollModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-xs text-yellow-800">
                  <strong>Warning:</strong> This will process all pending payslips, create bank transactions, 
                  and update accounting entries. This action cannot be undone.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pay Period</label>
                <input
                  type="month"
                  value={runPayrollForm.pay_period}
                  onChange={(e) => setRunPayrollForm({...runPayrollForm, pay_period: e.target.value})}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pay Date</label>
                <input
                  type="date"
                  value={runPayrollForm.pay_date}
                  onChange={(e) => setRunPayrollForm({...runPayrollForm, pay_date: e.target.value})}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bank Account *</label>
                <select
                  value={runPayrollForm.bank_account_id}
                  onChange={(e) => setRunPayrollForm({...runPayrollForm, bank_account_id: e.target.value})}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">Select Bank Account</option>
                                     {bankAccounts.map((account) => (
                     <option key={account.id} value={account.id}>
                       {account.name} - {formatCurrency(account.balance, account.currency)}
                     </option>
                   ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={runPayrollForm.payment_method}
                  onChange={(e) => setRunPayrollForm({...runPayrollForm, payment_method: e.target.value})}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
                             <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">Reference (Auto-generated)</label>
                 <input
                   type="text"
                   value={runPayrollForm.reference}
                   onChange={(e) => setRunPayrollForm({...runPayrollForm, reference: e.target.value})}
                   placeholder="Auto-generated reference"
                   className="w-full border border-gray-300 px-2 py-1.5 text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                   readOnly
                 />
                 <p className="text-xs text-gray-500 mt-1">Reference is automatically generated for tracking</p>
               </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={runPayrollForm.notes}
                  onChange={(e) => setRunPayrollForm({...runPayrollForm, notes: e.target.value})}
                  rows="3"
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowRunPayrollModal(false)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRunPayroll}
                disabled={loading}
                className="px-3 py-1.5 bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Run Payroll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-md mx-4 rounded-lg">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <FontAwesomeIcon icon={faCheck} className="text-green-600 text-lg" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payroll Processed Successfully!</h3>
              <div className="text-sm text-gray-600 space-y-2 mb-6">
                {successData && (
                  <>
                    <p><strong>Payroll Run ID:</strong> #{successData.payroll_run_id}</p>
                    <p><strong>Payslips Processed:</strong> {successData.payslips_processed}</p>
                    <p><strong>Total Amount:</strong> {formatCurrency(successData.total_amount, 'USD')}</p>
                    <p><strong>Pay Period:</strong> {successData.pay_period}</p>
                    <p><strong>Pay Date:</strong> {formatDate(successData.pay_date)}</p>
                  </>
                )}
                <div className="bg-green-50 border border-green-200 p-3 rounded mt-4">
                  <p className="text-xs text-green-800">
                    <strong>✓</strong> Bank transactions created<br/>
                    <strong>✓</strong> Accounting entries updated<br/>
                    <strong>✓</strong> Account balances updated<br/>
                    <strong>✓</strong> Payslips marked as processed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
};

export default Payroll;
