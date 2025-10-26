import React from 'react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { User, Mail, Phone, Calendar, MapPin, GraduationCap } from 'lucide-react';

const Profile = () => {
  const { student } = useStudentAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">View and manage your personal information</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-green-600" />
              </div>
            </div>
            
            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {student?.Name} {student?.Surname}
              </h2>
              <p className="text-gray-600">Registration Number: {student?.RegNumber}</p>
              <p className="text-gray-500">Student</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Full Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {student?.Name} {student?.Surname}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Registration Number
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {student?.RegNumber}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date of Birth
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {student?.DateOfBirth ? new Date(student.DateOfBirth).toLocaleDateString() : 'Not provided'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Gender
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {student?.Gender || 'Not specified'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {student?.Email || 'Not provided'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {student?.PhoneNumber || 'Not provided'}
                </dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Address
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {student?.Address || 'Not provided'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Academic Information */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Class</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {student?.gradelevel_class_name || 'Not assigned'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Stream</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {student?.stream_name || 'Not assigned'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
