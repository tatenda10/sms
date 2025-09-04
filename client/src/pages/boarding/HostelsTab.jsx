import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEdit, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import { useNavigate } from 'react-router-dom';

const HostelsTab = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    gender: 'Mixed'
  });

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/boarding/hostels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Hostels API response:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Is array:', Array.isArray(response.data));
      
      // Ensure we always set an array
      if (Array.isArray(response.data)) {
        setHostels(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setHostels(response.data.data);
      } else if (response.data && response.data.hostels && Array.isArray(response.data.hostels)) {
        setHostels(response.data.hostels);
      } else {
        console.warn('Unexpected response format, setting empty array');
        setHostels([]);
      }
    } catch (error) {
      console.error('Error fetching hostels:', error);
      setError('Failed to load hostels');
      setHostels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showEditModal) {
        await axios.put(`${BASE_URL}/boarding/hostels/${selectedHostel.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BASE_URL}/boarding/hostels`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({
        name: '',
        description: '',
        location: '',
        gender: 'Male'
      });
      fetchHostels();
    } catch (error) {
      console.error('Error saving hostel:', error);
      setError('Failed to save hostel');
    }
  };

  const handleEdit = (hostel) => {
    setSelectedHostel(hostel);
    setFormData({
      name: hostel.name,
      description: hostel.description,
      location: hostel.location,
      gender: hostel.gender
    });
    setShowEditModal(true);
  };

  const handleView = (hostel) => {
    navigate(`/dashboard/boarding/hostel/${hostel.id}`);
  };

  const handleDelete = async (hostel) => {
    if (window.confirm('Are you sure you want to delete this hostel?')) {
      try {
        await axios.delete(`${BASE_URL}/boarding/hostels/${hostel.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchHostels();
      } catch (error) {
        console.error('Error deleting hostel:', error);
        setError('Failed to delete hostel');
      }
    }
  };

  const filteredHostels = (() => {
    try {
      if (!Array.isArray(hostels)) {
        console.warn('Hostels is not an array:', hostels);
        return [];
      }
             return hostels.filter(hostel =>
         hostel && hostel.name && hostel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         hostel && hostel.location && hostel.location.toLowerCase().includes(searchTerm.toLowerCase())
       );
    } catch (error) {
      console.error('Error filtering hostels:', error);
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
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hostels</h2>
          <p className="text-xs text-gray-500">Manage boarding hostels and their details</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-900 text-white px-3 py-1.5 flex items-center space-x-2 hover:bg-gray-800 text-xs font-medium"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add Hostel</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search hostels..."
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

      {/* Hostels Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200/30">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rooms</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200/30">
                                      {(filteredHostels || []).map((hostel, index) => (
               <tr key={hostel?.id || index} className="hover:bg-gray-50">
                                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-xs font-medium text-gray-900">{hostel?.name || 'N/A'}</div>
                   <div className="text-xs text-gray-500">{hostel?.description || ''}</div>
                 </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{hostel?.location || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{hostel?.gender || 'N/A'}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{hostel?.total_rooms || 0}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">{hostel?.total_capacity || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                  <div className="flex space-x-1">
                                         <button
                       onClick={() => hostel && handleView(hostel)}
                       className="text-blue-600 hover:text-blue-900 p-1"
                       disabled={!hostel}
                     >
                       <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                     </button>
                     <button
                       onClick={() => hostel && handleEdit(hostel)}
                       className="text-green-600 hover:text-green-900 p-1"
                       disabled={!hostel}
                     >
                       <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                     </button>
                     <button
                       onClick={() => hostel && handleDelete(hostel)}
                       className="text-red-600 hover:text-red-900 p-1"
                       disabled={!hostel}
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
                  {showEditModal ? 'Edit Hostel' : 'Add New Hostel'}
                </h3>
               <form onSubmit={handleSubmit}>
                 <div className="space-y-4">
                   {/* Name - Full Width */}
                   <div>
                     <label className="block text-xs font-medium text-gray-700">Name</label>
                     <input
                       type="text"
                       required
                       value={formData.name}
                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                       className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                     />
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
                   
                                       {/* Location - Full Width */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Location</label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                      />
                    </div>
                    
                    {/* Gender - Full Width */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Gender</label>
                                             <select
                         required
                         value={formData.gender}
                         onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                         className="mt-1 block w-full border border-gray-200/30 px-3 py-2 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-xs"
                       >
                         <option value="Male">Male</option>
                         <option value="Female">Female</option>
                         <option value="Mixed">Mixed</option>
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
                          name: '',
                          description: '',
                          location: '',
                          gender: 'Male'
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

export default HostelsTab;
