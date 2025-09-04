import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faDollarSign, 
  faUserGraduate, 
  faExclamationTriangle,
  faEye,
  faFileAlt,
  faDownload,
  faPrint,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const StudentBalances = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalStudents: 0,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false
  });

  useEffect(() => {
    fetchStudentBalances();
    fetchSummary();
  }, [pagination.currentPage, activeSearchTerm]);

  const fetchStudentBalances = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(activeSearchTerm && { search: activeSearchTerm })
      });

      const response = await axios.get(`${BASE_URL}/students/balances/outstanding?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStudents(response.data.data);
        setPagination(response.data.pagination);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching student balances:', error);
      setError('Failed to fetch student balances');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/students/balances/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const handleRefresh = () => {
    fetchStudentBalances();
    fetchSummary();
  };

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ['Registration Number', 'Name', 'Surname', 'Class', 'Outstanding Balance', 'Last Transaction Date'],
             ...students.map(student => [
         student.RegNumber,
         student.Name,
         student.Surname,
         'Not Assigned',
         Math.abs(student.current_balance).toFixed(2),
         student.last_transaction_date ? formatDate(student.last_transaction_date) : 'N/A'
       ])
    ].map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outstanding-balances-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Outstanding Student Balances</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border: 1px solid #ddd; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .amount { text-align: right; }
            .total { font-weight: bold; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>OUTSTANDING STUDENT BALANCES</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Students with Outstanding Balances:</strong> ${summary?.total_students_with_debt || 0}</p>
            <p><strong>Total Outstanding Amount:</strong> ${formatCurrency(summary?.total_outstanding_debt || 0)}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Registration No</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Class</th>
                <th class="amount">Outstanding Balance</th>
                <th>Last Transaction</th>
              </tr>
            </thead>
            <tbody>
                             ${students.map(student => `
                 <tr>
                   <td>${student.RegNumber}</td>
                   <td>${student.Name}</td>
                   <td>${student.Surname}</td>
                   <td>Not Assigned</td>
                   <td class="amount">${formatCurrency(student.current_balance)}</td>
                   <td>${student.last_transaction_date ? formatDate(student.last_transaction_date) : 'N/A'}</td>
                 </tr>
               `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Outstanding Student Balances</h1>
              <p className="text-xs text-gray-600">Students with outstanding debts and payment obligations</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                className="bg-gray-600 text-white px-3 py-2 text-xs hover:bg-gray-700 flex items-center"
              >
                <FontAwesomeIcon icon={faRefresh} className="mr-1" />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="bg-green-600 text-white px-3 py-2 text-xs hover:bg-green-700 flex items-center"
              >
                <FontAwesomeIcon icon={faDownload} className="mr-1" />
                Export
              </button>
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-3 py-2 text-xs hover:bg-blue-700 flex items-center"
              >
                <FontAwesomeIcon icon={faPrint} className="mr-1" />
                Print
              </button>
            </div>
          </div>
        </div>

                 {/* Summary Cards */}
         {summary && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
             <div className="bg-red-50 border border-red-200 rounded-lg p-4">
               <div className="flex items-center">
                 <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-lg mr-3" />
                 <div>
                   <p className="text-xs text-red-600 font-medium">Students with Debt</p>
                   <p className="text-lg font-bold text-red-900">{summary.total_students_with_debt}</p>
                 </div>
               </div>
             </div>
             <div className="bg-red-50 border border-red-200 rounded-lg p-4">
               <div className="flex items-center">
                 <FontAwesomeIcon icon={faDollarSign} className="text-red-600 text-lg mr-3" />
                 <div>
                   <p className="text-xs text-red-600 font-medium">Total Outstanding</p>
                   <p className="text-lg font-bold text-red-900">{formatCurrency(summary.total_outstanding_debt)}</p>
                 </div>
               </div>
             </div>
           </div>
         )}

        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search by name or registration number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-6 pr-2 py-2 border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-gray-900 text-white px-4 py-2 text-xs hover:bg-gray-800"
            >
              Search
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        {/* Students Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-600">Loading outstanding balances...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center">
              <FontAwesomeIcon icon={faUserGraduate} className="text-gray-400 text-3xl mb-2" />
              <p className="text-sm text-gray-600">
                {activeSearchTerm ? 'No students found matching your search' : 'No students with outstanding balances'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Outstanding Balance
                      </th>
                                             <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Last Transaction
                       </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.RegNumber} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <div>
                            <div className="font-medium text-gray-900">
                              {student.Name} {student.Surname}
                            </div>
                            <div className="text-gray-500">
                              {student.RegNumber}
                            </div>
                          </div>
                        </td>
                                                 <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                           Not Assigned
                         </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right">
                          <span className="text-red-600 font-bold">
                            {formatCurrency(student.current_balance)}
                          </span>
                        </td>
                                                 <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                           {student.last_transaction_date ? formatDate(student.last_transaction_date) : 'N/A'}
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPreviousPage}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {((pagination.currentPage - 1) * pagination.limit) + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(pagination.currentPage * pagination.limit, pagination.totalStudents)}
                          </span>{' '}
                          of{' '}
                          <span className="font-medium">{pagination.totalStudents}</span>{' '}
                          results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={!pagination.hasPreviousPage}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          
                          {/* Page Numbers */}
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex items-center px-3 py-2 border text-xs font-medium ${
                                  pageNum === pagination.currentPage
                                    ? 'z-10 bg-gray-900 border-gray-900 text-white'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentBalances;
