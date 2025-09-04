import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';

const Results = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = (classId) => {
    navigate(`/dashboard/results/view/${classId}`);
  };

  const handleAddResult = (classId) => {
    navigate(`/dashboard/results/entry/${classId}`);
  };

  const filteredClasses = classes.filter(cls =>
    (cls.name && cls.name.toLowerCase().includes(search.toLowerCase())) ||
    (cls.stream_name && cls.stream_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-2">
      <div className="mb-8">
        <h1 className="text-base font-bold text-gray-900 mb-2">Results Management</h1>
        <p className="text-sm text-gray-600">
          View and manage student results by class
        </p>
      </div>

      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
            <input
              type="text"
              placeholder="Search classes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class Name
              </th>
                             <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Stage
               </th>
               <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Stream
               </th>
               <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Capacity
               </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-3 py-4 text-center text-xs text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredClasses.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-3 py-4 text-center text-xs text-gray-500">
                  {search ? 'No classes found matching your search' : 'No classes found'}
                </td>
              </tr>
            ) : (
                             filteredClasses.map((cls) => (
                 <tr key={cls.id} className="hover:bg-gray-50">
                   <td className="px-3 py-2 whitespace-nowrap">
                     <div className="text-xs font-bold text-gray-900">{cls.name}</div>
                   </td>
                   <td className="px-3 py-2 whitespace-nowrap">
                     <div className="text-xs text-gray-900">{cls.stream_stage || 'N/A'}</div>
                   </td>
                   <td className="px-3 py-2 whitespace-nowrap">
                     <div className="text-xs text-gray-900">{cls.stream_name || 'N/A'}</div>
                   </td>
                   <td className="px-3 py-2 whitespace-nowrap">
                     <div className="text-xs text-gray-900">{cls.capacity || 'Unlimited'}</div>
                   </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewResults(cls.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="View Results"
                      >
                        <FontAwesomeIcon icon={faEye} className="h-3 w-3 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleAddResult(cls.id)}
                        className="text-green-600 hover:text-green-900 flex items-center"
                        title="Add Result"
                      >
                        <FontAwesomeIcon icon={faPlus} className="h-3 w-3 mr-1" />
                        Add
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="mt-4 text-xs text-red-600">{error}</div>
      )}
    </div>
  );
};

export default Results;
