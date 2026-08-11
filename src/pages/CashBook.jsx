import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const TX_TYPE_CONFIG = {
  investment: {
    label: 'Investment',
    dot: 'bg-blue-400',
    bg: 'bg-blue-50 text-blue-700 border-blue-100',
    direction: 'in',
  },
  sale_cash: {
    label: 'Sale Cash',
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    direction: 'in',
  },
  credit_payment_received: {
    label: 'Baki Payment',
    dot: 'bg-teal-400',
    bg: 'bg-teal-50 text-teal-700 border-teal-100',
    direction: 'in',
  },
  withdrawal: {
    label: 'Withdrawal',
    dot: 'bg-amber-400',
    bg: 'bg-amber-50 text-amber-700 border-amber-100',
    direction: 'out',
  },
  expense: {
    label: 'Expense',
    dot: 'bg-red-400',
    bg: 'bg-red-50 text-red-700 border-red-100',
    direction: 'out',
  },
}

const MONEY_IN_TYPES = ['investment', 'sale_cash', 'credit_payment_received']
const MONEY_OUT_TYPES = ['withdrawal', 'expense']

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
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="h-5 w-24 rounded bg-slate-100 animate-pulse" />
          <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="h-5 w-16 rounded-full bg-slate-100 animate-pulse" />
      </div>
      <div className="h-6 w-20 rounded bg-slate-100 animate-pulse" />
    </div>
  )
}

function TransactionCard({ tx }) {
  const cfg = TX_TYPE_CONFIG[tx.type] || { label: tx.type, dot: 'bg-slate-400', bg: 'bg-slate-50 text-slate-600 border-slate-100', direction: 'out' }
  const isIn = cfg.direction === 'in'

  return (
    <div className="card p-4 flex flex-col gap-3 border border-slate-200 hover:border-slate-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        <p className={`text-lg font-bold ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
          {isIn ? '+' : '−'}৳{formatCurrency(tx.amount)}
        </p>
      </div>

      {/* Note */}
      {tx.note && (
        <p className="text-sm text-slate-600">{tx.note}</p>
      )}

      {/* Date */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-auto">
        <p className="text-xs text-slate-400">{formatDate(tx.transaction_date)}</p>
      </div>
    </div>
  )
}

function AddTransaction({ onSuccess, onCancel }) {
  const [txType, setTxType] = useState('investment')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const TYPES = [
    { value: 'investment', label: 'Investment', hint: 'Money put into the business' },
    { value: 'withdrawal', label: 'Withdrawal', hint: 'Money taken out for personal use' },
    { value: 'expense', label: 'Expense', hint: 'Business expense (rent, bills, etc.)' },
  ]

  function validate() {
    const errs = {}
    const amt = Number(amount)
    if (!amount || amt <= 0) errs.amount = 'Amount must be greater than 0'
    if (txType === 'expense' && !note.trim()) errs.note = 'Note is required for expenses'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const { error } = await supabase.from('cash_transactions').insert({
      type: txType,
      amount: Number(amount),
      note: note.trim() || null,
      transaction_date: txDate,
    })

    setLoading(false)
    if (error) {
      setErrors({ _form: error.message })
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors._form && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
          {errors._form}
        </div>
      )}

      {/* Type selector */}
      <div>
        <label className="label">Transaction Type</label>
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                txType === t.value
                  ? t.value === 'investment'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : t.value === 'withdrawal'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
              onClick={() => setTxType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {TYPES.find(t => t.value === txType) && (
          <p className="text-xs text-slate-400 mt-1">
            {TYPES.find(t => t.value === txType).hint}
          </p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="label">Amount (৳)</label>
        <input
          type="number"
          className={`input ${errors.amount ? 'input-error' : ''}`}
          placeholder="0"
          min="0"
          step="1"
          value={amount}
          onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: '' })) }}
        />
        {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
      </div>

      {/* Note */}
      <div>
        <label className="label">
          Note {txType !== 'expense' && <span className="text-slate-400 font-normal">(optional)</span>}
        </label>
        <input
          type="text"
          className={`input ${errors.note ? 'input-error' : ''}`}
          placeholder={txType === 'investment' ? 'e.g. Initial capital' : txType === 'withdrawal' ? 'e.g. Personal withdrawal' : 'e.g. Shop rent, Electricity bill…'}
          value={note}
          onChange={e => { setNote(e.target.value); setErrors(p => ({ ...p, note: '' })) }}
        />
        {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note}</p>}
      </div>

      {/* Date */}
      <div>
        <label className="label">Date</label>
        <input
          type="date"
          className="input"
          value={txDate}
          onChange={e => setTxDate(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        )}
        <button
          type="submit"
          className="btn bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Adding…' : 'Add Transaction'}
        </button>
      </div>
    </form>
  )
}

export default function CashBook() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [directionFilter, setDirectionFilter] = useState('all') // 'all' | 'in' | 'out'
  const [showAddModal, setShowAddModal] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('CashBook fetch error:', error)
    }
    setTransactions(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchTransactions() }, [])

  async function handleAddSuccess() {
    setShowAddModal(false)
    showToast('Transaction added!')
    fetchTransactions()
  }

  const filtered = transactions.filter(tx => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q || (tx.note || '').toLowerCase().includes(q)
    const cfg = TX_TYPE_CONFIG[tx.type]
    const dir = cfg?.direction || 'out'

    if (directionFilter === 'in') return matchSearch && dir === 'in'
    if (directionFilter === 'out') return matchSearch && dir === 'out'
    return matchSearch
  })

  // Summary calculations
  const totalCashIn = transactions
    .filter(t => MONEY_IN_TYPES.includes(t.type))
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const totalCashOut = transactions
    .filter(t => MONEY_OUT_TYPES.includes(t.type))
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const currentBalance = totalCashIn - totalCashOut

  const totalInvestment = transactions
    .filter(t => t.type === 'investment')
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const totalSalesCash = transactions
    .filter(t => t.type === 'sale_cash' || t.type === 'credit_payment_received')
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const totalWithdrawalsExpenses = transactions
    .filter(t => t.type === 'withdrawal' || t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount || 0), 0)

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
        <div className="stat-card border-2 border-slate-900">
          <span className="stat-label">Current Balance</span>
          <span className={`stat-value ${currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ৳{formatCurrency(currentBalance)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Investment</span>
          <span className="stat-value text-blue-600">৳{formatCurrency(totalInvestment)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sales Cash In</span>
          <span className="stat-value text-emerald-600">৳{formatCurrency(totalSalesCash)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Withdrawn / Expenses</span>
          <span className="stat-value text-red-600">৳{formatCurrency(totalWithdrawalsExpenses)}</span>
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
            placeholder="Search notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input w-auto"
          value={directionFilter}
          onChange={e => setDirectionFilter(e.target.value)}
        >
          <option value="all">All Transactions</option>
          <option value="in">Money In</option>
          <option value="out">Money Out</option>
        </select>

        <button
          className="btn-primary ml-auto"
          onClick={() => setShowAddModal(true)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Add Transaction
        </button>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-slate-400">
          {filtered.length === 0
            ? 'No transactions found'
            : `Showing ${filtered.length} of ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">No transactions yet</p>
              <p className="text-xs text-slate-400 mt-1">Add investment, expenses, or withdrawals using the button above</p>
            </div>
          </div>
        )}

        {!loading && filtered.map(tx => (
          <TransactionCard key={tx.id} tx={tx} />
        ))}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Add Transaction</h2>
              <button className="btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <AddTransaction
              onSuccess={handleAddSuccess}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
