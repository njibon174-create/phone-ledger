import { useState } from 'react'
import { supabase } from '../lib/supabase'

function formatCurrency(num) {
  return new Intl.NumberFormat('en-BD').format(num || 0)
}

export default function AddPayment({ credit, onSuccess, onCancel }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const remaining = Number(credit.remaining) || 0

  function validate() {
    const errs = {}
    const amt = Number(amount)
    if (!amount || amt <= 0) errs.amount = 'Amount must be greater than 0'
    if (amt > remaining) errs.amount = `Amount cannot exceed remaining (৳${formatCurrency(remaining)})`
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const paymentAmt = Number(amount)
    const today = new Date().toISOString().split('T')[0]
    const newRemaining = remaining - paymentAmt
    const newStatus = newRemaining <= 0 ? 'cleared' : 'partial'

    // 1. Insert credit_payment
    const { error: paymentErr } = await supabase.from('credit_payments').insert({
      credit_id: credit.id,
      amount: paymentAmt,
      payment_date: today,
      note: note.trim() || null,
    })

    if (paymentErr) {
      setLoading(false)
      setErrors({ _form: paymentErr.message })
      return
    }

    // 2. Update credits record
    const { error: creditErr } = await supabase
      .from('credits')
      .update({
        paid_amount: (Number(credit.paid_amount) || 0) + paymentAmt,
        remaining: newRemaining,
        status: newStatus,
        last_payment_date: today,
      })
      .eq('id', credit.id)

    if (creditErr) {
      setLoading(false)
      setErrors({ _form: creditErr.message })
      return
    }

    // 3. Insert cash_transaction
    const buyerName = credit.sale?.buyer_name || 'Unknown'
    await supabase.from('cash_transactions').insert({
      type: 'credit_payment_received',
      amount: paymentAmt,
      note: `Payment from ${buyerName}`,
      transaction_date: today,
    })

    setLoading(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors._form && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
          {errors._form}
        </div>
      )}

      {/* Remaining info */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-xs text-slate-500 font-medium mb-1">Remaining Balance</p>
        <p className="text-2xl font-bold text-slate-900">৳{formatCurrency(remaining)}</p>
      </div>

      {/* Payment Amount */}
      <div>
        <label className="label">Payment Amount (৳)</label>
        <input
          type="number"
          className={`input ${errors.amount ? 'input-error' : ''}`}
          placeholder="0"
          min="0"
          max={remaining}
          step="1"
          value={amount}
          onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: '' })) }}
        />
        {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
      </div>

      {/* Note */}
      <div>
        <label className="label">Note (optional)</label>
        <input
          type="text"
          className="input"
          placeholder="e.g. Partial payment, baki astechile…"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      {/* Quick amount buttons */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 5, 10].map(mult => {
          const val = Math.min(mult * 1000, remaining)
          if (val <= 0) return null
          return (
            <button
              key={mult}
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setAmount(String(val))}
            >
              ৳{formatCurrency(val)}
            </button>
          )
        })}
        <button
          type="button"
          className="btn btn-sm bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
          onClick={() => setAmount(String(remaining))}
        >
          Clear Full ৳{formatCurrency(remaining)}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        )}
        <button
          type="submit"
          className="btn bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Recording…' : 'Record Payment'}
        </button>
      </div>
    </form>
  )
}
