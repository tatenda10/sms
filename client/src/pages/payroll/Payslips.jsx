import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileInvoiceDollar, 
  faDownload,
  faPrint,
  faEye,
  faSearch,
  faFilter,
  faCalendarAlt,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import logo from '../../assets/logo.png';
import { jsPDF } from 'jspdf';

const Payslips = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [payslips, setPayslips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(searchParams.get('period') || '');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayslips, setTotalPayslips] = useState(0);
  const [limit] = useState(25);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    loadCurrencies();
  }, []);

  useEffect(() => {
    loadPayslips();
  }, [currentPage, activeSearchTerm, selectedPeriod, selectedDepartment]);

  const loadPayslips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit
      });
      if (activeSearchTerm) {
        params.append('search', activeSearchTerm);
      }
      if (selectedPeriod) {
        params.append('pay_period', selectedPeriod);
      }
      if (selectedDepartment && selectedDepartment !== 'all') {
        params.append('department', selectedDepartment);
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
          // Fallback if no pagination data
          setTotalPayslips(response.data.data?.length || 0);
          setTotalPages(1);
        }
      } else {
        setError('Failed to load payslips');
      }
    } catch (err) {
      setError('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
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

  // Calculate display ranges for pagination
  const displayStart = payslips.length > 0 ? (currentPage - 1) * limit + 1 : 0;
  const displayEnd = Math.min(currentPage * limit, totalPayslips);

  const handleViewPayslip = async (payslip) => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/payroll/payslips/${payslip.id}`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setSelectedPayslip(response.data.data);
        setShowPayslipModal(true);
      } else {
        setError('Failed to load payslip details');
      }
    } catch (err) {
      console.error('Error loading payslip details:', err);
      setError('Failed to load payslip details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = async (payslip) => {
    try {
      // Create PDF using jsPDF
      const doc = new jsPDF();
      
      // Set font and styling
      doc.setFont('helvetica');
      doc.setFontSize(12);
      
             // Add actual logo image
       const img = new Image();
       img.src = logo;
       doc.addImage(img, 'PNG', 20, 15, 25, 18);
       
       // Employee Information (left side)
       doc.setFontSize(10);
       doc.setFont('helvetica', 'bold');
       doc.text(payslip.employee_name, 20, 38);
       doc.setFont('helvetica', 'normal');
       doc.text(`Employee ID: ${payslip.employee_id}`, 20, 44);
       doc.text(`Department: ${payslip.department_name || 'No Department'}`, 20, 50);
       doc.text(`Job Title: ${payslip.job_title || 'No Job Title'}`, 20, 56);
      
             // Payslip details (right side) - reduced spacing
       doc.setFontSize(9);
       doc.setFont('helvetica', 'bold');
       doc.text('PAY DATE', 140, 38);
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(8);
       doc.text(formatDate(payslip.pay_date), 140, 44);
       
       doc.setFont('helvetica', 'bold');
       doc.setFontSize(9);
       doc.text('PAY PERIOD', 140, 50);
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(8);
       doc.text(payslip.pay_period, 140, 56);
       
       doc.setFont('helvetica', 'bold');
       doc.setFontSize(9);
       doc.text('PAYSLIP #', 140, 62);
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(8);
       doc.text(payslip.id.toString(), 140, 68);
      
             // Earnings Section
       let yPosition = 75;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(75, 85, 99); // Gray background
      doc.rect(20, yPosition, 170, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('EARNINGS', 25, yPosition + 6);
      doc.setTextColor(0, 0, 0);
      
      yPosition += 15;
      // Earnings header
      doc.setFillColor(229, 231, 235); // Light gray background
      doc.rect(20, yPosition, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPTION', 25, yPosition + 6);
      doc.text('AMOUNT', 150, yPosition + 6);
      
      yPosition += 15;
      doc.setFont('helvetica', 'normal');
      
      if (payslip.earnings && payslip.earnings.length > 0) {
        payslip.earnings.forEach((earning, index) => {
          doc.text(earning.label, 25, yPosition + 6);
          doc.text(formatCurrency(earning.amount, earning.currency), 150, yPosition + 6);
          yPosition += 10;
        });
        
        // Total Earnings
        doc.setFillColor(243, 244, 246); // Lighter gray background
        doc.rect(20, yPosition, 170, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL EARNINGS', 25, yPosition + 6);
        doc.text(formatCurrency(payslip.total_earnings, payslip.currency), 150, yPosition + 6);
        doc.setFont('helvetica', 'normal');
      } else {
        doc.text('No earnings recorded', 25, yPosition + 6);
      }
      
      // Deductions Section
      yPosition += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(75, 85, 99); // Gray background
      doc.rect(20, yPosition, 170, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('DEDUCTIONS', 25, yPosition + 6);
      doc.setTextColor(0, 0, 0);
      
      yPosition += 15;
      // Deductions header
      doc.setFillColor(229, 231, 235); // Light gray background
      doc.rect(20, yPosition, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPTION', 25, yPosition + 6);
      doc.text('AMOUNT', 150, yPosition + 6);
      
      yPosition += 15;
      doc.setFont('helvetica', 'normal');
      
      if (payslip.deductions && payslip.deductions.length > 0) {
        payslip.deductions.forEach((deduction, index) => {
          doc.text(deduction.label, 25, yPosition + 6);
          doc.text(formatCurrency(deduction.amount, deduction.currency), 150, yPosition + 6);
          yPosition += 10;
        });
        
        // Total Deductions
        doc.setFillColor(243, 244, 246); // Lighter gray background
        doc.rect(20, yPosition, 170, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL DEDUCTIONS', 25, yPosition + 6);
        doc.text(formatCurrency(payslip.total_deductions, payslip.currency), 150, yPosition + 6);
        doc.setFont('helvetica', 'normal');
      } else {
        doc.text('No deductions recorded', 25, yPosition + 6);
      }
      
      // Net Pay
      yPosition += 15;
      doc.setFillColor(55, 65, 81); // Dark gray background
      doc.rect(20, yPosition, 170, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('NET PAY', 25, yPosition + 8);
      doc.text(formatCurrency(payslip.net_pay, payslip.currency), 150, yPosition + 8);
      doc.setTextColor(0, 0, 0);
      
      // Notes
      if (payslip.notes) {
        yPosition += 20;
        doc.setFillColor(249, 250, 251); // Very light gray background
        doc.rect(20, yPosition, 170, 15, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes', 25, yPosition + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(payslip.notes, 25, yPosition + 15);
      }
      
      // Footer
      yPosition += 25;
      doc.setFontSize(8);
      doc.text('If you have any questions about this payslip, please contact your HR department.', 105, yPosition, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, yPosition + 10, { align: 'center' });
      
      // Save the PDF
      doc.save(`payslip-${payslip.employee_id}-${payslip.pay_period}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
    }
  };

  const handlePrintPayslip = (payslip) => {
    // Mock print functionality
    window.print();
  };

  const formatCurrency = (amount, currencyCode = 'KES') => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-KE', {
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
          <h2 className="report-title">Employee Payslips</h2>
          <p className="report-subtitle">View and manage employee payslips.</p>
        </div>
        <div className="report-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/dashboard/payroll')}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Back to Payroll
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
          
          {/* Pay Period Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Period:</label>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px' }}
            />
            {selectedPeriod && (
              <button
                onClick={() => {
                  setSelectedPeriod('');
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
                title="Clear period filter"
              >
                ×
              </button>
            )}
          </div>
          
          {/* Department Filter */}
          <div className="filter-group">
            <label className="filter-label" style={{ marginRight: '8px' }}>Department:</label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
              style={{ minWidth: '150px', width: '150px' }}
            >
              <option value="all">All Departments</option>
              <option value="Teaching">Teaching Staff</option>
              <option value="Administration">Administration</option>
              <option value="Support">Support Staff</option>
            </select>
            {selectedDepartment !== 'all' && (
              <button
                onClick={() => {
                  setSelectedDepartment('all');
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
                title="Clear department filter"
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
                <th style={{ padding: '6px 10px' }}>DEPARTMENT</th>
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
                    {payslip.department_name || 'No Department'}
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
                        onClick={() => handleViewPayslip(payslip)}
                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="View"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleDownloadPayslip(payslip)}
                        style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Download"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>
                      <button
                        onClick={() => handlePrintPayslip(payslip)}
                        style={{ color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Print"
                      >
                        <FontAwesomeIcon icon={faPrint} />
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

      {/* Payslip Detail Modal */}
      {showPayslipModal && selectedPayslip && (
        <div className="modal-overlay" onClick={() => setShowPayslipModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: '90vw', width: '90vw', maxHeight: '95vh' }} onClick={(e) => e.stopPropagation()}>
             <div className="modal-header">
               <h3 className="modal-title">Payslip Details</h3>
               <button className="modal-close-btn" onClick={() => setShowPayslipModal(false)}>
                 <FontAwesomeIcon icon={faTimes} />
               </button>
             </div>
             
                           <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <img src={logo} alt="Company Logo" className="h-8 mb-2" />
                    <div className="text-xs text-gray-600">
                      <div className="font-semibold text-gray-800">{selectedPayslip.employee_name}</div>
                      <div>Employee ID: {selectedPayslip.employee_id}</div>
                      <div>Department: {selectedPayslip.department_name || 'No Department'}</div>
                      <div>Job Title: {selectedPayslip.job_title || 'No Job Title'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">
                      <div className="font-semibold text-gray-800">PAY DATE</div>
                      <div>{formatDate(selectedPayslip.pay_date)}</div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      <div className="font-semibold text-gray-800">PAY PERIOD</div>
                      <div>{selectedPayslip.pay_period}</div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      <div className="font-semibold text-gray-800">PAYSLIP #</div>
                      <div>{selectedPayslip.id}</div>
                    </div>
                  </div>
                </div>

                               {/* Earnings Section */}
                <div className="mb-6">
                  <div className="bg-gray-600 text-white font-bold p-2">
                    EARNINGS
                  </div>
                  <div className="border border-gray-300">
                    <div className="bg-gray-200 p-2 grid grid-cols-2 gap-4 font-semibold text-xs">
                      <div>DESCRIPTION</div>
                      <div className="text-right">AMOUNT</div>
                    </div>
                    {selectedPayslip.earnings && selectedPayslip.earnings.length > 0 ? (
                      <>
                        {selectedPayslip.earnings.map((earning, index) => (
                          <div key={index} className="p-2 border-b border-gray-200 grid grid-cols-2 gap-4 text-xs">
                            <div>{earning.label}</div>
                            <div className="text-right">{formatCurrency(earning.amount, earning.currency)}</div>
                          </div>
                        ))}
                        <div className="bg-gray-100 p-2 grid grid-cols-2 gap-4 font-bold text-xs">
                          <div>TOTAL EARNINGS</div>
                          <div className="text-right">{formatCurrency(selectedPayslip.total_earnings, selectedPayslip.currency)}</div>
                        </div>
                      </>
                    ) : (
                      <div className="p-2 text-xs text-gray-500">No earnings recorded</div>
                    )}
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="mb-6">
                  <div className="bg-gray-600 text-white font-bold p-2">
                    DEDUCTIONS
                  </div>
                  <div className="border border-gray-300">
                    <div className="bg-gray-200 p-2 grid grid-cols-2 gap-4 font-semibold text-xs">
                      <div>DESCRIPTION</div>
                      <div className="text-right">AMOUNT</div>
                    </div>
                    {selectedPayslip.deductions && selectedPayslip.deductions.length > 0 ? (
                      <>
                        {selectedPayslip.deductions.map((deduction, index) => (
                          <div key={index} className="p-2 border-b border-gray-200 grid grid-cols-2 gap-4 text-xs">
                            <div>{deduction.label}</div>
                            <div className="text-right">{formatCurrency(deduction.amount, deduction.currency)}</div>
                          </div>
                        ))}
                        <div className="bg-gray-100 p-2 grid grid-cols-2 gap-4 font-bold text-xs">
                          <div>TOTAL DEDUCTIONS</div>
                          <div className="text-right">{formatCurrency(selectedPayslip.total_deductions, selectedPayslip.currency)}</div>
                        </div>
                      </>
                    ) : (
                      <div className="p-2 text-xs text-gray-500">No deductions recorded</div>
                    )}
                  </div>
                </div>

                               {/* Net Pay */}
                <div className="bg-gray-700 text-white font-bold p-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">NET PAY</div>
                    <div className="text-sm">{formatCurrency(selectedPayslip.net_pay, selectedPayslip.currency)}</div>
                  </div>
                </div>

                {/* Notes */}
                {selectedPayslip.notes && (
                  <div className="mt-4 p-3 bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-900 mb-1">Notes</h4>
                    <p className="text-xs text-gray-600">{selectedPayslip.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-gray-600">
                  <p>If you have any questions about this payslip, please contact your HR department.</p>
                </div>

                                 {/* Actions */}
                 <div className="flex justify-end space-x-3 mt-4 pt-3 border-t border-gray-200">
                   <button
                     onClick={() => handleDownloadPayslip(selectedPayslip)}
                     className="px-3 py-1.5 bg-blue-600 text-white text-xs hover:bg-blue-700 flex items-center space-x-1"
                   >
                     <FontAwesomeIcon icon={faDownload} />
                     <span>Download Payslip</span>
                   </button>
                  <button
                    onClick={() => handlePrintPayslip(selectedPayslip)}
                    className="px-3 py-1.5 bg-gray-600 text-white text-xs hover:bg-gray-700 flex items-center space-x-1"
                  >
                    <FontAwesomeIcon icon={faPrint} />
                    <span>Print</span>
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Payslips; 