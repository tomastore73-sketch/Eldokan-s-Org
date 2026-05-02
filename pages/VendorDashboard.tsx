import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, LogOut } from 'lucide-react';
import PointDescriptionEngine from '../components/PointDescriptionEngine';

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('products');
  
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', category: '', image: '', descriptionPoints: [{ title: '', desc: '' }]
  });
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || localStorage.getItem('role') !== 'VENDOR') {
      navigate('/login');
      return;
    }

    fetch('/api/vendors/products', { headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => res.json()).then(setProducts);
      
    fetch('/api/vendors/orders', { headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => res.json()).then(setOrders);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const images = newProduct.image ? [newProduct.image] : [];
    const description_points = newProduct.descriptionPoints.filter(dp => dp.title.trim() !== '' && dp.desc.trim() !== '');

    const url = editingProductId ? `/api/vendors/products/${editingProductId}` : '/api/vendors/products';
    const method = editingProductId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        images,
        description_points
      })
    });

    if (res.ok) {
        fetch('/api/vendors/products', { headers: { 'Authorization': `Bearer ${token}` }})
        .then(res => res.json()).then(setProducts);
        setNewProduct({name: '', price: '', category: '', image: '', descriptionPoints: [{ title: '', desc: '' }]});
        setEditingProductId(null);
    }
  };

  const handleEditClick = (p: any) => {
    setEditingProductId(p.id);
    const images = JSON.parse(p.images_json || '[]');
    const points = JSON.parse(p.description_points_json || '[]');
    setNewProduct({
        name: p.name || '',
        price: p.price ? p.price.toString() : '',
        category: p.category || '',
        image: images[0] || '',
        descriptionPoints: points.length > 0 ? points : [{ title: '', desc: '' }]
    });
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setNewProduct({name: '', price: '', category: '', image: '', descriptionPoints: [{ title: '', desc: '' }]});
  };

  const productStats = React.useMemo(() => {
    const stats = new Map();
    orders.forEach((o: any) => {
        if (!stats.has(o.product_id)) {
            stats.set(o.product_id, { quantitySold: 0, revenue: 0 });
        }
        const s = stats.get(o.product_id);
        s.quantitySold += o.quantity;
        s.revenue += (o.quantity * o.price_at_time);
    });
    return stats;
  }, [orders]);

  const groupedOrders = React.useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      if (!map.has(o.order_id)) {
        map.set(o.order_id, {
          order_id: o.order_id,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          customer_address: o.customer_address,
          payment_method: o.payment_method,
          created_at: o.created_at,
          items: [],
          total_amount: 0
        });
      }
      const order = map.get(o.order_id);
      order.items.push(o);
      order.total_amount += o.price_at_time * o.quantity;
    });
    return Array.from(map.values());
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      <nav className="bg-white border-b border-stone-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-stone-900 rounded-lg grid place-items-center font-bold">V</div>
            <span className="font-semibold text-lg tracking-wide">Vendor Portal</span>
          </div>
          <button onClick={handleLogout} className="text-stone-500 hover:text-stone-900 flex items-center gap-2 text-sm">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 mt-4">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
            <button 
                onClick={() => setActiveTab('products')}
                className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${activeTab === 'products' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200'}`}
            ><Package className="w-5 h-5"/> My Inventory</button>
            <button 
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${activeTab === 'orders' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200'}`}
            ><Clock className="w-5 h-5"/> Order History</button>
        </div>

        {activeTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {products.map(p => (
                        <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm flex gap-6">
                            <div className="w-32 h-32 bg-stone-100 rounded-xl overflow-hidden shrink-0">
                                {JSON.parse(p.images_json)[0] && <img src={JSON.parse(p.images_json)[0]} className="w-full h-full object-cover"/>}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between">
                                        <h3 className="text-xl font-semibold">{p.name}</h3>
                                        <span className="text-lg font-medium text-orange-600">${p.price.toFixed(2)}</span>
                                    </div>
                                    <p className="text-sm text-stone-500">{p.category}</p>
                                    <div className="mt-2">
                                        <PointDescriptionEngine points={JSON.parse(p.description_points_json)} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-end justify-between">
                                    <div className="flex gap-4">
                                        <div className="bg-stone-50 border border-stone-100 rounded-lg px-4 py-2">
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Sold</p>
                                            <p className="text-lg font-bold text-stone-900">{productStats.get(p.id)?.quantitySold || 0}</p>
                                        </div>
                                        <div className="bg-stone-50 border border-stone-100 rounded-lg px-4 py-2">
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Revenue</p>
                                            <p className="text-lg font-bold text-emerald-600">${(productStats.get(p.id)?.revenue || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleEditClick(p)}
                                        className="text-sm font-medium text-stone-600 hover:text-stone-900 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                                    >
                                        Edit Product
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && <p className="text-stone-500">No products found.</p>}
                </div>
                
                {/* Add Product Form */}
                <div className="bg-white p-6 rounded-3xl shadow-sm h-max border border-stone-100 relative">
                    {editingProductId && (
                        <button 
                            type="button" 
                            onClick={cancelEdit}
                            className="absolute top-6 right-6 text-stone-400 hover:text-stone-600"
                        >
                            &times;
                        </button>
                    )}
                    <h3 className="font-semibold text-lg mb-6">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
                    <form onSubmit={handleSubmitProduct} className="space-y-4">
                        <input placeholder="Product Name" required className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})}/>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" step="0.01" placeholder="Price" required className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price: e.target.value})}/>
                            <input placeholder="Category" required className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200" value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category: e.target.value})}/>
                        </div>
                        <input placeholder="Image URL" className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200" value={newProduct.image} onChange={e=>setNewProduct({...newProduct, image: e.target.value})}/>
                        
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-semibold text-orange-800 uppercase tracking-wider">Point System Engine</h4>
                                <button type="button" onClick={() => setNewProduct({...newProduct, descriptionPoints: [...newProduct.descriptionPoints, {title: '', desc: ''}]})} className="text-xs font-medium text-orange-600 hover:text-orange-800">
                                    + Add Point
                                </button>
                            </div>
                            {newProduct.descriptionPoints.map((point, index) => (
                                <div key={index} className="flex gap-2 items-start relative pb-2 mb-2 border-b border-orange-100 last:border-0 last:pb-0 last:mb-0">
                                    <div className="flex-1 space-y-2">
                                        <input 
                                            placeholder="Feature Bold Title" 
                                            className="w-full p-2 text-sm bg-white rounded flex-1 border border-orange-200" 
                                            value={point.title} 
                                            onChange={e => {
                                                const newPoints = [...newProduct.descriptionPoints];
                                                newPoints[index].title = e.target.value;
                                                setNewProduct({...newProduct, descriptionPoints: newPoints});
                                            }}
                                        />
                                        <textarea 
                                            placeholder="Feature Description" 
                                            className="w-full p-2 text-sm bg-white rounded border border-orange-200" 
                                            rows={2} 
                                            value={point.desc} 
                                            onChange={e => {
                                                const newPoints = [...newProduct.descriptionPoints];
                                                newPoints[index].desc = e.target.value;
                                                setNewProduct({...newProduct, descriptionPoints: newPoints});
                                            }}
                                        />
                                    </div>
                                    {newProduct.descriptionPoints.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const newPoints = newProduct.descriptionPoints.filter((_, i) => i !== index);
                                                setNewProduct({...newProduct, descriptionPoints: newPoints});
                                            }} 
                                            className="text-stone-400 hover:text-red-500 font-bold p-1 pt-2"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors">
                            {editingProductId ? 'Update Product' : 'Publish Product'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-stone-100">
                <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="p-4">Order Details</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Items</th>
                    <th className="p-4 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                    {groupedOrders.map(o => (
                        <tr key={o.order_id} onClick={() => setSelectedOrder(o)} className="hover:bg-stone-50 cursor-pointer transition-colors">
                            <td className="p-4">
                                <p className="font-semibold">Order #{o.order_id}</p>
                                <p className="text-xs text-stone-500 mt-1">{new Date(o.created_at).toLocaleString()}</p>
                            </td>
                            <td className="p-4">
                                <p className="font-medium text-stone-900">{o.customer_name}</p>
                                <p className="text-stone-500">{o.customer_phone}</p>
                            </td>
                            <td className="p-4">
                                <p className="font-medium">{o.items.length} items</p>
                            </td>
                            <td className="p-4 text-right font-medium text-stone-900">${o.total_amount.toFixed(2)}</td>
                        </tr>
                    ))}
                    {groupedOrders.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-stone-500">No orders yet.</td></tr>}
                </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Selected Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-stone-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div>
                <h2 className="text-2xl font-bold">Order #{selectedOrder.order_id}</h2>
                <p className="text-sm text-stone-500 mt-1">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors font-bold text-stone-500"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Customer Info</h3>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-stone-600">{selectedOrder.customer_phone}</p>
                  <p className="text-stone-600">{selectedOrder.customer_address}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Payment Details</h3>
                  <p className="font-medium">{selectedOrder.payment_method}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Purchased Items</h3>
                <div className="rounded-2xl border border-stone-200 overflow-hidden text-sm">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 text-stone-500 font-medium">
                      <tr>
                        <th className="p-4">Product Name</th>
                        <th className="p-4 text-center">Qty</th>
                        <th className="p-4 text-right">Price</th>
                        <th className="p-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-4 font-medium">{item.product_name}</td>
                          <td className="p-4 text-center">{item.quantity}</td>
                          <td className="p-4 text-right text-stone-600">${item.price_at_time.toFixed(2)}</td>
                          <td className="p-4 text-right font-medium">${(item.price_at_time * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-stone-50 border-t border-stone-200">
                      <tr>
                        <td colSpan={3} className="p-4 text-right font-bold">Total Amount</td>
                        <td className="p-4 text-right font-bold text-lg">${selectedOrder.total_amount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
