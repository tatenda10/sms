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
  faTimes,
  faChalkboardTeacher,
  faBook
} from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const TimetableGrid = ({ templateId, entries, onEntryUpdate, onEntryDelete }) => {
  const { token } = useAuth();
  const [periods, setPeriods] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
  const handleDeleteClick = (entry) => {
    setEntryToDelete(entry);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;

    setIsDeleting(true);
    try {
      const response = await axios.delete(`${BASE_URL}/timetables/entries/${entryToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        onEntryDelete && onEntryDelete();
        setShowDeleteModal(false);
        setEntryToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setEntryToDelete(null);
    setIsDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading timetable...</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="ecl-table" style={{ width: '100%', fontSize: '0.75rem' }}>
          <thead style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'var(--sidebar-bg)'
          }}>
            <tr>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, width: '150px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontAwesomeIcon icon={faClock} style={{ fontSize: '0.875rem' }} />
                  Time
                </div>
              </th>
              {days.map(day => (
                <th key={day} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, minWidth: '180px' }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(periods).length > 0 && getSortedPeriods(days[0]).map((period, periodIndex) => (
              <tr 
                key={period.id}
                style={{
                  backgroundColor: periodIndex % 2 === 0 ? '#fafafa' : '#f3f4f6'
                }}
              >
                <td style={{ padding: '12px', background: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faClock} style={{ fontSize: '0.875rem', color: '#64748b' }} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {period.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
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
                      <td key={day} style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', background: '#f9fafb' }}>
                        -
                      </td>
                    );
                  }

                  return (
                    <td key={day} style={{ padding: '8px', verticalAlign: 'top' }}>
                      {dayPeriod.is_break ? (
                        <div className="flex items-center justify-center p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-center">
                            <div className="font-medium text-red-800">{dayPeriod.name}</div>
                            <div className="text-xs text-red-600">{dayPeriod.period_type}</div>
                          </div>
                        </div>
                      ) : entry ? (
                        <div 
                          className="group relative"
                          onClick={() => handleCellClick(day, dayPeriod)}
                        >
                          <div style={{
                            padding: '10px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#dbeafe';
                            e.currentTarget.style.borderColor = '#93c5fd';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#eff6ff';
                            e.currentTarget.style.borderColor = '#bfdbfe';
                          }}
                          >
                            <div style={{ fontWeight: 600, color: '#1e40af', fontSize: '0.75rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FontAwesomeIcon icon={faBook} style={{ fontSize: '0.7rem' }} />
                              {entry.subject_name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#1e3a8a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FontAwesomeIcon icon={faChalkboardTeacher} style={{ fontSize: '0.65rem' }} />
                              {entry.teacher_name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FontAwesomeIcon icon={faUsers} style={{ fontSize: '0.65rem' }} />
                              {entry.class_name || entry.stream_name}
                            </div>
                          </div>
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                  handleDeleteClick(entry);
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
                          style={{
                            width: '100%',
                            padding: '16px 8px',
                            border: '2px dashed #d1d5db',
                            borderRadius: '6px',
                            background: 'transparent',
                            color: '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#60a5fa';
                            e.currentTarget.style.background = '#eff6ff';
                            e.currentTarget.style.color = '#2563eb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#6b7280';
                          }}
                        >
                          <FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.875rem' }} />
                          <div style={{ fontSize: '0.7rem', fontWeight: 500 }}>Add Entry</div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && entryToDelete && (
        <div className="modal-overlay" onClick={handleCloseDeleteModal}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button className="modal-close-btn" onClick={handleCloseDeleteModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '1.5rem', color: '#ef4444' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Are you sure you want to delete this timetable entry?
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div style={{
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Entry Information
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Subject:</strong> {entryToDelete.subject_name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Teacher:</strong> {entryToDelete.teacher_name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Class:</strong> {entryToDelete.class_name || entryToDelete.stream_name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Day:</strong> {entryToDelete.day_of_week} - {entryToDelete.period_name}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-delete"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Entry Modal Component
const EntryModal = ({ selectedCell, templateId, onClose, onSave }) => {
  const { token } = useAuth();
  const [subjectClasses, setSubjectClasses] = useState([]);
  const [allSubjectClasses, setAllSubjectClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    subject_class_id: selectedCell.entry?.subject_class_id || ''
  });

  // Fetch all subject classes (including already assigned ones for editing)
  useEffect(() => {
    const fetchSubjectClasses = async () => {
      try {
        setLoading(true);
        // Fetch available subject classes
        const availableResponse = await axios.get(`${BASE_URL}/timetables/templates/${templateId}/available-subject-classes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let availableClasses = [];
        if (availableResponse.data.success) {
          availableClasses = availableResponse.data.data || [];
        }

        // If editing, also fetch the current subject class to include it in the list
        if (selectedCell.entry?.subject_class_id) {
          try {
            const currentResponse = await axios.get(`${BASE_URL}/classes/subject-classes/${selectedCell.entry.subject_class_id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (currentResponse.data.success) {
              const currentClass = currentResponse.data.data;
              // Combine available classes with current class
              const combined = [...availableClasses];
              if (!combined.find(sc => sc.id === currentClass.id)) {
                combined.push({
                  id: currentClass.id,
                  subject_name: currentClass.subject_name,
                  subject_code: currentClass.subject_code,
                  teacher_name: currentClass.teacher_name || 'N/A',
                  class_name: currentClass.gradelevel_class_name,
                  stream_name: currentClass.stream_name
                });
              }
              setAllSubjectClasses(combined);
            } else {
              setAllSubjectClasses(availableClasses);
            }
          } catch (err) {
            console.error('Error fetching current subject class:', err);
            setAllSubjectClasses(availableClasses);
          }
        } else {
          setAllSubjectClasses(availableClasses);
        }
      } catch (err) {
        console.error('Error fetching subject classes:', err);
        setFormError('Failed to load subject classes');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectClasses();
  }, [templateId, selectedCell.entry?.subject_class_id, token]);

  // Filter subject classes based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSubjectClasses(allSubjectClasses);
      return;
    }

    const filtered = allSubjectClasses.filter(sc => {
      const search = searchTerm.toLowerCase();
      return (
        sc.subject_name?.toLowerCase().includes(search) ||
        sc.subject_code?.toLowerCase().includes(search) ||
        sc.teacher_name?.toLowerCase().includes(search) ||
        sc.class_name?.toLowerCase().includes(search) ||
        sc.stream_name?.toLowerCase().includes(search)
      );
    });
    setSubjectClasses(filtered);
  }, [searchTerm, allSubjectClasses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject_class_id) {
      setFormError('Please select a subject class');
      return;
    }

    setLoading(true);
    setFormError(null);
    try {
      await onSave(formData);
    } catch (err) {
      setFormError('Failed to save entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {selectedCell.entry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Day & Time
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              <strong>{selectedCell.day}</strong> - {selectedCell.period.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {selectedCell.period.start_time} - {selectedCell.period.end_time}
            </div>
          </div>

          {formError && (
            <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label className="form-label">
                Search Subject Class <span className="required">*</span>
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by subject, teacher, or class..."
                className="form-control"
                style={{ marginBottom: '12px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Select Subject Class <span className="required">*</span>
              </label>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                  Loading subject classes...
                </div>
              ) : subjectClasses.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {searchTerm ? 'No subject classes found matching your search.' : 'No available subject classes.'}
                </div>
              ) : (
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '6px',
                  padding: '8px'
                }}>
                  {subjectClasses.map(sc => (
                    <label
                      key={sc.id}
                      style={{
                        display: 'block',
                        padding: '12px',
                        marginBottom: '8px',
                        borderRadius: '6px',
                        border: `2px solid ${formData.subject_class_id === sc.id ? '#2563eb' : '#e5e7eb'}`,
                        background: formData.subject_class_id === sc.id ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (formData.subject_class_id !== sc.id) {
                          e.currentTarget.style.borderColor = '#bfdbfe';
                          e.currentTarget.style.background = '#f0f9ff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.subject_class_id !== sc.id) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.background = '#ffffff';
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="subject_class_id"
                        value={sc.id}
                        checked={formData.subject_class_id === sc.id}
                        onChange={handleInputChange}
                        style={{ marginRight: '10px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {sc.subject_name} {sc.subject_code && `(${sc.subject_code})`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                          <FontAwesomeIcon icon={faUsers} style={{ marginRight: '4px' }} />
                          Teacher: {sc.teacher_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <FontAwesomeIcon icon={faUsers} style={{ marginRight: '4px' }} />
                          Class: {sc.class_name || sc.stream_name || 'N/A'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="modal-btn modal-btn-confirm"
            onClick={handleSubmit}
            disabled={loading || !formData.subject_class_id}
          >
            {loading ? 'Saving...' : (selectedCell.entry ? 'Update Entry' : 'Add Entry')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;
