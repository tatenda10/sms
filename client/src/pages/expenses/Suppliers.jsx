import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';

const Suppliers = () => {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [form, setForm] = useState({ id: null, name: '', contact_person: '', phone: '', email: '', address: '', is_active: true });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${BASE_URL}/expenses/suppliers`, { headers: { Authorization: `Bearer ${token}` } });
      setSuppliers(res.data.data || []);
    } catch (err) {
      setError('Failed to load suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const openAddModal = () => {
    setForm({ id: null, name: '', contact_person: '', phone: '', email: '', address: '', is_active: true });
    setModalMode('add');
    setShowModal(true);
    setFormError('');
  };

  const openEditModal = (supplier) => {
    setForm({ ...supplier });
    setModalMode('edit');
    setShowModal(true);
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      if (!form.name) {
        setFormError('Name is required.');
        setFormLoading(false);
        return;
      }
      if (modalMode === 'add') {
        await axios.post(`${BASE_URL}/expenses/suppliers`, form, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.put(`${BASE_URL}/expenses/suppliers/${form.id}`, form, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      setFormError('Failed to save supplier.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await axios.delete(`${BASE_URL}/expenses/suppliers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchSuppliers();
    } catch (err) {
      alert('Failed to delete supplier.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold text-gray-800">Suppliers</h1>
        <button className="px-3 py-1 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800" style={{ borderRadius: 0 }} onClick={openAddModal}>+ Add Supplier</button>
      </div>
      <div className="border-t border-gray-200">
        {loading ? (
          <div className="text-xs text-gray-500 p-4">Loading suppliers...</div>
        ) : error ? (
          <div className="text-xs text-red-600 p-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Contact Person</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Phone</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Email</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Address</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left font-medium tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 whitespace-nowrap">{s.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{s.contact_person}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{s.phone}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{s.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{s.address}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{s.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button className="text-gray-700 hover:text-gray-900 text-xs mr-2" style={{ borderRadius: 0 }} onClick={() => openEditModal(s)}>Edit</button>
                      <button className="text-red-600 hover:text-red-800 text-xs" style={{ borderRadius: 0 }} onClick={() => handleDelete(s.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal for Add/Edit Supplier */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white border border-gray-200 p-6 w-full max-w-md" style={{ borderRadius: 0 }}>
            <h2 className="text-base font-semibold text-gray-800 mb-4">{modalMode === 'add' ? 'Add Supplier' : 'Edit Supplier'}</h2>
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Name</label>
                <input type="text" name="name" value={form.name} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} required />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Contact Person</label>
                <input type="text" name="contact_person" value={form.contact_person} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Phone</label>
                <input type="text" name="phone" value={form.phone} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Address</label>
                <input type="text" name="address" value={form.address} onChange={handleFormChange} className="w-full border border-gray-300 px-2 py-1 text-xs" style={{ borderRadius: 0 }} />
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleFormChange} className="mr-2" />
                <label className="text-xs text-gray-600">Active</label>
              </div>
              {formError && <div className="text-xs text-red-600">{formError}</div>}
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" className="px-3 py-1 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300" style={{ borderRadius: 0 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="px-3 py-1 text-xs text-white bg-gray-900 hover:bg-gray-800" style={{ borderRadius: 0 }} disabled={formLoading}>{formLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
