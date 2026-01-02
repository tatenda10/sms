import React from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUserGraduate } from '@fortawesome/free-solid-svg-icons';

const Profile = () => {
  const { student } = useStudentAuth();

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
          <h2 className="report-title">Profile</h2>
          <p className="report-subtitle">View and manage your personal information</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px 30px',
        background: 'white',
        margin: '0 0 20px 0',
        borderRadius: '8px'
      }}>
        {/* Basic Info Card */}
        <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Avatar */}
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'var(--sidebar-bg)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FontAwesomeIcon icon={faUser} style={{ fontSize: '2rem', color: 'white' }} />
            </div>
            
            {/* Basic Info */}
            <div>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                margin: '0 0 4px 0' 
              }}>
                {student?.Name} {student?.Surname}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                Registration Number: {student?.RegNumber}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>
                Student
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ 
            margin: 0, 
            fontSize: '0.95rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#2563eb' }} />
            Personal Information
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Full Name
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                {student?.Name} {student?.Surname}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Registration Number
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                {student?.RegNumber || 'N/A'}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Date of Birth
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                {student?.DateOfBirth ? new Date(student.DateOfBirth).toLocaleDateString() : 'Not provided'}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Gender
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                {student?.Gender || 'Not specified'}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                {student?.Email || 'Not provided'}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Phone Number
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                {student?.PhoneNumber || 'Not provided'}
              </div>
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Address
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                {student?.Address || 'Not provided'}
              </div>
            </div>
          </div>
        </div>

        {/* Academic Information Section */}
        <div>
          <h4 style={{ 
            margin: 0, 
            fontSize: '0.95rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <FontAwesomeIcon icon={faUserGraduate} style={{ color: '#10b981' }} />
            Academic Information
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Class
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                {student?.gradelevel_class_name || 'Not assigned'}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Stream
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                {student?.stream_name || 'Not assigned'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
