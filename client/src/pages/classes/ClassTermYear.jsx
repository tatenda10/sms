import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye,
  faPlay
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';

const ClassTermYear = () => {
  const { token } = useAuth();
  const [classTermYears, setClassTermYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Bulk form states
  const [bulkFormData, setBulkFormData] = useState({
    term: '',
    academic_year: '',
    start_date: '',
    end_date: ''
  });

  // Success/Error modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchClassTermYears();
  }, []);

  const fetchClassTermYears = async () => {
    setLoading(true);
    try {
      console.log('Fetching all class term years...');
      console.log('URL:', `${BASE_URL}/classes/class-term-years`);

      const response = await axios.get(`${BASE_URL}/classes/class-term-years`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Response:', response.data);
      setClassTermYears(response.data.data || []);
    } catch (error) {
      console.error('Error fetching class term years:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      setError('Failed to fetch class term years');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      console.log('Fetching classes...');
      console.log('URL:', `${BASE_URL}/classes/gradelevel-classes`);
      
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Classes response:', response.data);
      setClasses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
    }
  };



  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log('Bulk populate data:', bulkFormData);
      console.log('URL:', `${BASE_URL}/classes/class-term-years/bulk-populate`);

      const response = await axios.post(`${BASE_URL}/classes/class-term-years/bulk-populate`, bulkFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Bulk populate response:', response.data);
      setSuccessMessage(response.data.message);
      setShowSuccessModal(true);
      setShowBulkModal(false);
      resetBulkForm();
      fetchClassTermYears();
    } catch (error) {
      console.error('Error bulk populating class term years:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      setErrorMessage(error.response?.data?.message || 'Failed to bulk populate class term years');
      setShowErrorModal(true);
    }
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };


  const resetBulkForm = () => {
    setBulkFormData({
      term: '',
      academic_year: '',
      start_date: '',
      end_date: ''
    });
  };


  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-900">Class Term Year Management</h1>
            <p className="text-xs text-gray-500">Manage class assignments for terms and academic years</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkModal(true)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FontAwesomeIcon icon={faPlay} className="mr-1" />
              Bulk Populate
            </button>
          </div>
        </div>
      </div>


      {/* Class Term Year Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Term
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : classTermYears.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No class term year records found
                  </td>
                </tr>
              ) : (
                classTermYears.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {record.class_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.stream_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {record.term}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {record.academic_year}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {record.start_date || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {record.end_date || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(record)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Bulk Populate Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 w-full max-w-md">
            <h2 className="text-sm font-bold mb-4">Bulk Populate Class Term Years</h2>
            <p className="text-xs text-gray-600 mb-4">
              This will create class term year records for all active classes for the specified term and academic year.
            </p>
            
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Term *
                </label>
                <select
                  value={bulkFormData.term}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, term: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
                  Academic Year *
                </label>
                <input
                  type="text"
                  value={bulkFormData.academic_year}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                  placeholder="e.g., 2025"
                  className="w-full border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={bulkFormData.start_date}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={bulkFormData.end_date}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false);
                    resetBulkForm();
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Populate All Classes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-bold mb-4">Class Term Year Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Class</label>
                  <p className="text-xs text-gray-900">{selectedRecord.class_name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Stream</label>
                  <p className="text-xs text-gray-900">{selectedRecord.stream_name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Term</label>
                  <p className="text-xs text-gray-900">{selectedRecord.term}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Academic Year</label>
                  <p className="text-xs text-gray-900">{selectedRecord.academic_year}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Start Date</label>
                  <p className="text-xs text-gray-900">{selectedRecord.start_date || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">End Date</label>
                  <p className="text-xs text-gray-900">{selectedRecord.end_date || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold ${
                    selectedRecord.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedRecord.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowViewModal(false)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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

export default ClassTermYear;
