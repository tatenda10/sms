import { useState, useEffect, useRef } from 'react';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';
import { CreditCard, Download, Eye, Calendar, Filter, Search } from 'lucide-react';

const Payslips = () => {
  const { employee } = useEmployeeAuth();
  const [payslips, setPayslips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    pay_period: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const hasFetched = useRef(false);

  console.log('🏗️ Payslips component initialized');
  console.log('👤 Employee from context:', employee);

  const fetchPayslips = async () => {
    if (!employee?.id || hasFetched.current) return;
    
    try {
      console.log('🔄 Fetching payslips for employee:', employee.id);
      setIsLoading(true);
      setError(null);
      hasFetched.current = true;
      
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.pay_period) queryParams.append('pay_period', filters.pay_period);
      
      const url = `http://localhost:5000/api/employee-payroll/${employee.id}?${queryParams}`;
      console.log('🌐 API URL:', url);
      
      const token = localStorage.getItem('employeeToken');
      console.log('🔑 Token exists:', !!token);
      console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Response data:', data);
      setPayslips(data.data || []);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
      hasFetched.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('👤 Employee data:', employee);
    console.log('🆔 Employee ID:', employee?.id);
    console.log('🔍 Filters:', filters);
    
    if (employee?.id) {
      console.log('✅ Employee ID found, fetching payslips...');
      fetchPayslips();
    } else {
      console.log('❌ No employee ID found, skipping fetch');
    }
  }, [employee?.id, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    hasFetched.current = false;
  };

  const filteredPayslips = payslips.filter(payslip => {
    if (!searchTerm) return true;
    return payslip.pay_period?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           payslip.employee_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading payslips</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-medium text-gray-900">Payslips</h1>
        <p className="text-sm text-gray-500">View your salary information and payslips</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search payslips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processed">Processed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="text"
            placeholder="Pay Period (e.g., 2024-12)"
            value={filters.pay_period}
            onChange={(e) => handleFilterChange('pay_period', e.target.value)}
            className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setFilters({ status: '', pay_period: '' });
              setSearchTerm('');
              hasFetched.current = false;
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pay Period
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Pay
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pay Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                    {payslips.length === 0 ? 'No payslips found' : 'No payslips match your search criteria'}
                  </td>
                </tr>
              ) : (
                filteredPayslips.map((payslip) => (
                  <tr key={payslip.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payslip.pay_period || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${payslip.net_pay ? payslip.net_pay.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium ${
                        payslip.status === 'processed' 
                          ? 'bg-green-100 text-green-800' 
                          : payslip.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payslip.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payslip.pay_date ? new Date(payslip.pay_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => window.open(`/payslips/${payslip.id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Payslip"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          title="Download Payslip"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {payslips.length > 0 && (
        <div className="mt-6 bg-gray-50 border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Payslips:</span>
              <span className="ml-2 font-medium">{payslips.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Earnings:</span>
              <span className="ml-2 font-medium">
                ${payslips.reduce((sum, p) => sum + (p.total_earnings || 0), 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total Net Pay:</span>
              <span className="ml-2 font-medium">
                ${payslips.reduce((sum, p) => sum + (p.net_pay || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payslips;
