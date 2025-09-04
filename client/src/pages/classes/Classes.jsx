import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faPlus,
  faSearch,
  faEye,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const Classes = () => {
  const { token } = useAuth();
  const [gradelevelClasses, setGradelevelClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  useEffect(() => {
    fetchGradelevelClasses();
  }, [activeSearchTerm]);

  const fetchGradelevelClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're searching
      if (activeSearchTerm && activeSearchTerm.trim() !== '') {
        console.log('🔍 Searching for:', activeSearchTerm);
        // Search mode
        const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes/search`, {
          params: { 
            search: activeSearchTerm.trim()
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = response.data;
        console.log('🔍 Search results:', data);
        setGradelevelClasses(data.data || []);
      } else {
        console.log('📄 Fetching all classes');
        // Normal fetch mode
        const response = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = response.data;
        console.log('📊 Raw response:', data);
        setGradelevelClasses(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching grade-level classes:', err);
      if (err.response) {
        // Server responded with error status
        setError(`Error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        // Request was made but no response received
        setError('No response from server. Please check your connection.');
      } else {
        // Something else happened
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      return; // Don't search if term is empty
    }
    console.log('🔍 Starting search with term:', searchTerm);
    setActiveSearchTerm(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
  };

  const handleDelete = async (classId) => {
    setClassToDelete(classId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;

    try {
      await axios.delete(`${BASE_URL}/classes/gradelevel-classes/${classToDelete}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh the list
      fetchGradelevelClasses();
      setShowDeleteModal(false);
      setClassToDelete(null);
    } catch (err) {
      console.error('Error deleting class:', err);
      alert('Failed to delete class. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setClassToDelete(null);
  };







  const renderGradelevelClasses = () => (
    <div className="space-y-6">
      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="flex">
                         <input
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Search by class name or stream name..."
               className="flex-1 px-2 py-1 border border-gray-300  focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
             />
             <button
               type="submit"
               className="inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
             >
               <FontAwesomeIcon icon={faSearch} className="h-3 w-3" />
             </button>
          </form>
          
          {/* Search Results Info */}
          {activeSearchTerm && (
            <div className="mt-2 text-xs text-gray-600">
              {loading ? 'Searching...' : `Found ${gradelevelClasses.length} results for "${activeSearchTerm}"`}
              <button 
                onClick={handleClearSearch}
                className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
                     <Link
             to="/dashboard/classes/gradelevel-classes/add"
             className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
           >
             <FontAwesomeIcon icon={faPlus} className="mr-1 h-3 w-3" />
             Add New Class
           </Link>
        </div>
      </div>

      {/* Error Display */}
             {error && (
         <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
           <div className="text-xs text-red-600">{error}</div>
         </div>
       )}

      {/* Classes Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                                 <thead className="bg-gray-100">
                   <tr>
                     <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">
                       Class Name
                     </th>
                     <th className="px-3 py-2 text-left text-xs font-medium  tracking-wider">
                       Stream
                     </th>
                     <th className="px-3 py-2 text-left text-xs font-medium  tracking-wider">
                       Stage
                     </th>
                     <th className="px-3 py-2 text-left text-xs font-medium  tracking-wider">
                       Teacher
                     </th>
                     <th className="px-3 py-2 text-left text-xs font-medium  tracking-wider">
                       Capacity
                     </th>
                     <th className="px-3 py-2 text-left text-xs font-medium  tracking-wider">
                       Actions
                     </th>
                   </tr>
                 </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                                     {gradelevelClasses.map((classItem) => (
                     <tr key={classItem.id} className="hover:bg-gray-50">
                       <td className="px-3 py-2 whitespace-nowrap">
                         <div className="text-xs text-gray-900 font-medium">
                           {classItem.name}
                         </div>
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap">
                         <div className="text-xs text-gray-900">
                           {classItem.stream_name || 'N/A'}
                         </div>
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap">
                         <div className="text-xs text-gray-900">
                           {classItem.stream_stage || 'N/A'}
                         </div>
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap">
                         <div className="text-xs text-gray-900">
                           {classItem.teacher_name || 'Not Assigned'}
                         </div>
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap">
                         <div className="text-xs text-gray-900">
                           {classItem.capacity || 'Unlimited'}
                         </div>
                       </td>
                       <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                         <div className="flex space-x-2">
                           <Link
                             to={`/dashboard/classes/gradelevel-classes/view/${classItem.id}`}
                             className="text-blue-600 hover:text-blue-900"
                             title="View Class"
                           >
                             <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                           </Link>
                           <Link
                             to={`/dashboard/classes/gradelevel-classes/edit/${classItem.id}`}
                             className="text-indigo-600 hover:text-indigo-900"
                             title="Edit Class"
                           >
                             <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                           </Link>
                           <button
                             onClick={() => handleDelete(classItem.id)}
                             className="text-red-600 hover:text-red-900"
                             title="Delete Class"
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
          </div>
        </div>
      </div>



      {/* Empty State */}
      {!loading && gradelevelClasses.length === 0 && (
                 <div className="mt-8 text-center">
           <FontAwesomeIcon icon={faUsers} className="mx-auto h-8 w-8 text-gray-400" />
           <h3 className="mt-2 text-xs font-medium text-gray-900">No grade-level classes found</h3>
           <p className="mt-1 text-xs text-gray-500">
             {activeSearchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new class.'}
           </p>
           {!activeSearchTerm && (
             <div className="mt-4">
               <Link
                 to="/dashboard/classes/gradelevel-classes/add"
                 className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
               >
                 <FontAwesomeIcon icon={faPlus} className="mr-1 h-3 w-3" />
                 Add New Class
               </Link>
             </div>
           )}
         </div>
      )}

      {/* Loading State */}
             {loading && (
         <div className="mt-8 text-center">
           <div className="text-xs text-gray-500">Loading grade-level classes...</div>
         </div>
       )}
    </div>
  );

  return (
    <div className="p-2">
      <div className="mb-8">
        <h1 className="text-base font-bold text-gray-900 mb-2">Class Management</h1>
        <p className="text-sm text-gray-600">
          Manage academic streams, classes, subjects, and student enrollments
        </p>
      </div>

      {/* Content */}
      {renderGradelevelClasses()}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <FontAwesomeIcon icon={faTrash} className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Class</h3>
              <div className="mt-2 px-7 pt-4">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this class? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 mt-6">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes; 