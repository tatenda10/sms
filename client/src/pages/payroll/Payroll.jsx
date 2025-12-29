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
  faPlay,
  faSearch,
  faTrash
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
  const [showCreatePayslipModal, setShowCreatePayslipModal] = useState(false);
  const [createPayslipLoading, setCreatePayslipLoading] = useState(false);
  const [createPayslipError, setCreatePayslipError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeBankAccounts, setSelectedEmployeeBankAccounts] = useState([]);
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState({
    bank_name: '',
    account_number: '',
    currency: 'KES'
  });
  
  // Create payslip form
  const [payslipForm, setPayslipForm] = useState({
    employee_id: '',
    pay_period: new Date().toISOString().slice(0, 7),
    pay_date: new Date().toISOString().split('T')[0],
    currency: 'KES',
    payment_method: 'bank',
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayslips, setTotalPayslips] = useState(0);
  const [limit] = useState(25);

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
    loadEmployees();
  }, []);

  useEffect(() => {
    if (payslipForm.employee_id && showCreatePayslipModal) {
      loadEmployeeBankAccounts(payslipForm.employee_id);
    } else {
      setSelectedEmployeeBankAccounts([]);
    }
  }, [payslipForm.employee_id, showCreatePayslipModal]);

  useEffect(() => {
    loadPayslips();
  }, [currentPage, activeSearchTerm, statusFilter]);

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

  const loadEmployees = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/employees`, { headers: authHeaders });
      if (response.data.success) {
        setEmployees(response.data.data || []);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
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
        setSelectedEmployeeBankAccounts(response.data.data.bankAccounts || []);
        setShowAddBankAccount((response.data.data.bankAccounts || []).length === 0);
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
        setCreatePayslipError('Bank name and account number are required');
        return;
      }

      setCreatePayslipLoading(true);
      setCreatePayslipError(null);

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
        await loadEmployeeBankAccounts(payslipForm.employee_id);
        setPayslipForm({
          ...payslipForm,
          bank_account_id: response.data.data.id
        });
        setNewBankAccount({
          bank_name: '',
          account_number: '',
          currency: 'KES'
        });
        setShowAddBankAccount(false);
      } else {
        setCreatePayslipError(response.data.error || 'Failed to add bank account');
      }
    } catch (err) {
      console.error('Error adding bank account:', err);
      setCreatePayslipError(err.response?.data?.error || 'Failed to add bank account');
    } finally {
      setCreatePayslipLoading(false);
    }
  };

  const addEarning = () => {
    const newId = Math.max(...earnings.map(e => e.id), 0) + 1;
    setEarnings([...earnings, { id: newId, label: '', amount: '', currency: payslipForm.currency }]);
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
    setDeductions([...deductions, { id: newId, label: '', amount: '', currency: payslipForm.currency }]);
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

  const calculateNetPay = () => {
    const totalEarnings = earnings
      .filter(e => e.label.trim() && e.amount)
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    const totalDeductions = deductions
      .filter(d => d.label.trim() && d.amount)
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    
    return totalEarnings - totalDeductions;
  };

  const handleCreatePayslip = async () => {
    try {
      if (!payslipForm.employee_id) {
        setCreatePayslipError('Employee is required');
        return;
      }

      if (payslipForm.payment_method === 'bank' && !payslipForm.bank_account_id) {
        setCreatePayslipError('Bank account is required for bank transfer');
        return;
      }

      const validEarnings = earnings.filter(e => e.label.trim() && e.amount);
      if (validEarnings.length === 0) {
        setCreatePayslipError('At least one earning item is required');
        return;
      }

      setCreatePayslipLoading(true);
      setCreatePayslipError(null);
      
      const payload = {
        ...payslipForm,
        earnings: validEarnings,
        deductions: deductions.filter(d => d.label.trim() && d.amount)
      };
      
      const response = await axios.post(`${BASE_URL}/payroll/payslips`, payload, { headers: authHeaders });
      
      if (response.data.success) {
        setShowCreatePayslipModal(false);
        loadPayslips();
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
        setEarnings([{ id: 1, label: 'Basic Salary', amount: '', currency: 'KES' }]);
        setDeductions([{ id: 1, label: 'PAYE Tax', amount: '', currency: 'KES' }]);
        setSelectedEmployeeBankAccounts([]);
        setShowAddBankAccount(false);
        setNewBankAccount({
          bank_name: '',
          account_number: '',
          currency: 'KES'
        });
      } else {
        setCreatePayslipError(response.data.message || 'Failed to create payslip');
      }
    } catch (err) {
      console.error('Error creating payslip:', err);
      setCreatePayslipError(err.response?.data?.message || 'Failed to create payslip');
    } finally {
      setCreatePayslipLoading(false);
    }
  };

  const handleCloseCreatePayslipModal = () => {
    setShowCreatePayslipModal(false);
    setCreatePayslipError(null);
    setPayslipForm({
      employee_id: '',
      pay_period: new Date().toISOString().slice(0, 7),
      pay_date: new Date().toISOString().split('T')[0],
      currency: 'KES',
      payment_method: 'bank',
      bank_account_id: '',
      notes: ''
    });
    setEarnings([{ id: 1, label: 'Basic Salary', amount: '', currency: 'KES' }]);
    setDeductions([{ id: 1, label: 'PAYE Tax', amount: '', currency: 'KES' }]);
    setSelectedEmployeeBankAccounts([]);
    setShowAddBankAccount(false);
  };

  const loadPayslips = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit
      });
      
      if (activeSearchTerm) {
        params.append('search', activeSearchTerm);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      const response = await axios.get(`${BASE_URL}/payroll/payslips?${params}`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setPayslips(response.data.data || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
          setTotalPayslips(response.data.pagination.total || 0);
        } else {
          setTotalPayslips(response.data.data?.length || 0);
          setTotalPages(1);
        }
      } else {
        setError('Failed to load payslips');
      }
    } catch (err) {
      console.error('Error loading payslips:', err);
      setError('Failed to load payslips');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
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

  // Calculate display ranges for pagination
  const displayStart = payslips.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalPayslips);

  if (loading && payslips.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading payslips...</div>
      </div>
    );
  }

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
          <h2 className="report-title">Payroll Management</h2>
          <p className="report-subtitle">Manage employee payslips and process payroll.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              setRunPayrollForm(prev => ({
                ...prev,
                reference: generateReference()
              }));
              setShowRunPayrollModal(true);
            }}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FontAwesomeIcon icon={faPlay} />
            Run Payroll
          </button>
          <button
            onClick={() => setShowCreatePayslipModal(true)}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
            Create Payslip
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="report-filters" style={{ flexShrink: 0 }}>
        <div className="report-filters-left">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="filter-group">
            <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by employee name or ID..."
                className="filter-input search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveSearchTerm('');
                    setCurrentPage(1);
                  }}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    padding: '4px 6px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
                  }}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </form>
          
          {/* Status Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
              style={{ minWidth: '120px', width: '120px' }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
            </select>
            {statusFilter && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
                style={{
                  marginLeft: '8px',
                  padding: '6px 10px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)'
                }}
                title="Clear status filter"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="report-content-container ecl-table-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        overflow: 'auto', 
        minHeight: 0,
        padding: 0,
        height: '100%'
      }}>
        {loading && payslips.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading payslips...
          </div>
        ) : (
          <table className="ecl-table" style={{ fontSize: '0.75rem', width: '100%' }}>
            <thead style={{ 
              position: 'sticky', 
              top: 0, 
              zIndex: 10, 
              background: 'var(--sidebar-bg)' 
            }}>
              <tr>
                <th style={{ padding: '6px 10px' }}>EMPLOYEE</th>
                <th style={{ padding: '6px 10px' }}>PAY PERIOD</th>
                <th style={{ padding: '6px 10px' }}>GROSS PAY</th>
                <th style={{ padding: '6px 10px' }}>DEDUCTIONS</th>
                <th style={{ padding: '6px 10px' }}>NET PAY</th>
                <th style={{ padding: '6px 10px' }}>STATUS</th>
                <th style={{ padding: '6px 10px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((payslip, index) => (
                <tr 
                  key={payslip.id} 
                  style={{ 
                    height: '32px', 
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{payslip.employee_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{payslip.employee_id}</div>
                    </div>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {payslip.pay_period}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    {formatCurrency(payslip.total_earnings, payslip.currency)}
                  </td>
                  <td style={{ padding: '4px 10px', color: '#dc2626' }}>
                    {formatCurrency(payslip.total_deductions, payslip.currency)}
                  </td>
                  <td style={{ padding: '4px 10px', fontWeight: 600, color: '#10b981' }}>
                    {formatCurrency(payslip.net_pay, payslip.currency)}
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      borderRadius: '4px',
                      backgroundColor: payslip.status === 'processed' ? '#d1fae5' : '#fef3c7',
                      color: payslip.status === 'processed' ? '#065f46' : '#92400e'
                    }}>
                      {payslip.status === 'processed' ? 'Processed' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 10px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => navigate(`/dashboard/payroll/payslips/${payslip.id}`)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Empty placeholder rows to always show 25 rows */}
              {Array.from({ length: Math.max(0, 25 - payslips.length) }).map((_, index) => (
                <tr 
                  key={`empty-${index}`}
                  style={{ 
                    height: '32px', 
                    backgroundColor: (payslips.length + index) % 2 === 0 ? '#fafafa' : '#f3f4f6' 
                  }}
                >
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '4px 10px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer - Separate Container */}
      <div className="ecl-table-footer" style={{ flexShrink: 0 }}>
        <div className="table-footer-left">
          Showing {displayStart} to {displayEnd} of {totalPayslips || 0} results.
        </div>
        <div className="table-footer-right">
          {!activeSearchTerm && totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info" style={{ fontSize: '0.7rem' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
          {!activeSearchTerm && totalPages <= 1 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              All data displayed
            </div>
          )}
        </div>
      </div>



      {/* Create Payslip Modal */}
      {showCreatePayslipModal && (
        <div className="modal-overlay" onClick={handleCloseCreatePayslipModal}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', width: '90vw', maxHeight: '95vh' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Create Payslip</h3>
              <button className="modal-close-btn" onClick={handleCloseCreatePayslipModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
              {createPayslipError && (
                <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
                  {createPayslipError}
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handleCreatePayslip(); }} className="modal-form">
                {/* Employee & Pay Information Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faUsers} style={{ color: '#2563eb' }} />
                    Employee & Pay Information
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Employee <span className="required">*</span>
                      </label>
                      <select
                        className="form-control"
                        value={payslipForm.employee_id}
                        onChange={(e) => setPayslipForm({...payslipForm, employee_id: e.target.value})}
                        required
                      >
                        <option value="">Select Employee</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name || emp.Name} - {emp.employee_id || emp.EmployeeID || emp.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Pay Period <span className="required">*</span>
                      </label>
                      <input
                        type="month"
                        className="form-control"
                        value={payslipForm.pay_period}
                        onChange={(e) => setPayslipForm({...payslipForm, pay_period: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Pay Date <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={payslipForm.pay_date}
                        onChange={(e) => setPayslipForm({...payslipForm, pay_date: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Currency <span className="required">*</span>
                      </label>
                      <select
                        className="form-control"
                        value={payslipForm.currency}
                        onChange={(e) => {
                          setPayslipForm({...payslipForm, currency: e.target.value});
                          setEarnings(earnings.map(e => ({...e, currency: e.target.value})));
                          setDeductions(deductions.map(d => ({...d, currency: e.target.value})));
                        }}
                        required
                      >
                        {currencies.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.code} - {curr.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Payment Method <span className="required">*</span>
                      </label>
                      <select
                        className="form-control"
                        value={payslipForm.payment_method}
                        onChange={(e) => setPayslipForm({...payslipForm, payment_method: e.target.value})}
                        required
                      >
                        <option value="bank">Bank Transfer</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>
                    
                    {payslipForm.payment_method === 'bank' && (
                      <div className="form-group">
                        <label className="form-label">
                          Bank Account <span className="required">*</span>
                        </label>
                        {selectedEmployeeBankAccounts.length > 0 ? (
                          <select
                            className="form-control"
                            value={payslipForm.bank_account_id}
                            onChange={(e) => setPayslipForm({...payslipForm, bank_account_id: e.target.value})}
                            required
                          >
                            <option value="">Select Bank Account</option>
                            {selectedEmployeeBankAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.bankName} - {account.accountNumber}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No bank accounts found. Add one below:</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Bank Name"
                                value={newBankAccount.bank_name}
                                onChange={(e) => setNewBankAccount({...newBankAccount, bank_name: e.target.value})}
                              />
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Account Number"
                                value={newBankAccount.account_number}
                                onChange={(e) => setNewBankAccount({...newBankAccount, account_number: e.target.value})}
                              />
                              <select
                                className="form-control"
                                value={newBankAccount.currency}
                                onChange={(e) => setNewBankAccount({...newBankAccount, currency: e.target.value})}
                              >
                                {currencies.map((curr) => (
                                  <option key={curr.code} value={curr.code}>{curr.code}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={handleAddBankAccount}
                                disabled={createPayslipLoading}
                                className="modal-btn"
                                style={{ background: '#10b981', color: 'white', padding: '6px 12px', whiteSpace: 'nowrap' }}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Earnings Section */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faMoneyBillWave} style={{ color: '#10b981' }} />
                      Earnings
                    </h4>
                    <button
                      type="button"
                      onClick={addEarning}
                      className="modal-btn"
                      style={{ background: '#10b981', color: 'white', padding: '6px 12px', fontSize: '0.7rem' }}
                    >
                      <FontAwesomeIcon icon={faPlus} style={{ marginRight: '4px' }} />
                      Add Earning
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {earnings.map((earning) => (
                      <div key={earning.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Earning description"
                          value={earning.label}
                          onChange={(e) => updateEarning(earning.id, 'label', e.target.value)}
                        />
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Amount"
                          value={earning.amount}
                          onChange={(e) => updateEarning(earning.id, 'amount', e.target.value)}
                          step="0.01"
                          min="0"
                        />
                        <button
                          type="button"
                          onClick={() => removeEarning(earning.id)}
                          disabled={earnings.length === 1}
                          style={{ 
                            background: earnings.length === 1 ? '#e5e7eb' : '#dc2626', 
                            color: 'white', 
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: earnings.length === 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deductions Section */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faCalculator} style={{ color: '#dc2626' }} />
                      Deductions
                    </h4>
                    <button
                      type="button"
                      onClick={addDeduction}
                      className="modal-btn"
                      style={{ background: '#dc2626', color: 'white', padding: '6px 12px', fontSize: '0.7rem' }}
                    >
                      <FontAwesomeIcon icon={faPlus} style={{ marginRight: '4px' }} />
                      Add Deduction
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {deductions.map((deduction) => (
                      <div key={deduction.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Deduction description"
                          value={deduction.label}
                          onChange={(e) => updateDeduction(deduction.id, 'label', e.target.value)}
                        />
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Amount"
                          value={deduction.amount}
                          onChange={(e) => updateDeduction(deduction.id, 'amount', e.target.value)}
                          step="0.01"
                          min="0"
                        />
                        <button
                          type="button"
                          onClick={() => removeDeduction(deduction.id)}
                          disabled={deductions.length === 1}
                          style={{ 
                            background: deductions.length === 1 ? '#e5e7eb' : '#dc2626', 
                            color: 'white', 
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: deductions.length === 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Net Pay Summary */}
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f3f4f6', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Net Pay:</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>
                      {formatCurrency(calculateNetPay(), payslipForm.currency)}
                    </span>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Additional notes..."
                    value={payslipForm.notes}
                    onChange={(e) => setPayslipForm({...payslipForm, notes: e.target.value})}
                  />
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={handleCloseCreatePayslipModal}
                    className="modal-btn modal-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createPayslipLoading}
                    className="modal-btn modal-btn-primary"
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {createPayslipLoading ? 'Creating...' : 'Create Payslip'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Run Payroll Modal */}
      {showRunPayrollModal && (
        <div className="modal-overlay" onClick={() => setShowRunPayrollModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Run Payroll</h3>
              <button className="modal-close-btn" onClick={() => setShowRunPayrollModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
                <p style={{ fontSize: '0.75rem', color: '#92400e' }}>
                  <strong>Warning:</strong> This will process all pending payslips, create bank transactions, 
                  and update accounting entries. This action cannot be undone.
                </p>
              </div>

              <form className="modal-form">
                <div className="form-group">
                  <label className="form-label">Pay Period</label>
                  <input
                    type="month"
                    value={runPayrollForm.pay_period}
                    onChange={(e) => setRunPayrollForm({...runPayrollForm, pay_period: e.target.value})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pay Date</label>
                  <input
                    type="date"
                    value={runPayrollForm.pay_date}
                    onChange={(e) => setRunPayrollForm({...runPayrollForm, pay_date: e.target.value})}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Account *</label>
                  <select
                    value={runPayrollForm.bank_account_id}
                    onChange={(e) => setRunPayrollForm({...runPayrollForm, bank_account_id: e.target.value})}
                    className="form-control"
                  >
                    <option value="">Select Bank Account</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {formatCurrency(account.balance, account.currency)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    value={runPayrollForm.payment_method}
                    onChange={(e) => setRunPayrollForm({...runPayrollForm, payment_method: e.target.value})}
                    className="form-control"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reference (Auto-generated)</label>
                  <input
                    type="text"
                    value={runPayrollForm.reference}
                    onChange={(e) => setRunPayrollForm({...runPayrollForm, reference: e.target.value})}
                    placeholder="Auto-generated reference"
                    className="form-control"
                    style={{ background: '#f9fafb' }}
                    readOnly
                  />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Reference is automatically generated for tracking
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    value={runPayrollForm.notes}
                    onChange={(e) => setRunPayrollForm({...runPayrollForm, notes: e.target.value})}
                    rows="3"
                    className="form-control"
                  />
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowRunPayrollModal(false)}
                    className="modal-btn modal-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRunPayroll}
                    disabled={loading}
                    className="modal-btn modal-btn-primary"
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {loading ? 'Processing...' : 'Run Payroll'}
                  </button>
                </div>
              </form>
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

    </div>
  );
};

export default Payroll;
