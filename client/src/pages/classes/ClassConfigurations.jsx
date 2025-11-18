import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBook, faEdit, faTrash, faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../contexts/Api';
import axios from 'axios';

const ClassConfigurations = () => {
  const { token } = useAuth();
  // Stream add form state
  const [streamForm, setStreamForm] = useState({ name: '', stage: '' });
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [streamSuccess, setStreamSuccess] = useState('');
  const [streams, setStreams] = useState([]);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [streamsError, setStreamsError] = useState('');
  const [editingStreamId, setEditingStreamId] = useState(null);
  const [editStreamForm, setEditStreamForm] = useState({ name: '', stage: '' });
  const [updateStreamLoading, setUpdateStreamLoading] = useState(false);
  const [deleteStreamLoading, setDeleteStreamLoading] = useState(null);

  // Subject add form state
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '', syllabus: '' });
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectError, setSubjectError] = useState('');
  const [subjectSuccess, setSubjectSuccess] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');

  // Fetch streams on mount and after adding
  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    setStreamsLoading(true);
    setStreamsError('');
    try {
      const response = await axios.get(`${BASE_URL}/classes/streams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStreams(response.data.data || []);
      } else {
        setStreamsError('Failed to load streams.');
      }
    } catch (err) {
      setStreamsError('Failed to load streams.');
    } finally {
      setStreamsLoading(false);
    }
  };

  const handleStreamInputChange = (e) => {
    const { name, value } = e.target;
    setStreamForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStream = async (e) => {
    e.preventDefault();
    setStreamError('');
    setStreamSuccess('');
    if (!streamForm.name.trim() || !streamForm.stage.trim()) {
      setStreamError('Both name and stage are required.');
      return;
    }
    try {
      setStreamLoading(true);
      const response = await axios.post(`${BASE_URL}/classes/streams`, streamForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStreamSuccess('Stream added successfully!');
        setStreamForm({ name: '', stage: '' });
        fetchStreams();
      } else {
        setStreamError(response.data.message || 'Failed to add stream.');
      }
    } catch (err) {
      setStreamError(err.response?.data?.message || 'Failed to add stream.');
    } finally {
      setStreamLoading(false);
    }
  };

  const handleEditStream = (stream) => {
    setEditingStreamId(stream.id);
    setEditStreamForm({ name: stream.name, stage: stream.stage });
  };

  const handleCancelEdit = () => {
    setEditingStreamId(null);
    setEditStreamForm({ name: '', stage: '' });
  };

  const handleUpdateStream = async (streamId) => {
    if (!editStreamForm.name.trim() || !editStreamForm.stage.trim()) {
      setStreamsError('Both name and stage are required.');
      return;
    }
    try {
      setUpdateStreamLoading(true);
      setStreamsError('');
      const response = await axios.put(`${BASE_URL}/classes/streams/${streamId}`, editStreamForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setEditingStreamId(null);
        setEditStreamForm({ name: '', stage: '' });
        fetchStreams();
      } else {
        setStreamsError(response.data.message || 'Failed to update stream.');
      }
    } catch (err) {
      setStreamsError(err.response?.data?.message || 'Failed to update stream.');
    } finally {
      setUpdateStreamLoading(false);
    }
  };

  const handleDeleteStream = async (streamId) => {
    if (!window.confirm('Are you sure you want to delete this stream? This action cannot be undone.')) {
      return;
    }
    try {
      setDeleteStreamLoading(streamId);
      setStreamsError('');
      const response = await axios.delete(`${BASE_URL}/classes/streams/${streamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        fetchStreams();
      } else {
        setStreamsError(response.data.message || 'Failed to delete stream.');
      }
    } catch (err) {
      setStreamsError(err.response?.data?.message || 'Failed to delete stream.');
    } finally {
      setDeleteStreamLoading(null);
    }
  };

  // Fetch subjects on mount and after adding
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setSubjectsLoading(true);
    setSubjectsError('');
    try {
      const response = await axios.get(`${BASE_URL}/classes/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSubjects(response.data.data || []);
      } else {
        setSubjectsError('Failed to load subjects.');
      }
    } catch (err) {
      setSubjectsError('Failed to load subjects.');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleSubjectInputChange = (e) => {
    const { name, value } = e.target;
    setSubjectForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setSubjectError('');
    setSubjectSuccess('');
    if (!subjectForm.code.trim() || !subjectForm.name.trim()) {
      setSubjectError('Both code and name are required.');
      return;
    }
    try {
      setSubjectLoading(true);
      const response = await axios.post(`${BASE_URL}/classes/subjects`, subjectForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSubjectSuccess('Subject added successfully!');
        setSubjectForm({ code: '', name: '', syllabus: '' });
        fetchSubjects();
      } else {
        setSubjectError(response.data.message || 'Failed to add subject.');
      }
    } catch (err) {
      console.log('Error adding subject:', err); // <-- log error for debugging
      setSubjectError(err.response?.data?.message || 'Failed to add subject.');
    } finally {
      setSubjectLoading(false);
    }
  };

  // Add this function for auto-generating subject code
  const generateSubjectCode = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setSubjectForm((prev) => ({ ...prev, code: `SUBJ${random}` }));
  };

  return (
    <div className="space-y-6">
      {/* Add Stream Section (no border/shadow) */}
      <div className="p-6 mb-6">
        <h2 className=" font-semibold text-gray-900 mb-2 flex items-center">
          <FontAwesomeIcon icon={faUsers} className="mr-2 h-5 w-5 text-gray-400" />
          Add New Stream
        </h2>
        <form onSubmit={handleAddStream} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600">Stream Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={streamForm.name}
              onChange={handleStreamInputChange}
              className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Grade 1, Form 2, ECD A"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Stage <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="stage"
              value={streamForm.stage}
              onChange={handleStreamInputChange}
              className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Primary, Secondary, ECD"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={streamLoading}
              className={`px-6 py-2 text-xs font-medium text-white ${streamLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-800'} w-full`}
            >
              {streamLoading ? 'Adding...' : 'Add Stream'}
            </button>
          </div>
        </form>
        {(streamError || streamSuccess) && (
          <div className={`mt-3 text-xs ${streamError ? 'text-red-600' : 'text-green-600'}`}>{streamError || streamSuccess}</div>
        )}
      </div>
      {/* Add Subject Section */}
      <div className="p-6 mb-6">
        <h2 className=" font-semibold text-gray-900 mb-2 flex items-center">
          <FontAwesomeIcon icon={faBook} className="mr-2 h-5 w-5 text-gray-400" />
          Add New Subject
        </h2>
        <form onSubmit={handleAddSubject} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600">Subject Code <span className="text-red-500">*</span></label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                name="code"
                value={subjectForm.code}
                onChange={handleSubjectInputChange}
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., ENG101"
                required
              />
              <button
                type="button"
                onClick={generateSubjectCode}
                className="mt-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300 rounded"
              >
                Auto
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Subject Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={subjectForm.name}
              onChange={handleSubjectInputChange}
              className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., English Language"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Syllabus</label>
            <input
              type="text"
              name="syllabus"
              value={subjectForm.syllabus}
              onChange={handleSubjectInputChange}
              className="mt-1 block w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., ZIMSEC, Cambridge"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={subjectLoading}
              className={`px-6 py-2 text-xs font-medium text-white ${subjectLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-800'} w-full`}
            >
              {subjectLoading ? 'Adding...' : 'Add Subject'}
            </button>
          </div>
        </form>
        {(subjectError || subjectSuccess) && (
          <div className={`mt-3 text-xs ${subjectError ? 'text-red-600' : 'text-green-600'}`}>{subjectError || subjectSuccess}</div>
        )}
      </div>
      {/* List of Streams */}
      <div className="p-6">
        <h3 className=" font-semibold text-gray-900 mb-2">Existing Streams</h3>
        {streamsError && (
          <div className="mb-3 text-xs text-red-600 bg-red-50 p-2 rounded">{streamsError}</div>
        )}
        {streamsLoading ? (
          <div className="text-xs text-gray-500">Loading streams...</div>
        ) : streams.length === 0 ? (
          <div className="text-xs text-gray-500">No streams found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Stream Name</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Stage</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {streams.map((stream) => (
                  <tr key={stream.id}>
                    {editingStreamId === stream.id ? (
                      <>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="text"
                            value={editStreamForm.name}
                            onChange={(e) => setEditStreamForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Stream Name"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="text"
                            value={editStreamForm.stage}
                            onChange={(e) => setEditStreamForm(prev => ({ ...prev, stage: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Stage"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateStream(stream.id)}
                              disabled={updateStreamLoading}
                              className="px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center"
                              title="Save"
                            >
                              <FontAwesomeIcon icon={faSave} className="h-3 w-3" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={updateStreamLoading}
                              className="px-2 py-1 text-xs bg-gray-500 text-white hover:bg-gray-600 disabled:opacity-50 flex items-center"
                              title="Cancel"
                            >
                              <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 whitespace-nowrap">{stream.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{stream.stage}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditStream(stream)}
                              className="px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 flex items-center"
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={faEdit} className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteStream(stream.id)}
                              disabled={deleteStreamLoading === stream.id}
                              className="px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center"
                              title="Delete"
                            >
                              <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* List of Subjects */}
      <div className="p-6">
        <h3 className=" font-semibold text-gray-900 mb-2">Existing Subjects</h3>
        {subjectsLoading ? (
          <div className="text-xs text-gray-500">Loading subjects...</div>
        ) : subjectsError ? (
          <div className="text-xs text-red-600">{subjectsError}</div>
        ) : subjects.length === 0 ? (
          <div className="text-xs text-gray-500">No subjects found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Subject Name</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Code</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Syllabus</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-3 py-2 whitespace-nowrap">{subject.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{subject.code}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{subject.syllabus || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassConfigurations;
