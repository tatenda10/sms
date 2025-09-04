import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faRoute, faCalendarAlt, faMapMarkerAlt, faDollarSign
} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';

const AddStudentRegistration = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentResults, setShowStudentResults] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    student_reg_number: '',
    route_id: '',
    pickup_point: '',
    dropoff_point: '',
    start_date: '',
    end_date: '',
    weekly_fee: '',
    currency: 'USD'
  });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    loadRoutes();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.student-search-container')) {
        setShowStudentResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadRoutes = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/transport/routes?limit=100`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setRoutes(response.data.data);
      }
    } catch (err) {
      console.error('Error loading routes:', err);
    }
  };

  const searchStudents = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setStudents([]);
      return;
    }

    try {
      // First try exact match by registration number
      try {
        const exactResponse = await axios.get(`${BASE_URL}/students/${searchTerm}`, {
          headers: authHeaders
        });
        
        if (exactResponse.data.success) {
          setStudents([exactResponse.data.data]);
          return;
        }
      } catch (exactErr) {
        // If exact match fails, try general search
      }

      // Fallback to general search
      const response = await axios.get(`${BASE_URL}/students/search?query=${searchTerm}`, {
        headers: authHeaders
      });
      
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (err) {
      console.error('Error searching students:', err);
      setStudents([]);
    }
  };

  const handleStudentSearch = (e) => {
    const value = e.target.value;
    setStudentSearchTerm(value);
    
    if (value.trim()) {
      searchStudents(value);
      setShowStudentResults(true);
    } else {
      setStudents([]);
      setShowStudentResults(false);
      setSelectedStudent(null);
      setFormData(prev => ({ ...prev, student_reg_number: '' }));
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearchTerm(`${student.Name} ${student.Surname} (${student.RegNumber})`);
    setFormData(prev => ({ ...prev, student_reg_number: student.RegNumber }));
    setShowStudentResults(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-populate pickup and dropoff points when route is selected
    if (name === 'route_id' && value) {
      const selectedRoute = routes.find(route => route.id.toString() === value);
      if (selectedRoute) {
        setFormData(prev => ({
          ...prev,
          pickup_point: selectedRoute.pickup_point || '',
          dropoff_point: selectedRoute.dropoff_point || '',
          weekly_fee: selectedRoute.weekly_fee || '',
          currency: selectedRoute.currency || 'USD'
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const cleanedData = {
        ...formData,
        weekly_fee: parseFloat(formData.weekly_fee),
        pickup_point: formData.pickup_point.trim() || null,
        dropoff_point: formData.dropoff_point.trim() || null,
        end_date: formData.end_date || null
      };
      
      // Create new registration
      await axios.post(`${BASE_URL}/transport/registrations`, cleanedData, {
        headers: authHeaders
      });
      
      setSuccess('Student registered for transport successfully');
      
      // Navigate back to registrations list after a short delay
      setTimeout(() => {
        navigate('/dashboard/transport/registrations');
      }, 1500);
      
    } catch (err) {
      console.error('Error saving registration:', err);
      setError(err.response?.data?.message || 'Failed to register student');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Register Student for Transport</h1>
          <p className="text-xs text-gray-600">Add a new student transport registration</p>
        </div>
      </div>

      {/* Registration Form */}
      <div className="bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Search */}
            <div className="student-search-container relative">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Student Registration Number
              </label>
              <input
                type="text"
                value={studentSearchTerm}
                onChange={handleStudentSearch}
                placeholder="Enter student registration number..."
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                required
              />
              
              {/* Student Search Results */}
              {showStudentResults && students.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.RegNumber}
                      onClick={() => selectStudent(student)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs"
                    >
                      <div className="font-medium">{student.Name} {student.Surname}</div>
                      <div className="text-gray-500">Reg: {student.RegNumber}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Route Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faRoute} className="mr-2" />
                Route
              </label>
              <select
                name="route_id"
                value={formData.route_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">Select Route</option>
                {routes.filter(route => route.is_active).map(route => (
                  <option key={route.id} value={route.id}>
                    {route.route_name} - {route.weekly_fee} {route.currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Pickup Point */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                Pickup Point
              </label>
              <input
                type="text"
                name="pickup_point"
                value={formData.pickup_point}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Pickup location"
              />
            </div>

            {/* Dropoff Point */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                Dropoff Point
              </label>
              <input
                type="text"
                name="dropoff_point"
                value={formData.dropoff_point}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Dropoff location"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                End Date (Optional)
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>

            {/* Weekly Fee */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faDollarSign} className="mr-2" />
                Weekly Fee
              </label>
              <input
                type="number"
                name="weekly_fee"
                value={formData.weekly_fee}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="0.00"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="USD">USD</option>
                <option value="ZWL">ZWL</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

                     {/* Form Actions */}
           <div className="flex gap-3 pt-6 border-t border-gray-200">
             <button
               type="submit"
               disabled={loading}
               className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 disabled:opacity-50 flex items-center justify-center"
             >
               {loading ? 'Registering...' : 'Register Student'}
             </button>
             <Link
               to="/dashboard/transport/registrations"
               className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center"
             >
               Cancel
             </Link>
           </div>
        </form>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 z-50">
          {success}
        </div>
      )}
      
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default AddStudentRegistration;
