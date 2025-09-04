import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../contexts/Api';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faChalkboardTeacher, faUsers, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import SubjectStudentsTab from './SubjectStudentsTab';

const ViewSubjectClass = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [subjectClass, setSubjectClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('students');

  useEffect(() => {
    fetchSubjectClass();
    // eslint-disable-next-line
  }, [id]);

  const fetchSubjectClass = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BASE_URL}/classes/subject-classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSubjectClass(response.data.data);
      } else {
        setError('Failed to load subject class information.');
      }
    } catch (err) {
      setError('Failed to load subject class information.');
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
    if (!subjectClass) {
      return <div className="text-xs text-gray-500">No data found.</div>;
    }
    switch (activeTab) {
      case 'students':
      default:
        return <SubjectStudentsTab subjectClassId={subjectClass.id} gradelevelClassId={subjectClass.gradelevel_class_id} />;
    }
  };

  return (
    <div className="px-0 py-1 w-full">
     
      {/* Info Card */}
      <div className="mb-6 border-b border-gray-200">
        <div className="pt-2 pb-2">
          <div className=" text-gray-900 font-semibold mb-1 flex items-center">
            <FontAwesomeIcon icon={faBook} className="mr-2 h-5 w-5 text-gray-400" />
            Subject Class Information
          </div>
          {subjectClass && (
            <div className="border border-gray-200 p-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Subject Name</div>
                  <div className="text-sm text-gray-900">{subjectClass.subject_name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Subject Code</div>
                  <div className="text-sm text-gray-900">{subjectClass.subject_code}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Stream</div>
                  <div className="text-sm text-gray-900">{subjectClass.stream_name} ({subjectClass.stream_stage})</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Gradelevel Class</div>
                  <div className="text-sm text-gray-900">{subjectClass.gradelevel_class_name || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Teacher</div>
                  <div className="text-sm text-gray-900">{subjectClass.teacher_name || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Capacity</div>
                  <div className="text-sm text-gray-900">{subjectClass.capacity || 'Unlimited'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Syllabus</div>
                  <div className="text-sm text-gray-900">{subjectClass.subject_syllabus || '-'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors duration-150 ${
              activeTab === 'students'
                ? 'border-gray-700 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faUsers} className="mr-2 h-4 w-4" />
            Students
          </button>
        </nav>
      </div>
      {/* Tab Content */}
      <div className="px-0 md:px-6">{renderTabContent()}</div>
    </div>
  );
};

export default ViewSubjectClass;
