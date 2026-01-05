import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';

const AddGradelevelClass = ({ onClose }) => {
  const { token } = useAuth();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Employee search state
  const [teacherQuery, setTeacherQuery] = useState('');
  const [teacherResults, setTeacherResults] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherError, setTeacherError] = useState('');
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    stream_id: '',
    name: '',
    homeroom_teacher_employee_number: '', // will store employee_id
    capacity: ''
  });

  useEffect(() => {
    fetchStreams();
  }, []);

  // Debounced employee search
  useEffect(() => {
    if (!teacherQuery.trim()) {
      setTeacherResults([]);
      setTeacherError('');
      return;
    }
    setTeacherLoading(true);
    setTeacherError('');
    const timeout = setTimeout(async () => {
      try {
        const response = await axios.get(`${BASE_URL}/employees/search`, {
          params: { query: teacherQuery },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setTeacherResults(response.data.data || []);
        } else {
          setTeacherError('Failed to search employees');
        }
      } catch (err) {
        setTeacherError('Failed to search employees');
      } finally {
        setTeacherLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [teacherQuery, token]);

  const fetchStreams = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/classes/streams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStreams(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to load streams');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle teacher search input
  const handleTeacherInputChange = (e) => {
    setTeacherQuery(e.target.value);
    setTeacherDropdownOpen(true);
  };

  // Handle teacher selection
  const handleTeacherSelect = (employee) => {
    setFormData((prev) => ({ ...prev, homeroom_teacher_employee_number: employee.employee_id }));
    setTeacherQuery(`${employee.full_name} (${employee.employee_id})`);
    setTeacherDropdownOpen(false);
  };

  const validateForm = () => {
    if (!formData.stream_id) {
      setError('Stream is required');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Class name is required');
      return false;
    }
    if (formData.capacity && isNaN(Number(formData.capacity))) {
      setError('Capacity must be a number');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    try {
      setLoading(true);
      const payload = {
        ...formData,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        homeroom_teacher_employee_number: formData.homeroom_teacher_employee_number || null
      };
      const response = await axios.post(`${BASE_URL}/classes/gradelevel-classes`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSuccess('Grade level class created successfully!');
        setFormData({ stream_id: '', name: '', homeroom_teacher_employee_number: '', capacity: '' });
        setTeacherQuery('');
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setSuccess(null);
          if (onClose) {
            onClose();
          }
        }, 2000);
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create class');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '10px', background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', marginBottom: '16px', borderRadius: '4px' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="modal-form">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">
              Stream <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              name="stream_id"
              value={formData.stream_id}
              onChange={handleInputChange}
              className="form-control"
              required
            >
              <option value="">Select Stream</option>
              {streams.map((stream) => (
                <option key={stream.id} value={stream.id}>
                  {stream.name} ({stream.stage})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              Class Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-control"
              placeholder="e.g., 1A, 2B, Form 1"
              required
            />
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">
              Homeroom Teacher <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>(search by name or ID)</span>
            </label>
            <input
              type="text"
              name="homeroom_teacher_search"
              value={teacherQuery}
              onChange={handleTeacherInputChange}
              className="form-control"
              placeholder="Type to search..."
              autoComplete="off"
              onFocus={() => setTeacherDropdownOpen(true)}
            />
            {/* Dropdown */}
            {teacherDropdownOpen && teacherQuery && (
              <div style={{
                position: 'absolute',
                zIndex: 1000,
                marginTop: '4px',
                width: '100%',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                maxHeight: '192px',
                overflowY: 'auto'
              }}>
                {teacherLoading ? (
                  <div style={{ padding: '8px', fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '8px' }} />
                    Searching...
                  </div>
                ) : teacherError ? (
                  <div style={{ padding: '8px', fontSize: '0.75rem', color: '#dc2626' }}>{teacherError}</div>
                ) : teacherResults.length === 0 ? (
                  <div style={{ padding: '8px', fontSize: '0.75rem', color: '#6b7280' }}>No employees found.</div>
                ) : (
                  teacherResults.map((emp) => (
                    <div
                      key={emp.employee_id}
                      style={{
                        padding: '8px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onClick={() => handleTeacherSelect(emp)}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                    >
                      <span style={{ fontWeight: 500, color: '#111827' }}>{emp.full_name}</span>
                      <span style={{ color: '#6b7280', marginLeft: '4px' }}>({emp.employee_id})</span>
                      {emp.job_title && <span style={{ marginLeft: '8px', color: '#9ca3af' }}>{emp.job_title}</span>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Capacity</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              className="form-control"
              placeholder="e.g., 40"
              min="1"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onClose}
            className="modal-btn modal-btn-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="modal-btn modal-btn-confirm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                Creating...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} style={{ fontSize: '0.7rem' }} />
                Create Class
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddGradelevelClass;
