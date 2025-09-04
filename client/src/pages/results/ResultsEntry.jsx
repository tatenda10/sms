import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

const ResultsEntry = () => {
  const { token } = useAuth();
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = location.state?.editMode || false;
  const resultData = location.state?.resultData || null;
  const editStudentId = location.state?.studentId || null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Data
  const [classInfo, setClassInfo] = useState(null);
  const [subjectClasses, setSubjectClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [gradingCriteria, setGradingCriteria] = useState([]);
  
  // Selected values
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  // Form data
  const [courseworkMark, setCourseworkMark] = useState('');
  const [paperMarks, setPaperMarks] = useState([{ name: 'Paper 1', mark: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (classId) {
      fetchClassInfo();
      fetchSubjectClasses();
      fetchStudents();
      fetchGradingCriteria();
    }
  }, [classId]);

  useEffect(() => {
    if (editMode && resultData && editStudentId) {
      // Pre-fill form with existing data
      setSelectedSubject(resultData.subject_class_id.toString());
      setSelectedStudent(editStudentId);
      setSelectedTerm(resultData.term);
      setSelectedYear(resultData.academic_year);
      
      // Load existing coursework and paper marks
      loadExistingData();
    }
  }, [editMode, resultData, editStudentId]);

  const fetchClassInfo = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassInfo(res.data.data);
    } catch (err) {
      console.error('Error fetching class info:', err);
    }
  };

  const fetchSubjectClasses = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/classes/subject-classes?gradelevel_class_id=${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjectClasses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/classes/gradelevel-classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchGradingCriteria = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/results/grading`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGradingCriteria(res.data.data || []);
    } catch (err) {
      console.error('Error fetching grading criteria:', err);
    }
  };

  const loadExistingData = async () => {
    try {
      // Load coursework
      const courseworkRes = await axios.get(`${BASE_URL}/results/coursework`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          reg_number: editStudentId,
          subject_class_id: resultData.subject_class_id,
          gradelevel_class_id: classId,
          term: resultData.term,
          academic_year: resultData.academic_year
        }
      });
      
      if (courseworkRes.data.data && courseworkRes.data.data.length > 0) {
        setCourseworkMark(courseworkRes.data.data[0].coursework_mark.toString());
      }

      // Load paper marks
      if (resultData.paper_marks && resultData.paper_marks.length > 0) {
        const formattedPaperMarks = resultData.paper_marks.map(paper => ({
          name: paper.paper_name,
          mark: paper.mark.toString()
        }));
        setPaperMarks(formattedPaperMarks);
      }
    } catch (err) {
      console.error('Error loading existing data:', err);
    }
  };

  const addPaperMark = () => {
    setPaperMarks([...paperMarks, { name: `Paper ${paperMarks.length + 1}`, mark: '' }]);
  };

  const removePaperMark = (index) => {
    if (paperMarks.length > 1) {
      const newPaperMarks = paperMarks.filter((_, i) => i !== index);
      setPaperMarks(newPaperMarks);
    }
  };

  const updatePaperMark = (index, field, value) => {
    const newPaperMarks = [...paperMarks];
    newPaperMarks[index][field] = value;
    setPaperMarks(newPaperMarks);
  };

  const calculateTotalMarks = () => {
    const validPapers = paperMarks.filter(paper => paper.mark && parseFloat(paper.mark) > 0);
    if (validPapers.length === 0) return 0;
    
    const total = validPapers.reduce((sum, paper) => sum + (parseFloat(paper.mark) || 0), 0);
    const average = total / validPapers.length;
    return Math.round(average * 100) / 100; // Round to 2 decimal places
  };

  const calculateGrade = (totalMarks) => {
    const criteria = gradingCriteria.find(c => 
      totalMarks >= c.min_mark && totalMarks <= c.max_mark
    );
    return criteria ? { grade: criteria.grade, points: criteria.points } : { grade: 'N/A', points: 0 };
  };

  const handleSaveResult = async () => {
    console.log('=== VALIDATION CHECK ===');
    console.log('selectedSubject:', selectedSubject);
    console.log('selectedStudent:', selectedStudent);
    console.log('selectedTerm:', selectedTerm);
    console.log('selectedYear:', selectedYear);
    console.log('courseworkMark:', courseworkMark);
    console.log('paperMarks:', paperMarks);
    console.log('editMode:', editMode);
    
    if (!selectedSubject || !selectedStudent || !selectedTerm || !selectedYear) {
      console.log('❌ VALIDATION FAILED - Missing required fields');
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const totalMarks = calculateTotalMarks();
      const gradeInfo = calculateGrade(totalMarks);

      console.log('=== CALCULATED VALUES ===');
      console.log('totalMarks:', totalMarks);
      console.log('gradeInfo:', gradeInfo);

      if (editMode && resultData) {
        // Update existing result
        console.log('📝 UPDATING EXISTING RESULT');
        
        // Update coursework
        if (courseworkMark) {
          const courseworkData = {
            reg_number: selectedStudent,
            subject_class_id: selectedSubject,
            gradelevel_class_id: classId,
            term: selectedTerm,
            academic_year: selectedYear,
            coursework_mark: parseFloat(courseworkMark)
          };
          console.log('📝 UPDATING COURSEWORK:', courseworkData);
          
          await axios.post(`${BASE_URL}/results/coursework`, courseworkData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Coursework updated successfully');
        }

                 // Update paper marks
         for (let i = 0; i < paperMarks.length; i++) {
           const paper = paperMarks[i];
           if (paper.mark) {
             // First create the paper if it doesn't exist
             let paperId = null;
             
             try {
               // Try to create the paper
               const paperCreateData = {
                 name: paper.name,
                 description: `${paper.name} for ${selectedSubject}`
               };
               console.log('📝 CREATING PAPER:', paperCreateData);
               
               const paperResponse = await axios.post(`${BASE_URL}/results/papers`, paperCreateData, {
                 headers: { Authorization: `Bearer ${token}` }
               });
               paperId = paperResponse.data.data.id;
               console.log('✅ Paper created successfully with ID:', paperId);
             } catch (paperErr) {
               console.log('⚠️ Paper creation failed, trying to get existing paper');
               // Try to get existing paper
               try {
                 const existingPapersRes = await axios.get(`${BASE_URL}/results/papers`, {
                   headers: { Authorization: `Bearer ${token}` }
                 });
                 const existingPaper = existingPapersRes.data.data.find(p => p.name === paper.name);
                 if (existingPaper) {
                   paperId = existingPaper.id;
                   console.log('✅ Found existing paper, ID:', paperId);
                 } else {
                   console.error('❌ Could not find or create paper');
                   continue;
                 }
               } catch (getErr) {
                 console.error('❌ Could not get existing papers');
                 continue;
               }
             }
             
             if (paperId) {
               const paperData = {
                 result_id: resultData.id,
                 paper_id: paperId,
                 mark: parseFloat(paper.mark)
               };
               console.log('📝 UPDATING PAPER MARK:', paperData);
               
               await axios.post(`${BASE_URL}/results/results/paper-mark`, paperData, {
                 headers: { Authorization: `Bearer ${token}` }
               });
               console.log('✅ Paper mark updated successfully');
             }
           } else {
             console.log('⚠️ Skipping empty paper mark:', paper);
           }
         }

        setSuccess('Result updated successfully!');
      } else {
        // Create new result
        console.log('📝 CREATING NEW RESULT');
        
        // Save coursework mark
        if (courseworkMark) {
          const courseworkData = {
            reg_number: selectedStudent,
            subject_class_id: selectedSubject,
            gradelevel_class_id: classId,
            term: selectedTerm,
            academic_year: selectedYear,
            coursework_mark: parseFloat(courseworkMark)
          };
          console.log('📝 SAVING COURSEWORK:', courseworkData);
          
          await axios.post(`${BASE_URL}/results/coursework`, courseworkData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Coursework saved successfully');
        } else {
          console.log('⚠️ No coursework mark to save');
        }

        // Save main result first
        const resultData = {
          reg_number: selectedStudent,
          subject_class_id: selectedSubject,
          gradelevel_class_id: classId,
          term: selectedTerm,
          academic_year: selectedYear
        };
        console.log('📝 SAVING MAIN RESULT:', resultData);
        
        const resultResponse = await axios.post(`${BASE_URL}/results/results`, resultData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Main result saved successfully');
        
        const resultId = resultResponse.data.data.id;
        
                 // Save paper marks
         for (let i = 0; i < paperMarks.length; i++) {
           const paper = paperMarks[i];
           if (paper.mark) {
             // First create the paper if it doesn't exist
             let paperId = null;
             
             try {
               // Try to create the paper
               const paperCreateData = {
                 name: paper.name,
                 description: `${paper.name} for ${selectedSubject}`
               };
               console.log('📝 CREATING PAPER:', paperCreateData);
               
               const paperResponse = await axios.post(`${BASE_URL}/results/papers`, paperCreateData, {
                 headers: { Authorization: `Bearer ${token}` }
               });
               paperId = paperResponse.data.data.id;
               console.log('✅ Paper created successfully with ID:', paperId);
             } catch (paperErr) {
               console.log('⚠️ Paper creation failed, trying to get existing paper');
               // Try to get existing paper
               try {
                 const existingPapersRes = await axios.get(`${BASE_URL}/results/papers`, {
                   headers: { Authorization: `Bearer ${token}` }
                 });
                 const existingPaper = existingPapersRes.data.data.find(p => p.name === paper.name);
                 if (existingPaper) {
                   paperId = existingPaper.id;
                   console.log('✅ Found existing paper, ID:', paperId);
                 } else {
                   console.error('❌ Could not find or create paper');
                   continue;
                 }
               } catch (getErr) {
                 console.error('❌ Could not get existing papers');
                 continue;
               }
             }
             
             if (paperId) {
               const paperData = {
                 result_id: resultId,
                 paper_id: paperId,
                 mark: parseFloat(paper.mark)
               };
               console.log('📝 SAVING PAPER MARK:', paperData);
               
               await axios.post(`${BASE_URL}/results/results/paper-mark`, paperData, {
                 headers: { Authorization: `Bearer ${token}` }
               });
               console.log('✅ Paper mark saved successfully');
             }
           } else {
             console.log('⚠️ Skipping empty paper mark:', paper);
           }
         }

        setSuccess('Result saved successfully!');
        setCourseworkMark('');
        setPaperMarks([{ name: 'Paper 1', mark: '' }]);
        setSelectedStudent('');
      }

      setTimeout(() => {
        navigate(`/dashboard/results/student/${classId}/${selectedStudent}`);
      }, 1500);

    } catch (err) {
      console.error('❌ ERROR SAVING RESULT:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.message);
      setError('Failed to save result: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const totalMarks = calculateTotalMarks();
  const gradeInfo = calculateGrade(totalMarks);

  return (
    <div className="p-2">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-base font-bold text-gray-900 mb-2">
          {editMode ? 'Edit Result' : 'Enter Results'}
        </h1>
        {classInfo && (
          <p className="text-sm text-gray-600">
            Class: {classInfo.name} - {classInfo.stream_stage} - {classInfo.stream_name}
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Subject *</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Subject</option>
                {subjectClasses.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Student *</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.RegNumber} value={student.RegNumber}>
                    {student.Surname} {student.Name} ({student.RegNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Term *</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Term</option>
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Academic Year *</label>
                <input
                  type="text"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Right Column - Marks Entry */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Coursework Mark</label>
              <input
                type="number"
                value={courseworkMark}
                onChange={(e) => setCourseworkMark(e.target.value)}
                className="w-full border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="100"
                step="0.1"
                placeholder="0"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs text-gray-600">Paper Marks</label>
                <button
                  type="button"
                  onClick={addPaperMark}
                  className="text-blue-600 hover:text-blue-900 text-xs flex items-center"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-3 w-3 mr-1" />
                  Add Paper
                </button>
              </div>
              <div className="space-y-2">
                {paperMarks.map((paper, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={paper.name}
                      onChange={(e) => updatePaperMark(index, 'name', e.target.value)}
                      className="flex-1 border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Paper name"
                    />
                    <input
                      type="number"
                      value={paper.mark}
                      onChange={(e) => updatePaperMark(index, 'mark', e.target.value)}
                      className="w-20 border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                    />
                    {paperMarks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePaperMark(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Summary</h3>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div>
              <span className="font-semibold">Coursework:</span> {courseworkMark || 'N/A'}
            </div>
                         <div>
               <span className="font-semibold">Paper Average:</span> {totalMarks}
             </div>
            <div>
              <span className="font-semibold">Grade:</span> {gradeInfo.grade}
            </div>
            <div>
              <span className="font-semibold">Points:</span> {gradeInfo.points}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveResult}
            disabled={saving || !selectedSubject || !selectedStudent || !selectedTerm || !selectedYear}
            className="px-4 py-2 bg-gray-900 text-white text-xs hover:bg-gray-800 disabled:opacity-50 flex items-center"
          >
            <FontAwesomeIcon icon={faSave} className="mr-2 h-3 w-3" />
            {saving ? 'Saving...' : (editMode ? 'Update Result' : 'Save Result')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 text-xs text-red-600">{error}</div>
      )}
      
      {success && (
        <div className="mt-4 text-xs text-green-600">{success}</div>
      )}
    </div>
  );
};

export default ResultsEntry;
