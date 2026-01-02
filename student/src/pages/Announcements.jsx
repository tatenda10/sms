import React, { useState, useEffect } from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell,
  faCalendarAlt,
  faUser,
  faExclamationTriangle,
  faInfoCircle,
  faCheckCircle,
  faClock,
  faEye,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../contexts/Api';

const Announcements = () => {
  const { student, token } = useStudentAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (student?.RegNumber) {
      fetchAnnouncements();
    }
  }, [student?.RegNumber]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      console.log('📢 Fetching announcements for student:', student?.RegNumber);
      
      const response = await fetch(`${BASE_URL}/student-announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Announcements data:', data);
        setAnnouncements(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('❌ Error fetching announcements:', errorData);
        setError(errorData.message || 'Failed to fetch announcements');
      }
    } catch (error) {
      console.error('❌ Error fetching announcements:', error);
      setError('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnnouncement = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '1rem', color: '#dc2626' }} />;
      case 'medium':
        return <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: '1rem', color: '#d97706' }} />;
      case 'low':
        return <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: '1rem', color: '#2563eb' }} />;
      default:
        return <FontAwesomeIcon icon={faBell} style={{ fontSize: '1rem', color: '#6b7280' }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return { border: '#fecaca', background: '#fee2e2' };
      case 'medium':
        return { border: '#fde68a', background: '#fef3c7' };
      case 'low':
        return { border: '#bfdbfe', background: '#dbeafe' };
      default:
        return { border: '#e5e7eb', background: '#f9fafb' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnnouncementTypeIcon = (type) => {
    switch (type) {
      case 'general':
        return <FontAwesomeIcon icon={faBell} style={{ fontSize: '0.75rem' }} />;
      case 'academic':
        return <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '0.75rem' }} />;
      case 'event':
        return <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '0.75rem' }} />;
      case 'emergency':
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '0.75rem' }} />;
      default:
        return <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: '0.75rem' }} />;
    }
  };

  return (
    <div className="reports-container" style={{ 
      height: '100%', 
      maxHeight: '100%', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative' 
    }}>
      {/* Report Header */}
      <div className="report-header" style={{ flexShrink: 0 }}>
        <div className="report-header-content">
          <h2 className="report-title">Announcements</h2>
          <p className="report-subtitle">Stay updated with the latest school news and information</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '10px 30px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Content Container */}
      <div className="report-content-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        overflow: 'auto', 
        minHeight: 0,
        padding: '20px 30px',
        height: '100%'
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
            Loading announcements...
          </div>
        ) : announcements.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {announcements.map((announcement) => {
              const priorityColors = getPriorityColor(announcement.priority);
              return (
                <div
                  key={announcement.id}
                  style={{
                    background: 'white',
                    border: `1px solid ${priorityColors.border}`,
                    borderRadius: '0px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                    background: priorityColors.background
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => handleViewAnnouncement(announcement)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div style={{ flexShrink: 0, marginTop: '2px' }}>
                        {getPriorityIcon(announcement.priority)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ 
                            fontSize: '0.95rem', 
                            fontWeight: '700', 
                            color: 'var(--text-primary)',
                            margin: 0
                          }}>
                            {announcement.title}
                          </h3>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            background: announcement.priority === 'high' ? '#fee2e2' :
                                        announcement.priority === 'medium' ? '#fef3c7' :
                                        announcement.priority === 'low' ? '#dbeafe' :
                                        '#f3f4f6',
                            color: announcement.priority === 'high' ? '#991b1b' :
                                   announcement.priority === 'medium' ? '#92400e' :
                                   announcement.priority === 'low' ? '#1e40af' :
                                   '#374151'
                          }}>
                            {announcement.priority}
                          </span>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            background: '#f3f4f6',
                            color: '#374151',
                            textTransform: 'capitalize'
                          }}>
                            {getAnnouncementTypeIcon(announcement.announcement_type)}
                            <span>{announcement.announcement_type}</span>
                          </span>
                        </div>
                        <p style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--text-secondary)', 
                          margin: '0 0 12px 0',
                          lineHeight: '1.5',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {announcement.content}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FontAwesomeIcon icon={faUser} style={{ fontSize: '0.7rem' }} />
                            <span>{announcement.created_by_name || 'Admin'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FontAwesomeIcon icon={faClock} style={{ fontSize: '0.7rem' }} />
                            <span>{formatDate(announcement.created_at)}</span>
                          </div>
                          {announcement.start_date && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '0.7rem' }} />
                              <span>Starts: {formatDate(announcement.start_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewAnnouncement(announcement);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <FontAwesomeIcon icon={faEye} style={{ fontSize: '1rem' }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '200px', 
            color: '#64748b' 
          }}>
            <FontAwesomeIcon icon={faBell} style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>No Announcements</div>
            <div style={{ fontSize: '0.75rem' }}>
              There are no announcements at the moment.
            </div>
          </div>
        )}
      </div>

      {/* Announcement Detail Modal */}
      {showModal && selectedAnnouncement && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '56rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {getPriorityIcon(selectedAnnouncement.priority)}
                <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                  {selectedAnnouncement.title}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  lineHeight: '1',
                  padding: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  background: selectedAnnouncement.priority === 'high' ? '#fee2e2' :
                              selectedAnnouncement.priority === 'medium' ? '#fef3c7' :
                              selectedAnnouncement.priority === 'low' ? '#dbeafe' :
                              '#f3f4f6',
                  color: selectedAnnouncement.priority === 'high' ? '#991b1b' :
                         selectedAnnouncement.priority === 'medium' ? '#92400e' :
                         selectedAnnouncement.priority === 'low' ? '#1e40af' :
                         '#374151'
                }}>
                  {selectedAnnouncement.priority}
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  background: '#f3f4f6',
                  color: '#374151',
                  textTransform: 'capitalize'
                }}>
                  {getAnnouncementTypeIcon(selectedAnnouncement.announcement_type)}
                  <span>{selectedAnnouncement.announcement_type}</span>
                </span>
              </div>
              
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FontAwesomeIcon icon={faUser} style={{ fontSize: '0.7rem' }} />
                  <span>By: {selectedAnnouncement.created_by_name || 'Admin'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FontAwesomeIcon icon={faClock} style={{ fontSize: '0.7rem' }} />
                  <span>Posted: {formatDate(selectedAnnouncement.created_at)}</span>
                </div>
                {selectedAnnouncement.start_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '0.7rem' }} />
                    <span>Starts: {formatDate(selectedAnnouncement.start_date)}</span>
                  </div>
                )}
                {selectedAnnouncement.end_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '0.7rem' }} />
                    <span>Expires: {formatDate(selectedAnnouncement.end_date)}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Content</h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {selectedAnnouncement.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
