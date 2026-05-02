import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogOut, Users, Settings, Tag } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const [activeTab, setActiveTab] = useState<'vendors' | 'discount-codes'>('vendors');
  const [discountCodes, setDiscountCodes] = useState<any[]>([]);
  const [showAddCode, setShowAddCode] = useState(false);
  const [codeData, setCodeData] = useState({
    code: '', discount_type: 'PERCENTAGE', value: '', applicability: 'SITE_WIDE', vendor_id: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || localStorage.getItem('role') !== 'SUPER_ADMIN') {
      navigate('/login');
      return;
    }

    fetch('/api/admin/vendors', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setVendors);

    fetch('/api/admin/discount-codes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setDiscountCodes);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const [formData, setFormData] = useState({
    store_name: '', vendor_name: '', phone: '', address: '', email: '', password: ''
  });

  const [editingVendorId, setEditingVendorId] = useState<number | null>(null);

  const handleSubmitVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const method = editingVendorId ? 'PUT' : 'POST';
    const url = editingVendorId ? `/api/admin/vendors/${editingVendorId}` : '/api/admin/vendors';
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowAdd(false);
      setEditingVendorId(null);
      setFormData({
        store_name: '', vendor_name: '', phone: '', address: '', email: '', password: ''
      });
      // reload vendors
      fetch('/api/admin/vendors', { headers: { 'Authorization': `Bearer ${token}` }})
        .then(res => res.json()).then(setVendors);
    } else {
      alert("Failed to save vendor");
    }
  };

  const handleEditVendor = (vendor: any) => {
    setFormData({
      store_name: vendor.store_name, vendor_name: vendor.vendor_name, 
      phone: vendor.phone, address: vendor.address, email: vendor.email, password: ''
    });
    setEditingVendorId(vendor.id);
    setShowAdd(false); // Hide create form if open
  };

  const handleDeleteVendor = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vendor and all their data?")) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/vendors/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetch('/api/admin/vendors', { headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => res.json()).then(setVendors);
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/discount-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...codeData,
        value: parseFloat(codeData.value),
        vendor_id: codeData.applicability === 'SPECIFIC_VENDOR' ? parseInt(codeData.vendor_id) : null
      })
    });
    if (res.ok) {
      setShowAddCode(false);
      fetch('/api/admin/discount-codes', { headers: { 'Authorization': `Bearer ${token}` }})
        .then(res => res.json()).then(setDiscountCodes);
      setCodeData({ code: '', discount_type: 'PERCENTAGE', value: '', applicability: 'SITE_WIDE', vendor_id: '' });
    } else {
      alert("Failed to create discount code");
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <aside className="w-64 bg-slate-900 flex flex-col text-white shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl">E</div>
            <span className="text-xl font-bold tracking-tight">ELDOKAN</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Super Admin Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase px-2 mb-2">Management</div>
          <button 
            onClick={() => setActiveTab('vendors')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'vendors' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            <span>Vendors</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-md text-sm font-medium transition-colors">
            <span>Global Tools</span>
          </button>
          <button 
            onClick={() => setActiveTab('discount-codes')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'discount-codes' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            <span>Discount Codes</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-400 border border-white/20"></div>
          <div className="flex-1 overflow-hidden text-left">
            <p className="text-xs font-medium truncate">admin@eldokan.com</p>
            <p className="text-[10px] text-slate-400 uppercase">Main Access Only</p>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-semibold">{activeTab === 'vendors' ? 'Vendor Management Dashboard' : 'Discount Codes Dashboard'}</h1>
          <div className="flex items-center gap-4">
            {activeTab === 'vendors' && (
              <button 
                onClick={() => {
                  setShowAdd(!showAdd);
                  setEditingVendorId(null);
                  setFormData({store_name: '', vendor_name: '', phone: '', address: '', email: '', password: ''});
                }} 
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-xs font-semibold shadow-sm"
              >
                + Add New Vendor
              </button>
            )}
            {activeTab === 'discount-codes' && (
              <button onClick={() => setShowAddCode(!showAddCode)} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-xs font-semibold shadow-sm">
                + Add New Code
              </button>
            )}
          </div>
        </header>
        
        <div className="p-6 space-y-6 flex-1 overflow-auto">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-medium uppercase">Total Vendors</p>
              <p className="text-2xl font-bold mt-1">{vendors.length}</p>
              <div className="text-emerald-500 text-[10px] font-bold mt-2">+12 this month</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-medium uppercase">Active Products</p>
              <p className="text-2xl font-bold mt-1">8,432</p>
              <div className="text-slate-400 text-[10px] font-medium mt-2">Across 12 categories</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-medium uppercase">Market Revenue</p>
              <p className="text-2xl font-bold mt-1">$124.5k</p>
              <div className="text-emerald-500 text-[10px] font-bold mt-2">+4.2% vs last week</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-medium uppercase">Global Tools</p>
              <p className="text-2xl font-bold mt-1">24</p>
              <div className="text-slate-400 text-[10px] font-medium mt-2">Specifications active</div>
            </div>
          </div>
          
          {activeTab === 'vendors' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                {(showAdd || editingVendorId) && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden relative"
                    onSubmit={handleSubmitVendor}
                  >
                    <button 
                      type="button" 
                      onClick={() => { setShowAdd(false); setEditingVendorId(null); }}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                    >
                      &times;
                    </button>
                    <h2 className="font-bold text-sm uppercase text-slate-600 tracking-wider mb-4">
                      {editingVendorId ? 'Edit Vendor Credentials' : 'Create Vendor Credentials'}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <input placeholder="Store Name" className="text-xs px-4 py-2 rounded-md border border-slate-200 focus:ring-1 ring-indigo-500 outline-none" required value={formData.store_name} onChange={e => setFormData({...formData, store_name: e.target.value})} />
                      <input placeholder="Vendor Name" className="text-xs px-4 py-2 rounded-md border border-slate-200 focus:ring-1 ring-indigo-500 outline-none" required value={formData.vendor_name} onChange={e => setFormData({...formData, vendor_name: e.target.value})} />
                      <input placeholder="Login Email" type="email" className="text-xs px-4 py-2 rounded-md border border-slate-200 focus:ring-1 ring-indigo-500 outline-none" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      <input placeholder={editingVendorId ? "New Password (optional)" : "Login Password"} type="password" className="text-xs px-4 py-2 rounded-md border border-slate-200 focus:ring-1 ring-indigo-500 outline-none" required={!editingVendorId} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                      <input placeholder="Phone" className="text-xs px-4 py-2 rounded-md border border-slate-200 focus:ring-1 ring-indigo-500 outline-none" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      <input placeholder="Address" className="col-span-2 text-xs px-4 py-2 rounded-md border border-slate-200 focus:ring-1 ring-indigo-500 outline-none" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-xs font-semibold shadow-sm">
                      {editingVendorId ? 'Update Vendor' : 'Submit Vendor'}
                    </button>
                  </motion.form>
                )}
                
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-sm uppercase text-slate-600 tracking-wider">Active Vendor Stores</h2>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                        <tr className="border-b border-slate-100">
                          <th className="px-6 py-3">Store Name</th>
                          <th className="px-6 py-3">Vendor</th>
                          <th className="px-6 py-3">Email</th>
                          <th className="px-6 py-3">Phone</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs text-slate-700">
                        {vendors.map(v => (
                          <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-6 py-3 font-semibold text-slate-900">{v.store_name}</td>
                            <td className="px-6 py-3">{v.vendor_name}</td>
                            <td className="px-6 py-3">{v.email}</td>
                            <td className="px-6 py-3">{v.phone}</td>
                            <td className="px-6 py-3 text-right">
                              <button onClick={() => handleEditVendor(v)} className="text-indigo-600 font-semibold hover:text-indigo-800 mr-3">Edit</button>
                              <button onClick={() => handleDeleteVendor(v.id)} className="text-red-500 font-semibold hover:text-red-700">Remove</button>
                            </td>
                          </tr>
                        ))}
                        {vendors.length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-500">No vendors found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="font-bold text-sm uppercase text-slate-600 tracking-wider mb-4">Global Toolsets</h2>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
                      <span className="text-xs font-semibold">Electronics (v2)</span>
                      <span className="text-[10px] bg-slate-200 px-2 py-1 rounded">8 Specs</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
                      <span className="text-xs font-semibold">Apparel & Fashion</span>
                      <span className="text-[10px] bg-slate-200 px-2 py-1 rounded">12 Specs</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
                      <span className="text-xs font-semibold">Home & Kitchen</span>
                      <span className="text-[10px] bg-slate-200 px-2 py-1 rounded">5 Specs</span>
                    </div>
                  </div>
                  <button className="w-full mt-4 py-2 border border-dashed border-slate-300 text-slate-400 text-xs rounded hover:bg-slate-50 transition-colors">
                    + Create New Attribute Set
                  </button>
                </div>

                <div className="bg-indigo-900 p-5 rounded-xl text-white shadow-lg overflow-hidden relative">
                  <div className="relative z-10">
                    <h2 className="font-bold text-sm uppercase tracking-wider mb-2">Active Campaign</h2>
                    <p className="text-2xl font-bold">WINTER-24</p>
                    <p className="text-[10px] opacity-70 mt-1">Fixed 15% site-wide discount across all vendors.</p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-white"></div>
                      </div>
                      <span className="text-[10px] font-bold">67% Limit</span>
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'discount-codes' && (
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-6">
                {showAddCode && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    onSubmit={handleCreateCode}
                  >
                    <h2 className="font-bold text-sm uppercase text-slate-600 tracking-wider mb-4">Create Discount Code</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <input placeholder="Code (e.g., WINTER20)" className="text-xs px-4 py-2 rounded-md border border-slate-200 focus:ring-1 ring-indigo-500 outline-none uppercase" required value={codeData.code} onChange={e => setCodeData({...codeData, code: e.target.value.toUpperCase()})} />
                      <select className="text-xs px-4 py-2 rounded-md border border-slate-200 focus:ring-1 ring-indigo-500 outline-none" required value={codeData.discount_type} onChange={e => setCodeData({...codeData, discount_type: e.target.value})}>
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount ($)</option>
                      </select>
                      <input placeholder="Value" type="number" step="0.01" className="text-xs px-4 py-2 rounded-md border border-slate-200 focus:ring-1 ring-indigo-500 outline-none" required value={codeData.value} onChange={e => setCodeData({...codeData, value: e.target.value})} />
                      <select className="text-xs px-4 py-2 rounded-md border border-slate-200 focus:ring-1 ring-indigo-500 outline-none" required value={codeData.applicability} onChange={e => setCodeData({...codeData, applicability: e.target.value})}>
                        <option value="SITE_WIDE">Site Wide</option>
                        <option value="SPECIFIC_VENDOR">Specific Vendor</option>
                      </select>
                      {codeData.applicability === 'SPECIFIC_VENDOR' && (
                        <select className="text-xs px-4 py-2 rounded-md border border-slate-200 focus:ring-1 ring-indigo-500 outline-none col-span-2" required value={codeData.vendor_id} onChange={e => setCodeData({...codeData, vendor_id: e.target.value})}>
                          <option value="">Select a vendor...</option>
                          {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.store_name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-xs font-semibold shadow-sm">Submit Code</button>
                  </motion.form>
                )}
                
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-sm uppercase text-slate-600 tracking-wider">Active Discount Codes</h2>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                        <tr className="border-b border-slate-100">
                          <th className="px-6 py-3">Code</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Value</th>
                          <th className="px-6 py-3">Applicability</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs text-slate-700">
                        {discountCodes.map(d => (
                          <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-6 py-3 font-semibold text-indigo-700">{d.code}</td>
                            <td className="px-6 py-3">{d.discount_type}</td>
                            <td className="px-6 py-3">{d.discount_type === 'PERCENTAGE' ? `${d.value}%` : `$${d.value}`}</td>
                            <td className="px-6 py-3">{d.applicability === 'SITE_WIDE' ? 'Site-Wide' : d.store_name}</td>
                          </tr>
                        ))}
                        {discountCodes.length === 0 && (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-500">No discount codes found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
