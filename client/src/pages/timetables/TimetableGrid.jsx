import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, 
  faUsers, 
  faExclamationTriangle, 
  faPlus, 
  faEdit, 
  faTrash,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const TimetableGrid = ({ templateId, entries, onEntryUpdate, onEntryDelete }) => {
  const { token } = useAuth();
  const [periods, setPeriods] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Fetch periods for each day
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        setLoading(true);
        const periodsData = {};
        
        for (const day of days) {
          const response = await axios.get(`${BASE_URL}/timetables/templates/${templateId}/periods/${day}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data.success) {
            periodsData[day] = response.data.data || [];
          }
        }
        
        setPeriods(periodsData);
      } catch (err) {
        console.error('Error fetching periods:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPeriods();
  }, [templateId]);

  // Get entry for specific day and period
  const getEntry = (day, periodId) => {
    return entries.find(entry => 
      entry.day_of_week === day && entry.period_id === periodId
    );
  };

  // Get all periods for a day, sorted by time
  const getSortedPeriods = (day) => {
    const dayPeriods = periods[day] || [];
    return dayPeriods.sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  // Handle cell click
  const handleCellClick = (day, period) => {
    if (period.is_break) return; // Don't allow editing break periods
    
    const entry = getEntry(day, period.id);
    setSelectedCell({ day, period, entry });
    setShowAddEntryModal(true);
  };

  // Add/Update entry
  const handleSaveEntry = async (entryData) => {
    try {
      if (selectedCell.entry) {
        // Update existing entry
        const response = await fetch(`${BASE_URL}/timetables/entries/${selectedCell.entry.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(entryData)
        });

        if (response.ok) {
          onEntryUpdate && onEntryUpdate();
        }
      } else {
        // Create new entry
        const response = await fetch(`${BASE_URL}/timetables/templates/${templateId}/entries`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...entryData,
            day_of_week: selectedCell.day,
            period_id: selectedCell.period.id
          })
        });

        if (response.ok) {
          onEntryUpdate && onEntryUpdate();
        }
      }
      
      setShowAddEntryModal(false);
      setSelectedCell(null);
    } catch (err) {
      console.error('Error saving entry:', err);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        const response = await fetch(`${BASE_URL}/timetables/entries/${entryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          onEntryDelete && onEntryDelete();
        }
      } catch (err) {
        console.error('Error deleting entry:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading timetable...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Time
              </th>
              {days.map(day => (
                <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.keys(periods).length > 0 && getSortedPeriods(days[0]).map(period => (
              <tr key={period.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 bg-gray-50">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium">{period.name}</div>
                      <div className="text-xs text-gray-500">
                        {period.start_time} - {period.end_time}
                      </div>
                    </div>
                  </div>
                </td>
                {days.map(day => {
                  const dayPeriod = periods[day]?.find(p => p.id === period.id);
                  const entry = getEntry(day, period.id);
                  
                  if (!dayPeriod) {
                    return (
                      <td key={day} className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 bg-gray-50">
                        -
                      </td>
                    );
                  }

                  return (
                    <td key={day} className="px-6 py-4 whitespace-nowrap text-sm">
                      {dayPeriod.is_break ? (
                        <div className="flex items-center justify-center p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-center">
                            <div className="font-medium text-red-800">{dayPeriod.name}</div>
                            <div className="text-xs text-red-600">{dayPeriod.period_type}</div>
                          </div>
                        </div>
                      ) : entry ? (
                        <div className="group relative">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                            <div className="font-medium text-blue-900">{entry.subject_name}</div>
                            <div className="text-xs text-blue-700">{entry.teacher_name}</div>
                            <div className="text-xs text-blue-600">{entry.class_name || entry.stream_name}</div>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCell({ day, period: dayPeriod, entry });
                                  setShowAddEntryModal(true);
                                }}
                                className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                                title="Edit Entry"
                              >
                                <FontAwesomeIcon icon={faEdit} className="h-3 w-3 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEntry(entry.id);
                                }}
                                className="p-1 bg-white rounded shadow-sm hover:bg-red-50"
                                title="Delete Entry"
                              >
                                <FontAwesomeIcon icon={faTrash} className="h-3 w-3 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCellClick(day, dayPeriod)}
                          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-500 hover:text-blue-600"
                        >
                          <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mx-auto mb-1" />
                          <div className="text-xs">Add Class</div>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Entry Modal */}
      {showAddEntryModal && selectedCell && (
        <EntryModal
          selectedCell={selectedCell}
          templateId={templateId}
          onClose={() => {
            setShowAddEntryModal(false);
            setSelectedCell(null);
          }}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
};

// Entry Modal Component
const EntryModal = ({ selectedCell, templateId, onClose, onSave }) => {
  const { token } = useAuth();
  const [subjectClasses, setSubjectClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject_class_id: selectedCell.entry?.subject_class_id || ''
  });

  // Fetch available subject classes
  useEffect(() => {
    const fetchSubjectClasses = async () => {
      try {
        const response = await fetch(`${BASE_URL}/timetables/templates/${templateId}/available-subject-classes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSubjectClasses(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching subject classes:', err);
      }
    };

    fetchSubjectClasses();
  }, [templateId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {selectedCell.entry ? 'Edit Entry' : 'Add Entry'} - {selectedCell.day}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {selectedCell.period.name} ({selectedCell.period.start_time} - {selectedCell.period.end_time})
        </p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Class *
              </label>
              <select
                name="subject_class_id"
                value={formData.subject_class_id}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a subject class</option>
                {subjectClasses.map(sc => (
                  <option key={sc.id} value={sc.id}>
                    {sc.subject_name} - {sc.teacher_name} ({sc.class_name || sc.stream_name})
                  </option>
                ))}
              </select>
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
              {loading ? 'Saving...' : (selectedCell.entry ? 'Update' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimetableGrid;
