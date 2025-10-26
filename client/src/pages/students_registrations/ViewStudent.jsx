import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash,
  faUserGraduate,
  faPhone,
  faMapMarkerAlt,
  faIdCard,
  faCalendarAlt,
  faVenusMars,
  faCheckCircle,
  faTimesCircle,
  faUser,
  faUsers,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const ViewStudent = () => {
  const { id: regNumber } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    fetchStudent();
  }, [regNumber]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching student with regNumber:', regNumber);
      const response = await axios.get(`${BASE_URL}/students/${regNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      console.log('👤 Student data received:', data.data);
      console.log('👨‍👩‍👧‍👦 Guardian data:', data.data.guardians);
      setStudent(data.data);
    } catch (err) {
      console.error('Error fetching student:', err);
      if (err.response) {
        if (err.response.status === 404) {
          setError('Student not found');
        } else {
          setError(`Error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
        }
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/students/${regNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      navigate('/dashboard/students');
    } catch (err) {
      console.error('Error deleting student:', err);
      if (err.response) {
        setError(`Failed to delete student: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Error: ${err.message}`);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading student information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 p-4">
          <div className="text-sm text-red-600">{error}</div>
          <Link
            to="/dashboard/students"
            className="mt-2 inline-flex items-center text-sm text-red-600 hover:text-red-800"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
            Back to Students
          </Link>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-gray-500">Student not found</div>
          <Link
            to="/dashboard/students"
            className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
            Back to Students
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {student.Name} {student.Surname}
            </h1>
            <p className="text-xs text-gray-500">
              Registration Number: {student.RegNumber}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/dashboard/students/edit/${regNumber}`}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <FontAwesomeIcon icon={faEdit} className="mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FontAwesomeIcon icon={faTrash} className="mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {[
            { id: 'personal', label: 'Personal Information', icon: faUser },
            { id: 'guardian', label: 'Guardian Information', icon: faUsers }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-xs flex items-center ${
                activeTab === tab.id
                  ? 'border-gray-700 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="mr-2 h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'personal' && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 sm:px-6">
              <h3 className="text-sm leading-6 font-medium text-gray-900 flex items-center">
                <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-600" />
                Personal Information
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-xs font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-xs text-gray-900 sm:mt-0 sm:col-span-2">
                    {student.Name} {student.Surname}
                  </dd>
                </div>
                <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-xs font-medium text-gray-500">Registration Number</dt>
                  <dd className="mt-1 text-xs text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                    {student.RegNumber}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-xs font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-xs text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400" />
                    {formatDate(student.DateOfBirth)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-xs font-medium text-gray-500">National ID Number</dt>
                  <dd className="mt-1 text-xs text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                    <FontAwesomeIcon icon={faIdCard} className="mr-2 text-gray-400" />
                    {student.NationalIDNumber || 'N/A'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-xs font-medium text-gray-500">Gender</dt>
                  <dd className="mt-1 text-xs text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                    <FontAwesomeIcon icon={faVenusMars} className="mr-2 text-gray-400" />
                    {student.Gender || 'N/A'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-xs font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-xs text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-gray-400" />
                    {student.Address || 'N/A'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-xs font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-xs sm:mt-0 sm:col-span-2">
                    <div className="text-xs text-gray-900">
                      {student.Active || 'Unknown'}
                    </div>
                  </dd>
                </div>
                {student.ImagePath && (
                  <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-xs font-medium text-gray-500">Profile Image</dt>
                    <dd className="mt-1 text-xs text-gray-900 sm:mt-0 sm:col-span-2">
                      <img 
                        src={student.ImagePath} 
                        alt={`${student.Name} ${student.Surname}`}
                        className="h-20 w-20 object-cover"
                      />
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'guardian' && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 sm:px-6">
              <h3 className="text-sm leading-6 font-medium text-gray-900 flex items-center">
                <FontAwesomeIcon icon={faUsers} className="mr-2 text-green-600" />
                Guardian Information
              </h3>
            </div>
            <div className="border-t border-gray-200">
              {student.guardians && student.guardians.length > 0 ? (
                <div>
                  {student.guardians.map((guardian, index) => (
                    <dl key={guardian.GuardianID || index} className={index > 0 ? 'border-t border-gray-200' : ''}>
                      <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-xs font-medium text-gray-500">Guardian Name</dt>
                        <dd className="mt-1 text-xs text-gray-900 sm:mt-0 sm:col-span-2">
                          {guardian.Name} {guardian.Surname}
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-xs font-medium text-gray-500">Phone Number</dt>
                        <dd className="mt-1 text-xs text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                          <FontAwesomeIcon icon={faPhone} className="mr-2 text-gray-400" />
                          {guardian.PhoneNumber || 'N/A'}
                        </dd>
                      </div>
                      {guardian.NationalIDNumber && (
                        <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-xs font-medium text-gray-500">National ID</dt>
                          <dd className="mt-1 text-xs text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                            <FontAwesomeIcon icon={faIdCard} className="mr-2 text-gray-400" />
                            {guardian.NationalIDNumber}
                          </dd>
                        </div>
                      )}
                      {guardian.RelationshipToStudent && (
                        <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-xs font-medium text-gray-500">Relationship</dt>
                          <dd className="mt-1 text-xs text-gray-900 sm:mt-0 sm:col-span-2">
                            {guardian.RelationshipToStudent}
                          </dd>
                        </div>
                      )}
                    </dl>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-xs text-gray-500">
                  No guardian information available
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ViewStudent;
