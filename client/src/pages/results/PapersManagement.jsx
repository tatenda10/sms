import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';

const PapersManagement = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/results/papers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPapers(res.data.data || []);
    } catch (err) {
      console.error('Error fetching papers:', err);
      setError('Failed to fetch papers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaper = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${BASE_URL}/results/papers`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      setForm({ name: '', description: '' });
      fetchPapers();
    } catch (err) {
      console.error('Error adding paper:', err);
      setError('Failed to add paper: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPaper = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${BASE_URL}/results/papers/${selectedPaper.id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowEditModal(false);
      setSelectedPaper(null);
      setForm({ name: '', description: '' });
      fetchPapers();
    } catch (err) {
      console.error('Error updating paper:', err);
      setError('Failed to update paper: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePaper = async (paper) => {
    if (!window.confirm(`Are you sure you want to delete "${paper.name}"?`)) {
      return;
    }
    
    try {
      await axios.delete(`${BASE_URL}/results/papers/${paper.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPapers();
    } catch (err) {
      console.error('Error deleting paper:', err);
      setError('Failed to delete paper: ' + (err.response?.data?.message || err.message));
    }
  };

  const openEditModal = (paper) => {
    setSelectedPaper(paper);
    setForm({
      name: paper.name,
      description: paper.description || ''
    });
    setShowEditModal(true);
  };

  const filteredPapers = papers.filter(paper =>
    paper.name.toLowerCase().includes(search.toLowerCase()) ||
    (paper.description && paper.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-2">
      <div className="mb-8">
        <h1 className="text-base font-bold text-gray-900 mb-2">Papers Management</h1>
        <p className="text-sm text-gray-600">
          Manage paper types for results entry (Paper 1, Paper 2, Practical, etc.)
        </p>
      </div>

      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
            <input
              type="text"
              placeholder="Search papers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="ml-4 px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />
          Add Paper
        </button>
      </div>

      {/* Papers Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paper Name
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
                <td colSpan="4" className="px-3 py-4 text-center text-xs text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredPapers.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-3 py-4 text-center text-xs text-gray-500">
                  {search ? 'No papers found matching your search' : 'No papers found'}
                </td>
              </tr>
            ) : (
              filteredPapers.map((paper) => (
                <tr key={paper.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-medium text-gray-900">{paper.name}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs text-gray-900">
                      {paper.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      paper.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {paper.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(paper)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Paper"
                      >
                        <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeletePaper(paper)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Paper"
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

      {/* Add Paper Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-md rounded-lg">
            <h2 className="text-base font-semibold mb-4">Add New Paper</h2>
            <form onSubmit={handleAddPaper} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Paper Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="e.g., Paper 1, Practical, Coursework"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Optional description of the paper type"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setForm({ name: '', description: '' });
                  }}
                  className="px-4 py-1 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Paper Modal */}
      {showEditModal && selectedPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-md rounded-lg">
            <h2 className="text-base font-semibold mb-4">Edit Paper</h2>
            <form onSubmit={handleEditPaper} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Paper Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPaper(null);
                    setForm({ name: '', description: '' });
                  }}
                  className="px-4 py-1 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Paper'}
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

export default PapersManagement;
