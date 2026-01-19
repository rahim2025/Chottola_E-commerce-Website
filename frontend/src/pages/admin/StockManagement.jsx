import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader';

const StockManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [product, setProduct] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Stock update form
  const [stockForm, setStockForm] = useState({
    action: 'add',
    quantity: '',
    reason: '',
    batchInfo: {
      batchNumber: '',
      manufactureDate: '',
      expiryDate: '',
      costPrice: ''
    }
  });

  // Recent stock movements
  const [recentMovements, setRecentMovements] = useState([]);

  useEffect(() => {
    fetchProductData();
  }, [id]);

  // Fetch product and inventory data
  const fetchProductData = async () => {
    try {
      setLoading(true);
      
      // Fetch product details
      const productResponse = await fetch(`/api/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!productResponse.ok) {
        throw new Error('Product not found');
      }

      const productData = await productResponse.json();
      setProduct(productData.data);

      // Fetch inventory details
      const inventoryResponse = await fetch(`/api/products/${id}/inventory`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        setInventory(inventoryData.data.inventory);
        setRecentMovements(inventoryData.data.inventory.movements.slice(-10).reverse());
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle stock update
  const handleStockUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        action: stockForm.action,
        quantity: parseInt(stockForm.quantity),
        reason: stockForm.reason
      };

      // Add batch info if it's an 'add' action and batch details are provided
      if (stockForm.action === 'add' && stockForm.batchInfo.batchNumber) {
        updateData.batchInfo = stockForm.batchInfo;
      }

      const response = await fetch(`/api/products/${id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update stock');
      }

      const data = await response.json();
      setSuccess(data.message);
      
      // Reset form
      setStockForm({
        action: 'add',
        quantity: '',
        reason: '',
        batchInfo: {
          batchNumber: '',
          manufactureDate: '',
          expiryDate: '',
          costPrice: ''
        }
      });

      // Refresh data
      fetchProductData();

    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setStockForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setStockForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Get stock status color
  const getStockStatusColor = (status) => {
    switch (status) {
      case 'in_stock':
        return 'text-green-600 bg-green-100';
      case 'low_stock':
        return 'text-yellow-600 bg-yellow-100';
      case 'out_of_stock':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Format movement type
  const formatMovementType = (type) => {
    switch (type) {
      case 'in':
        return 'Stock In';
      case 'out':
        return 'Stock Out';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  if (loading) return <Loader />;

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Product Not Found</h1>
          <button
            onClick={() => navigate('/admin/products')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-600 mt-2">{product.name}</p>
          </div>
          <button
            onClick={() => navigate('/admin/products')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Back to Products
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button onClick={() => setError('')} className="float-right text-red-500 hover:text-red-700">×</button>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
            <button onClick={() => setSuccess('')} className="float-right text-green-500 hover:text-green-700">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Stock Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Current Stock</h2>
              
              {inventory ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Available Stock:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {inventory.stock?.current || 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Reserved Stock:</span>
                    <span className="text-lg font-semibold text-yellow-600">
                      {inventory.stock?.reserved || 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Reorder Level:</span>
                    <span className="text-lg font-semibold text-orange-600">
                      {inventory.stock?.reorderLevel || 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Max Stock:</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {inventory.stock?.maxStock || 0}
                    </span>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getStockStatusColor(
                          inventory.stock?.current <= 0 ? 'out_of_stock' :
                          inventory.stock?.current <= inventory.stock?.reorderLevel ? 'low_stock' : 'in_stock'
                        )
                      }`}>
                        {inventory.stock?.current <= 0 ? 'Out of Stock' :
                         inventory.stock?.current <= inventory.stock?.reorderLevel ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>No inventory data available</p>
                </div>
              )}
            </div>

            {/* Batch Information */}
            {inventory?.batches && inventory.batches.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Active Batches</h2>
                <div className="space-y-3">
                  {inventory.batches
                    .filter(batch => batch.quantity > 0)
                    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
                    .slice(0, 5)
                    .map((batch, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{batch.batchNumber}</p>
                          <p className="text-xs text-gray-500">
                            Exp: {new Date(batch.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{batch.quantity} units</p>
                          <p className="text-xs text-gray-500">
                            {product.pricing?.currency} {batch.costPrice}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stock Update Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Update Stock</h2>
              
              <form onSubmit={handleStockUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Action *</label>
                    <select
                      name="action"
                      value={stockForm.action}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="add">Add Stock</option>
                      <option value="reduce">Reduce Stock</option>
                      <option value="set">Set Stock</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={stockForm.quantity}
                      onChange={handleInputChange}
                      min="1"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                    <input
                      type="text"
                      name="reason"
                      value={stockForm.reason}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Reason for update"
                    />
                  </div>
                </div>

                {/* Batch Information (only for adding stock) */}
                {stockForm.action === 'add' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-3">Batch Information (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                        <input
                          type="text"
                          name="batchInfo.batchNumber"
                          value={stockForm.batchInfo.batchNumber}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="BATCH-001"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Manufacture Date</label>
                        <input
                          type="date"
                          name="batchInfo.manufactureDate"
                          value={stockForm.batchInfo.manufactureDate}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <input
                          type="date"
                          name="batchInfo.expiryDate"
                          value={stockForm.batchInfo.expiryDate}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
                        <input
                          type="number"
                          name="batchInfo.costPrice"
                          value={stockForm.batchInfo.costPrice}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Update Stock'}
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Movements */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Stock Movements</h2>
              
              {recentMovements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentMovements.map((movement, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(movement.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              movement.type === 'in' ? 'bg-green-100 text-green-800' :
                              movement.type === 'out' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {formatMovementType(movement.type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {movement.type === 'out' ? '-' : '+'}{movement.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {movement.reason || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {movement.reference || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No stock movements recorded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManagement;