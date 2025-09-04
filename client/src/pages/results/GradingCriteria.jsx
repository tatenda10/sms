import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';

const GradingCriteria = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCriterion, setSelectedCriterion] = useState(null);
  const [form, setForm] = useState({
    grade: '',
    min_mark: '',
    max_mark: '',
    points: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCriteria();
  }, []);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/results/grading`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCriteria(res.data.data || []);
    } catch (err) {
      console.error('Error fetching grading criteria:', err);
      setError('Failed to fetch grading criteria');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCriterion = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        min_mark: parseInt(form.min_mark),
        max_mark: parseInt(form.max_mark),
        points: parseInt(form.points)
      };
      
      await axios.post(`${BASE_URL}/results/grading`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      setForm({ grade: '', min_mark: '', max_mark: '', points: '', description: '' });
      fetchCriteria();
    } catch (err) {
      console.error('Error adding grading criterion:', err);
      setError('Failed to add grading criterion: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCriterion = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        min_mark: parseInt(form.min_mark),
        max_mark: parseInt(form.max_mark),
        points: parseInt(form.points)
      };
      
      await axios.put(`${BASE_URL}/results/grading/${selectedCriterion.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowEditModal(false);
      setSelectedCriterion(null);
      setForm({ grade: '', min_mark: '', max_mark: '', points: '', description: '' });
      fetchCriteria();
    } catch (err) {
      console.error('Error updating grading criterion:', err);
      setError('Failed to update grading criterion: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCriterion = async (criterion) => {
    if (!window.confirm(`Are you sure you want to delete grade "${criterion.grade}"?`)) {
      return;
    }
    
    try {
      await axios.delete(`${BASE_URL}/results/grading/${criterion.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCriteria();
    } catch (err) {
      console.error('Error deleting grading criterion:', err);
      setError('Failed to delete grading criterion: ' + (err.response?.data?.message || err.message));
    }
  };

  const openEditModal = (criterion) => {
    setSelectedCriterion(criterion);
    setForm({
      grade: criterion.grade,
      min_mark: criterion.min_mark.toString(),
      max_mark: criterion.max_mark.toString(),
      points: criterion.points.toString(),
      description: criterion.description || ''
    });
    setShowEditModal(true);
  };

  const filteredCriteria = criteria.filter(criterion =>
    criterion.grade.toLowerCase().includes(search.toLowerCase()) ||
    (criterion.description && criterion.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-2">
      <div className="mb-8">
        <h1 className="text-base font-bold text-gray-900 mb-2">Grading Criteria</h1>
        <p className="text-sm text-gray-600">
          Manage grade ranges and points for automatic grade calculation
        </p>
      </div>

      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
            <input
              type="text"
              placeholder="Search grades..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="ml-4 px-4 py-2 bg-gray-900 text-white text-xs hover:bg-gray-800 flex items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />
          Add Grade
        </button>
      </div>

      {/* Grading Criteria Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mark Range
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-3 py-4 text-center text-xs text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredCriteria.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-3 py-4 text-center text-xs text-gray-500">
                  {search ? 'No grades found matching your search' : 'No grading criteria found'}
                </td>
              </tr>
            ) : (
              filteredCriteria.map((criterion) => (
                <tr key={criterion.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-bold text-gray-900">{criterion.grade}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-900">
                      {criterion.min_mark} - {criterion.max_mark}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-medium text-gray-900">{criterion.points}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs text-gray-900">
                      {criterion.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      criterion.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {criterion.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(criterion)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Grade"
                      >
                        <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteCriterion(criterion)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Grade"
                      >
                        <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Grade Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-md rounded-lg">
            <h2 className="text-base font-semibold mb-4">Add New Grade</h2>
            <form onSubmit={handleAddCriterion} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Grade *</label>
                <input
                  type="text"
                  value={form.grade}
                  onChange={(e) => setForm(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="e.g., A, B, C, D, E, F"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Mark *</label>
                  <input
                    type="number"
                    value={form.min_mark}
                    onChange={(e) => setForm(prev => ({ ...prev, min_mark: e.target.value }))}
                    className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    min="0"
                    max="100"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Mark *</label>
                  <input
                    type="number"
                    value={form.max_mark}
                    onChange={(e) => setForm(prev => ({ ...prev, max_mark: e.target.value }))}
                    className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    min="0"
                    max="100"
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Points *</label>
                <input
                  type="number"
                  value={form.points}
                  onChange={(e) => setForm(prev => ({ ...prev, points: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                  placeholder="e.g., 12 for A, 10 for B"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  placeholder="Optional description (e.g., Excellent, Good, Pass)"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setForm({ grade: '', min_mark: '', max_mark: '', points: '', description: '' });
                  }}
                  className="px-4 py-1 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1 text-xs text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Grade Modal */}
      {showEditModal && selectedCriterion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-md rounded-lg">
            <h2 className="text-base font-semibold mb-4">Edit Grade</h2>
            <form onSubmit={handleEditCriterion} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Grade *</label>
                <input
                  type="text"
                  value={form.grade}
                  onChange={(e) => setForm(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Mark *</label>
                  <input
                    type="number"
                    value={form.min_mark}
                    onChange={(e) => setForm(prev => ({ ...prev, min_mark: e.target.value }))}
                    className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Mark *</label>
                  <input
                    type="number"
                    value={form.max_mark}
                    onChange={(e) => setForm(prev => ({ ...prev, max_mark: e.target.value }))}
                    className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Points *</label>
                <input
                  type="number"
                  value={form.points}
                  onChange={(e) => setForm(prev => ({ ...prev, points: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCriterion(null);
                    setForm({ grade: '', min_mark: '', max_mark: '', points: '', description: '' });
                  }}
                  className="px-4 py-1 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1 text-xs text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 text-xs text-red-600">{error}</div>
      )}
    </div>
  );
};

export default GradingCriteria;
