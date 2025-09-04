import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, 
    faCreditCard, 
    faDollarSign,
    faCheck,
    faTimes,
    faPrint,
    faDownload,
    faUser,
    faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';

const UnifiedFeePayment = () => {
    const { token } = useAuth();
    const [studentRegNumber, setStudentRegNumber] = useState('');
    const [student, setStudent] = useState(null);
    const [balance, setBalance] = useState(null);
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [paymentData, setPaymentData] = useState({
        payment_amount: '',
        payment_currency: '',
        exchange_rate: 1.0,
        payment_method: 'Cash',
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        notes: ''
    });
    const [receipt, setReceipt] = useState(null);

    // Fetch currencies on component mount
    useEffect(() => {
        fetchCurrencies();
    }, []);

    // Fetch currencies
    const fetchCurrencies = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrencies(response.data.data);
        } catch (error) {
            console.error('Error fetching currencies:', error);
        }
    };

    // Search for student
    const searchStudent = async () => {
        console.log('🔍 Starting student search for:', studentRegNumber);
        
        if (!studentRegNumber.trim()) {
            setError('Please enter a student registration number');
            setShowErrorModal(true);
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('📡 Making API call to:', `${BASE_URL}/students/search?query=${studentRegNumber}`);
            // Get student details
            const studentResponse = await axios.get(`${BASE_URL}/students/search?query=${studentRegNumber}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Student response:', studentResponse.data);
            setStudent(studentResponse.data.data[0]); // Get first student from search results

            console.log('📡 Making balance API call to:', `${BASE_URL}/student-balances/${studentRegNumber}`);
            // Get student balance
            const balanceResponse = await axios.get(`${BASE_URL}/student-balances/${studentRegNumber}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Balance response:', balanceResponse.data);
            setBalance(balanceResponse.data.data);

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
            setShowErrorModal(true);
            setStudent(null);
            setBalance(null);
        } finally {
            setLoading(false);
        }
    };

    // Handle payment data change
    const handlePaymentDataChange = (field, value) => {
        setPaymentData(prev => ({
            ...prev,
            [field]: value
        }));

        // Auto-calculate exchange rate if currency changes
        if (field === 'payment_currency') {
            const selectedCurrency = currencies.find(c => c.id == value);
            if (selectedCurrency) {
                setPaymentData(prev => ({
                    ...prev,
                    exchange_rate: selectedCurrency.exchange_rate || 1.0
                }));
            }
        }
    };

    // Calculate base currency amount
    const calculateBaseAmount = () => {
        const amount = parseFloat(paymentData.payment_amount) || 0;
        const rate = parseFloat(paymentData.exchange_rate) || 1.0;
        return (amount * rate).toFixed(2);
    };

    // Process payment
    const processPayment = async () => {
        if (!student) {
            setError('Please search for a student first');
            setShowErrorModal(true);
            return;
        }

        if (!paymentData.payment_amount || !paymentData.payment_currency || !paymentData.payment_method) {
            setError('Please fill in all required fields');
            setShowErrorModal(true);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const paymentPayload = {
                student_reg_number: studentRegNumber,
                ...paymentData,
                base_currency_amount: calculateBaseAmount()
            };

            const response = await axios.post(`${BASE_URL}/fees/payments`, paymentPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setReceipt(response.data.data);
            setSuccess('Payment processed successfully!');
            setShowSuccessModal(true);

            // Reset form
            setPaymentData({
                payment_amount: '',
                payment_currency: '',
                exchange_rate: 1.0,
                payment_method: 'Cash',
                payment_date: new Date().toISOString().split('T')[0],
                reference_number: '',
                notes: ''
            });

            // Refresh student balance
            if (student) {
                const balanceResponse = await axios.get(`${BASE_URL}/student-balances/${studentRegNumber}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBalance(balanceResponse.data.data);
            }

        } catch (error) {
            console.error('Error processing payment:', error);
            setError(error.response?.data?.message || 'Failed to process payment');
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };

    // Print receipt
    const printReceipt = () => {
        if (receipt) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Payment Receipt</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                            .receipt-details { margin-bottom: 20px; }
                            .receipt-details table { width: 100%; border-collapse: collapse; }
                            .receipt-details td { padding: 5px; border-bottom: 1px solid #ddd; }
                            .amount { font-size: 18px; font-weight: bold; color: #2563eb; }
                            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Payment Receipt</h1>
                            <p>Receipt #: ${receipt.receipt_number}</p>
                        </div>
                        <div class="receipt-details">
                            <table>
                                <tr><td><strong>Student:</strong></td><td>${student?.Name} ${student?.Surname}</td></tr>
                                <tr><td><strong>Registration No:</strong></td><td>${student?.RegNumber}</td></tr>
                                <tr><td><strong>Payment Date:</strong></td><td>${paymentData.payment_date}</td></tr>
                                <tr><td><strong>Payment Method:</strong></td><td>${paymentData.payment_method}</td></tr>
                                <tr><td><strong>Amount:</strong></td><td class="amount">$${calculateBaseAmount()}</td></tr>
                                ${paymentData.reference_number ? `<tr><td><strong>Reference:</strong></td><td>${paymentData.reference_number}</td></tr>` : ''}
                                ${paymentData.notes ? `<tr><td><strong>Notes:</strong></td><td>${paymentData.notes}</td></tr>` : ''}
                            </table>
                        </div>
                        <div class="footer">
                            <p>Thank you for your payment!</p>
                            <p>Generated on: ${new Date().toLocaleString()}</p>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Fee Payment</h1>

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

                {/* Student Info and Balance */}
                {student && balance && (
                    <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Student Info */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                                    Student Information
                                </h3>
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
                                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                                    <FontAwesomeIcon icon={faDollarSign} className="mr-2" />
                                    Current Balance
                                </h3>
                                <div className={`text-2xl font-bold ${balance.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${parseFloat(balance.current_balance).toFixed(2)}
                                </div>
                                <p className="text-sm text-gray-500">
                                    {balance.current_balance >= 0 ? 'Credit Balance' : 'Outstanding Balance'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Form */}
                {student && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
                            Payment Details
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Payment Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Amount *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={paymentData.payment_amount}
                                    onChange={(e) => handlePaymentDataChange('payment_amount', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Payment Currency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Currency *
                                </label>
                                <select
                                    value={paymentData.payment_currency}
                                    onChange={(e) => handlePaymentDataChange('payment_currency', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Currency</option>
                                    {currencies.map(currency => (
                                        <option key={currency.id} value={currency.id}>
                                            {currency.name} ({currency.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Exchange Rate */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Exchange Rate
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={paymentData.exchange_rate}
                                    onChange={(e) => handlePaymentDataChange('exchange_rate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method *
                                </label>
                                <select
                                    value={paymentData.payment_method}
                                    onChange={(e) => handlePaymentDataChange('payment_method', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Mobile Money">Mobile Money</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Payment Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Date
                                </label>
                                <input
                                    type="date"
                                    value={paymentData.payment_date}
                                    onChange={(e) => handlePaymentDataChange('payment_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Reference Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reference Number
                                </label>
                                <input
                                    type="text"
                                    value={paymentData.reference_number}
                                    onChange={(e) => handlePaymentDataChange('reference_number', e.target.value)}
                                    placeholder="Transaction reference"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={paymentData.notes}
                                onChange={(e) => handlePaymentDataChange('notes', e.target.value)}
                                placeholder="Additional notes..."
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Base Currency Amount Display */}
                        {paymentData.payment_amount && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Base Currency Amount:</span>
                                    <span className="ml-2 text-lg font-bold text-blue-600">
                                        ${calculateBaseAmount()}
                                    </span>
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="mt-6">
                            <button
                                onClick={processPayment}
                                disabled={loading || !paymentData.payment_amount || !paymentData.payment_currency}
                                className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                {loading ? 'Processing Payment...' : 'Process Payment'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Receipt Actions */}
                {receipt && (
                    <div className="mt-6 bg-green-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-800 mb-3">Payment Successful!</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Receipt #: <span className="font-medium">{receipt.receipt_number}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={printReceipt}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <FontAwesomeIcon icon={faPrint} className="mr-2" />
                                Print Receipt
                            </button>
                            <button
                                onClick={() => setReceipt(null)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Success Modal */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Payment Successful"
                message={success}
            />

            {/* Error Modal */}
            <ErrorModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                title="Payment Error"
                message={error}
            />
        </div>
    );
};

export default UnifiedFeePayment;
