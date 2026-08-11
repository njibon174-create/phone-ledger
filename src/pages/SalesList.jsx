import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const PAYMENT_CONFIG = {
  cash: { label: 'Cash', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-400' },
  baki: { label: 'Baki', bg: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-400' },
}

const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-400' },
  pending:   { label: 'Pending',   bg: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-400' },
  partial:   { label: 'Partial',   bg: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-400' },
  cleared:   { label: 'Cleared',   bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
}

function formatCurrency(num) {
  return new Intl.NumberFormat('en-BD').format(num || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[120, 130, 90, 80, 100, 90, 80].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-slate-100 animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function SalesList() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  async function fetchSales() {
    setLoading(true)
    const { data } = await supabase
      .from('sales')
      .select(`
        id,
        sell_price,
        payment_type,
        buyer_name,
        buyer_phone,
        status,
        sale_date,
        created_at,
        phone:phones(brand, model, imei)
      `)
      .order('created_at', { ascending: false })
    setSales(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchSales() }, [])

  const filtered = sales.filter(s => {
    if (paymentFilter === 'all') return true
    return s.payment_type === paymentFilter
  })

  const totalSales  = filtered.length
  const totalAmount = filtered.reduce((s, sale) => s + Number(sale.sell_price || 0), 0)
  const cashTotal   = filtered.filter(s => s.payment_type === 'cash').reduce((s, sale) => s + Number(sale.sell_price || 0), 0)
  const bakiTotal   = filtered.filter(s => s.payment_type === 'baki').reduce((s, sale) => s + Number(sale.sell_price || 0), 0)

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-100'
            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="stat-card">
          <span className="stat-label">Total Sales</span>
          <span className="stat-value">{totalSales}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Amount</span>
          <span className="stat-value text-base">৳{formatCurrency(totalAmount)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cash Sales</span>
          <span className="stat-value text-base text-emerald-600">৳{formatCurrency(cashTotal)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Baki Sales</span>
          <span className="stat-value text-base text-amber-600">৳{formatCurrency(bakiTotal)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input w-auto"
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
        >
          <option value="all">All Payments</option>
          <option value="cash">Cash</option>
          <option value="baki">Baki (Credit)</option>
        </select>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-slate-400">
          {filtered.length === 0 ? 'No sales yet' : `Showing ${filtered.length} sale${filtered.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr className="border-b border-slate-200">
              <th>Phone</th>
              <th>IMEI</th>
              <th>Sell Price</th>
              <th>Payment</th>
              <th>Buyer</th>
              <th>Sale Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {/* Loading skeletons */}
            {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">No sales recorded yet</p>
                      <p className="text-xs text-slate-400 mt-0.5">Complete a sale from the Inventory page</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading && filtered.map(sale => {
              const phone = sale.phone
              const pmtConfig = PAYMENT_CONFIG[sale.payment_type] || PAYMENT_CONFIG.cash
              const stConfig  = STATUS_CONFIG[sale.status] || STATUS_CONFIG.completed
              return (
                <tr
                  key={sale.id}
                  className="border-b border-slate-100 last:border-0 transition-colors duration-75 hover:bg-slate-50/70"
                >
                  <td>
                    <p className="font-medium text-slate-900">{phone?.brand || '—'}</p>
                    <p className="text-sm text-slate-500">{phone?.model || '—'}</p>
                  </td>
                  <td className="font-mono text-xs text-slate-400 tracking-wider">{phone?.imei || '—'}</td>
                  <td className="font-semibold text-slate-800">৳{formatCurrency(sale.sell_price)}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${pmtConfig.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pmtConfig.dot}`} />
                      {pmtConfig.label}
                    </span>
                  </td>
                  <td>
                    {sale.payment_type === 'baki' ? (
                      <div>
                        <p className="text-sm font-medium text-slate-700">{sale.buyer_name || '—'}</p>
                        {sale.buyer_phone && (
                          <p className="text-xs text-slate-400">{sale.buyer_phone}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </td>
                  <td className="text-slate-400 text-xs">{formatDate(sale.sale_date)}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${stConfig.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stConfig.dot}`} />
                      {stConfig.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
