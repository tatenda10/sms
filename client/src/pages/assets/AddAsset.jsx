import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddAsset = () => {
  const navigate = useNavigate();
  const [assetTypes, setAssetTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    asset_type_id: '',
    asset_name: '',
    description: '',
    purchase_date: '',
    total_cost: '',
    supplier_name: '',
    registration_number: '',
    location: '',
    serial_number: '',
    status: 'Active',
    condition: '',
    custom_fields: {},
    enable_depreciation: false,
    depreciation_method: 'Straight Line',
    useful_life_years: '',
    salvage_value: '0',
    is_opening_balance: false,
    opening_balance_date: '',
    amount_paid: '0',
    payment_method: 'Bank Transfer'
  });

  // Dynamic custom fields
  const [dynamicFields, setDynamicFields] = useState([]);

  const addDynamicField = () => {
    setDynamicFields([...dynamicFields, { name: '', value: '' }]);
  };

  const updateDynamicField = (index, field, value) => {
    const updated = [...dynamicFields];
    updated[index][field] = value;
    setDynamicFields(updated);
    
    // Update formData custom_fields
    const customFields = {};
    updated.forEach(f => {
      if (f.name && f.value) {
        customFields[f.name] = f.value;
      }
    });
    setFormData(prev => ({
      ...prev,
      custom_fields: { ...prev.custom_fields, ...customFields }
    }));
  };

  const removeDynamicField = (index) => {
    const updated = dynamicFields.filter((_, i) => i !== index);
    setDynamicFields(updated);
    
    // Update formData custom_fields
    const customFields = {};
    updated.forEach(f => {
      if (f.name && f.value) {
        customFields[f.name] = f.value;
      }
    });
    setFormData(prev => ({
      ...prev,
      custom_fields: customFields
    }));
  };

  useEffect(() => {
    fetchAssetTypes();
  }, []);

  useEffect(() => {
    if (formData.asset_type_id) {
      const type = assetTypes.find(t => t.id === parseInt(formData.asset_type_id));
      setSelectedType(type);
    } else {
      setSelectedType(null);
    }
  }, [formData.asset_type_id, assetTypes]);

  const fetchAssetTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/assets/types', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssetTypes(response.data.data || []);
    } catch (err) {
      console.error('Error fetching asset types:', err);
      setError('Failed to fetch asset types');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldName]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Prepare data
      const submitData = {
        ...formData,
        total_cost: parseFloat(formData.total_cost),
        amount_paid: parseFloat(formData.amount_paid || 0),
        useful_life_years: formData.enable_depreciation ? parseInt(formData.useful_life_years) : null,
        salvage_value: formData.enable_depreciation ? parseFloat(formData.salvage_value || 0) : 0
      };

      const response = await axios.post('http://localhost:5000/api/assets', submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Asset created successfully!');
      setTimeout(() => {
        navigate('/dashboard/assets');
      }, 1500);

    } catch (err) {
      console.error('Error creating asset:', err);
      setError(err.response?.data?.error || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  const renderCustomField = (field) => {
    const value = formData.custom_fields[field.field_name] || '';

    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="w-full border border-gray-300 px-2 py-1.5 text-xs"
            required={field.is_required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="w-full border border-gray-300 px-2 py-1.5 text-xs"
            required={field.is_required}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="w-full border border-gray-300 px-2 py-1.5 text-xs"
            required={field.is_required}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="w-full border border-gray-300 px-2 py-1.5 text-xs"
            rows="3"
            required={field.is_required}
          />
        );
      case 'select':
        const options = field.field_options ? JSON.parse(field.field_options) : [];
        return (
          <select
            value={value}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
            className="w-full border border-gray-300 px-2 py-1.5 text-xs"
            required={field.is_required}
          >
            <option value="">Select...</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value === true || value === 'true'}
            onChange={(e) => handleCustomFieldChange(field.field_name, e.target.checked)}
            className="h-3 w-3"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-2">
      <div className="mb-3">
        <h1 className="text-base font-bold text-gray-900">Add New Fixed Asset</h1>
        <p className="text-xs text-gray-600 mt-0.5">Record a new asset purchase or add historical asset</p>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 p-2 bg-green-100 border border-green-400 text-green-700 text-xs">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-3 space-y-3">
        {/* Asset Type Selection */}
        <div className="border-b pb-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-3">Asset Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Asset Type <span className="text-red-500">*</span>
              </label>
              <select
                name="asset_type_id"
                value={formData.asset_type_id}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-2 py-1.5 text-xs"
              >
                <option value="">Select Asset Type</option>
                {assetTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Asset Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="asset_name"
                value={formData.asset_name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                placeholder="e.g., Toyota Hilux ABC-1234"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                rows="2"
                placeholder="Additional details about the asset..."
              />
            </div>
          </div>
        </div>

        {/* Purchase Details */}
        <div className="border-b pb-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-3">Purchase Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-2 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Total Cost (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="total_cost"
                value={formData.total_cost}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Name</label>
              <input
                type="text"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                placeholder="Name of supplier/vendor"
              />
            </div>
          </div>
        </div>

        {/* Standard Fields */}
        <div className="border-b pb-3">
          <h2 className="text-xs font-semibold text-gray-900 mb-3">Asset Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedType?.requires_registration && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                  placeholder="e.g., ABC-1234"
                />
              </div>
            )}

            {selectedType?.requires_serial_number && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                  placeholder="e.g., SN123456789"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                placeholder="Where is this asset located?"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status || 'Active'}
                onChange={handleChange}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs"
              >
                <option value="Active">Active</option>
                <option value="Disposed">Disposed</option>
                <option value="Lost">Lost</option>
                <option value="Damaged">Damaged</option>
                <option value="Under Repair">Under Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Condition</label>
              <select
                name="condition"
                value={formData.condition || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 px-2 py-1.5 text-xs"
              >
                <option value="">Select Condition</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Details - User Defined */}
        <div className="border-b pb-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-semibold text-gray-900">Custom Details</h2>
            <button
              type="button"
              onClick={addDynamicField}
              className="bg-blue-600 text-white px-3 py-1 text-xs hover:bg-blue-700"
            >
              + Add Custom Field
            </button>
          </div>
          
          {dynamicFields.length === 0 ? (
            <p className="text-xs text-gray-500 italic">Click "Add Custom Field" to add your own details like Color, Receipt Number, etc.</p>
          ) : (
            <div className="space-y-2">
              {dynamicFields.map((field, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateDynamicField(index, 'name', e.target.value)}
                      placeholder="Field name (e.g., Color)"
                      className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateDynamicField(index, 'value', e.target.value)}
                      placeholder="Value (e.g., Red)"
                      className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeDynamicField(index)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                      title="Remove field"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Fields */}
        {selectedType && selectedType.custom_fields && selectedType.custom_fields.length > 0 && (
          <div className="border-b pb-3">
            <h2 className="text-xs font-semibold text-gray-900 mb-3">Additional Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedType.custom_fields.map(field => (
                <div key={field.id} className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {field.field_label}
                    {field.is_required && <span className="text-red-500">*</span>}
                  </label>
                  {renderCustomField(field)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opening Balance */}
        <div className="border-b pb-3">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              name="is_opening_balance"
              checked={formData.is_opening_balance}
              onChange={handleChange}
              className="h-3 w-3"
            />
            <label className="text-xs font-medium text-gray-700">
              This is a historical asset (opening balance)
            </label>
          </div>

          {formData.is_opening_balance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-blue-50 p-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Opening Balance Date</label>
                <input
                  type="date"
                  name="opening_balance_date"
                  value={formData.opening_balance_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount Already Paid (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount_paid"
                  value={formData.amount_paid}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Outstanding: ${(parseFloat(formData.total_cost) - parseFloat(formData.amount_paid || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Depreciation */}
        <div className="border-b pb-3">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              name="enable_depreciation"
              checked={formData.enable_depreciation}
              onChange={handleChange}
              className="h-3 w-3"
            />
            <label className="text-xs font-medium text-gray-700">
              Enable depreciation tracking (optional)
            </label>
          </div>

          {formData.enable_depreciation && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Depreciation Method</label>
                <select
                  name="depreciation_method"
                  value={formData.depreciation_method}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                >
                  <option value="Straight Line">Straight Line</option>
                  <option value="Declining Balance">Declining Balance</option>
                  <option value="Units of Production">Units of Production</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Useful Life (years)</label>
                <input
                  type="number"
                  name="useful_life_years"
                  value={formData.useful_life_years}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                  placeholder="e.g., 5"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Salvage Value (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  name="salvage_value"
                  value={formData.salvage_value}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 py-1.5 text-xs"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gray-900 text-white px-3 py-1.5 text-xs hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Creating Asset...' : 'Create Asset'}
          </button>
          <button
            type="button"
            onClick={() => window.location.href = '/dashboard/assets'}
            className="flex-1 bg-gray-200 text-gray-700 px-3 py-1.5 text-xs hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAsset;

