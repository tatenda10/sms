import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendar, 
  faPlus, 
  faEdit, 
  faTrash, 
  faEye, 
  faSearch,
  faClock,
  faUsers,
  faExclamationTriangle,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Timetables = () => {
  const { token } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // Fetch timetable templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (activeSearchTerm && activeSearchTerm.trim() !== '') {
        // Search mode
        const response = await axios.get(`${BASE_URL}/timetables/templates`, {
          params: { 
            search: activeSearchTerm.trim()
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setTemplates(response.data.data || []);
      } else {
        // Normal mode
        const response = await axios.get(`${BASE_URL}/timetables/templates`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setTemplates(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to fetch timetable templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [activeSearchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
  };

  const handleCreateTemplate = () => {
    setShowCreateModal(true);
  };

  const handleViewTemplate = (template) => {
    window.location.href = `/dashboard/timetables/template/${template.id}`;
  };

  const handleEditTemplate = (template) => {
    window.location.href = `/dashboard/timetables/template/${template.id}/edit`;
  };

  const handleDeleteTemplate = (template) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      await axios.put(`${BASE_URL}/timetables/templates/${templateToDelete.id}`, 
        { is_active: false },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      fetchTemplates();
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTemplateToDelete(null);
  };

  const renderTemplates = () => (
    <div className="space-y-6">
      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by template name, year, or term..."
              className="flex-1 px-2 py-1 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <FontAwesomeIcon icon={faSearch} className="h-3 w-3" />
            </button>
          </form>
          
          {/* Search Results Info */}
          {activeSearchTerm && (
            <div className="mt-2 text-xs text-gray-600">
              {loading ? 'Searching...' : `Found ${templates.length} results for "${activeSearchTerm}"`}
              <button 
                onClick={handleClearSearch}
                className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCreateTemplate}
            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-1 h-3 w-3" />
            Add New Template
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-xs text-red-600">{error}</div>
        </div>
      )}

      {/* Templates Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">
                      Template Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">
                      Academic Year
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">
                      Term
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">
                      Days
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">
                      Entries
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {templates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium">{template.name}</div>
                            {template.description && (
                              <div className="text-gray-500 text-xs">{template.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {template.academic_year}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {template.term}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faClock} className="h-3 w-3 mr-1" />
                          {template.total_days || 0}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faUsers} className="h-3 w-3 mr-1" />
                          {template.total_entries || 0}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {template.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FontAwesomeIcon icon={faCheckCircle} className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="h-3 w-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewTemplate(template)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Template"
                          >
                            <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Template"
                          >
                            <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Template"
                          >
                            <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {templates.length === 0 && !loading && (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faCalendar} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetable Templates</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first timetable template</p>
          <button
            onClick={handleCreateTemplate}
            className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
            Create Template
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="">
      {loading ? (
        <div className="text-xs text-gray-500 mb-4">Loading...</div>
      ) : error ? (
        <div className="text-xs text-red-600 mb-4">{error}</div>
      ) : (
        renderTemplates()
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTemplates();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && templateToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delete Template</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{templateToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Create Template Modal Component
const CreateTemplateModal = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    academic_year: new Date().getFullYear().toString(),
    term: 'Term 1',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${BASE_URL}/timetables/templates`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        onSuccess();
      } else {
        setError(response.data.message || 'Failed to create template');
      }
    } catch (err) {
      console.error('Error creating template:', err);
      setError(err.response?.data?.message || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Timetable Template</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Term 1 2025"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Brief description of this timetable template"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year *
                </label>
                <input
                  type="text"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term *
                </label>
                <select
                  name="term"
                  value={formData.term}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.days.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Timetables;
