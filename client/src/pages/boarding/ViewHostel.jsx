import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faUserGraduate, faMoneyBill, faArrowLeft, faPlus, faEye, faEdit, faTrash, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const ViewHostel = () => {
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('rooms');
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const tabs = [
    { id: 'rooms', name: 'Rooms', icon: faBed },
    { id: 'enrollments', name: 'Enrollments', icon: faUserGraduate },
    { id: 'billing', name: 'Billing', icon: faMoneyBill }
  ];

  useEffect(() => {
    fetchHostel();
  }, [id]);

  const fetchHostel = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/boarding/hostels/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHostel(response.data.data);
    } catch (error) {
      console.error('Error fetching hostel:', error);
      setError('Failed to load hostel details');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'rooms':
        return <RoomsTab hostelId={id} />;
      case 'enrollments':
        return <EnrollmentsTab hostelId={id} />;
      case 'billing':
        return <BillingTab hostelId={id} />;
      default:
        return <RoomsTab hostelId={id} />;
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
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

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 text-xs">
          {error}
        </div>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 text-xs">
          Hostel not found
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
         
            <div>
              <h1 className="text-lg font-bold text-gray-900">{hostel.name}</h1>
              <p className="text-xs text-gray-500">Manage hostel details and operations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hostel Info Card */}
      <div className="mb-6 bg-white border border-gray-200/30 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">Location</label>
            <p className="text-xs text-gray-900">{hostel.location || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Gender</label>
            <p className="text-xs text-gray-900">{hostel.gender || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Total Rooms</label>
            <p className="text-xs text-gray-900">{hostel.total_rooms || 0}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Total Capacity</label>
            <p className="text-xs text-gray-900">{hostel.total_capacity || 0}</p>
          </div>
        </div>
        {hostel.description && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700">Description</label>
            <p className="text-xs text-gray-900">{hostel.description}</p>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {tabs.map((tab) => (
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
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Functional RoomsTab component
const RoomsTab = ({ hostelId }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const { token } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'Single',
    floor_number: '',
    capacity: 1,
    description: ''
  });

  useEffect(() => {
    fetchRooms();
  }, [hostelId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/boarding/hostels/${hostelId}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        setRooms(response.data.data);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load rooms');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showEditModal) {
        await axios.put(`${BASE_URL}/boarding/rooms/${selectedRoom.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BASE_URL}/boarding/rooms`, { ...formData, hostel_id: hostelId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({
        room_number: '',
        room_type: 'Single',
        floor_number: '',
        capacity: 1,
        description: ''
      });
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      setError('Failed to save room');
    }
  };

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      floor_number: room.floor_number,
      capacity: room.capacity,
      description: room.description || ''
    });
    setShowEditModal(true);
  };

  const handleView = (room) => {
    setSelectedRoom(room);
    setShowViewModal(true);
  };

  const handleDelete = async (room) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await axios.delete(`${BASE_URL}/boarding/rooms/${room.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchRooms();
      } catch (error) {
        console.error('Error deleting room:', error);
        setError('Failed to delete room');
      }
    }
  };

  const filteredRooms = rooms.filter(room =>
    room && room.room_number && room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room && room.room_type && room.room_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200/30 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-medium text-gray-900">Rooms</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-gray-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-gray-800"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1" />
          Add Room
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200/30 focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Rooms Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200/30">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Occupancy</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200/30">
            {(filteredRooms || []).map((room, index) => (
              <tr key={room?.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">{room?.room_number || 'N/A'}</div>
                  <div className="text-xs text-gray-500">{room?.description || ''}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{room?.room_type || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{room?.floor_number || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{room?.capacity || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{room?.current_enrollments || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => room && handleView(room)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      disabled={!room}
                    >
                      <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => room && handleEdit(room)}
                      className="text-green-600 hover:text-green-900 p-1"
                      disabled={!room}
                    >
                      <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => room && handleDelete(room)}
                      className="text-red-600 hover:text-red-900 p-1"
                      disabled={!room}
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-30 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg bg-white">
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                {showEditModal ? 'Edit Room' : 'Add New Room'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Room Number and Type - 2 columns */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Room Number</label>
                      <input
                        type="text"
                        required
                        value={formData.room_number}
                        onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                        className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Room Type</label>
                                             <select
                         required
                         value={formData.room_type}
                         onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                         className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                       >
                         <option value="Single">Single</option>
                         <option value="Double">Double</option>
                         <option value="Triple">Triple</option>
                         <option value="Quad">Quad</option>
                         <option value="Many">Many</option>
                       </select>
                    </div>
                  </div>

                  {/* Floor Number and Capacity - 2 columns */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Floor Number</label>
                      <input
                        type="number"
                        required
                        value={formData.floor_number}
                        onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
                        className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Capacity</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                        className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Description - Full Width */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setFormData({
                        room_number: '',
                        room_type: 'Single',
                        floor_number: '',
                        capacity: 1,
                        description: ''
                      });
                    }}
                    className="px-3 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium hover:bg-gray-800"
                  >
                    {showEditModal ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedRoom && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Room Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Room Number</label>
                  <p className="text-xs text-gray-900">{selectedRoom?.room_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Room Type</label>
                  <p className="text-xs text-gray-900">{selectedRoom?.room_type || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Floor Number</label>
                  <p className="text-xs text-gray-900">{selectedRoom?.floor_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Capacity</label>
                  <p className="text-xs text-gray-900">{selectedRoom?.capacity || 0}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Current Occupancy</label>
                  <p className="text-xs text-gray-900">{selectedRoom?.current_enrollments || 0}</p>
                </div>
                {selectedRoom?.description && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Description</label>
                    <p className="text-xs text-gray-900">{selectedRoom.description}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium hover:bg-gray-800"
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

// Functional EnrollmentsTab component
const EnrollmentsTab = ({ hostelId }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    student_reg_number: '',
    room_id: '',
    academic_year: '',
    term: '',
    enrollment_date: '',
    check_in_date: '',
    check_out_date: '',
    status: 'enrolled',
    notes: ''
  });

  // Student search state
  const [studentSearchReg, setStudentSearchReg] = useState('');
  const [foundStudent, setFoundStudent] = useState(null);

  useEffect(() => {
    fetchRooms();
    fetchEnrollments(); // Add initial fetch
  }, [hostelId]);

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedTerm) params.append('term', selectedTerm);
      if (selectedAcademicYear) params.append('academic_year', selectedAcademicYear);
      
      const url = `${BASE_URL}/boarding/hostels/${hostelId}/enrollments${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        setEnrollments(response.data.data);
      } else {
        setEnrollments([]);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setError('Failed to load enrollments');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [hostelId, selectedTerm, selectedAcademicYear, token]);


  const fetchRooms = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/boarding/hostels/${hostelId}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        setRooms(response.data.data);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  }, [hostelId, token]);

     const handleSubmit = async (e) => {
     e.preventDefault();
     
     // Validate required fields
     if (!formData.student_reg_number) {
       setError('Student registration number is required');
       return;
     }
     if (!formData.room_id) {
       setError('Room selection is required');
       return;
     }
     if (!formData.academic_year) {
       setError('Academic year is required');
       return;
     }
     if (!formData.term) {
       setError('Term is required');
       return;
     }
     if (!formData.enrollment_date) {
       setError('Enrollment date is required');
       return;
     }
     
     setIsSubmitting(true);
     setError('');
     
     try {
        // Convert term format from dropdown (e.g., "Term 3") to database format (e.g., "3")
        const processedFormData = { ...formData };
        if (processedFormData.term && processedFormData.term.startsWith('Term ')) {
          processedFormData.term = processedFormData.term.replace('Term ', '');
        }
        
        const requestData = showEditModal ? processedFormData : { ...processedFormData, hostel_id: hostelId };
        console.log('Sending enrollment data:', requestData);
        
        if (showEditModal) {
          await axios.put(`${BASE_URL}/boarding/enrollments/${selectedEnrollment.id}`, processedFormData, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          const response = await axios.post(`${BASE_URL}/boarding/enrollments`, requestData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Enrollment response:', response.data);
        }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({
        student_reg_number: '',
        room_id: '',
        academic_year: '',
        term: '',
        enrollment_date: '',
        check_in_date: '',
        check_out_date: '',
        status: 'enrolled',
        notes: ''
      });
      clearStudentSearch();
      fetchEnrollments();
     } catch (error) {
       console.error('Error saving enrollment:', error);
       if (error.response && error.response.data && error.response.data.message) {
         setError(error.response.data.message);
       } else {
         setError('Failed to save enrollment');
       }
     } finally {
       setIsSubmitting(false);
     }
  };

  const handleEdit = async (enrollment) => {
    setSelectedEnrollment(enrollment);
    
    // Convert term format from database (e.g., "3") to dropdown format (e.g., "Term 3")
    let formattedTerm = enrollment.term;
    if (enrollment.term && !enrollment.term.startsWith('Term ')) {
      formattedTerm = `Term ${enrollment.term}`;
    }
    
    setFormData({
      student_reg_number: enrollment.student_reg_number,
      room_id: enrollment.room_id || '',
      academic_year: enrollment.academic_year,
      term: formattedTerm,
      enrollment_date: enrollment.enrollment_date,
      check_in_date: enrollment.check_in_date || '',
      check_out_date: enrollment.check_out_date || '',
      status: enrollment.status,
      notes: enrollment.notes || ''
    });
    
    // Set the student search field and find the student
    setStudentSearchReg(enrollment.student_reg_number);
    
    // Search for the student to populate the found student state
    try {
      const response = await axios.get(`${BASE_URL}/students/search`, {
        params: { query: enrollment.student_reg_number },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.data.length > 0) {
        const student = response.data.data.find(s => s.RegNumber === enrollment.student_reg_number);
        if (student) {
          setFoundStudent(student);
        }
      }
    } catch (error) {
      console.error('Error searching for student during edit:', error);
    }
    
    setShowEditModal(true);
  };

  const handleView = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowViewModal(true);
  };

  const handleDelete = async (enrollment) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      try {
        const response = await axios.delete(`${BASE_URL}/boarding/enrollments/${enrollment.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          fetchEnrollments();
        } else {
          setError(response.data.message || 'Failed to delete enrollment');
        }
      } catch (error) {
        console.error('Error deleting enrollment:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete enrollment';
        setError(errorMessage);
      }
    }
  };

  const handleCheckIn = async (enrollment) => {
    try {
      await axios.post(`${BASE_URL}/boarding/enrollments/${enrollment.id}/checkin`, {}, {
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
      await axios.post(`${BASE_URL}/boarding/enrollments/${enrollment.id}/checkout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEnrollments();
    } catch (error) {
      console.error('Error checking out student:', error);
      setError('Failed to check out student');
    }
  };

  const handleStudentSearch = async () => {
    if (!studentSearchReg.trim()) {
      setError('Please enter a registration number');
      return;
    }

    try {
      setError('');
      const response = await axios.get(`${BASE_URL}/students/search`, {
        params: { query: studentSearchReg },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.data.length > 0) {
        const student = response.data.data.find(s => s.RegNumber === studentSearchReg);
        if (student) {
          setFoundStudent(student);
          setFormData({ ...formData, student_reg_number: student.RegNumber });
        } else {
          setFoundStudent(null);
          setError('Student not found with this registration number');
        }
      } else {
        setFoundStudent(null);
        setError('Student not found with this registration number');
      }
    } catch (error) {
      console.error('Error searching for student:', error);
      setFoundStudent(null);
      setError('Error searching for student. Please try again.');
    }
  };

  const clearStudentSearch = () => {
    setStudentSearchReg('');
    setFoundStudent(null);
    setFormData({ ...formData, student_reg_number: '' });
  };

  const getStudentName = (regNumber) => {
    // This will be populated from enrollment data
    return 'Student'; // Will be updated when enrollment data includes student names
  };

  const getRoomNumber = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.room_number : 'N/A';
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      enrolled: 'bg-blue-100 text-blue-800',
      checked_in: 'bg-green-100 text-green-800',
      checked_out: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment && getStudentName(enrollment.student_reg_number).toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment && enrollment.status && enrollment.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200/30 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-medium text-gray-900">Enrollments</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-gray-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-gray-800"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1" />
          Enroll Student
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search enrollments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200/30 focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs"
          />
        </div>
        
                 {/* Filters */}
         <div className="grid grid-cols-3 gap-4">
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
             <input
               type="text"
               placeholder="Enter year (e.g., 2025)"
               value={selectedAcademicYear}
               onChange={(e) => setSelectedAcademicYear(e.target.value)}
               className="w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
             />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Term</label>
             <select
               value={selectedTerm}
               onChange={(e) => setSelectedTerm(e.target.value)}
               className="w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
             >
               <option value="">All Terms</option>
               <option value="Term 1">Term 1</option>
               <option value="Term 2">Term 2</option>
               <option value="Term 3">Term 3</option>
             </select>
           </div>
           <div className="flex items-end">
             <button
               onClick={fetchEnrollments}
               className="w-full bg-gray-900 text-white px-3 py-2 text-xs font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
             >
               <FontAwesomeIcon icon={faSearch} className="mr-1" />
               Search
             </button>
           </div>
         </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Enrollments Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200/30">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200/30">
            {(filteredEnrollments || []).map((enrollment, index) => (
              <tr key={enrollment?.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">{getStudentName(enrollment?.student_reg_number)}</div>
                  <div className="text-xs text-gray-500">{enrollment?.student_reg_number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{getRoomNumber(enrollment?.room_id)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{enrollment?.academic_year || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{enrollment?.term || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                  {getStatusBadge(enrollment?.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => enrollment && handleView(enrollment)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      disabled={!enrollment}
                    >
                      <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => enrollment && handleEdit(enrollment)}
                      className="text-green-600 hover:text-green-900 p-1"
                      disabled={!enrollment}
                    >
                      <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                    </button>
                    {enrollment?.status === 'enrolled' && (
                      <button
                        onClick={() => enrollment && handleCheckIn(enrollment)}
                        className="text-purple-600 hover:text-purple-900 p-1"
                        disabled={!enrollment}
                        title="Check In"
                      >
                        <FontAwesomeIcon icon={faUserGraduate} className="h-3 w-3" />
                      </button>
                    )}
                    {enrollment?.status === 'checked_in' && (
                      <button
                        onClick={() => enrollment && handleCheckOut(enrollment)}
                        className="text-orange-600 hover:text-orange-900 p-1"
                        disabled={!enrollment}
                        title="Check Out"
                      >
                        <FontAwesomeIcon icon={faUserGraduate} className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => enrollment && handleDelete(enrollment)}
                      className="text-red-600 hover:text-red-900 p-1"
                      disabled={!enrollment}
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
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
         <div className="fixed inset-0 bg-gray-600 bg-opacity-30 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg bg-white">
             <div className="mt-3">
               <h3 className="text-sm font-medium text-gray-900 mb-4">
                 {showEditModal ? 'Edit Enrollment' : 'Enroll New Student'}
               </h3>
               
               {/* Error Message in Modal */}
               {error && (
                 <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 text-xs">
                   {error}
                 </div>
               )}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                                     {/* Student Search and Room - 2 columns */}
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-medium text-gray-700">Student Registration Number</label>
                       <div className="flex space-x-2">
                         <input
                           type="text"
                           placeholder="Enter registration number"
                           value={studentSearchReg}
                           onChange={(e) => setStudentSearchReg(e.target.value)}
                           className="flex-1 border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                         />
                         <button
                           type="button"
                           onClick={handleStudentSearch}
                           className="bg-gray-900 text-white px-3 py-2 text-xs font-medium hover:bg-gray-800"
                         >
                           Search
                         </button>
                       </div>
                       {foundStudent && (
                         <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                           <p className="text-xs text-green-800">
                             <strong>Found:</strong> {foundStudent.Name} {foundStudent.Surname} ({foundStudent.RegNumber})
                           </p>
                           <button
                             type="button"
                             onClick={clearStudentSearch}
                             className="text-xs text-red-600 hover:text-red-800 mt-1"
                           >
                             Clear
                           </button>
                         </div>
                       )}
                     </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Room</label>
                      <select
                        value={formData.room_id}
                        onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                        className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                      >
                        <option value="">Select Room</option>
                        {rooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.room_number} ({room.room_type}) - {room.current_enrollments || 0}/{room.capacity}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Academic Year and Term - 2 columns */}
                  <div className="grid grid-cols-2 gap-4">
                                         <div>
                       <label className="block text-xs font-medium text-gray-700">Academic Year</label>
                       <input
                         type="text"
                         required
                         value={formData.academic_year}
                         onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                         placeholder="e.g., 2025"
                         className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                       />
                     </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Term</label>
                      <select
                        required
                        value={formData.term}
                        onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                        className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                      >
                        <option value="">Select Term</option>
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                      </select>
                    </div>
                  </div>

                  {/* Enrollment Date and Status - 2 columns */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Enrollment Date</label>
                      <input
                        type="date"
                        required
                        value={formData.enrollment_date}
                        onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Status</label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                      >
                        <option value="enrolled">Enrolled</option>
                        <option value="checked_in">Checked In</option>
                        <option value="checked_out">Checked Out</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Check In/Out Dates - 2 columns */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Check In Date</label>
                      <input
                        type="date"
                        value={formData.check_in_date}
                        onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Check Out Date</label>
                      <input
                        type="date"
                        value={formData.check_out_date}
                        onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Notes - Full Width */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows="3"
                      className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setFormData({
                        student_reg_number: '',
                        room_id: '',
                        academic_year: '',
                        term: '',
                        enrollment_date: '',
                        check_in_date: '',
                        check_out_date: '',
                        status: 'enrolled',
                        notes: ''
                      });
                      clearStudentSearch();
                    }}
                    className="px-3 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-3 py-1.5 text-xs font-medium ${
                      isSubmitting 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
                        {showEditModal ? 'Updating...' : 'Enrolling...'}
                      </>
                    ) : (
                      showEditModal ? 'Update' : 'Enroll'
                    )}
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Enrollment Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Student</label>
                  <p className="text-xs text-gray-900">{getStudentName(selectedEnrollment?.student_reg_number)}</p>
                  <p className="text-xs text-gray-500">{selectedEnrollment?.student_reg_number}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Room</label>
                  <p className="text-xs text-gray-900">{getRoomNumber(selectedEnrollment?.room_id)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Academic Year</label>
                  <p className="text-xs text-gray-900">{selectedEnrollment?.academic_year || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Term</label>
                  <p className="text-xs text-gray-900">{selectedEnrollment?.term || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedEnrollment?.status)}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Enrollment Date</label>
                  <p className="text-xs text-gray-900">{selectedEnrollment?.enrollment_date || 'N/A'}</p>
                </div>
                {selectedEnrollment?.check_in_date && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Check In Date</label>
                    <p className="text-xs text-gray-900">{selectedEnrollment.check_in_date}</p>
                  </div>
                )}
                {selectedEnrollment?.check_out_date && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Check Out Date</label>
                    <p className="text-xs text-gray-900">{selectedEnrollment.check_out_date}</p>
                  </div>
                )}
                {selectedEnrollment?.notes && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Notes</label>
                    <p className="text-xs text-gray-900">{selectedEnrollment.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium hover:bg-gray-800"
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

const BillingTab = ({ hostelId }) => {
  const [billingFees, setBillingFees] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [error, setError] = useState('');
  const { token } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    term: '',
    academic_year: '',
    amount: '',
    currency_id: ''
  });

  useEffect(() => {
    fetchBillingFees();
    fetchCurrencies();
  }, [hostelId]);

  const fetchBillingFees = async () => {
    try {
      setLoading(true);
      console.log('Fetching billing fees for hostel:', hostelId);
      console.log('Request URL:', `${BASE_URL}/boarding/hostels/${hostelId}/billing-fees`);
      
      const response = await axios.get(`${BASE_URL}/boarding/hostels/${hostelId}/billing-fees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Billing fees response:', response.data);
      
      if (response.data && Array.isArray(response.data.data)) {
        setBillingFees(response.data.data);
      } else {
        setBillingFees([]);
      }
    } catch (error) {
      console.error('Error fetching billing fees:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      setError('Failed to load billing fees');
      setBillingFees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        setCurrencies(response.data.data);
      } else {
        setCurrencies([]);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      setCurrencies([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showEditModal) {
        await axios.put(`${BASE_URL}/boarding/billing-fees/${selectedFee.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BASE_URL}/boarding/billing-fees`, { ...formData, hostel_id: hostelId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({
        term: '',
        academic_year: '',
        amount: '',
        currency_id: ''
      });
      fetchBillingFees();
    } catch (error) {
      console.error('Error saving billing fee:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to save billing fee');
      }
    }
  };

  const handleEdit = (fee) => {
    setSelectedFee(fee);
    setFormData({
      term: fee.term,
      academic_year: fee.academic_year,
      amount: fee.amount,
      currency_id: fee.currency_id
    });
    setShowEditModal(true);
  };

  const handleDelete = async (fee) => {
    if (window.confirm('Are you sure you want to delete this billing fee?')) {
      try {
        await axios.delete(`${BASE_URL}/boarding/billing-fees/${fee.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchBillingFees();
      } catch (error) {
        console.error('Error deleting billing fee:', error);
        setError('Failed to delete billing fee');
      }
    }
  };

  const getCurrencyName = (currencyId) => {
    const currency = currencies.find(c => c.id === currencyId);
    return currency ? currency.name : 'N/A';
  };

  const getCurrencySymbol = (currencyId) => {
    const currency = currencies.find(c => c.id === currencyId);
    return currency ? currency.symbol : '';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200/30 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-medium text-gray-900">Billing & Fees</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-gray-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-gray-800"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1" />
          Add Billing
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 text-xs">
          {error}
        </div>
      )}

             {/* Billing Fees Table */}
       <div className="overflow-x-auto">
         <table className="min-w-full bg-white border border-gray-200/30">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200/30">
             {(billingFees || []).map((fee, index) => (
               <tr key={fee?.id || index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{fee?.term || 'N/A'}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{fee?.academic_year || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                  {getCurrencySymbol(fee?.currency_id)}{fee?.amount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{getCurrencyName(fee?.currency_id)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => fee && handleEdit(fee)}
                      className="text-green-600 hover:text-green-900 p-1"
                      disabled={!fee}
                    >
                      <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => fee && handleDelete(fee)}
                      className="text-red-600 hover:text-red-900 p-1"
                      disabled={!fee}
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-30 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg bg-white">
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                {showEditModal ? 'Edit Fee Structure' : 'Add New Fee Structure'}
              </h3>
              
              {/* Error Message in Modal */}
              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 text-xs">
                  {error}
                </div>
              )}
              
                             <form onSubmit={handleSubmit}>
                 <div className="space-y-4">
                   {/* Term and Academic Year - 2 columns */}
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-medium text-gray-700">Term</label>
                       <select
                         required
                         value={formData.term}
                         onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                         className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                       >
                         <option value="">Select Term</option>
                         <option value="Term 1">Term 1</option>
                         <option value="Term 2">Term 2</option>
                         <option value="Term 3">Term 3</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs font-medium text-gray-700">Academic Year</label>
                       <input
                         type="text"
                         required
                         value={formData.academic_year}
                         onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                         placeholder="e.g., 2025"
                         className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                       />
                     </div>
                   </div>

                                     {/* Amount - Full Width */}
                   <div>
                     <label className="block text-xs font-medium text-gray-700">Amount</label>
                     <input
                       type="number"
                       required
                       min="0"
                       step="0.01"
                       value={formData.amount}
                       onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                       placeholder="0.00"
                       className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                     />
                   </div>

                  {/* Currency - Full Width */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Currency</label>
                    <select
                      required
                      value={formData.currency_id}
                      onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                      className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                    >
                      <option value="">Select Currency</option>
                      {currencies.map(currency => (
                        <option key={currency.id} value={currency.id}>
                          {currency.name} ({currency.symbol})
                        </option>
                      ))}
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
                        term: '',
                        academic_year: '',
                        amount: '',
                        currency_id: ''
                      });
                    }}
                    className="px-3 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium hover:bg-gray-800"
                  >
                    {showEditModal ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewHostel;
