import React, { createContext, useContext, useState, useEffect } from 'react';
import BASE_URL from './Api';
const EmployeeAuthContext = createContext();


export const useEmployeeAuth = () => {
  const context = useContext(EmployeeAuthContext);
  if (!context) {
    throw new Error('useEmployeeAuth must be used within an EmployeeAuthProvider');
  }
  return context;
};

export const EmployeeAuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('employeeToken');
      const storedEmployee = localStorage.getItem('employee');
      
      if (storedToken && storedEmployee) {
        try {
          // Verify token is still valid by making a request to profile endpoint
          const response = await fetch(`${BASE_URL}/employee-auth/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setEmployee(data.employee);
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('employeeToken');
            localStorage.removeItem('employee');
            setEmployee(null);
            setToken(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          localStorage.removeItem('employeeToken');
          localStorage.removeItem('employee');
          setEmployee(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (employeeNumber, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/employee-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeNumber, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requiresPasswordSetup) {
          // First-time login - password setup required
          return { 
            success: true, 
            requiresPasswordSetup: true, 
            employee: data.employee 
          };
        } else {
          // Regular login successful
          const { token: authToken, employee: employeeData } = data;
          
          setEmployee(employeeData);
          setToken(authToken);
          setIsAuthenticated(true);
          localStorage.setItem('employeeToken', authToken);
          localStorage.setItem('employee', JSON.stringify(employeeData));
          
          return { success: true, employee: employeeData };
        }
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setPassword = async (employeeId, password, confirmPassword) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/employee-auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId, password, confirmPassword })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        throw new Error(data.error || 'Failed to set password');
      }
    } catch (error) {
      console.error('Set password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setEmployee(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employee');
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/employee-auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getProfile = async () => {
    try {
      const response = await fetch(`${BASE_URL}/employee-auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployee(data.employee);
        localStorage.setItem('employee', JSON.stringify(data.employee));
        return data.employee;
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  };

  const value = {
    employee,
    token,
    isAuthenticated,
    isLoading,
    login,
    setPassword,
    logout,
    changePassword,
    getProfile
  };

  return (
    <EmployeeAuthContext.Provider value={value}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};
