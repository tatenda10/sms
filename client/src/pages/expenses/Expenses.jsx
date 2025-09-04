import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const Expenses = () => {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewExpense, setViewExpense] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  // Pagination, search, filters
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      const params = [];
      params.push(`page=${page}`);
      params.push(`pageSize=${pageSize}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      const query = params.length ? `?${params.join('&')}` : '';
      const res = await axios.get(`${BASE_URL}/expenses/expenses${query}`, { headers: { Authorization: `Bearer ${token}` } });
      setExpenses(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, [page, search, startDate, endDate]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    setDeleteLoadingId(id);
    try {
      await axios.delete(`${BASE_URL}/expenses/expenses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchExpenses();
    } catch (err) {
      alert('Failed to delete expense.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleView = async (id) => {
    setShowViewModal(true);
    setViewLoading(true);
    setViewExpense(null);
    try {
      const res = await axios.get(`${BASE_URL}/expenses/expenses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setViewExpense(res.data.data);
    } catch {
      setViewExpense(null);
    } finally {
      setViewLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold text-gray-800">Expenses</h1>
        <button className="px-3 py-1 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800" style={{ borderRadius: 0 }} onClick={() => navigate('/dashboard/expenses/expenses/add')}>+ Add Expense</button>
      </div>
      {/* Search and Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => { setPage(1); setSearch(e.target.value); }}
          className="border border-gray-300 px-2 py-1 text-xs"
          style={{ borderRadius: 0 }}
        />
        <input
          type="date"
          value={startDate}
          onChange={e => { setPage(1); setStartDate(e.target.value); }}
          className="border border-gray-300 px-2 py-1 text-xs"
          style={{ borderRadius: 0 }}
        />
        <input
          type="date"
          value={endDate}
          onChange={e => { setPage(1); setEndDate(e.target.value); }}
          className="border border-gray-300 px-2 py-1 text-xs"
          style={{ borderRadius: 0 }}
        />
        <span className="text-xs text-gray-500 ml-2">Total: {total}</span>
      </div>
      <div className="border-t border-gray-200">
        {loading ? (
          <div className="text-xs text-gray-500 p-4">Loading expenses...</div>
        ) : error ? (
          <div className="text-xs text-red-600 p-4">{error}</div>
        ) : (
          <div className="overflow-x-auto border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Date</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Supplier</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Description</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Amount</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Currency</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Payment Method</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Payment Status</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="px-3 py-2 whitespace-nowrap">{e.expense_date}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.supplier_name || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.description}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{parseFloat(e.amount).toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.currency_code}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.payment_method}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{e.payment_status}</td>
                    <td className="px-3 py-2 whitespace-nowrap flex gap-2">
                      <button title="View" className="text-gray-700 hover:text-gray-900 text-xs" style={{ borderRadius: 0 }} onClick={() => handleView(e.id)}>
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button title="Edit" className="text-blue-700 hover:text-blue-900 text-xs" style={{ borderRadius: 0 }} onClick={() => navigate(`/dashboard/expenses/expenses/edit/${e.id}`)}>
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button title="Delete" className="text-red-600 hover:text-red-800 text-xs" style={{ borderRadius: 0 }} onClick={() => handleDelete(e.id)} disabled={deleteLoadingId === e.id}>
                        {deleteLoadingId === e.id ? '...' : <FontAwesomeIcon icon={faTrash} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-4 gap-2">
        <button
          className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300"
          style={{ borderRadius: 0 }}
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >Prev</button>
        <span className="text-xs">{page} / {totalPages || 1}</span>
        <button
          className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300"
          style={{ borderRadius: 0 }}
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage(page + 1)}
        >Next</button>
      </div>
      {/* View Modal */}
      {showViewModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white border border-gray-200 p-6 w-full max-w-md" style={{ borderRadius: 0 }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-gray-800">Expense Receipt</h2>
              <button className="text-gray-500 hover:text-gray-800 text-lg" onClick={() => setShowViewModal(false)}>&times;</button>
            </div>
            {viewLoading ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : viewExpense ? (
              <div className="text-xs">
                <div className="mb-2 flex justify-between">
                  <span className="font-semibold">Date:</span>
                  <span>{viewExpense.expense_date}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="font-semibold">Supplier:</span>
                  <span>{viewExpense.supplier_name || '-'}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="font-semibold">Description:</span>
                  <span>{viewExpense.description}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="font-semibold">Amount:</span>
                  <span>{parseFloat(viewExpense.amount).toFixed(2)}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="font-semibold">Currency:</span>
                  <span>{viewExpense.currency_code}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="font-semibold">Payment Method:</span>
                  <span>{viewExpense.payment_method}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="font-semibold">Payment Status:</span>
                  <span>{viewExpense.payment_status}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="font-semibold">Journal:</span>
                  <span>{viewExpense.journal_description || '-'}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="font-semibold">Recorded At:</span>
                  <span>{viewExpense.created_at}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-red-600">Failed to load expense details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
