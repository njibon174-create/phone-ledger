import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import AddPayment from './AddPayment'

const STATUS_CONFIG = {
  pending: {
    label: 'Baki',
    dot: 'bg-amber-400',
    bg: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  partial: {
    label: 'Partial Baki',
    dot: 'bg-blue-400',
    bg: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  cleared: {
    label: 'Cleared',
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
}

function formatCurrency(num) {
  return new Intl.NumberFormat('en-BD').format(num || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function SkeletonCard() {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="space-y-1.5">
        <div className="h-5 w-32 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
      </div>
      <div className="space-y-1">
        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
        <div className="h-4 w-28 rounded bg-slate-100 animate-pulse" />
      </div>
      <div className="flex gap-4">
        {[60, 60, 60].map((w, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-12 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-16 rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-8 rounded-lg bg-slate-100 animate-pulse" />
    </div>
  )
}

// Single credit card
function CreditCard({ credit, onAddPayment }) {
  const [expanded, setExpanded] = useState(false)

  const sale = credit.sale || {}
  const phone = sale.phone || {}
  const payments = credit.credit_payments || []

  const statusCfg = STATUS_CONFIG[credit.status] || STATUS_CONFIG.pending
  const isCleared = credit.status === 'cleared'
  const remaining = Number(credit.remaining) || 0

  return (
    <div className="card p-4 flex flex-col gap-3 border border-slate-200 hover:border-slate-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{sale.buyer_name || '—'}</p>
          {sale.buyer_phone && (
            <p className="text-xs text-slate-400">{sale.buyer_phone}</p>
          )}
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </div>

      {/* Phone info */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">{phone.brand} {phone.model}</span>
        <span className="text-slate-300">·</span>
        <span className="font-mono text-xs text-slate-400">{phone.imei || '—'}</span>
      </div>

      {/* Financials */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <p className="text-xs text-slate-400 font-medium">Total</p>
          <p className="text-sm font-semibold text-slate-700">৳{formatCurrency(credit.total_due)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <p className="text-xs text-slate-400 font-medium">Paid</p>
          <p className="text-sm font-semibold text-emerald-600">৳{formatCurrency(credit.paid_amount)}</p>
        </div>
        <div className={`rounded-lg border px-3 py-2 ${
          isCleared
            ? 'bg-emerald-50 border-emerald-100'
            : remaining > 0
              ? 'bg-red-50 border-red-100'
              : 'bg-amber-50 border-amber-100'
        }`}>
          <p className="text-xs font-medium">Remaining</p>
          <p className={`text-sm font-bold ${
            isCleared ? 'text-emerald-600' : remaining > 0 ? 'text-red-600' : 'text-amber-600'
          }`}>
            ৳{formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {/* Add Payment button */}
      {!isCleared && (
        <button
          className="btn btn-sm w-full justify-center bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 font-medium"
          onClick={() => onAddPayment(credit)}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Add Payment
        </button>
      )}

      {/* Payment history toggle */}
      {payments.length > 0 && (
        <div className="border-t border-slate-100 pt-2">
          <button
            className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
            onClick={() => setExpanded(v => !v)}
          >
            <span>{payments.length} payment{payments.length !== 1 ? 's' : ''} recorded</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      +৳{formatCurrency(p.amount)}
                    </p>
                    {p.note && (
                      <p className="text-xs text-slate-400">{p.note}</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{formatDate(p.payment_date)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function BakiLedger() {
  const [credits, setCredits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'outstanding' | 'cleared'
  const [addPaymentCredit, setAddPaymentCredit] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  async function fetchCredits() {
    setLoading(true)
    const { data, error } = await supabase
      .from('credits')
      .select(`
        id,
        total_due,
        paid_amount,
        remaining,
        status,
        last_payment_date,
        created_at,
        sale:sales(
          id,
          buyer_name,
          buyer_phone,
          sale_date,
          phone:phones(
            brand,
            model,
            imei
          )
        ),
        credit_payments(
          id,
          amount,
          payment_date,
          note
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch credits error:', error)
    }
    setCredits(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCredits() }, [])

  async function handleAddPaymentSuccess() {
    setAddPaymentCredit(null)
    showToast('Payment recorded successfully!')
    fetchCredits()
  }

  const filtered = credits.filter(c => {
    const buyerName = c.sale?.buyer_name || ''
    const q = search.trim().toLowerCase()
    const matchSearch = !q || buyerName.toLowerCase().includes(q)

    if (statusFilter === 'outstanding') {
      return matchSearch && c.status !== 'cleared'
    } else if (statusFilter === 'cleared') {
      return matchSearch && c.status === 'cleared'
    }
    return matchSearch
  })

  const totalOutstanding = credits
    .filter(c => c.status !== 'cleared')
    .reduce((s, c) => s + Number(c.remaining || 0), 0)

  const totalCleared = credits
    .filter(c => c.status === 'cleared')
    .reduce((s, c) => s + Number(c.total_due || 0), 0)

  const pendingBuyers = credits.filter(c => c.status === 'pending').length

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="stat-card">
          <span className="stat-label">Outstanding</span>
          <span className="stat-value text-red-600">৳{formatCurrency(totalOutstanding)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cleared</span>
          <span className="stat-value text-emerald-600">৳{formatCurrency(totalCleared)}</span>
        </div>
        <div className="stat-card sm:col-span-1">
          <span className="stat-label">Pending Buyers</span>
          <span className="stat-value">{pendingBuyers}</span>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by buyer name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input w-auto"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Credits</option>
          <option value="outstanding">Outstanding</option>
          <option value="cleared">Cleared</option>
        </select>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-slate-400">
          {filtered.length === 0
            ? 'No credits found'
            : `Showing ${filtered.length} credit${filtered.length !== 1 ? 's' : ''}`
          }
        </p>
      )}

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading && filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">No credit records yet</p>
              <p className="text-xs text-slate-400 mt-1">Baki sales from the Inventory page will appear here</p>
            </div>
          </div>
        )}

        {!loading && filtered.map(credit => (
          <CreditCard
            key={credit.id}
            credit={credit}
            onAddPayment={setAddPaymentCredit}
          />
        ))}
      </div>

      {/* Add Payment Modal */}
      {addPaymentCredit && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Add Payment</h2>
              <button className="btn-ghost btn-sm" onClick={() => setAddPaymentCredit(null)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <AddPayment
              credit={addPaymentCredit}
              onSuccess={handleAddPaymentSuccess}
              onCancel={() => setAddPaymentCredit(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
