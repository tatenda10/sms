import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEdit, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const RoomsTab = () => {
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
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
    hostel_id: '',
    room_number: '',
    room_type: 'SINGLE',
    capacity: 1,
    description: ''
  });

  useEffect(() => {
    fetchRooms();
    fetchHostels();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/boarding/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Rooms API response:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Is array:', Array.isArray(response.data));
      
      // Ensure we always set an array
      if (Array.isArray(response.data)) {
        setRooms(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setRooms(response.data.data);
      } else if (response.data && response.data.rooms && Array.isArray(response.data.rooms)) {
        setRooms(response.data.rooms);
      } else {
        console.warn('Unexpected response format, setting empty array');
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

  const fetchHostels = async () => {
    try {
      const response = await axios.get('/api/boarding/hostels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Hostels for rooms API response:', response.data);
      
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showEditModal) {
        await axios.put(`/api/boarding/rooms/${selectedRoom.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/boarding/rooms', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({
        hostel_id: '',
        room_number: '',
        room_type: 'SINGLE',
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
      hostel_id: room.hostel_id,
      room_number: room.room_number,
      room_type: room.room_type,
      capacity: room.capacity,
      description: room.description
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
        await axios.delete(`/api/boarding/rooms/${room.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchRooms();
      } catch (error) {
        console.error('Error deleting room:', error);
        setError('Failed to delete room');
      }
    }
  };

  const getHostelName = (hostelId) => {
    const hostel = (hostels || []).find(h => h.id === hostelId);
    return hostel ? hostel.name : 'Unknown Hostel';
  };

  const getRoomTypeLabel = (type) => {
    const types = {
      'SINGLE': 'Single',
      'DOUBLE': 'Double',
      'TRIPLE': 'Triple',
      'QUAD': 'Quad'
    };
    return types[type] || type;
  };

  const filteredRooms = (() => {
    try {
      if (!Array.isArray(rooms)) {
        console.warn('Rooms is not an array:', rooms);
        return [];
      }
      return rooms.filter(room =>
        room && room.room_number && room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room && room.hostel_id && getHostelName(room.hostel_id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error filtering rooms:', error);
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Rooms</h2>
          <p className="text-gray-600 mt-1">Manage rooms within boarding hostels</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-gray-800"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add Room</span>
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

      {/* Rooms Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hostel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
                         {(filteredRooms || []).map((room, index) => (
                             <tr key={room?.id || index} className="hover:bg-gray-50">
                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-sm font-medium text-gray-900">{room?.room_number || 'N/A'}</div>
                   <div className="text-sm text-gray-500">{room?.description || ''}</div>
                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                   {getHostelName(room?.hostel_id)}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                   {getRoomTypeLabel(room?.room_type)}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{room?.capacity || 0}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                   {room?.current_occupancy || 0} / {room?.capacity || 0}
                 </td>
                <td className="px-6 py-4 whitespace-nowrap">
                                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                     (room?.current_occupancy || 0) >= (room?.capacity || 0)
                       ? 'bg-red-100 text-red-800'
                       : (room?.current_occupancy || 0) > 0
                       ? 'bg-yellow-100 text-yellow-800'
                       : 'bg-green-100 text-green-800'
                   }`}>
                     {(room?.current_occupancy || 0) >= (room?.capacity || 0) ? 'Full' : 
                      (room?.current_occupancy || 0) > 0 ? 'Partially Occupied' : 'Available'}
                   </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                                         <button
                       onClick={() => room && handleView(room)}
                       className="text-blue-600 hover:text-blue-900"
                       disabled={!room}
                     >
                       <FontAwesomeIcon icon={faEye} />
                     </button>
                     <button
                       onClick={() => room && handleEdit(room)}
                       className="text-green-600 hover:text-green-900"
                       disabled={!room}
                     >
                       <FontAwesomeIcon icon={faEdit} />
                     </button>
                     <button
                       onClick={() => room && handleDelete(room)}
                       className="text-red-600 hover:text-red-900"
                       disabled={!room}
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
                {showEditModal ? 'Edit Room' : 'Add New Room'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hostel</label>
                    <select
                      required
                      value={formData.hostel_id}
                      onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700">Room Number</label>
                    <input
                      type="text"
                      required
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room Type</label>
                    <select
                      required
                      value={formData.room_type}
                      onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="SINGLE">Single</option>
                      <option value="DOUBLE">Double</option>
                      <option value="TRIPLE">Triple</option>
                      <option value="QUAD">Quad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                        hostel_id: '',
                        room_number: '',
                        room_type: 'SINGLE',
                        capacity: 1,
                        description: ''
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Room Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Number</label>
                  <p className="text-sm text-gray-900">{selectedRoom.room_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hostel</label>
                  <p className="text-sm text-gray-900">{getHostelName(selectedRoom.hostel_id)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Type</label>
                  <p className="text-sm text-gray-900">{getRoomTypeLabel(selectedRoom.room_type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <p className="text-sm text-gray-900">{selectedRoom.capacity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Occupancy</label>
                  <p className="text-sm text-gray-900">{selectedRoom.current_occupancy || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedRoom.description}</p>
                </div>
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

export default RoomsTab;
