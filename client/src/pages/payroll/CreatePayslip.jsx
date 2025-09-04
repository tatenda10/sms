import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faSave,
  faTimes,
  faPlus,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const CreatePayslip = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Create payslip form
  const [payslipForm, setPayslipForm] = useState({
    employee_id: '',
    pay_period: new Date().toISOString().slice(0, 7), // YYYY-MM
    pay_date: new Date().toISOString().split('T')[0],
    currency: 'KES',
    payment_method: 'bank', // 'bank' or 'cash'
    bank_account_id: '',
    notes: ''
  });

  // Dynamic earnings and deductions
  const [earnings, setEarnings] = useState([
    { id: 1, label: 'Basic Salary', amount: '', currency: 'KES' }
  ]);
  
  const [deductions, setDeductions] = useState([
    { id: 1, label: 'PAYE Tax', amount: '', currency: 'KES' }
  ]);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeBankAccounts, setSelectedEmployeeBankAccounts] = useState([]);
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [newBankAccount, setNewBankAccount] = useState({
    bank_name: '',
    account_number: '',
    currency: 'KES'
  });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    loadEmployees();
    loadCurrencies();
  }, []);

  useEffect(() => {
    if (payslipForm.employee_id) {
      loadEmployeeBankAccounts(payslipForm.employee_id);
    } else {
      setSelectedEmployeeBankAccounts([]);
    }
  }, [payslipForm.employee_id]);

  const loadEmployees = async () => {
    try {
      // Real API call to get employees with bank accounts
      const response = await axios.get(`${BASE_URL}/employees`, { headers: authHeaders });
      if (response.data.success) {
        setEmployees(response.data.data);
      } else {
        // Fallback to mock data if API fails
        const mockEmployees = [
          { id: 1, name: 'John Doe', employee_id: 'EMP001', department: 'Teaching', job_title: 'Mathematics Teacher' },
          { id: 2, name: 'Jane Smith', employee_id: 'EMP002', department: 'Teaching', job_title: 'English Teacher' },
          { id: 3, name: 'Mary Johnson', employee_id: 'EMP003', department: 'Administration', job_title: 'Accountant' },
          { id: 4, name: 'Peter Wilson', employee_id: 'EMP004', department: 'Support', job_title: 'IT Support' },
          { id: 5, name: 'Sarah Brown', employee_id: 'EMP005', department: 'Teaching', job_title: 'Science Teacher' }
        ];
        setEmployees(mockEmployees);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Failed to load employees');
    }
  };

  const loadCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, { headers: authHeaders });
      if (response.data.success) {
        setCurrencies(response.data.data);
      } else {
        setError('Failed to load currencies');
      }
    } catch (err) {
      console.error('Error loading currencies:', err);
      setError('Failed to load currencies');
    }
  };

  const loadEmployeeBankAccounts = async (employeeId) => {
    try {
      if (!employeeId) {
        setSelectedEmployeeBankAccounts([]);
        setShowAddBankAccount(false);
        return;
      }
      
      const response = await axios.get(`${BASE_URL}/employees/${employeeId}/bank-accounts`, { headers: authHeaders });
      if (response.data.success) {
        setSelectedEmployeeBankAccounts(response.data.data.bankAccounts);
        setShowAddBankAccount(response.data.data.bankAccounts.length === 0);
      } else {
        setSelectedEmployeeBankAccounts([]);
        setShowAddBankAccount(true);
      }
    } catch (err) {
      console.error('Error loading employee bank accounts:', err);
      setSelectedEmployeeBankAccounts([]);
      setShowAddBankAccount(true);
    }
  };

  const handleAddBankAccount = async () => {
    try {
      if (!newBankAccount.bank_name || !newBankAccount.account_number) {
        setError('Bank name and account number are required');
        return;
      }

      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${BASE_URL}/employees/${payslipForm.employee_id}/bank-accounts`,
        {
          bankName: newBankAccount.bank_name,
          accountNumber: newBankAccount.account_number,
          currency: newBankAccount.currency,
          isPrimary: true
        },
        { headers: authHeaders }
      );

      if (response.data.success) {
        // Reload bank accounts
        await loadEmployeeBankAccounts(payslipForm.employee_id);
        
        // Set the new account as selected
        setPayslipForm({
          ...payslipForm,
          bank_account_id: response.data.data.id
        });

        // Reset form
        setNewBankAccount({
          bank_name: '',
          account_number: '',
          currency: 'KES'
        });
        setShowAddBankAccount(false);
        setSuccess('Bank account added successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(response.data.error || 'Failed to add bank account');
      }
    } catch (err) {
      console.error('Error adding bank account:', err);
      setError(err.response?.data?.error || 'Failed to add bank account');
    } finally {
      setLoading(false);
    }
  };

  const addEarning = () => {
    const newId = Math.max(...earnings.map(e => e.id), 0) + 1;
    setEarnings([...earnings, { id: newId, label: '', amount: '', currency: 'KES' }]);
  };

  const removeEarning = (id) => {
    if (earnings.length > 1) {
      setEarnings(earnings.filter(e => e.id !== id));
    }
  };

  const updateEarning = (id, field, value) => {
    setEarnings(earnings.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const addDeduction = () => {
    const newId = Math.max(...deductions.map(d => d.id), 0) + 1;
    setDeductions([...deductions, { id: newId, label: '', amount: '', currency: 'KES' }]);
  };

  const removeDeduction = (id) => {
    if (deductions.length > 1) {
      setDeductions(deductions.filter(d => d.id !== id));
    }
  };

  const updateDeduction = (id, field, value) => {
    setDeductions(deductions.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const handleCreatePayslip = async () => {
    try {
      if (!payslipForm.employee_id) {
        setError('Employee is required');
        return;
      }

      if (!payslipForm.payment_method) {
        setError('Payment method is required');
        return;
      }

      if (payslipForm.payment_method === 'bank' && !payslipForm.bank_account_id) {
        setError('Bank account is required for bank transfer');
        return;
      }

      // Validate earnings
      const validEarnings = earnings.filter(e => e.label.trim() && e.amount);
      if (validEarnings.length === 0) {
        setError('At least one earning item is required');
        return;
      }

      setLoading(true);
      setError(null);
      
      // Prepare payload
      const payload = {
        ...payslipForm,
        earnings: validEarnings,
        deductions: deductions.filter(d => d.label.trim() && d.amount)
      };
      
      // Real API call
      const response = await axios.post(`${BASE_URL}/payroll/payslips`, payload, { headers: authHeaders });
      
      if (response.data.success) {
        setSuccess('Payslip created successfully!');
        
        // Reset form
        setPayslipForm({
          employee_id: '',
          pay_period: new Date().toISOString().slice(0, 7),
          pay_date: new Date().toISOString().split('T')[0],
          currency: 'KES',
          payment_method: 'bank',
          bank_account_id: '',
          notes: ''
        });
        setSelectedEmployeeBankAccounts([]);
        setShowAddBankAccount(false);
        setNewBankAccount({
          bank_name: '',
          account_number: '',
          currency: 'KES'
        });
        setEarnings([{ id: 1, label: 'Basic Salary', amount: '', currency: 'KES' }]);
        setDeductions([{ id: 1, label: 'PAYE Tax', amount: '', currency: 'KES' }]);

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/dashboard/payroll');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to create payslip');
      }
    } catch (err) {
      console.error('Error creating payslip:', err);
      setError(err.response?.data?.message || 'Failed to create payslip');
    } finally {
      setLoading(false);
    }
  };

  const calculateNetPay = () => {
    const totalEarnings = earnings
      .filter(e => e.label.trim() && e.amount)
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    const totalDeductions = deductions
      .filter(d => d.label.trim() && d.amount)
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    
    return totalEarnings - totalDeductions;
  };

  const formatCurrency = (amount, currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return amount;
    
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCurrencySymbol = (currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency ? currency.symbol : currencyCode;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="flex items-center space-x-3">
         
          <div>
            <h1 className="text-base font-medium text-gray-900">Create Payslip</h1>
            <p className="text-xs text-gray-500 mt-1">Enter employee details and salary components</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 p-3 text-xs text-green-700">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Basic Information</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employee *</label>
                <select
                  value={payslipForm.employee_id}
                  onChange={(e) => setPayslipForm({...payslipForm, employee_id: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">Select Employee</option>
                                                         {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} - {emp.employee_id} ({emp.department_name || 'No Department'})
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pay Period *</label>
                  <input
                    type="month"
                    value={payslipForm.pay_period}
                    onChange={(e) => setPayslipForm({...payslipForm, pay_period: e.target.value})}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pay Date *</label>
                  <input
                    type="date"
                    value={payslipForm.pay_date}
                    onChange={(e) => setPayslipForm({...payslipForm, pay_date: e.target.value})}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
              </div>
                             <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">Default Currency</label>
                 <select
                   value={payslipForm.currency}
                   onChange={(e) => setPayslipForm({...payslipForm, currency: e.target.value})}
                   className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                 >
                   {currencies.map((currency) => (
                     <option key={currency.code} value={currency.code}>
                       {currency.code} - {currency.name}
                     </option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method *</label>
                 <select
                   value={payslipForm.payment_method}
                   onChange={(e) => {
                     setPayslipForm({
                       ...payslipForm, 
                       payment_method: e.target.value,
                       bank_account_id: e.target.value === 'cash' ? '' : payslipForm.bank_account_id
                     });
                   }}
                   className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                 >
                   <option value="bank">Bank Transfer</option>
                   <option value="cash">Cash Payment</option>
                 </select>
               </div>
                               {payslipForm.payment_method === 'bank' && payslipForm.employee_id && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bank Account *</label>
                    {selectedEmployeeBankAccounts.length > 0 ? (
                      <div className="space-y-2">
                        <select
                          value={payslipForm.bank_account_id}
                          onChange={(e) => setPayslipForm({...payslipForm, bank_account_id: e.target.value})}
                          className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        >
                          <option value="">Select Bank Account</option>
                          {selectedEmployeeBankAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.bank_name} - {account.account_number} ({account.currency})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setShowAddBankAccount(true)}
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
                        >
                          <FontAwesomeIcon icon={faPlus} className="text-xs" />
                          <span>Add New Bank Account</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-600">No bank accounts found for this employee. Add a new one:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <input
                              type="text"
                              value={newBankAccount.bank_name}
                              onChange={(e) => setNewBankAccount({...newBankAccount, bank_name: e.target.value})}
                              placeholder="Bank Name"
                              className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={newBankAccount.account_number}
                              onChange={(e) => setNewBankAccount({...newBankAccount, account_number: e.target.value})}
                              placeholder="Account Number"
                              className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={newBankAccount.currency}
                            onChange={(e) => setNewBankAccount({...newBankAccount, currency: e.target.value})}
                            className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          >
                            {currencies.map((currency) => (
                              <option key={currency.code} value={currency.code}>
                                {currency.code}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleAddBankAccount}
                            disabled={loading || !newBankAccount.bank_name || !newBankAccount.account_number}
                            className="px-3 py-1 bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Adding...' : 'Add Account'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {showAddBankAccount && selectedEmployeeBankAccounts.length > 0 && (
                      <div className="mt-3 p-3 border border-gray-200 rounded bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-medium text-gray-700">Add New Bank Account</h4>
                          <button
                            onClick={() => setShowAddBankAccount(false)}
                            className="text-gray-500 hover:text-gray-700 text-xs"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <input
                              type="text"
                              value={newBankAccount.bank_name}
                              onChange={(e) => setNewBankAccount({...newBankAccount, bank_name: e.target.value})}
                              placeholder="Bank Name"
                              className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={newBankAccount.account_number}
                              onChange={(e) => setNewBankAccount({...newBankAccount, account_number: e.target.value})}
                              placeholder="Account Number"
                              className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <select
                            value={newBankAccount.currency}
                            onChange={(e) => setNewBankAccount({...newBankAccount, currency: e.target.value})}
                            className="border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          >
                            {currencies.map((currency) => (
                              <option key={currency.code} value={currency.code}>
                                {currency.code}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleAddBankAccount}
                            disabled={loading || !newBankAccount.bank_name || !newBankAccount.account_number}
                            className="px-3 py-1 bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Adding...' : 'Add Account'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Earnings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 className="text-sm font-semibold text-gray-900">Earnings</h3>
                <button
                  onClick={addEarning}
                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                  <span>Add Earning</span>
                </button>
              </div>
              <div className="space-y-3">
                {earnings.map((earning, index) => (
                  <div key={earning.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={earning.label}
                        onChange={(e) => updateEarning(earning.id, 'label', e.target.value)}
                        placeholder="Earning description"
                        className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                    <div className="w-24">
                      <select
                        value={earning.currency}
                        onChange={(e) => updateEarning(earning.id, 'currency', e.target.value)}
                        className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        value={earning.amount}
                        onChange={(e) => updateEarning(earning.id, 'amount', e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                    {earnings.length > 1 && (
                      <button
                        onClick={() => removeEarning(earning.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Deductions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 className="text-sm font-semibold text-gray-900">Deductions</h3>
                <button
                  onClick={addDeduction}
                  className="text-red-600 hover:text-red-800 text-xs flex items-center space-x-1"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                  <span>Add Deduction</span>
                </button>
              </div>
              <div className="space-y-3">
                {deductions.map((deduction, index) => (
                  <div key={deduction.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={deduction.label}
                        onChange={(e) => updateDeduction(deduction.id, 'label', e.target.value)}
                        placeholder="Deduction description"
                        className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                    <div className="w-24">
                      <select
                        value={deduction.currency}
                        onChange={(e) => updateDeduction(deduction.id, 'currency', e.target.value)}
                        className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        value={deduction.amount}
                        onChange={(e) => updateDeduction(deduction.id, 'amount', e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                    {deductions.length > 1 && (
                      <button
                        onClick={() => removeDeduction(deduction.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Earnings:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        earnings
                          .filter(e => e.label.trim() && e.amount)
                          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
                        payslipForm.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Deductions:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(
                        deductions
                          .filter(d => d.label.trim() && d.amount)
                          .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
                        payslipForm.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3">
                    <span className="font-semibold text-gray-900">Net Pay:</span>
                    <span className="font-bold text-green-600 text-lg">{formatCurrency(calculateNetPay(), payslipForm.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Notes</label>
              <textarea
                value={payslipForm.notes}
                onChange={(e) => setPayslipForm({...payslipForm, notes: e.target.value})}
                rows="4"
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter any additional notes or comments..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => navigate('/dashboard/payroll')}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePayslip}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faSave} className="text-sm" />
            <span>{loading ? 'Creating...' : 'Create Payslip'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePayslip;
