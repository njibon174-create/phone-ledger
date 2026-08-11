import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import EditPhone from './EditPhone'

const BRANDS = ['Samsung', 'Xiaomi', 'Realme', 'Vivo', 'Oppo', 'iTel', 'Symphony', 'Walton', 'Apple', 'Other']

const STATUS_CONFIG = {
  in_stock: { label: 'In Stock', class: 'badge-success' },
  sold:     { label: 'Sold',     class: 'badge-warning' },
  returned: { label: 'Returned', class: 'badge-slate' },
}

function formatCurrency(num) {
  return new Intl.NumberFormat('en-BD').format(num)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function InventoryList() {
  const [phones, setPhones] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [editPhone, setEditPhone] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'cards'
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  async function fetchPhones() {
    setLoading(true)
    const { data, error } = await supabase
      .from('phones')
      .select('*')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (!error) setPhones(data || [])
  }

  useEffect(() => { fetchPhones() }, [])

  async function handleDelete(phone) {
    setDeleting(true)
    const { error } = await supabase.from('phones').delete().eq('id', phone.id)
    setDeleting(false)
    setDeleteConfirm(null)
    if (error) {
      showToast('Delete failed: ' + error.message, 'error')
    } else {
      showToast('Phone deleted successfully.')
      fetchPhones()
    }
  }

  // Filter logic
  const filtered = phones.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchBrand  = brandFilter === 'all' || p.brand === brandFilter
    const q = search.trim().toLowerCase()
    const matchSearch = !q
      || p.imei.toLowerCase().includes(q)
      || (p.model || '').toLowerCase().includes(q)
    return matchStatus && matchBrand && matchSearch
  })

  // Stats
  const inStock = phones.filter(p => p.status === 'in_stock')
  const totalInStock  = inStock.length
  const totalInvestment = inStock.reduce((s, p) => s + Number(p.buy_price || 0), 0)

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="stat-card">
          <span className="stat-label">In Stock</span>
          <span className="stat-value">{totalInStock}</span>
        </div>
        <div className="stat-card sm:col-span-2">
          <span className="stat-label">Total Investment</span>
          <span className="stat-value">৳{formatCurrency(totalInvestment)}</span>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            className="input pl-9"
            placeholder="Search IMEI or model…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="sold">Sold</option>
          <option value="returned">Returned</option>
        </select>

        {/* Brand Filter */}
        <select className="input w-auto" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
          <option value="all">All Brands</option>
          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        {/* View Toggle */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
            onClick={() => setViewMode('table')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18"/></svg>
          </button>
          <button
            className={`px-3 py-2 text-xs font-medium transition-colors border-l border-slate-200 ${viewMode === 'cards' ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
            onClick={() => setViewMode('cards')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
          </button>
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-slate-400">
        Showing {filtered.length} of {phones.length} phones
      </p>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Model</th>
                <th>IMEI</th>
                <th>Buy Price</th>
                <th>MRP</th>
                <th>Status</th>
                <th>Added</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && phones.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No phones found</td></tr>
              )}
              {filtered.map(phone => (
                <tr key={phone.id}>
                  <td className="font-medium">{phone.brand}</td>
                  <td>{phone.model}</td>
                  <td className="font-mono text-xs text-slate-500">{phone.imei}</td>
                  <td>৳{formatCurrency(phone.buy_price)}</td>
                  <td>৳{formatCurrency(phone.mrp)}</td>
                  <td>
                    <span className={STATUS_CONFIG[phone.status]?.class || 'badge-slate'}>
                      {STATUS_CONFIG[phone.status]?.label || phone.status}
                    </span>
                  </td>
                  <td className="text-slate-400">{formatDate(phone.added_date)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="btn-ghost btn-sm"
                        onClick={() => setEditPhone(phone)}
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      {phone.status === 'in_stock' && (
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => setDeleteConfirm(phone)}
                          title="Delete"
                        >
                          <svg className="w-3.5 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && phones.length === 0 && (
            <p className="col-span-full text-center py-12 text-slate-400">Loading…</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="col-span-full text-center py-12 text-slate-400">No phones found</p>
          )}
          {filtered.map(phone => (
            <div key={phone.id} className="card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{phone.brand}</p>
                  <p className="text-sm text-slate-500">{phone.model}</p>
                </div>
                <span className={STATUS_CONFIG[phone.status]?.class || 'badge-slate'}>
                  {STATUS_CONFIG[phone.status]?.label || phone.status}
                </span>
              </div>
              <p className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">{phone.imei}</p>
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Buy</p>
                  <p className="font-medium">৳{formatCurrency(phone.buy_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">MRP</p>
                  <p className="font-medium">৳{formatCurrency(phone.mrp)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Added</p>
                  <p className="font-medium text-xs">{formatDate(phone.added_date)}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button className="btn-secondary btn-sm flex-1" onClick={() => setEditPhone(phone)}>
                  Edit
                </button>
                {phone.status === 'in_stock' && (
                  <button className="btn-danger btn-sm" onClick={() => setDeleteConfirm(phone)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editPhone && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Edit Phone</h2>
            <EditPhone
              phone={editPhone}
              onSuccess={() => { setEditPhone(null); showToast('Phone updated successfully.'); fetchPhones() }}
              onCancel={() => setEditPhone(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Delete Phone?</h2>
              <p className="text-sm text-slate-500 mt-1">
                IMEI <span className="font-mono">{deleteConfirm.imei}</span> ({deleteConfirm.brand} {deleteConfirm.model}) will be permanently removed.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn bg-red-600 text-white hover:bg-red-700" disabled={deleting} onClick={() => handleDelete(deleteConfirm)}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
