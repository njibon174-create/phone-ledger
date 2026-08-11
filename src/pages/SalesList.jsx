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

const CREDIT_STATUS_CONFIG = {
  pending: { label: 'Unpaid', bg: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-400' },
  partial: { label: 'Partial', bg: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-400' },
  cleared: { label: 'Cleared', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-400' },
}

function formatCurrency(num) {
  return new Intl.NumberFormat('en-BD').format(num || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
// Skeleton card
function SkeletonCard() {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-28 rounded bg-slate-100 animate-pulse" />
          <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="h-5 w-14 rounded-full bg-slate-100 animate-pulse" />
      </div>
      <div className="space-y-1">
        <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
        <div className="h-6 w-24 rounded bg-slate-100 animate-pulse" />
      </div>
      <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
        <div className="h-5 w-16 rounded-full bg-slate-100 animate-pulse" />
      </div>
    </div>
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
        phone:phones(brand, model, imei),
        credit:credits(id, status, remaining, paid_amount, total_due)
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

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Loading skeletons */}
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">No sales recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Complete a sale from the Inventory page</p>
            </div>
          </div>
        )}

        {/* Sales cards */}
        {!loading && filtered.map(sale => {
          const phone = sale.phone
          const pmtConfig = PAYMENT_CONFIG[sale.payment_type] || PAYMENT_CONFIG.cash
          const stConfig  = STATUS_CONFIG[sale.status] || STATUS_CONFIG.completed
          return (
            <div
              key={sale.id}
              className="card p-4 flex flex-col gap-3 border border-slate-200 hover:border-slate-300 transition-colors"
            >
              {/* Header: Phone + Payment Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{phone?.brand} {phone?.model}</p>
                  <p className="font-mono text-xs text-slate-400 mt-0.5 tracking-wider">{phone?.imei || '—'}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${pmtConfig.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${pmtConfig.dot}`} />
                    {pmtConfig.label}
                  </span>
                  {sale.payment_type === 'baki' && sale.credit && (
                    (() => {
                      const creditStatus = Array.isArray(sale.credit)
                        ? sale.credit.find(c => c)?.status
                        : sale.credit.status
                      const creditCfg = CREDIT_STATUS_CONFIG[creditStatus]
                      if (!creditCfg) return null
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${creditCfg.bg}`}>
                          {creditStatus === 'cleared' && '✓ '}{creditCfg.label}
                        </span>
                      )
                    })()
                  )}
                </div>
              </div>

              {/* Sell Price */}
              <div>
                <p className="text-xs text-slate-400 font-medium">Sell Price</p>
                <p className="text-xl font-bold text-slate-900">৳{formatCurrency(sale.sell_price)}</p>
              </div>

              {/* Buyer info — only for Baki */}
              {sale.payment_type === 'baki' && (
                <div className="rounded-lg bg-amber-50/60 border border-amber-100 px-3 py-2">
                  <p className="text-xs text-amber-600 font-medium mb-1">Credit Buyer</p>
                  <p className="text-sm font-semibold text-slate-800">{sale.buyer_name || '—'}</p>
                  {sale.buyer_phone && (
                    <p className="text-xs text-slate-500">{sale.buyer_phone}</p>
                  )}
                </div>
              )}

              {/* Footer: Sale Date + Status */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-auto">
                <p className="text-xs text-slate-400">Sold {formatDate(sale.sale_date)}</p>
                {sale.status !== 'completed' && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${stConfig.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${stConfig.dot}`} />
                    {stConfig.label}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
