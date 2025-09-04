import React, { useState, useEffect } from 'react';
import BASE_URL from '../../contexts/Api';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const CurrencyManagement = () => {
  const { token } = useAuth();
  const [currencies, setCurrencies] = useState([]);
  const [currencyForm, setCurrencyForm] = useState({ code: '', name: '', symbol: '', is_active: true });
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState('');

  useEffect(() => {
    fetchCurrencies();
    // eslint-disable-next-line
  }, []);

  const fetchCurrencies = async () => {
    setCurrencyLoading(true);
    setCurrencyError('');
    try {
      const response = await axios.get(`${BASE_URL}/accounting/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCurrencies(response.data.data || []);
      } else {
        setCurrencyError('Failed to load currencies.');
      }
    } catch (err) {
      setCurrencyError('Failed to load currencies.');
    } finally {
      setCurrencyLoading(false);
    }
  };

  const handleCurrencyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrencyForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCurrencySubmit = async (e) => {
    e.preventDefault();
    setCurrencyLoading(true);
    setCurrencyError('');
    try {
      const response = await axios.post(
        `${BASE_URL}/accounting/currencies`,
        currencyForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setCurrencyForm({ code: '', name: '', symbol: '', is_active: true });
        fetchCurrencies();
      } else {
        setCurrencyError(response.data.message || 'Failed to add currency.');
      }
    } catch (err) {
      setCurrencyError(err.response?.data?.message || 'Failed to add currency.');
    } finally {
      setCurrencyLoading(false);
    }
  };

  return (
    <div className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Currencies</h2>
      </div>
      <div className="bg-white border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700">Add New Currency</h3>
        </div>
        <form className="px-4 py-4 flex flex-col md:flex-row md:items-end gap-4" onSubmit={handleCurrencySubmit}>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Code <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="code"
              value={currencyForm.code}
              onChange={handleCurrencyChange}
              className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
              style={{ borderRadius: 0 }}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={currencyForm.name}
              onChange={handleCurrencyChange}
              className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
              style={{ borderRadius: 0 }}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Symbol</label>
            <input
              type="text"
              name="symbol"
              value={currencyForm.symbol}
              onChange={handleCurrencyChange}
              className="w-full border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
              style={{ borderRadius: 0 }}
            />
          </div>
          <div className="flex items-center mb-2 md:mb-0">
            <input
              type="checkbox"
              name="is_active"
              checked={currencyForm.is_active}
              onChange={handleCurrencyChange}
              className="mr-2 border-gray-300 focus:ring-gray-900"
              style={{ borderRadius: 0 }}
              id="is_active"
            />
            <label htmlFor="is_active" className="text-xs text-gray-700">Active</label>
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            style={{ borderRadius: 0 }}
            disabled={currencyLoading}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />
            {currencyLoading ? 'Saving...' : 'Add Currency'}
          </button>
        </form>
        {currencyError && <div className="px-4 pb-2 text-xs text-red-600">{currencyError}</div>}
      </div>
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700">Currencies List</h3>
        </div>
        <div className="border-t border-gray-200">
          {currencyLoading ? (
            <div className="p-6 text-xs text-gray-500">Loading currencies...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium tracking-wider">Code</th>
                    <th className="px-3 py-2 text-left font-medium tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left font-medium tracking-wider">Symbol</th>
                    <th className="px-3 py-2 text-left font-medium tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currencies.map((cur) => (
                    <tr key={cur.id}>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{cur.code}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{cur.name}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{cur.symbol || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={cur.is_active ? 'text-gray-700' : 'text-gray-400'}>
                          {cur.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrencyManagement;
