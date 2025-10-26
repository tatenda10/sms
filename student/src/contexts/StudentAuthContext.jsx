import React, { createContext, useContext, useState, useEffect } from 'react';
import BASE_URL from './Api';

const StudentAuthContext = createContext();

export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
};

export const StudentAuthProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('studentToken');
      const storedStudent = localStorage.getItem('student');
      
      if (storedToken && storedStudent) {
        try {
          // Verify token is still valid by making a request to profile endpoint
          const response = await fetch(`${BASE_URL}/student-auth/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setStudent(data.student);
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('studentToken');
            localStorage.removeItem('student');
            setStudent(null);
            setToken(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          localStorage.removeItem('studentToken');
          localStorage.removeItem('student');
          setStudent(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (regNumber, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/student-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ regNumber, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isFirstLogin) {
          // First-time login - password setup required
          console.log('🆕 First login - storing token:', data.token);
          localStorage.setItem('studentToken', data.token);
          return { 
            success: true, 
            isFirstLogin: true, 
            student: data.student,
            token: data.token
          };
        } else {
          // Regular login successful
          const { token: authToken, student: studentData } = data;
          
          setStudent(studentData);
          setToken(authToken);
          setIsAuthenticated(true);
          localStorage.setItem('studentToken', authToken);
          localStorage.setItem('student', JSON.stringify(studentData));
          
          return { success: true, student: studentData };
        }
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setInitialPassword = async (newPassword, confirmPassword) => {
    setIsLoading(true);
    try {
      // Get token from localStorage for first-time password setup
      const storedToken = localStorage.getItem('studentToken');
      console.log('🔐 Setting initial password with token:', storedToken);
      
      const response = await fetch(`${BASE_URL}/student-auth/set-initial-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        },
        body: JSON.stringify({ newPassword, confirmPassword })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Failed to set password');
      }
    } catch (error) {
      console.error('Set password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setStudent(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('studentToken');
    localStorage.removeItem('student');
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/student-auth/change-password`, {
        method: 'POST',
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
        throw new Error(data.message || 'Failed to change password');
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
      const response = await fetch(`${BASE_URL}/student-auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudent(data.student);
        localStorage.setItem('student', JSON.stringify(data.student));
        return data.student;
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  };

  const value = {
    student,
    token,
    isAuthenticated,
    isLoading,
    login,
    setInitialPassword,
    logout,
    changePassword,
    getProfile
  };

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  );
};
