import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faCheckCircle,
  faExclamationTriangle,
  faPlay,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const CloseToTerm = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [formData, setFormData] = useState({
    new_term: '',
    new_academic_year: ''
  });
  
  const [activeTab, setActiveTab] = useState('close'); // 'close' or 'open'


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseToTerm = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.post(`${BASE_URL}/close-to-term/close-to-term`, {}, { headers: authHeaders });
      
      setSuccess(`Close to Term completed successfully! ${response.data.data.closed_count} enrollments closed.`);
      setShowConfirmation(false);
      
    } catch (error) {
      console.error('Error closing term:', error);
      setError(error.response?.data?.message || 'Failed to close term');
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenToTerm = async () => {
    if (!formData.new_term || !formData.new_academic_year) {
      setError('Please enter both term and academic year');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.post(`${BASE_URL}/close-to-term/open-to-term`, formData, { headers: authHeaders });
      
      setSuccess(`Open to Term completed successfully! ${response.data.data.classes_updated} classes updated.`);
      setShowConfirmation(false);
      
      // Clear form
      setFormData({
        new_term: '',
        new_academic_year: ''
      });
      
    } catch (error) {
      console.error('Error opening term:', error);
      setError(error.response?.data?.message || 'Failed to open term');
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleConfirmAction = () => {
    if (activeTab === 'open') {
      if (!formData.new_term || !formData.new_academic_year) {
        setError('Please enter both term and academic year');
        return;
      }
    }
    setShowConfirmation(true);
  };

  const handleExecuteAction = () => {
    if (activeTab === 'close') {
      handleCloseToTerm();
    } else {
      handleOpenToTerm();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Term Management</h1>
              <p className="text-xs text-gray-600">Close current term or open to next term</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('close')}
                className={`py-2 px-1 border-b-2 font-medium text-xs ${
                  activeTab === 'close'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Close to Term
              </button>
              <button
                onClick={() => setActiveTab('open')}
                className={`py-2 px-1 border-b-2 font-medium text-xs ${
                  activeTab === 'open'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Open to Term
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-gray-200 shadow">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">
                {activeTab === 'close' ? 'Close to Term' : 'Open to Term'}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {activeTab === 'close' 
                  ? 'De-enroll all students from current term (no balance changes)'
                  : 'Move classes to next term and academic year'
                }
              </p>
            </div>
            
            <div className="p-4">
              {/* Success/Error Messages */}
              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 text-xs">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  {success}
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-xs">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {activeTab === 'close' ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-600 mb-4">
                      This will close ALL active enrollments (both gradelevel and subject classes). 
                      No balance changes will be made.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        New Term *
                      </label>
                      <input
                        type="text"
                        name="new_term"
                        value={formData.new_term}
                        onChange={handleInputChange}
                        placeholder="e.g., Term 1, Term 2, Term 3"
                        required
                        className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        New Academic Year *
                      </label>
                      <input
                        type="text"
                        name="new_academic_year"
                        value={formData.new_academic_year}
                        onChange={handleInputChange}
                        placeholder="e.g., 2025, 2026"
                        required
                        className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmAction}
                    disabled={loading || (activeTab === 'open' && (!formData.new_term || !formData.new_academic_year))}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    ) : (
                      <FontAwesomeIcon icon={faPlay} className="mr-2" />
                    )}
                    {loading ? 'Processing...' : (activeTab === 'close' ? 'Close to Term' : 'Open to Term')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">
                  Confirm {activeTab === 'close' ? 'Close to Term' : 'Open to Term'}
                </h2>
                <button
                  onClick={handleCancelConfirmation}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
                <div className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-orange-600 text-xs mr-2" />
                  <span className="text-xs font-medium text-orange-800">Warning</span>
                </div>
                <p className="text-xs text-orange-700">
                  {activeTab === 'close' ? (
                    <>
                      Are you sure you want to close ALL active enrollments? 
                      This will de-enroll all students from both gradelevel and subject classes. This action will NOT affect student balances.
                    </>
                  ) : (
                    <>
                      Are you sure you want to set all classes to <strong>{formData.new_term} {formData.new_academic_year}</strong>? 
                      This will update the class term year for all gradelevel and subject classes.
                    </>
                  )}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelConfirmation}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 text-xs font-medium rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteAction}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 text-xs font-medium rounded flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  ) : (
                    <FontAwesomeIcon icon={faPlay} className="mr-2" />
                  )}
                  {loading ? 'Processing...' : `Yes, ${activeTab === 'close' ? 'Close to Term' : 'Open to Term'}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloseToTerm;
