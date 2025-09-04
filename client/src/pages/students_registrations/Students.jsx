import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faEye, 
  faEdit, 
  faTrash,
  faUserGraduate,
  faPhone,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';


const Students = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [limit] = useState(10);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, activeSearchTerm]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're searching
      if (activeSearchTerm && activeSearchTerm.trim() !== '') {
        console.log('🔍 Searching for:', activeSearchTerm);
        // Search mode - no pagination
        const response = await axios.get(`${BASE_URL}/students/search`, {
          params: { query: activeSearchTerm.trim() },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = response.data;
        console.log('🔍 Search results:', data);
        setStudents(data.data || []);
        setTotalPages(1); // Search results are not paginated
        setTotalStudents(data.totalResults || 0);
      } else {
        console.log('📄 Fetching page:', currentPage);
        // Normal pagination mode
        const response = await axios.get(`${BASE_URL}/students`, {
          params: {
            page: currentPage,
            limit: limit
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = response.data;
        console.log('📊 Pagination data:', data.pagination);
        console.log('📊 Raw response:', data);
        const totalPages = data.pagination?.totalPages || 1;
        const totalStudents = data.pagination?.totalStudents || 0;
        console.log('📊 Setting totalPages:', totalPages, 'totalStudents:', totalStudents);
        setStudents(data.data || []);
        setTotalPages(totalPages);
        setTotalStudents(totalStudents);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
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
    console.log('🔍 Starting search with term:', searchTerm);
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
    // fetchStudents will be called via useEffect
  };

  const handleClearSearch = () => {
    console.log('🧹 Clearing search');
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  const handleDelete = async (regNumber) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/students/${regNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh the list
      fetchStudents();
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

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-lg font-semibold text-gray-900">Students</h1>
          <p className="mt-2 text-xs text-gray-700">
            Manage student registrations and information
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/dashboard/students/add"
            className="inline-flex items-center justify-center border border-transparent bg-gray-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Student
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, surname, or registration number..."
                className="block w-full pl-10 pr-10 py-1.5 border border-gray-300 leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <span className="text-xs">✕</span>
                </button>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <FontAwesomeIcon icon={faSearch} className="h-3 w-3" />
          </button>
        </form>
        
        {/* Search Results Info */}
        {activeSearchTerm && (
          <div className="mt-2 text-xs text-gray-600">
            {loading ? 'Searching...' : `Found ${totalStudents} results for "${activeSearchTerm}"`}
            <button 
              onClick={handleClearSearch}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Students Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100/30">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Reg Number
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Surname
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Gender
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.RegNumber} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900 font-mono">
                          {student.RegNumber}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {student.Name}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {student.Surname}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {student.Gender || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {student.Active || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/dashboard/students/view/${student.RegNumber}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/dashboard/students/edit/${student.RegNumber}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(student.RegNumber)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
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

      {/* Pagination */}
      {(() => {
        console.log('🔢 Pagination check - activeSearchTerm:', activeSearchTerm, 'totalPages:', totalPages, 'should show:', !activeSearchTerm && totalPages > 1);
        return null;
      })()}
      {!activeSearchTerm && (totalPages > 1 || process.env.NODE_ENV === 'development') && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-gray-700">
            Showing page {currentPage} of {totalPages} ({totalStudents} total students)
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            {(() => {
              const pages = [];
              const startPage = Math.max(1, currentPage - 2);
              const endPage = Math.min(totalPages, currentPage + 2);
              
              // Add first page if not in range
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => setCurrentPage(1)}
                    className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                  >
                    1
                  </button>
                );
                if (startPage > 2) {
                  pages.push(<span key="dots1" className="px-1 text-xs text-gray-400">...</span>);
                }
              }
              
              // Add page numbers in range
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-2 py-1 text-xs font-medium border ${
                      i === currentPage
                        ? 'bg-gray-700 text-white border-gray-700'
                        : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i}
                  </button>
                );
              }
              
              // Add last page if not in range
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(<span key="dots2" className="px-1 text-xs text-gray-400">...</span>);
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                );
              }
              
              return pages;
            })()}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
