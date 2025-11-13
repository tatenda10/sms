import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUserGraduate, 
  faDollarSign,
  faCalendarAlt,
  faCheck,
  faTimes,
  faTag,
  faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';

const ProcessWaiver = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Success/Error modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    student_reg_number: '',
    waiver_amount: '',
    currency_id: '',
    category_id: '',
    reason: '',
    notes: '',
    term: '',
    academic_year: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchCurrencies();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/waivers/categories`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setErrorMessage(`Failed to fetch waiver categories: ${error.response?.data?.message || error.message}`);
      setShowErrorModal(true);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const currencyList = response.data.data || [];
      setCurrencies(currencyList);
      
      // Set default currency to base currency
      const baseCurrency = currencyList.find(c => c.base_currency);
      if (baseCurrency) {
        setFormData(prev => ({ ...prev, currency_id: baseCurrency.id }));
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      setErrorMessage('Failed to load currencies. Please refresh the page.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedStudent) {
      setErrorMessage('Please select a student');
      setShowErrorModal(true);
      return;
    }

    if (!formData.waiver_amount || !formData.currency_id || !formData.category_id || !formData.reason || !formData.term || !formData.academic_year) {
      setErrorMessage('Please fill in all required fields including currency, term and academic year');
      setShowErrorModal(true);
      return;
    }

    if (parseFloat(formData.waiver_amount) <= 0) {
      setErrorMessage('Waiver amount must be greater than 0');
      setShowErrorModal(true);
      return;
    }

    setShowConfirmation(true);
  };

  const confirmWaiver = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const waiverPayload = {
        student_reg_number: selectedStudent.RegNumber,
        waiver_amount: parseFloat(formData.waiver_amount),
        currency_id: formData.currency_id,
        category_id: formData.category_id,
        reason: formData.reason,
        notes: formData.notes,
        term: formData.term,
        academic_year: formData.academic_year
      };

      const response = await axios.post(`${BASE_URL}/waivers/process`, waiverPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMessage(`Waiver of ${formData.waiver_amount} processed successfully for ${selectedStudent.Name} ${selectedStudent.Surname}`);
        setShowSuccessModal(true);
        setShowConfirmation(false);
        
        // Reset form but keep currency
        const baseCurrency = currencies.find(c => c.base_currency);
        setFormData({
          student_reg_number: '',
          waiver_amount: '',
          currency_id: baseCurrency?.id || '',
          category_id: '',
          reason: '',
          notes: '',
          term: '',
          academic_year: ''
        });
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Error processing waiver:', error);
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to process waiver');
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

  return (
    <div className="bg-white border border-gray-200 p-3">
      <form onSubmit={handleSubmit} className="space-y-3">
            {/* Student Selection */}
            <div>
              <h3 className="text-xs font-medium text-gray-900 mb-1">Student Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Search Student <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
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
                      className="bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800 w-full sm:w-auto"
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

            {/* Waiver Details */}
            <div>
              <h3 className="text-xs font-medium text-gray-900 mb-1">Waiver Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Waiver Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faDollarSign} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.waiver_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, waiver_amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.currency_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency_id: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    required
                  >
                    <option value="">Select Currency</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Waiver Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faTag} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faFileAlt} className="absolute left-2 top-2 text-gray-400 text-xs" />
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Explain why this waiver is being granted..."
                      className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      rows="3"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Term <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                    <select
                      value={formData.term}
                      onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
                      className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      required
                    >
                      <option value="">Select Term</option>
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      value={formData.academic_year}
                      onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                      placeholder="e.g., 2025"
                      className="w-full pl-6 pr-2 py-1.5 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes or comments..."
                    className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    rows="2"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center sm:justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 text-white px-4 py-2 text-xs hover:bg-gray-800 disabled:opacity-50 w-full sm:w-auto"
              >
                {loading ? 'Processing...' : 'Process Waiver'}
              </button>
            </div>
          </form>

          {/* Confirmation Modal */}
          {showConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-4 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm md:text-base font-bold text-gray-900">Confirm Waiver</h2>
                  <button
                    onClick={handleCancelConfirmation}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                  </button>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                    <span className="text-gray-600">Student:</span>
                    <span className="font-medium text-gray-900">{selectedStudent?.Name} {selectedStudent?.Surname}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                    <span className="text-gray-600">Registration:</span>
                    <span className="font-medium text-gray-900">{selectedStudent?.RegNumber}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                    <span className="text-gray-600">Waiver Amount:</span>
                    <span className="font-medium text-gray-900">${formData.waiver_amount}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900">
                      {categories.find(c => c.id == formData.category_id)?.category_name}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                    <span className="text-gray-600">Reason:</span>
                    <span className="font-medium text-gray-900">{formData.reason}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                    <span className="text-gray-600">Term:</span>
                    <span className="font-medium text-gray-900">{formData.term}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs">
                    <span className="text-gray-600">Academic Year:</span>
                    <span className="font-medium text-gray-900">{formData.academic_year}</span>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-3 mb-4">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> This waiver will credit the student's account and reduce their outstanding balance.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <button
                    onClick={handleCancelConfirmation}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmWaiver}
                    disabled={loading}
                    className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 disabled:opacity-50 w-full sm:w-auto"
                  >
                    {loading ? 'Processing...' : 'Confirm Waiver'}
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

export default ProcessWaiver;
