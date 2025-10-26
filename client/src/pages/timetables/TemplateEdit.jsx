import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendar, 
  faClock, 
  faPlus, 
  faTrash, 
  faArrowLeft, 
  faSave, 
  faExclamationTriangle,
  faEdit,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const TemplateEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState('Monday');
  const [showAddPeriodModal, setShowAddPeriodModal] = useState(false);

  // Fetch template details
  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/timetables/templates/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setTemplate(response.data.data);
        if (response.data.data.days && response.data.data.days.length > 0) {
          setActiveDay(response.data.data.days[0].day_of_week);
        }
      } else {
        setError('Failed to fetch template details');
      }
    } catch (err) {
      console.error('Error fetching template:', err);
      setError('Failed to fetch template details');
    } finally {
      setLoading(false);
    }
  };

  // Update template
  const updateTemplate = async (formData) => {
    try {
      setSaving(true);
      const response = await axios.put(`${BASE_URL}/timetables/templates/${id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        navigate(`/dashboard/timetables/template/${id}`);
      } else {
        setError(response.data.message || 'Failed to update template');
      }
    } catch (err) {
      console.error('Error updating template:', err);
      setError(err.response?.data?.message || 'Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  // Add period
  const addPeriod = async (periodData) => {
    try {
      const response = await fetch(`${BASE_URL}/timetables/templates/${id}/periods/${activeDay}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(periodData)
      });

      if (response.ok) {
        fetchTemplate(); // Refresh template data
        setShowAddPeriodModal(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add period');
      }
    } catch (err) {
      console.error('Error adding period:', err);
      setError('Failed to add period');
    }
  };

  // Update period
  const updatePeriod = async (periodId, periodData) => {
    try {
      const response = await fetch(`${BASE_URL}/timetables/periods/${periodId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(periodData)
      });

      if (response.ok) {
        fetchTemplate(); // Refresh template data
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update period');
      }
    } catch (err) {
      console.error('Error updating period:', err);
      setError('Failed to update period');
    }
  };

  // Delete period
  const deletePeriod = async (periodId) => {
    if (window.confirm('Are you sure you want to delete this period?')) {
      try {
        const response = await fetch(`${BASE_URL}/timetables/periods/${periodId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          fetchTemplate(); // Refresh template data
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to delete period');
        }
      } catch (err) {
        console.error('Error deleting period:', err);
        setError('Failed to delete period');
      }
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading template...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard/timetables')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Timetables
          </button>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Template Not Found</h3>
          <p className="text-gray-600 mb-4">The requested timetable template could not be found.</p>
          <button
            onClick={() => navigate('/dashboard/timetables')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Timetables
          </button>
        </div>
      </div>
    );
  }

  const currentDay = template.days?.find(day => day.day_of_week === activeDay);
  const periods = currentDay?.periods || [];

  return (
    <div className="">
      {/* Template Info Card */}
      <div className="mb-6 border-b border-gray-200">
        <div className="px-6 pt-2 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/dashboard/timetables/template/${id}`)}
                className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
              </button>
              <div>
                <div className="text-xl text-gray-900 font-semibold mb-1">Edit Template</div>
                <div className="text-sm text-gray-500 mb-4">{template.name}</div>
              </div>
            </div>
            <button
              onClick={() => updateTemplate({ name: template.name, description: template.description, is_active: template.is_active })}
              disabled={saving}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faSave} className="mr-1 h-3 w-3" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:space-x-8 text-sm text-gray-700">
            <div className="flex items-center mb-2 sm:mb-0">
              <FontAwesomeIcon icon={faCalendar} className="mr-2 h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Template:</span>
              <span className="ml-1 text-gray-900">{template.name}</span>
            </div>
            <div className="flex items-center">
              <FontAwesomeIcon icon={faClock} className="mr-2 h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Days:</span>
              <span className="ml-1 text-gray-900">{template.days?.length || 0} configured</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <div className="px-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Days Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Days</h3>
            <div className="space-y-1">
              {template.days?.map(day => (
                <button
                  key={day.id}
                  onClick={() => setActiveDay(day.day_of_week)}
                  className={`w-full text-left px-2 py-1 transition-colors text-xs ${
                    activeDay === day.day_of_week
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{day.day_of_week}</span>
                    <span className="text-xs text-gray-500">{day.total_periods} periods</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Periods Content */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow">
            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                {activeDay} Periods
              </h3>
              <button
                onClick={() => setShowAddPeriodModal(true)}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-1 h-3 w-3" />
                Add Period
              </button>
            </div>
            <div className="p-4">
              {periods.length === 0 ? (
                <div className="text-center py-6">
                  <FontAwesomeIcon icon={faClock} className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No Periods</h3>
                  <p className="text-gray-600 text-xs mb-3">Add periods to configure the {activeDay} schedule</p>
                  <button
                    onClick={() => setShowAddPeriodModal(true)}
                    className="inline-flex items-center px-3 py-1 bg-gray-700 text-white hover:bg-gray-800 transition-colors text-xs"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-1 h-3 w-3" />
                    Add First Period
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {periods.map(period => (
                    <PeriodCard
                      key={period.id}
                      period={period}
                      onUpdate={(data) => updatePeriod(period.id, data)}
                      onDelete={() => deletePeriod(period.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Period Modal */}
      {showAddPeriodModal && (
        <AddPeriodModal
          onClose={() => setShowAddPeriodModal(false)}
          onSave={addPeriod}
          dayOfWeek={activeDay}
        />
      )}
    </div>
  );
};

// Period Card Component
const PeriodCard = ({ period, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: period.name,
    start_time: period.start_time,
    end_time: period.end_time,
    period_type: period.period_type,
    is_break: period.is_break,
    sort_order: period.sort_order
  });

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: period.name,
      start_time: period.start_time,
      end_time: period.end_time,
      period_type: period.period_type,
      is_break: period.is_break,
      sort_order: period.sort_order
    });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="border border-gray-200 p-3">
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                name="period_type"
                value={formData.period_type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Teaching">Teaching</option>
                <option value="Break">Break</option>
                <option value="Assembly">Assembly</option>
                <option value="Sports">Sports</option>
                <option value="Chapel">Chapel</option>
                <option value="Lunch">Lunch</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_break"
              checked={formData.is_break}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-xs text-gray-700">Break Period (no classes allowed)</label>
          </div>
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-gray-700 text-white hover:bg-gray-800 transition-colors text-xs"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-2 h-2 mr-2 ${
              period.is_break ? 'bg-red-500' : 'bg-green-500'
            }`} />
            <div>
              <h4 className="font-medium text-gray-900 text-sm">{period.name}</h4>
              <p className="text-xs text-gray-600">
                {period.start_time} - {period.end_time} ({period.period_type})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-600 hover:bg-gray-100 transition-colors"
              title="Edit Period"
            >
              <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-red-600 hover:bg-red-100 transition-colors"
              title="Delete Period"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Period Modal Component
const AddPeriodModal = ({ onClose, onSave, dayOfWeek }) => {
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    period_type: 'Teaching',
    is_break: false,
    sort_order: 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Add Period - {dayOfWeek}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Period 1, Break, Assembly"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Time *</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Time *</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
              <select
                name="period_type"
                value={formData.period_type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="Teaching">Teaching</option>
                <option value="Break">Break</option>
                <option value="Assembly">Assembly</option>
                <option value="Sports">Sports</option>
                <option value="Chapel">Chapel</option>
                <option value="Lunch">Lunch</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_break"
                checked={formData.is_break}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-xs text-gray-700">Break Period (no classes allowed)</label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-500 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faSave} className="mr-1 h-3 w-3" />
              {loading ? 'Adding...' : 'Add Period'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateEdit;
