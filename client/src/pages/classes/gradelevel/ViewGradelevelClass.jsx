import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBook, faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons';
import StudentsTab from './StudentsTab';
import SubjectClassesTab from '../subject/SubjectClassesTab';

const ViewGradelevelClass = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('students');
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClass();
    // eslint-disable-next-line
  }, [id]);

  const fetchClass = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setClassData(response.data.data);
      } else {
        setError('Failed to load class information.');
      }
    } catch (err) {
      setError('Failed to load class information.');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return <div className="text-xs text-gray-500">Loading...</div>;
    }
    if (error) {
      return <div className="text-xs text-red-600">{error}</div>;
    }
    if (!classData) {
      return <div className="text-xs text-gray-500">No data found.</div>;
    }
    switch (activeTab) {
      case 'students':
        return <StudentsTab classId={classData.id} />;
      case 'subjectclasses':
        return <SubjectClassesTab classId={classData.id} streamId={classData.stream_id} />;
      default:
        return null;
    }
  };

  return (
    <div className="">
      {/* Class Info Card */}
      {loading ? (
        <div className="text-xs text-gray-500 mb-4">Loading...</div>
      ) : error ? (
        <div className="text-xs text-red-600 mb-4">{error}</div>
      ) : classData ? (
        <div className="mb-6  border-b border-gray-200">
          <div className="px-6 pt-2 pb-2">
            <div className="text-xl text-gray-900 font-semibold mb-1">{classData.name}</div>
            <div className="text-sm text-gray-500 mb-4">{classData.stream_name} ({classData.stream_stage})</div>
            <div className="flex flex-col sm:flex-row sm:space-x-8 text-sm text-gray-700">
              <div className="flex items-center mb-2 sm:mb-0">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="mr-2 h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Teacher:</span>
                <span className="ml-1 text-gray-900">{classData.teacher_name || 'Not Assigned'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600">Capacity:</span>
                <span className="ml-1 text-gray-900">{classData.capacity || 'Unlimited'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
              activeTab === 'students'
                ? 'border-gray-700 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faUsers} className="mr-2 h-4 w-4" />
            Students
          </button>
          <button
            onClick={() => setActiveTab('subjectclasses')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
              activeTab === 'subjectclasses'
                ? 'border-gray-700 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faBook} className="mr-2 h-4 w-4" />
            Subject Classes
          </button>
        </nav>
      </div>
      {/* Tab Content */}
      <div className="px-0 md:px-6">{renderTabContent()}</div>
    </div>
  );
};

export default ViewGradelevelClass;
