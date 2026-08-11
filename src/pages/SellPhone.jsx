import { useState } from 'react'
import { supabase } from '../lib/supabase'

function formatCurrency(num) {
  return new Intl.NumberFormat('en-BD').format(num || 0)
}

export default function SellPhone({ phone, onSuccess, onCancel }) {
  const [sellPrice, setSellPrice] = useState(String(phone.mrp || ''))
  const [paymentType, setPaymentType] = useState('cash') // 'cash' | 'baki'
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const errs = {}
    if (!sellPrice || Number(sellPrice) <= 0) errs.sellPrice = 'Valid sell price required'
    if (paymentType === 'baki' && !buyerName.trim()) errs.buyerName = 'Buyer name required for credit sale'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const sellPriceNum = Number(sellPrice)
    const today = new Date().toISOString().split('T')[0]

    // 1. Update phone status to sold
    const { error: phoneErr } = await supabase
      .from('phones')
      .update({ status: 'sold' })
      .eq('id', phone.id)

    if (phoneErr) {
      setLoading(false)
      setErrors({ _form: phoneErr.message })
      return
    }

    // 2. Insert sale record
    const { data: saleData, error: saleErr } = await supabase
      .from('sales')
      .insert({
        phone_id: phone.id,
        sell_price: sellPriceNum,
        payment_type: paymentType,
        buyer_name: paymentType === 'baki' ? buyerName.trim() : null,
        buyer_phone: paymentType === 'baki' ? buyerPhone.trim() || null : null,
        status: 'completed',
        sale_date: today,
      })
      .select()
      .single()

    if (saleErr) {
      setLoading(false)
      setErrors({ _form: saleErr.message })
      return
    }

    // 3. If cash — insert cash_transactions; if baki — insert credits
    if (paymentType === 'cash') {
      await supabase.from('cash_transactions').insert({
        type: 'sale_cash',
        amount: sellPriceNum,
        note: `Sale: ${phone.brand} ${phone.model}`,
        transaction_date: today,
      })
    } else {
      await supabase.from('credits').insert({
        sale_id: saleData.id,
        total_due: sellPriceNum,
        paid_amount: 0,
        remaining: sellPriceNum,
        status: 'pending',
      })
    }

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

      {/* Phone Info */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
        <p className="text-sm font-semibold text-slate-800">{phone.brand} {phone.model}</p>
        <p className="font-mono text-xs text-slate-400">{phone.imei}</p>
        <p className="text-sm text-slate-500">MRP: ৳{formatCurrency(phone.mrp)}</p>
      </div>

      {/* Sell Price */}
      <div>
        <label className="label">Sell Price (৳)</label>
        <input
          type="number"
          className={`input ${errors.sellPrice ? 'input-error' : ''}`}
          placeholder="0"
          min="0"
          step="1"
          value={sellPrice}
          onChange={e => { setSellPrice(e.target.value); setErrors(p => ({ ...p, sellPrice: '' })) }}
        />
        {errors.sellPrice && <p className="mt-1 text-xs text-red-500">{errors.sellPrice}</p>}
      </div>

      {/* Payment Type Toggle */}
      <div>
        <label className="label">Payment Type</label>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all ${
              paymentType === 'cash'
                ? 'bg-emerald-50 text-emerald-700 border-r border-slate-200'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => setPaymentType('cash')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"/>
            </svg>
            Cash
          </button>
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all ${
              paymentType === 'baki'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => setPaymentType('baki')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Baki (Credit)
          </button>
        </div>
      </div>

      {/* Baki Fields */}
      {paymentType === 'baki' && (
        <div className="space-y-3 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Buyer Info (Required for Credit)</p>
          <div>
            <label className="label">Buyer Name *</label>
            <input
              type="text"
              className={`input ${errors.buyerName ? 'input-error' : ''}`}
              placeholder="e.g. Rahim Ahmed"
              value={buyerName}
              onChange={e => { setBuyerName(e.target.value); setErrors(p => ({ ...p, buyerName: '' })) }}
            />
            {errors.buyerName && <p className="mt-1 text-xs text-red-500">{errors.buyerName}</p>}
          </div>
          <div>
            <label className="label">Buyer Phone (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 01712345678"
              value={buyerPhone}
              onChange={e => setBuyerPhone(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Profit indicator */}
      {sellPrice && Number(sellPrice) > 0 && (
        <div className={`rounded-lg px-4 py-2.5 text-sm flex items-center justify-between ${
          Number(sellPrice) > phone.buy_price
            ? 'bg-emerald-50 text-emerald-700'
            : Number(sellPrice) < phone.buy_price
              ? 'bg-red-50 text-red-600'
              : 'bg-slate-50 text-slate-500'
        }`}>
          <span className="text-xs font-medium">
            {Number(sellPrice) > phone.buy_price ? 'Profit' : Number(sellPrice) < phone.buy_price ? 'Loss' : 'Break-even'}
          </span>
          <span className="font-semibold">
            ৳{formatCurrency(Math.abs(Number(sellPrice) - phone.buy_price))}
          </span>
        </div>
      )}

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
          {loading ? 'Processing…' : 'Complete Sale'}
        </button>
      </div>
    </form>
  )
}
