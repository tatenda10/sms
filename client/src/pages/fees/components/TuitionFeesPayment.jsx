import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUserGraduate, 
  faGraduationCap,
  faDollarSign,
  faCalendarAlt,
  faList,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';
import axios from 'axios';
import SuccessModal from '../../../components/SuccessModal';
import ErrorModal from '../../../components/ErrorModal';
import { jsPDF } from 'jspdf';

const TuitionFeesPayment = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods] = useState([
    { id: 'cash', name: 'Cash' },
    { id: 'bank_transfer', name: 'Bank Transfer' },
    { id: 'cheque', name: 'Cheque' },
    { id: 'mobile_money', name: 'Mobile Money' },
    { id: 'other', name: 'Other' }
  ]);
  const [invoiceStructures, setInvoiceStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    student_reg_number: '',
    gradelevel_class_id: '',
    term: '',
    academic_year: '',
    invoice_structure_id: '',
    amount: '',
    currency_id: '',
    payment_method_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  // Success/Error modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (formData.gradelevel_class_id && formData.term && formData.academic_year) {
      fetchInvoiceStructures();
    }
  }, [formData.gradelevel_class_id, formData.term, formData.academic_year]);

  const fetchClasses = async () => {
    try {
      console.log('🔍 Fetching classes from:', `${BASE_URL}/classes/gradelevel-classes`);
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📊 Classes response:', response.data);
      setClasses(response.data.data || []);
      console.log('📋 Classes set:', response.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrencies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };



  const fetchInvoiceStructures = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/fees/invoice-structures/class/${formData.gradelevel_class_id}?term=${formData.term}&academic_year=${formData.academic_year}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInvoiceStructures(response.data.data || []);
    } catch (error) {
      console.error('Error fetching invoice structures:', error);
      setInvoiceStructures([]);
    }
  };

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
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      student_reg_number: student.RegNumber
    }));
    setStudents([]);
    setSearchTerm('');
  };

  const selectInvoiceStructure = (structure) => {
    setSelectedStructure(structure);
    setFormData(prev => ({
      ...prev,
      invoice_structure_id: structure.id,
      currency_id: structure.currency_id
      // Removed auto-population of amount
    }));
  };

  const generateReferenceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedStudent) {
      setErrorMessage('Please select a student');
      setShowErrorModal(true);
      return;
    }

    if (!selectedStructure) {
      setErrorMessage('Please select an invoice structure');
      setShowErrorModal(true);
      return;
    }

    if (!formData.amount || !formData.currency_id || !formData.payment_method_id) {
      setErrorMessage('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }

    if (!formData.reference_number.trim()) {
      setErrorMessage('Please enter a reference number');
      setShowErrorModal(true);
      return;
    }

    setShowConfirmation(true);
  };

  const confirmPayment = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const paymentPayload = {
        student_reg_number: selectedStudent.RegNumber,
        payment_amount: parseFloat(formData.amount),
        payment_currency: formData.currency_id,
        payment_method: paymentMethods.find(m => m.id === formData.payment_method_id)?.name || 'Cash',
        payment_date: formData.payment_date,
        reference_number: formData.reference_number,
        notes: formData.notes,
        fee_type: 'tuition',
        invoice_structure_id: formData.invoice_structure_id
      };

      const response = await axios.post(`${BASE_URL}/fees/payments`, paymentPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const receiptData = {
          receipt_number: response.data.data.receipt_number,
          student_name: `${selectedStudent.Name} ${selectedStudent.Surname}`,
          student_reg: selectedStudent.RegNumber,
          amount: formData.amount,
          currency: currencies.find(c => c.id === formData.currency_id)?.symbol || '',
          payment_date: formData.payment_date,
          payment_method: paymentMethods.find(m => m.id === formData.payment_method_id)?.name || 'Cash',
          fee_type: 'tuition',
          reference_number: formData.reference_number,
          class_name: selectedStructure?.class_name || '',
          term: selectedStructure?.term || '',
          academic_year: selectedStructure?.academic_year || ''
        };
        
        setReceipt(receiptData);
        setShowConfirmation(false);
        setShowReceipt(true);
        setSuccessMessage('Payment processed successfully');
        setShowSuccessModal(true);
        
        // Reset form
        setFormData({
          student_reg_number: '',
          gradelevel_class_id: '',
          term: '',
          academic_year: '',
          invoice_structure_id: '',
          amount: '',
          currency_id: '',
          payment_method_id: '',
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: '',
          notes: ''
        });
        setSelectedStudent(null);
        setSelectedStructure(null);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to process payment');
      }
      setShowErrorModal(true);
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setErrorMessage('');
  };

  const downloadReceipt = () => {
    if (!receipt) return;
    
    // Create PDF content using jsPDF
    const doc = new jsPDF();
    
    // Set font and styling
    doc.setFont('helvetica');
    doc.setFontSize(16);
    
    // Header
    doc.text('PAYMENT RECEIPT', 105, 20, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Receipt details
    doc.setFontSize(10);
    doc.text('Receipt Number:', 20, 40);
    doc.text(receipt.receipt_number, 60, 40);
    
    doc.text('Date:', 20, 50);
    doc.text(receipt.payment_date, 60, 50);
    
    // Student Information
    doc.setFontSize(12);
    doc.text('Student Information:', 20, 70);
    doc.setFontSize(10);
    doc.text('Name:', 20, 80);
    doc.text(receipt.student_name, 60, 80);
    doc.text('Registration:', 20, 90);
    doc.text(receipt.student_reg, 60, 90);
    
    // Payment Details
    doc.setFontSize(12);
    doc.text('Payment Details:', 20, 110);
    doc.setFontSize(10);
    doc.text('Amount:', 20, 120);
    doc.text(`${receipt.amount} ${receipt.currency}`, 60, 120);
    doc.text('Payment Method:', 20, 130);
    doc.text(receipt.payment_method, 60, 130);
    doc.text('Reference Number:', 20, 140);
    doc.text(receipt.reference_number, 60, 140);
    
    // Fee Information
    doc.text('Fee Type:', 20, 150);
    doc.text(receipt.fee_type, 60, 150);
    doc.text('Class:', 20, 160);
    doc.text(receipt.class_name, 60, 160);
    doc.text('Term:', 20, 170);
    doc.text(`${receipt.term} ${receipt.academic_year}`, 60, 170);
    
    // Footer
    doc.setLineWidth(0.5);
    doc.line(20, 190, 190, 190);
    doc.setFontSize(10);
    doc.text('Thank you for your payment!', 105, 200, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 210, { align: 'center' });
    
    // Save the PDF
    doc.save(`receipt-${receipt.receipt_number}.pdf`);
  };

  return (
    <div className="bg-white border border-gray-200 p-4">
      <h2 className="text-base font-medium text-gray-900 mb-4">Tuition Fee Payments</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Student Selection */}
        <div>
          <h3 className="text-xs font-medium text-gray-900 mb-1">Student Information</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search Student <span className="text-red-500">*</span>
              </label>
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
                  className="bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800"
                >
                  Search
                </button>
              </div>
            </div>

                         {students.length > 0 && (
               <div className="border border-gray-200 max-h-32 overflow-y-auto">
                 <div className="bg-blue-50 p-2 border-b border-gray-200">
                   <p className="text-xs text-blue-700 font-medium">Click on a student below to select:</p>
                 </div>
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
                       Reg: {student.RegNumber} | Class: {student.Class}
                     </div>
                   </div>
                 ))}
               </div>
             )}

                         {selectedStudent && (
               <div className="bg-green-50 border border-green-200 p-3">
                 <div className="flex items-center mb-2">
                   <FontAwesomeIcon icon={faCheck} className="text-green-600 text-xs mr-2" />
                   <span className="text-xs font-medium text-green-800">Student Selected Successfully</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3 text-xs">
                   <div>
                     <span className="text-gray-600">Name:</span>
                     <span className="ml-1 font-medium">{selectedStudent.Name} {selectedStudent.Surname}</span>
                   </div>
                   <div>
                     <span className="text-gray-600">Registration No:</span>
                     <span className="ml-1 font-medium">{selectedStudent.RegNumber}</span>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Invoice Structure Selection */}
        <div>
          <h3 className="text-xs font-medium text-gray-900 mb-1">Invoice Structure</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Class <span className="text-red-500">*</span> ({classes.length} loaded)
              </label>
              <select
                value={formData.gradelevel_class_id}
                onChange={(e) => setFormData(prev => ({ ...prev, gradelevel_class_id: e.target.value }))}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls) => {
                  console.log('🔍 Class item:', cls);
                  return (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.stream_name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Term <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.term}
                onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              >
                <option value="">Select Term</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.academic_year}
                onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                placeholder="e.g., 2025"
                className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              />
            </div>
          </div>

                     {/* Invoice Structures List */}
           {invoiceStructures.length > 0 && (
             <div className="mt-3">
               <div className="bg-blue-50 p-2 border border-gray-200 mb-2">
                 <p className="text-xs text-blue-700 font-medium">Click on an invoice structure below to select:</p>
               </div>
               <div className="space-y-1">
                 {invoiceStructures.map((structure) => (
                   <div
                     key={structure.id}
                     onClick={() => selectInvoiceStructure(structure)}
                     className={`p-2 border cursor-pointer transition-colors ${
                       selectedStructure?.id === structure.id
                         ? 'border-gray-500 bg-gray-50'
                         : 'border-gray-200 hover:border-gray-300'
                     }`}
                   >
                     <div className="flex justify-between items-start">
                       <div>
                         <div className="font-medium text-gray-900 text-xs">
                           {structure.class_name} - {structure.term} {structure.academic_year}
                         </div>
                         <div className="text-xs text-gray-500">
                           {structure.invoice_items?.length || 0} items
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="font-medium text-gray-900 text-xs">
                           {structure.total_amount} {structure.currency_symbol}
                         </div>
                         <div className="text-xs text-gray-500">
                           {structure.is_active ? 'Active' : 'Inactive'}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}

                     {selectedStructure && (
             <div className="mt-3 bg-green-50 border border-green-200 p-3">
               <div className="flex items-center mb-2">
                 <FontAwesomeIcon icon={faCheck} className="text-green-600 text-xs mr-2" />
                 <span className="text-xs font-medium text-green-800">Invoice Structure Selected Successfully</span>
               </div>
               <div className="grid grid-cols-2 gap-3 text-xs">
                 <div>
                   <span className="text-gray-600">Selected:</span>
                   <span className="ml-1 font-medium">{selectedStructure.class_name} - {selectedStructure.term} {selectedStructure.academic_year}</span>
                 </div>
                 <div>
                   <span className="text-gray-600">Total Amount:</span>
                   <span className="ml-1 font-medium">{selectedStructure.total_amount} {selectedStructure.currency_symbol}</span>
                 </div>
                 <div className="col-span-2">
                   <span className="text-xs text-gray-500">Note: Please enter the payment amount manually below</span>
                 </div>
               </div>
             </div>
           )}
        </div>

        {/* Payment Details */}
        <div>
          <h3 className="text-xs font-medium text-gray-900 mb-1">Payment Details</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.currency_id}
                onChange={(e) => setFormData(prev => ({ ...prev, currency_id: e.target.value }))}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              >
                <option value="">Select Currency</option>
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.payment_method_id}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method_id: e.target.value }))}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              >
                <option value="">Select Payment Method</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reference Number <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Enter reference number"
                  className="flex-1 border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, reference_number: generateReferenceNumber() }))}
                  className="bg-gray-600 text-white px-2 py-1.5 text-xs hover:bg-gray-700"
                >
                  Auto
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                rows="2"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white px-4 py-2 text-xs hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Process Payment'}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Confirm Payment</h2>
              <button
                onClick={handleCancelConfirmation}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Student:</span>
                <span className="font-medium text-gray-900">{selectedStudent?.Name} {selectedStudent?.Surname}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Class:</span>
                <span className="font-medium text-gray-900">{selectedStructure?.class_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Term:</span>
                <span className="font-medium text-gray-900">{selectedStructure?.term} {selectedStructure?.academic_year}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-gray-900">{formData.amount} {currencies.find(c => c.id == formData.currency_id)?.symbol}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Reference:</span>
                <span className="font-medium text-gray-900">{formData.reference_number}</span>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelConfirmation}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                disabled={loading}
                className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && receipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Payment Receipt</h2>
              <button
                onClick={() => setShowReceipt(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Receipt Number</label>
                  <p className="text-xs text-gray-900 font-medium">{receipt.receipt_number}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-xs text-gray-900 font-medium">{receipt.payment_date}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Student</label>
                  <p className="text-xs text-gray-900 font-medium">{receipt.student_name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                  <p className="text-xs text-gray-900 font-medium">{receipt.amount} {receipt.currency}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reference</label>
                  <p className="text-xs text-gray-900 font-medium">{receipt.reference_number}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                  <p className="text-xs text-gray-900 font-medium">{receipt.payment_method}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={downloadReceipt}
                className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs hover:bg-gray-800"
              >
                Download PDF
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default TuitionFeesPayment;
