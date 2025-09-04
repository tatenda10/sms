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
  const [selectedPeriod, setSelectedPeriod] = useState(searchParams.get('period') || '');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [currencies, setCurrencies] = useState([]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    loadPayslips();
    loadCurrencies();
  }, [selectedPeriod, selectedDepartment]);

  const loadPayslips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedPeriod) {
        params.append('pay_period', selectedPeriod);
      }
      if (selectedDepartment && selectedDepartment !== 'all') {
        // Note: We'll need to filter by department after fetching since it's not a direct field
      }
      
      const response = await axios.get(`${BASE_URL}/payroll/payslips?${params}`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setPayslips(response.data.data);
      } else {
        setError('Failed to load payslips');
      }
    } catch (err) {
      setError('Failed to load payslips');
    } finally {
      setLoading(false);
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

  const filteredPayslips = payslips.filter(payslip => {
    const matchesSearch = payslip.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payslip.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = !selectedPeriod || payslip.pay_period === selectedPeriod;
    const matchesDepartment = selectedDepartment === 'all' || payslip.department_name === selectedDepartment;
    
    return matchesSearch && matchesPeriod && matchesDepartment;
  });

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-medium text-gray-900">Employee Payslips</h1>
            <p className="text-xs text-gray-500 mt-1">View and manage employee payslips</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/payroll')}
            className="text-gray-600 hover:text-gray-800 text-xs"
          >
            Back to Payroll
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search Employee</label>
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or employee number..."
                className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pay Period</label>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="all">All Departments</option>
              <option value="Teaching">Teaching Staff</option>
              <option value="Administration">Administration</option>
              <option value="Support">Support Staff</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800 flex items-center space-x-1">
              <FontAwesomeIcon icon={faFilter} className="text-xs" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">
            Payslips ({filteredPayslips.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          {filteredPayslips.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 text-sm">No payslips found</div>
              <div className="text-gray-400 text-xs mt-1">Try adjusting your filters or create a new payslip</div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pay Period</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayslips.map((payslip) => (
                <tr key={payslip.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div>
                      <div className="text-xs font-medium text-gray-900">{payslip.employee_name}</div>
                      <div className="text-xs text-gray-500">{payslip.employee_id}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-900">{payslip.department_name || 'No Department'}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{payslip.pay_period}</td>
                  <td className="px-4 py-2 text-xs text-gray-900">{formatCurrency(payslip.total_earnings, payslip.currency)}</td>
                  <td className="px-4 py-2 text-xs text-red-600">{formatCurrency(payslip.total_deductions, payslip.currency)}</td>
                  <td className="px-4 py-2 text-xs font-medium text-green-600">{formatCurrency(payslip.net_pay, payslip.currency)}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      payslip.status === 'processed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payslip.status === 'processed' ? 'Processed' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleViewPayslip(payslip)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                        title="View Payslip"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => handleDownloadPayslip(payslip)}
                        className="text-green-600 hover:text-green-800 text-xs"
                        title="Download PDF"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>
                      <button
                        onClick={() => handlePrintPayslip(payslip)}
                        className="text-purple-600 hover:text-purple-800 text-xs"
                        title="Print Payslip"
                      >
                        <FontAwesomeIcon icon={faPrint} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

             {/* Payslip Detail Modal */}
       {showPayslipModal && selectedPayslip && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                       <div className="bg-white w-full max-w-4xl max-h-[95vh] overflow-y-auto mx-4" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6'
            }}>
             {/* Close Button */}
             <div className="flex justify-end p-4">
               <button
                 onClick={() => setShowPayslipModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <FontAwesomeIcon icon={faTimes} className="text-lg" />
               </button>
             </div>
             
                           {/* Payslip Content */}
              <div className="p-6">
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

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
          Loading payslips...
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

export default Payslips; 