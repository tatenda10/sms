import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendar, 
  faClock, 
  faUsers, 
  faCog, 
  faPlus, 
  faEdit, 
  faTrash, 
  faArrowLeft, 
  faExclamationTriangle, 
  faCheckCircle, 
  faPlay,
  faEye,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import TimetableGrid from './TimetableGrid';

const TemplateView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [entries, setEntries] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [stats, setStats] = useState(null);

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

  // Fetch timetable entries
  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/timetables/templates/${id}/entries`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setEntries(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
    }
  };

  // Refresh entries (for TimetableGrid callbacks)
  const handleEntryUpdate = () => {
    fetchEntries();
  };

  const handleEntryDelete = () => {
    fetchEntries();
  };

  // Fetch conflicts
  const fetchConflicts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/timetable-generation/templates/${id}/conflicts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConflicts(data.data.conflicts || []);
      }
    } catch (err) {
      console.error('Error fetching conflicts:', err);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${BASE_URL}/timetable-generation/templates/${id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Generate timetable
  const generateTimetable = async () => {
    try {
      const response = await fetch(`${BASE_URL}/timetable-generation/templates/${id}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            clearExisting: true,
            strategy: 'balanced'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Timetable generated successfully! ${data.data.generated_entries} entries created.`);
        fetchEntries();
        fetchConflicts();
        fetchStats();
      } else {
        const errorData = await response.json();
        alert(`Failed to generate timetable: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Error generating timetable:', err);
      alert('Failed to generate timetable');
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  useEffect(() => {
    if (template) {
      fetchEntries();
      fetchConflicts();
      fetchStats();
    }
  }, [template]);

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

  return (
    <div className="">
      {/* Template Info Card */}
      {loading ? (
        <div className="text-xs text-gray-500 mb-4">Loading...</div>
      ) : error ? (
        <div className="text-xs text-red-600 mb-4">{error}</div>
      ) : template ? (
        <div className="mb-6 border-b border-gray-200">
          <div className="px-6 pt-2 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/dashboard/timetables')}
                  className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                </button>
                <div>
                  <div className="text-xl text-gray-900 font-semibold mb-1">{template.name}</div>
                  <div className="text-sm text-gray-500 mb-4">{template.academic_year} - {template.term}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={generateTimetable}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FontAwesomeIcon icon={faPlay} className="mr-1 h-3 w-3" />
                  Generate Timetable
                </button>
                <button
                  onClick={() => navigate(`/dashboard/timetables/template/${id}/edit`)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <FontAwesomeIcon icon={faEdit} className="mr-1 h-3 w-3" />
                  Edit Template
                </button>
              </div>
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
      ) : null}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', name: 'Overview', icon: faCalendar },
            { id: 'timetable', name: 'Timetable', icon: faClock },
            { id: 'conflicts', name: 'Conflicts', icon: faExclamationTriangle },
            { id: 'stats', name: 'Statistics', icon: faChartBar }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
                activeTab === tab.id
                  ? 'border-gray-700 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="mr-2 h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab template={template} />}
      {activeTab === 'timetable' && <TimetableTab template={template} entries={entries} onEntryUpdate={handleEntryUpdate} onEntryDelete={handleEntryDelete} />}
      {activeTab === 'conflicts' && <ConflictsTab conflicts={conflicts} />}
      {activeTab === 'stats' && <StatsTab stats={stats} />}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ template }) => {
  return (
      <div className="px-6 space-y-4">
        <div className="bg-white shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Template Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Name</label>
              <p className="text-gray-900 text-xs">{template.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Academic Year</label>
              <p className="text-gray-900 text-xs">{template.academic_year}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Term</label>
              <p className="text-gray-900 text-xs">{template.term}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Status</label>
              <p className="text-gray-900 text-xs">
                {template.is_active ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-gray-600">Inactive</span>
                )}
              </p>
            </div>
          </div>
          {template.description && (
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-700">Description</label>
              <p className="text-gray-900 text-xs">{template.description}</p>
            </div>
          )}
        </div>

      <div className="bg-white shadow p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Days Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {template.days?.map(day => (
            <div key={day.id} className="flex items-center p-2 bg-gray-50">
              <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 text-blue-600 mr-2" />
              <div>
                <p className="font-medium text-gray-900 text-xs">{day.day_of_week}</p>
                <p className="text-xs text-gray-600">{day.total_periods} periods</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Timetable Tab Component
const TimetableTab = ({ template, entries, onEntryUpdate, onEntryDelete }) => {
  return (
    <div className="px-6">
      <TimetableGrid 
        templateId={template.id} 
        entries={entries} 
        onEntryUpdate={onEntryUpdate}
        onEntryDelete={onEntryDelete}
      />
    </div>
  );
};

// Conflicts Tab Component
const ConflictsTab = ({ conflicts }) => {
  return (
    <div className="px-6">
      <div className="bg-white shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Conflicts</h3>
        </div>
        <div className="p-4">
          {conflicts.length === 0 ? (
            <div className="text-center py-6">
              <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">No Conflicts Found</h3>
              <p className="text-gray-600 text-xs">Your timetable is conflict-free!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conflicts.map(conflict => (
                <div key={conflict.id} className="p-3 bg-red-50 border border-red-200">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-medium text-red-800">{conflict.conflict_type}</h4>
                      <p className="text-xs text-red-700 mt-1">{conflict.description}</p>
                      <p className="text-xs text-red-600 mt-1">
                        {conflict.day_of_week} - {conflict.period_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stats Tab Component
const StatsTab = ({ stats }) => {
  if (!stats) {
    return (
      <div className="px-6">
        <div className="text-center py-8">
          <div className="text-gray-500 text-sm">Loading statistics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow p-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Entries</p>
              <p className="text-lg font-semibold text-gray-900">{stats.basic_stats?.total_entries || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow p-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCalendar} className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Active Days</p>
              <p className="text-lg font-semibold text-gray-900">{stats.basic_stats?.active_days || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow p-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faClock} className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Teachers</p>
              <p className="text-lg font-semibold text-gray-900">{stats.basic_stats?.teachers_involved || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow p-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-red-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Conflicts</p>
              <p className="text-lg font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {stats.teacher_workload && stats.teacher_workload.length > 0 && (
        <div className="bg-white shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Teacher Workload</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Periods
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Days
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subjects
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.teacher_workload.map(teacher => (
                  <tr key={teacher.teacher_name}>
                    <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      {teacher.teacher_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                      {teacher.total_periods}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                      {teacher.active_days}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                      {teacher.subjects_taught}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateView;
