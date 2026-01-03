import { useState, useEffect, useRef } from 'react';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';
import BASE_URL from '../contexts/Api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faPlus,
    faEye,
    faEdit,
    faTrash,
    faTimes,
    faSpinner,
    faSave
} from '@fortawesome/free-solid-svg-icons';

const TestMarks = () => {
    const { employee, token } = useEmployeeAuth();
    const [subjectClasses, setSubjectClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearchTerm, setActiveSearchTerm] = useState('');

    // Filters
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedTerm, setSelectedTerm] = useState('1');
    const [selectedType, setSelectedType] = useState('');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddMarksModal, setShowAddMarksModal] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);

    // Create Test Form
    const [newTest, setNewTest] = useState({
        title: '',
        test_type: 'Test',
        max_mark: 100,
        academic_year: new Date().getFullYear().toString(),
        term: '1'
    });
    const [creating, setCreating] = useState(false);

    // Marks Entry Form
    const [studentMarks, setStudentMarks] = useState([]);
    const [marksLoading, setMarksLoading] = useState(false);
    const [savingMarks, setSavingMarks] = useState(false);

    useEffect(() => {
        if (employee?.id) {
            fetchSubjectClasses();
        }
    }, [employee]);

    useEffect(() => {
        if (selectedClass) {
            fetchTests();
        } else {
            setTests([]);
        }
    }, [selectedClass, selectedYear, selectedTerm, selectedType, activeSearchTerm]);

    const fetchSubjectClasses = async () => {
        try {
            const response = await fetch(`${BASE_URL}/employee-classes/${employee.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setSubjectClasses(data.data.filter(cls => cls.class_type === 'Subject Class'));
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
        }
    };

    const fetchTests = async () => {
        if (!selectedClass) return;
        setLoading(true);
        setError(null);
        try {
            let url = `${BASE_URL}/student-enrollments/subject-classes/${selectedClass}/tests?academic_year=${selectedYear}&term=${selectedTerm}`;
            if (selectedType) url += `&test_type=${selectedType}`;
            if (activeSearchTerm) url += `&search=${activeSearchTerm}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setTests(data.data || []);
            } else {
                setError(data.message || 'Failed to fetch tests');
            }
        } catch (err) {
            console.error('Error fetching tests:', err);
            setError('Failed to load tests');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setActiveSearchTerm(searchTerm);
    };

    const handleCreateTest = async () => {
        if (!selectedClass || !newTest.title) return;
        setCreating(true);
        try {
            const response = await fetch(`${BASE_URL}/student-enrollments/subject-classes/${selectedClass}/tests`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTest)
            });
            const data = await response.json();
            if (data.success) {
                setShowCreateModal(false);
                setNewTest({
                    title: '',
                    test_type: 'Test',
                    max_mark: 100,
                    academic_year: new Date().getFullYear().toString(),
                    term: '1'
                });
                fetchTests();
            }
        } catch (err) {
            console.error('Error creating test:', err);
        } finally {
            setCreating(false);
        }
    };

    const handleOpenAddMarks = async (test) => {
        setSelectedTest(test);
        setShowAddMarksModal(true);
        setMarksLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/student-enrollments/class/${selectedClass}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const studentsData = await response.json();

            const marksResponse = await fetch(`${BASE_URL}/student-enrollments/tests/${test.id}/marks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const existingMarksData = await marksResponse.json();

            const students = studentsData.data || [];
            const existingMarks = existingMarksData.data || [];

            const marksList = students.map(student => {
                const markRecord = existingMarks.find(m => m.student_regnumber === student.RegNumber);
                return {
                    regNumber: student.RegNumber,
                    name: `${student.Name} ${student.Surname}`,
                    mark: markRecord ? markRecord.mark : '',
                    isExisting: !!markRecord,
                    id: markRecord ? markRecord.id : null
                };
            });

            setStudentMarks(marksList);
        } catch (err) {
            console.error('Error loading marks:', err);
        } finally {
            setMarksLoading(false);
        }
    };

    const handleSaveMarks = async () => {
        setSavingMarks(true);
        try {
            for (const record of studentMarks) {
                if (record.mark === '') continue;
                const payload = {
                    student_regnumber: record.regNumber,
                    test_id: selectedTest.id,
                    mark: parseFloat(record.mark)
                };
                const method = record.isExisting ? 'PUT' : 'POST';
                const url = record.isExisting
                    ? `${BASE_URL}/student-enrollments/marks/${record.id}`
                    : `${BASE_URL}/student-enrollments/marks`;

                await fetch(url, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            }
            setShowAddMarksModal(false);
            fetchTests();
        } catch (err) {
            console.error('Error saving marks:', err);
        } finally {
            setSavingMarks(false);
        }
    };

    const handleDeleteTest = async (testId) => {
        if (!window.confirm('Are you sure you want to delete this test? All marks will be lost.')) return;
        try {
            await fetch(`${BASE_URL}/student-enrollments/tests/${testId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchTests();
        } catch (err) {
            console.error('Error deleting test:', err);
        }
    };

    return (
        <div className="reports-container" style={{
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
        }}>
            {/* Report Header */}
            <div className="report-header" style={{ flexShrink: 0 }}>
                <div className="report-header-content">
                    <h2 className="report-title">Test Marks</h2>
                    <p className="report-subtitle">Manage student test scores and performance tracking.</p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="report-filters" style={{ flexShrink: 0 }}>
                <div className="report-filters-left" style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <form onSubmit={handleSearch} className="filter-group">
                        <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <FontAwesomeIcon icon={faSearch} className="search-icon" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search tests..."
                                className="filter-input search-input"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setActiveSearchTerm('');
                                    }}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        padding: '4px 6px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '20px',
                                        height: '20px'
                                    }}
                                    title="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="filter-group">
                        <label className="filter-label">Class:</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="filter-input"
                            style={{ minWidth: '180px' }}
                        >
                            <option value="">Select Class</option>
                            {subjectClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.subject_name} ({cls.stream_name})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Term:</label>
                        <select
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="filter-input"
                            style={{ minWidth: '100px' }}
                        >
                            <option value="1">Term 1</option>
                            <option value="2">Term 2</option>
                            <option value="3">Term 3</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Year:</label>
                        <input
                            type="text"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="filter-input text-center"
                            style={{ width: '70px' }}
                        />
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="report-content-container ecl-table-container" style={{ flex: 1, overflowY: 'auto' }}>
                <table className="ecl-table">
                    <thead>
                        <tr>
                            <th>TEST TITLE</th>
                            <th>TYPE</th>
                            <th>MAX MARK</th>
                            <th>DATE</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!selectedClass ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                    Please select a subject class to view tests.
                                </td>
                            </tr>
                        ) : loading ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                    <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '10px' }} />
                                    Loading tests...
                                </td>
                            </tr>
                        ) : tests.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                    No tests found for the selected criteria.
                                </td>
                            </tr>
                        ) : (
                            tests.map((test) => (
                                <tr key={test.id}>
                                    <td style={{ fontWeight: '600' }}>{test.title}</td>
                                    <td>{test.test_type}</td>
                                    <td>{test.max_mark}</td>
                                    <td>{new Date(test.created_at).toLocaleDateString()}</td>
                                    <td className="actions-cell">
                                        <button
                                            onClick={() => handleOpenAddMarks(test)}
                                            className="view-btn"
                                            title="Manage Marks"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTest(test.id)}
                                            className="delete-btn"
                                            title="Delete Test"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Section */}
            <div className="ecl-table-footer" style={{ borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: 'white' }}>
                <div className="footer-info" style={{ fontSize: '0.75rem', color: '#666' }}>
                    Showing {tests.length} results.
                </div>
                <div className="pagination-controls" style={{ display: 'flex', gap: '5px' }}>
                    <button className="pagination-btn disabled" disabled>Previous</button>
                    <button className="pagination-btn disabled" disabled>Next</button>
                </div>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md shadow-xl">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h2 className="text-sm font-bold text-gray-900">Create New Test</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Test Title</label>
                                <input
                                    type="text"
                                    value={newTest.title}
                                    onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                                    className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Test Type</label>
                                    <select
                                        value={newTest.test_type}
                                        onChange={(e) => setNewTest({ ...newTest, test_type: e.target.value })}
                                        className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                                    >
                                        <option value="Test">Test</option>
                                        <option value="Exam">Exam</option>
                                        <option value="Quiz">Quiz</option>
                                        <option value="Assignment">Assignment</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Max Marks</label>
                                    <input
                                        type="number"
                                        value={newTest.max_mark}
                                        onChange={(e) => setNewTest({ ...newTest, max_mark: parseInt(e.target.value) })}
                                        className="w-full border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-1.5 border border-gray-300 text-xs text-gray-700 hover:bg-gray-100">Cancel</button>
                            <button onClick={handleCreateTest} disabled={creating || !newTest.title} className="px-4 py-1.5 bg-gray-900 text-white text-xs hover:bg-gray-800 disabled:opacity-50">{creating ? 'Creating...' : 'Create Test'}</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddMarksModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">Manage Marks: {selectedTest?.title}</h2>
                                <p className="text-[10px] text-gray-500">Max Marks: {selectedTest?.max_mark}</p>
                            </div>
                            <button onClick={() => setShowAddMarksModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="p-0 overflow-y-auto flex-1">
                            {marksLoading ? (
                                <div className="p-10 text-center text-xs text-gray-500">
                                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                    Loading students...
                                </div>
                            ) : (
                                <table className="ecl-table sticky-header">
                                    <thead>
                                        <tr>
                                            <th>REG NUMBER</th>
                                            <th>STUDENT NAME</th>
                                            <th style={{ textAlign: 'right' }}>MARK</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentMarks.map((record, index) => (
                                            <tr key={record.regNumber}>
                                                <td style={{ fontFamily: 'monospace' }}>{record.regNumber}</td>
                                                <td>{record.name}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <input
                                                        type="number"
                                                        value={record.mark}
                                                        max={selectedTest?.max_mark}
                                                        onChange={(e) => {
                                                            const newList = [...studentMarks];
                                                            newList[index].mark = e.target.value;
                                                            setStudentMarks(newList);
                                                        }}
                                                        className="w-20 border border-gray-300 px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                        placeholder="0"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setShowAddMarksModal(false)} className="px-4 py-1.5 border border-gray-300 text-xs text-gray-700 hover:bg-gray-100">Cancel</button>
                            <button onClick={handleSaveMarks} disabled={savingMarks} className="px-4 py-1.5 bg-gray-900 text-white text-xs hover:bg-gray-800 disabled:opacity-50 flex items-center">
                                <FontAwesomeIcon icon={faSave} className="mr-2 h-3 w-3" />
                                {savingMarks ? 'Saving...' : 'Save All Marks'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Styles to ensure absolute parity */}
            <style>{`
        .reports-container {
          background: #e5e7eb;
        }
        .report-header {
          background: white;
          padding: 15px 30px 5px 30px;
          border-bottom: none;
          margin-bottom: 0;
        }
        .report-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .report-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 2px;
        }
        .report-filters {
          background: white;
          padding: 8px 30px;
          border-bottom: 1px solid #e5e7eb;
          margin-top: 0;
          margin-bottom: 10px;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 20px;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #374151;
          white-space: nowrap;
        }
        .filter-input {
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 0.75rem;
          color: #1f2937;
          background: white;
          outline: none;
        }
        .filter-input:focus {
          border-color: #2563eb;
          ring: 1px;
          ring-color: #2563eb;
        }
        .search-input-wrapper {
          width: 300px;
        }
        .search-input {
          width: 100%;
          padding-left: 32px;
        }
        .search-icon {
          position: absolute;
          left: 10px;
          color: #9ca3af;
          font-size: 0.875rem;
        }
        .ecl-table-container {
          background: white;
          padding: 0;
          margin: 0;
          border: 1px solid #e5e7eb;
        }
        .ecl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.75rem;
        }
        .ecl-table thead th {
          background-color: #1e3a5f;
          color: white;
          text-align: left;
          padding: 10px 15px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        .ecl-table thead th:last-child {
          border-right: none;
        }
        .ecl-table tbody tr {
          border-bottom: 1px solid #e5e7eb;
        }
        .ecl-table tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .ecl-table tbody tr:hover {
          background-color: #f3f4f6;
        }
        .ecl-table td {
          padding: 10px 15px;
          color: #374151;
        }
        .actions-cell {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .view-btn, .delete-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          padding: 4px;
          transition: transform 0.1s;
        }
        .view-btn { color: #2563eb; }
        .edit-btn { color: #059669; }
        .delete-btn { color: #dc2626; }
        .view-btn:hover, .delete-btn:hover {
          transform: scale(1.1);
        }
        .pagination-btn {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          background: white;
          font-size: 0.75rem;
          color: #374151;
          cursor: pointer;
          border-radius: 4px;
        }
        .pagination-btn:hover:not(.disabled) {
          background: #f3f4f6;
        }
        .pagination-btn.disabled {
          color: #9ca3af;
          cursor: not-allowed;
          background: #f9fafb;
        }
      `}</style>
        </div>
    );
};

export default TestMarks;
