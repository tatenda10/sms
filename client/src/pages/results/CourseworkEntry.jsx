import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';

const CourseworkEntry = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [gradelevelClasses, setGradelevelClasses] = useState([]);
  const [subjectClasses, setSubjectClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [coursework, setCoursework] = useState([]);
  
  // Selected filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  // Coursework marks for each student
  const [studentCoursework, setStudentCoursework] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGradelevelClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSubjectClasses();
      fetchStudents();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm && selectedYear) {
      fetchCoursework();
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedYear]);

  const fetchGradelevelClasses = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/classes/gradelevel-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGradelevelClasses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchSubjectClasses = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/classes/subject-classes?gradelevel_class_id=${selectedClass}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjectClasses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${selectedClass}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchCoursework = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/results/coursework`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          gradelevel_class_id: selectedClass,
          subject_class_id: selectedSubject,
          term: selectedTerm,
          academic_year: selectedYear
        }
      });
      setCoursework(res.data.data || []);
      
      // Initialize student coursework marks
      const marks = {};
      res.data.data.forEach(cw => {
        marks[cw.reg_number] = cw.coursework_mark;
      });
      setStudentCoursework(marks);
    } catch (err) {
      console.error('Error fetching coursework:', err);
      setError('Failed to fetch coursework');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseworkChange = (regNumber, value) => {
    setStudentCoursework(prev => ({
      ...prev,
      [regNumber]: value
    }));
  };

  const saveAllCoursework = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const promises = [];
      
      // For each student, save their coursework mark
      Object.keys(studentCoursework).forEach(regNumber => {
        const mark = studentCoursework[regNumber];
        if (mark !== undefined && mark !== '') {
          promises.push(
            axios.post(`${BASE_URL}/results/coursework`, {
              reg_number: regNumber,
              subject_class_id: selectedSubject,
              gradelevel_class_id: selectedClass,
              academic_year: selectedYear,
              term: selectedTerm,
              coursework_mark: parseFloat(mark)
            }, {
              headers: { Authorization: `Bearer ${token}` }
            })
          );
        }
      });
      
      await Promise.all(promises);
      setSuccess('All coursework marks saved successfully!');
      fetchCoursework(); // Refresh data
    } catch (err) {
      console.error('Error saving coursework:', err);
      setError('Failed to save coursework: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const bulkAddCoursework = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const courseworkData = [];
      
      // Prepare data for all students
      students.forEach(student => {
        const mark = studentCoursework[student.RegNumber];
        if (mark !== undefined && mark !== '') {
          courseworkData.push({
            reg_number: student.RegNumber,
            subject_class_id: selectedSubject,
            gradelevel_class_id: selectedClass,
            academic_year: selectedYear,
            term: selectedTerm,
            coursework_mark: parseFloat(mark)
          });
        }
      });
      
      if (courseworkData.length === 0) {
        setError('No coursework marks to save');
        return;
      }
      
      await axios.post(`${BASE_URL}/results/coursework/bulk`, {
        coursework_data: courseworkData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`Successfully saved ${courseworkData.length} coursework marks!`);
      fetchCoursework(); // Refresh data
    } catch (err) {
      console.error('Error bulk saving coursework:', err);
      setError('Failed to save coursework: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-2">
      <div className="mb-8">
        <h1 className="text-base font-bold text-gray-900 mb-2">Coursework Entry</h1>
        <p className="text-sm text-gray-600">
          Enter mid-term coursework marks for students
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Class</option>
              {gradelevelClasses.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedClass}
            >
              <option value="">Select Subject</option>
              {subjectClasses.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Term</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Academic Year</label>
            <input
              type="text"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 2024"
            />
          </div>
        </div>
      </div>

      {/* Coursework Table */}
      {selectedClass && selectedSubject && selectedTerm && selectedYear && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-900">
              Coursework Entry - {subjectClasses.find(s => s.id == selectedSubject)?.name} 
              ({selectedTerm} {selectedYear})
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={saveAllCoursework}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2 h-3 w-3" />
                {saving ? 'Saving...' : 'Save Marks'}
              </button>
              <button
                onClick={bulkAddCoursework}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />
                {saving ? 'Saving...' : 'Bulk Save'}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coursework Mark
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-3 py-4 text-center text-xs text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-3 py-4 text-center text-xs text-gray-500">
                      No students found in this class
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const existingCoursework = coursework.find(cw => cw.reg_number === student.RegNumber);
                    return (
                      <tr key={student.RegNumber} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">
                            {student.Surname} {student.Name}
                          </div>
                          <div className="text-xs text-gray-500">{student.RegNumber}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={studentCoursework[student.RegNumber] || ''}
                            onChange={(e) => handleCourseworkChange(student.RegNumber, e.target.value)}
                            className="w-20 border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            existingCoursework 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {existingCoursework ? 'Saved' : 'Not Saved'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 text-xs text-red-600">{error}</div>
      )}
      
      {success && (
        <div className="mt-4 text-xs text-green-600">{success}</div>
      )}
    </div>
  );
};

export default CourseworkEntry;
