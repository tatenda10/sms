import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEdit, faTrash, faSearch, faSignInAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Enrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const { token } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    hostel_id: '',
    room_id: '',
    academic_year: '',
    term: '',
    enrollment_date: '',
    check_in_date: '',
    check_out_date: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchHostels();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/boarding/enrollments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Enrollments API response:', response.data);
      
      // Ensure we always set an array
      if (Array.isArray(response.data)) {
        setEnrollments(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setEnrollments(response.data.data);
      } else if (response.data && response.data.enrollments && Array.isArray(response.data.enrollments)) {
        setEnrollments(response.data.enrollments);
      } else {
        console.warn('Unexpected response format, setting empty array');
        setEnrollments([]);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setError('Failed to load enrollments');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Students API response:', response.data);
      
      // Ensure we always set an array
      if (Array.isArray(response.data)) {
        setStudents(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setStudents(response.data.data);
      } else if (response.data && response.data.students && Array.isArray(response.data.students)) {
        setStudents(response.data.students);
      } else {
        console.warn('Unexpected students response format, setting empty array');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchHostels = async () => {
    try {
      const response = await axios.get('/api/boarding/hostels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Hostels for enrollments API response:', response.data);
      
      // Ensure we always set an array
      if (Array.isArray(response.data)) {
        setHostels(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setHostels(response.data.data);
      } else if (response.data && response.data.hostels && Array.isArray(response.data.hostels)) {
        setHostels(response.data.hostels);
      } else {
        console.warn('Unexpected hostels response format, setting empty array');
        setHostels([]);
      }
    } catch (error) {
      console.error('Error fetching hostels:', error);
      setHostels([]);
    }
  };

  const fetchRooms = async (hostelId) => {
    try {
      const response = await axios.get(`/api/boarding/rooms/available/${hostelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Rooms for enrollments API response:', response.data);
      
      // Ensure we always set an array
      if (Array.isArray(response.data)) {
        setRooms(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setRooms(response.data.data);
      } else if (response.data && response.data.rooms && Array.isArray(response.data.rooms)) {
        setRooms(response.data.rooms);
      } else {
        console.warn('Unexpected rooms response format, setting empty array');
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showEditModal) {
        await axios.put(`/api/boarding/enrollments/${selectedEnrollment.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/boarding/enrollments', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({
        student_id: '',
        hostel_id: '',
        room_id: '',
        academic_year: '',
        term: '',
        enrollment_date: '',
        check_in_date: '',
        check_out_date: '',
        status: 'ACTIVE'
      });
      fetchEnrollments();
    } catch (error) {
      console.error('Error saving enrollment:', error);
      setError('Failed to save enrollment');
    }
  };

  const handleEdit = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setFormData({
      student_id: enrollment.student_id,
      hostel_id: enrollment.hostel_id,
      room_id: enrollment.room_id,
      academic_year: enrollment.academic_year,
      term: enrollment.term,
      enrollment_date: enrollment.enrollment_date,
      check_in_date: enrollment.check_in_date,
      check_out_date: enrollment.check_out_date,
      status: enrollment.status
    });
    setShowEditModal(true);
  };

  const handleView = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowViewModal(true);
  };

  const handleDelete = async (enrollment) => {
    if (window.confirm('Are you sure you want to cancel this enrollment?')) {
      try {
        await axios.delete(`/api/boarding/enrollments/${enrollment.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchEnrollments();
      } catch (error) {
        console.error('Error deleting enrollment:', error);
        setError('Failed to cancel enrollment');
      }
    }
  };

  const handleCheckIn = async (enrollment) => {
    try {
      await axios.post(`/api/boarding/enrollments/${enrollment.id}/checkin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEnrollments();
    } catch (error) {
      console.error('Error checking in student:', error);
      setError('Failed to check in student');
    }
  };

  const handleCheckOut = async (enrollment) => {
    try {
      await axios.post(`/api/boarding/enrollments/${enrollment.id}/checkout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEnrollments();
    } catch (error) {
      console.error('Error checking out student:', error);
      setError('Failed to check out student');
    }
  };

  const getStudentName = (studentId) => {
    const student = (students || []).find(s => s.id === studentId);
    return student ? `${student.Name} ${student.Surname}` : 'Unknown Student';
  };

  const getHostelName = (hostelId) => {
    const hostel = (hostels || []).find(h => h.id === hostelId);
    return hostel ? hostel.name : 'Unknown Hostel';
  };

  const getRoomNumber = (roomId) => {
    const room = (rooms || []).find(r => r.id === roomId);
    return room ? room.room_number : 'Unknown Room';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'ACTIVE': { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      'CHECKED_IN': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Checked In' },
      'CHECKED_OUT': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Checked Out' },
      'CANCELLED': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig['ACTIVE'];
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const filteredEnrollments = (() => {
    try {
      if (!Array.isArray(enrollments)) {
        console.warn('Enrollments is not an array:', enrollments);
        return [];
      }
      return enrollments.filter(enrollment =>
        enrollment && getStudentName(enrollment.student_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment && getHostelName(enrollment.hostel_id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error filtering enrollments:', error);
      return [];
    }
  })();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Boarding Enrollments</h1>
        <p className="text-gray-600 mt-2">Manage student enrollments in boarding facilities</p>
      </div>

      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Enrollments</h2>
          <p className="text-gray-600 mt-1">Manage student enrollments in boarding facilities</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-gray-800"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Enroll Student</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search enrollments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Enrollments Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hostel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(filteredEnrollments || []).map((enrollment, index) => (
              <tr key={enrollment?.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getStudentName(enrollment?.student_id)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Enrolled: {enrollment?.enrollment_date ? new Date(enrollment.enrollment_date).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getHostelName(enrollment?.hostel_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getRoomNumber(enrollment?.room_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {enrollment?.academic_year || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {enrollment?.term || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(enrollment?.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => enrollment && handleView(enrollment)}
                      className="text-blue-600 hover:text-blue-900"
                      disabled={!enrollment}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                      onClick={() => enrollment && handleEdit(enrollment)}
                      className="text-green-600 hover:text-green-900"
                      disabled={!enrollment}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    {enrollment?.status === 'ACTIVE' && (
                      <button
                        onClick={() => enrollment && handleCheckIn(enrollment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Check In"
                        disabled={!enrollment}
                      >
                        <FontAwesomeIcon icon={faSignInAlt} />
                      </button>
                    )}
                    {enrollment?.status === 'CHECKED_IN' && (
                      <button
                        onClick={() => enrollment && handleCheckOut(enrollment)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Check Out"
                        disabled={!enrollment}
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                      </button>
                    )}
                    <button
                      onClick={() => enrollment && handleDelete(enrollment)}
                      className="text-red-600 hover:text-red-900"
                      disabled={!enrollment}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {showEditModal ? 'Edit Enrollment' : 'Enroll Student'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student</label>
                    <select
                      required
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Student</option>
                      {(students || []).map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.Name} {student.Surname}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hostel</label>
                    <select
                      required
                      value={formData.hostel_id}
                      onChange={(e) => {
                        setFormData({ ...formData, hostel_id: e.target.value, room_id: '' });
                        if (e.target.value) {
                          fetchRooms(e.target.value);
                        }
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Hostel</option>
                      {(hostels || []).map((hostel) => (
                        <option key={hostel.id} value={hostel.id}>
                          {hostel.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room</label>
                    <select
                      required
                      value={formData.room_id}
                      onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Room</option>
                      {(rooms || []).map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.room_number} ({room.room_type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                    <input
                      type="text"
                      required
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                      placeholder="e.g., 2024-2025"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Term</label>
                    <select
                      required
                      value={formData.term}
                      onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Term</option>
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Enrollment Date</label>
                    <input
                      type="date"
                      required
                      value={formData.enrollment_date}
                      onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="CHECKED_IN">Checked In</option>
                      <option value="CHECKED_OUT">Checked Out</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setFormData({
                        student_id: '',
                        hostel_id: '',
                        room_id: '',
                        academic_year: '',
                        term: '',
                        enrollment_date: '',
                        check_in_date: '',
                        check_out_date: '',
                        status: 'ACTIVE'
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800"
                  >
                    {showEditModal ? 'Update' : 'Enroll'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Enrollment Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student</label>
                  <p className="text-sm text-gray-900">{getStudentName(selectedEnrollment?.student_id)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hostel</label>
                  <p className="text-sm text-gray-900">{getHostelName(selectedEnrollment?.hostel_id)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <p className="text-sm text-gray-900">{getRoomNumber(selectedEnrollment?.room_id)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <p className="text-sm text-gray-900">{selectedEnrollment?.academic_year || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Term</label>
                  <p className="text-sm text-gray-900">{selectedEnrollment?.term || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Enrollment Date</label>
                  <p className="text-sm text-gray-900">
                    {selectedEnrollment?.enrollment_date ? new Date(selectedEnrollment.enrollment_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedEnrollment?.status)}</div>
                </div>
                {selectedEnrollment?.check_in_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check In Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedEnrollment.check_in_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedEnrollment?.check_out_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check Out Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedEnrollment.check_out_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enrollments;
