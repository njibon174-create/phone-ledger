import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function formatCurrency(num) {
  return new Intl.NumberFormat('en-BD').format(num || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function pctChange(current, previous) {
  if (previous === null || previous === undefined) return '—'
  if (previous === 0) return current > 0 ? '+100%' : '0%'
  const change = ((current - previous) / previous) * 100
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

function getMonthRange(year, month) {
  // month is 0-indexed
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

function StatCard({ label, value, sub, color = 'text-slate-900', border }) {
  return (
    <div className={`stat-card ${border || ''}`}>
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${color}`}>{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

function ComparisonRow({ label, current, previous, isCurrency = true, invertColors = false }) {
  if (previous === null || previous === undefined) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
        <span className="text-sm text-slate-600">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-900">
            {isCurrency ? `৳${formatCurrency(current)}` : current}
          </span>
          <span className="text-xs text-slate-400">—</span>
        </div>
      </div>
    )
  }

  const change = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100
  const isPositive = current > previous
  const isNeutral = current === previous

  // For profit/loss and outstanding, up = good (green)
  // For expenses/withdrawals, down = good (red means lower which is better)
  // For outstanding baki, lower = better
  const arrowColor = isNeutral ? 'text-slate-400' : invertColors
    ? (isPositive ? 'text-red-600' : 'text-emerald-600')
    : (isPositive ? 'text-emerald-600' : 'text-red-600')
  const ArrowIcon = isPositive ? (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
  ) : isPositive === false && !isNeutral ? (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
  ) : null

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-900">
          {isCurrency ? `৳${formatCurrency(current)}` : current}
        </span>
        {!isNeutral && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${arrowColor}`}>
            {ArrowIcon}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
        {isNeutral && <span className="text-xs text-slate-400">—</span>}
        <div className="w-16 text-right">
          <span className="text-xs text-slate-400">vs {isCurrency ? `৳${formatCurrency(previous)}` : previous}</span>
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()) // 0-indexed
  const [loading, setLoading] = useState(true)
  const [currentData, setCurrentData] = useState(null)
  const [prevData, setPrevData] = useState(null)
  const [exporting, setExporting] = useState(null) // 'pdf' | 'xlsx' | null

  // ── Export helpers ─────────────────────────────────────────────────
  function buildExportPayload() {
    return {
      monthLabel,
      monthIndex: selectedMonth,
      year: selectedYear,
      generatedAt: new Date(),
      current: currentData,
      prev: prevData,
    }
  }

  function exportPDF() {
    if (!currentData) return
    setExporting('pdf')
    try {
      const payload = buildExportPayload()
      const { monthLabel, generatedAt, current, prev } = payload
      const cs = current.sales || {}
      const cb = current.baki || {}
      const cc = current.cash || {}
      const cp = current.profit || {}
      const ps = prev.sales || {}
      const pb = prev.baki || {}
      const pc = prev.cash || {}
      const pp = prev.profit || {}

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const margin = 40
      let y = 40

      // ── Header ──
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageW, 70, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('PhoneLedger — Monthly Report', margin, 35)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(monthLabel, margin, 55)
      doc.setFontSize(9)
      doc.text(`Generated: ${generatedAt.toLocaleString('en-GB')}`, pageW - margin, 55, { align: 'right' })

      y = 100
      doc.setTextColor(15, 23, 42)

      // ── Sales Summary ──
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Sales Summary', margin, y)
      y += 8

      autoTable(doc, {
        startY: y,
        head: [['Metric', 'This Month', 'Prev Month', 'Change']],
        body: [
          ['Phones Sold', String(cs.count || 0), String(ps.count || 0), pctChange(cs.count, ps.count)],
          ['Total Sales (৳)', formatCurrency(cs.amount), formatCurrency(ps.amount), pctChange(cs.amount, ps.amount)],
          ['Cash Sales (৳)', formatCurrency(cs.cashAmount), formatCurrency(ps.cashAmount), pctChange(cs.cashAmount, ps.cashAmount)],
          ['Baki Sales (৳)', formatCurrency(cs.bakiAmount), formatCurrency(ps.bakiAmount), pctChange(cs.bakiAmount, ps.bakiAmount)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        margin: { left: margin, right: margin },
      })
      y = doc.lastAutoTable.finalY + 20

      // ── Brand Breakdown ──
      if (cs.brandBreakdown && Object.keys(cs.brandBreakdown).length > 0) {
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('Brand Breakdown', margin, y)
        y += 8
        const brandRows = Object.entries(cs.brandBreakdown)
          .sort(([, a], [, b]) => b.amount - a.amount)
          .map(([brand, data]) => [brand, String(data.count), `৳${formatCurrency(data.amount)}`])
        autoTable(doc, {
          startY: y,
          head: [['Brand', 'Count', 'Amount']],
          body: brandRows,
          theme: 'striped',
          headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 10 },
          bodyStyles: { fontSize: 10 },
          margin: { left: margin, right: margin },
        })
        y = doc.lastAutoTable.finalY + 20
      }

      // ── Baki Summary ──
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Baki / Credit Summary', margin, y)
      y += 8
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: [
          ['New Baki Created', `${cb.newBakiCount || 0} (৳${formatCurrency(cb.newBakiAmount)})`],
          ['Baki Cleared This Month', `৳${formatCurrency(cb.clearedAmount)}`],
          ['Total Outstanding (all-time)', `৳${formatCurrency(cb.outstanding)}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        margin: { left: margin, right: margin },
      })
      y = doc.lastAutoTable.finalY + 20

      // ── Cash Summary ──
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Cash Summary', margin, y)
      y += 8
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'This Month', 'Prev Month', 'Change']],
        body: [
          ['Investment (৳)', formatCurrency(cc.investment), formatCurrency(pc.investment), pctChange(cc.investment, pc.investment)],
          ['Withdrawals (৳)', formatCurrency(cc.withdrawals), formatCurrency(pc.withdrawals), pctChange(cc.withdrawals, pc.withdrawals)],
          ['Expenses (৳)', formatCurrency(cc.expenses), formatCurrency(pc.expenses), pctChange(cc.expenses, pc.expenses)],
          ['Net Cash Flow (৳)', formatCurrency(cc.netFlow), formatCurrency(pc.netFlow), pctChange(cc.netFlow, pc.netFlow)],
          ['Current Cash Balance (৳)', formatCurrency(cc.balance), formatCurrency(pc.balance), pctChange(cc.balance, pc.balance)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        margin: { left: margin, right: margin },
      })
      y = doc.lastAutoTable.finalY + 20

      // ── Profit / Loss ──
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Profit & Loss', margin, y)
      y += 8
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'This Month', 'Prev Month', 'Change']],
        body: [
          ['Gross Profit (৳)', formatCurrency(cp.grossProfit), formatCurrency(pp.grossProfit), pctChange(cp.grossProfit, pp.grossProfit)],
          ['Expenses (৳)', formatCurrency(cc.expenses), formatCurrency(pc.expenses), pctChange(cc.expenses, pc.expenses)],
          ['Net Profit (৳)', formatCurrency(cp.netProfit), formatCurrency(pp.netProfit), pctChange(cp.netProfit, pp.netProfit)],
          ['Phones Sold', String(cp.soldCount || 0), String(pp.soldCount || 0), pctChange(cp.soldCount, pp.soldCount)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        margin: { left: margin, right: margin },
      })

      // ── Footer ──
      const footerY = doc.internal.pageSize.getHeight() - 20
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text('PhoneLedger • Monthly Report • ' + monthLabel, pageW / 2, footerY, { align: 'center' })

      const fname = `PhoneLedger_Report_${MONTH_NAMES[selectedMonth]}_${selectedYear}.pdf`
      doc.save(fname)
    } finally {
      setExporting(null)
    }
  }

  function exportExcel() {
    if (!currentData) return
    setExporting('xlsx')
    try {
      const payload = buildExportPayload()
      const { monthLabel, generatedAt, current, prev } = payload
      const cs = current.sales || {}
      const cb = current.baki || {}
      const cc = current.cash || {}
      const cp = current.profit || {}
      const ps = prev.sales || {}
      const pb = prev.baki || {}
      const pc = prev.cash || {}
      const pp = prev.profit || {}

      const wb = XLSX.utils.book_new()

      // ── Summary sheet ──
      const summaryRows = [
        ['PhoneLedger — Monthly Report'],
        [monthLabel],
        [`Generated: ${generatedAt.toLocaleString('en-GB')}`],
        [],
        ['Section', 'Metric', 'This Month', 'Prev Month', 'Change'],
        ['Sales', 'Phones Sold', cs.count || 0, ps.count || 0, pctChange(cs.count, ps.count)],
        ['Sales', 'Total Sales (৳)', cs.amount || 0, ps.amount || 0, pctChange(cs.amount, ps.amount)],
        ['Sales', 'Cash Sales (৳)', cs.cashAmount || 0, ps.cashAmount || 0, pctChange(cs.cashAmount, ps.cashAmount)],
        ['Sales', 'Baki Sales (৳)', cs.bakiAmount || 0, ps.bakiAmount || 0, pctChange(cs.bakiAmount, ps.bakiAmount)],
        ['Baki', 'New Baki Created (count)', cb.newBakiCount || 0, '', ''],
        ['Baki', 'New Baki Amount (৳)', cb.newBakiAmount || 0, '', ''],
        ['Baki', 'Baki Cleared (৳)', cb.clearedAmount || 0, pb.clearedAmount || 0, pctChange(cb.clearedAmount, pb.clearedAmount)],
        ['Baki', 'Total Outstanding (৳)', cb.outstanding || 0, '', ''],
        ['Cash', 'Investment (৳)', cc.investment || 0, pc.investment || 0, pctChange(cc.investment, pc.investment)],
        ['Cash', 'Withdrawals (৳)', cc.withdrawals || 0, pc.withdrawals || 0, pctChange(cc.withdrawals, pc.withdrawals)],
        ['Cash', 'Expenses (৳)', cc.expenses || 0, pc.expenses || 0, pctChange(cc.expenses, pc.expenses)],
        ['Cash', 'Net Cash Flow (৳)', cc.netFlow || 0, pc.netFlow || 0, pctChange(cc.netFlow, pc.netFlow)],
        ['Cash', 'Current Balance (৳)', cc.balance || 0, pc.balance || 0, pctChange(cc.balance, pc.balance)],
        ['Profit', 'Gross Profit (৳)', cp.grossProfit || 0, pp.grossProfit || 0, pctChange(cp.grossProfit, pp.grossProfit)],
        ['Profit', 'Net Profit (৳)', cp.netProfit || 0, pp.netProfit || 0, pctChange(cp.netProfit, pp.netProfit)],
      ]
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
      wsSummary['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 12 }]
      wsSummary['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
      ]
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

      // ── Brand Breakdown sheet ──
      if (cs.brandBreakdown && Object.keys(cs.brandBreakdown).length > 0) {
        const brandRows = [['Brand', 'Count', 'Amount (৳)']]
        Object.entries(cs.brandBreakdown)
          .sort(([, a], [, b]) => b.amount - a.amount)
          .forEach(([brand, data]) => brandRows.push([brand, data.count, data.amount]))
        const wsBrands = XLSX.utils.aoa_to_sheet(brandRows)
        wsBrands['!cols'] = [{ wch: 16 }, { wch: 10 }, { wch: 16 }]
        XLSX.utils.book_append_sheet(wb, wsBrands, 'Brand Breakdown')
      }

      const fname = `PhoneLedger_Report_${MONTH_NAMES[selectedMonth]}_${selectedYear}.xlsx`
      XLSX.writeFile(wb, fname)
    } finally {
      setExporting(null)
    }
  }

  function pctChange(current, previous) {
    if (previous === null || previous === undefined) return '—'
    if (previous === 0) return current > 0 ? '+100%' : '0%'
    const change = ((current - previous) / previous) * 100
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  async function fetchMonthData(year, month) {
    const { start, end } = getMonthRange(year, month)
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const { start: pStart, end: pEnd } = getMonthRange(prevYear, prevMonth)

    // Fetch all sales (with phone for buy_price)
    const { data: allSales } = await supabase
      .from('sales')
      .select('id, sell_price, payment_type, sale_date, phone:phones(buy_price, brand)')
      .order('sale_date', { ascending: false })

    // Fetch all credits with their payments
    const { data: allCredits } = await supabase
      .from('credits')
      .select('id, total_due, remaining, status, last_payment_date, credit_payments(amount, payment_date)')

    // Fetch all cash transactions
    const { data: allTx } = await supabase
      .from('cash_transactions')
      .select('id, type, amount, transaction_date')

    function calcSales(sales) {
      if (!sales || sales.length === 0) return { count: 0, amount: 0, cashCount: 0, cashAmount: 0, bakiCount: 0, bakiAmount: 0, brandBreakdown: {} }

      const monthSales = sales.filter(s => s.sale_date >= start && s.sale_date <= end)
      const totalCount = monthSales.length
      const totalAmount = monthSales.reduce((sum, s) => sum + Number(s.sell_price || 0), 0)

      const cashSales = monthSales.filter(s => s.payment_type === 'cash')
      const bakiSales = monthSales.filter(s => s.payment_type === 'baki')

      const brandBreakdown = {}
      monthSales.forEach(s => {
        const brand = s.phone?.brand || 'Unknown'
        if (!brandBreakdown[brand]) brandBreakdown[brand] = { count: 0, amount: 0 }
        brandBreakdown[brand].count++
        brandBreakdown[brand].amount += Number(s.sell_price || 0)
      })

      return {
        count: totalCount,
        amount: totalAmount,
        cashCount: cashSales.length,
        cashAmount: cashSales.reduce((sum, s) => sum + Number(s.sell_price || 0), 0),
        bakiCount: bakiSales.length,
        bakiAmount: bakiSales.reduce((sum, s) => sum + Number(s.sell_price || 0), 0),
        brandBreakdown,
      }
    }

    function calcBaki(credits) {
      if (!credits) return { newBakiCount: 0, newBakiAmount: 0, clearedAmount: 0, outstanding: 0 }

      // New baki created this month (credits whose sale_date is in this month — need to match via sales)
      // For simplicity, we check if the credit's associated sale is in this month
      // We don't have sale_date directly on credits, so we approximate by using the first credit_payments date
      // Actually: credits don't have sale_date — let's join with sales. For now, we'll use credit_payments to find baki created
      // Better approach: count credits where there are NO payments before this month start AND there are payments or credit exists
      // Let's use a simpler approach: credits with status pending/partial/cleared this month
      // We'll iterate through credit_payments to find total cleared this month

      const clearedAmount = (credits || [])
        .flatMap(c => c.credit_payments || [])
        .filter(p => p.payment_date >= start && p.payment_date <= end)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)

      const outstanding = (credits || [])
        .filter(c => c.status !== 'cleared')
        .reduce((sum, c) => sum + Number(c.remaining || 0), 0)

      // New baki: credits created this month — we can't determine this directly without sale_date
      // Approximate: credits whose first payment date is in this month range (they were just created)
      // Or: credits where remaining === total_due (fully outstanding) and payments exist this month
      // Actually: let's count credits that were "opened" this month by checking sale dates from sales
      // We'll pass sales in to calcBaki
      return { clearedAmount, outstanding }
    }

    function calcCash(tx) {
      if (!tx) return { investment: 0, withdrawals: 0, expenses: 0, netFlow: 0, balance: 0 }

      const monthTx = tx.filter(t => t.transaction_date >= start && t.transaction_date <= end)

      const investment = monthTx
        .filter(t => t.type === 'investment')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)

      const withdrawals = monthTx
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)

      const expenses = monthTx
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)

      const netFlow = monthTx
        .reduce((sum, t) => {
          if (['investment', 'sale_cash', 'credit_payment_received'].includes(t.type)) return sum + Number(t.amount || 0)
          if (['withdrawal', 'expense'].includes(t.type)) return sum - Number(t.amount || 0)
          return sum
        }, 0)

      const allCashIn = tx
        .filter(t => ['investment', 'sale_cash', 'credit_payment_received'].includes(t.type))
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)
      const allCashOut = tx
        .filter(t => ['withdrawal', 'expense'].includes(t.type))
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)
      const balance = allCashIn - allCashOut

      return { investment, withdrawals, expenses, netFlow, balance }
    }

    function calcProfit(sales, expenses) {
      const monthSales = (sales || []).filter(s => s.sale_date >= start && s.sale_date <= end)
      const grossProfit = monthSales.reduce((sum, s) => {
        const buyPrice = Number(s.phone?.buy_price || 0)
        const sellPrice = Number(s.sell_price || 0)
        return sum + (sellPrice - buyPrice)
      }, 0)
      const monthExpenses = expenses || 0
      const netProfit = grossProfit - monthExpenses
      return { grossProfit, netProfit, soldCount: monthSales.length }
    }

    // For new baki count, we need sales with payment_type=baki and sale_date in range
    function calcNewBaki(sales) {
      if (!sales) return 0
      return sales.filter(s =>
        s.payment_type === 'baki' &&
        s.sale_date >= start &&
        s.sale_date <= end
      ).length
    }

    function calcNewBakiAmount(sales) {
      if (!sales) return 0
      return sales
        .filter(s => s.payment_type === 'baki' && s.sale_date >= start && s.sale_date <= end)
        .reduce((sum, s) => sum + Number(s.sell_price || 0), 0)
    }

    const salesData = calcSales(allSales)
    const bakiData = calcBaki(allCredits)
    bakiData.newBakiCount = calcNewBaki(allSales)
    bakiData.newBakiAmount = calcNewBakiAmount(allSales)

    const cashData = calcCash(allTx)
    const profitData = calcProfit(allSales, cashData.expenses)

    return { sales: salesData, baki: bakiData, cash: cashData, profit: profitData }
  }

  async function fetchData() {
    setLoading(true)
    const curr = await fetchMonthData(selectedYear, selectedMonth)
    const prev = await fetchMonthData(
      selectedMonth === 0 ? selectedYear - 1 : selectedYear,
      selectedMonth === 0 ? 11 : selectedMonth - 1
    )
    setCurrentData(curr)
    setPrevData(prev)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [selectedYear, selectedMonth])

  function prevMonth() {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }
  function nextMonth() {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-slate-400">Loading report…</div>
        </div>
      </div>
    )
  }

  const s = currentData?.sales || {}
  const b = currentData?.baki || {}
  const c = currentData?.cash || {}
  const p = currentData?.profit || {}

  const ps = prevData?.sales || {}
  const pb = prevData?.baki || {}
  const pc = prevData?.cash || {}
  const pp = prevData?.profit || {}

  return (
    <div className="space-y-6">
      {/* Month Navigator */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm" onClick={prevMonth}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Prev
          </button>
          <h2 className="text-lg font-bold text-slate-900 px-2">{monthLabel}</h2>
          <button className="btn-secondary btn-sm" onClick={nextMonth}>
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-secondary btn-sm"
            onClick={exportPDF}
            disabled={exporting !== null || !currentData}
            title="Export as PDF"
          >
            {exporting === 'pdf' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export PDF
              </>
            )}
          </button>
          <button
            className="btn-secondary btn-sm"
            onClick={exportExcel}
            disabled={exporting !== null || !currentData}
            title="Export as Excel"
          >
            {exporting === 'xlsx' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── SALES ── */}
      <SectionCard title="📊 Sales">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="Phones Sold" value={s.count || 0} />
          <StatCard label="Total Sales" value={`৳${formatCurrency(s.amount)}`} color="text-slate-900" />
          <StatCard label="Cash Sales" value={`৳${formatCurrency(s.cashAmount)}`} sub={`${s.cashCount || 0} phones`} color="text-emerald-600" />
          <StatCard label="Baki Sales" value={`৳${formatCurrency(s.bakiAmount)}`} sub={`${s.bakiCount || 0} phones`} color="text-amber-600" />
        </div>

        {/* Brand breakdown */}
        {s.brandBreakdown && Object.keys(s.brandBreakdown).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Brand Breakdown</p>
            <div className="space-y-1.5">
              {Object.entries(s.brandBreakdown)
                .sort(([, a], [, b]) => b.amount - a.amount)
                .map(([brand, data]) => (
                  <div key={brand} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700 w-24 truncate">{brand}</span>
                      <span className="text-xs text-slate-400">{data.count} phone{data.count !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">৳{formatCurrency(data.amount)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── BAKI ── */}
      <SectionCard title="🧾 Baki / Credit">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="New Baki Created" value={b.newBakiCount || 0} sub={`৳${formatCurrency(b.newBakiAmount)}`} color="text-amber-600" />
          <StatCard label="Baki Cleared (payments)" value={`৳${formatCurrency(b.clearedAmount)}`} color="text-emerald-600" />
          <StatCard label="Total Outstanding" value={`৳${formatCurrency(b.outstanding)}`} color="text-red-600" />
        </div>
      </SectionCard>

      {/* ── CASH FLOW ── */}
      <SectionCard title="💰 Cash Flow">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="Investment" value={`৳${formatCurrency(c.investment)}`} color="text-blue-600" />
          <StatCard label="Withdrawals" value={`৳${formatCurrency(c.withdrawals)}`} color="text-amber-600" />
          <StatCard label="Expenses" value={`৳${formatCurrency(c.expenses)}`} color="text-red-600" />
          <StatCard label="Net Flow (This Month)" value={`৳${formatCurrency(c.netFlow)}`} color={c.netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'} />
        </div>
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Current Cash Balance</span>
            <span className={`text-lg font-bold ${c.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ৳{formatCurrency(c.balance)}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* ── PROFIT / LOSS ── */}
      <div className="card p-5 border-2 border-slate-900">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">📈 Profit & Loss</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Gross Profit</p>
            <p className={`text-xl font-bold ${p.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ৳{formatCurrency(p.grossProfit)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Expenses</p>
            <p className="text-xl font-bold text-red-600">৳{formatCurrency(c.expenses)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Net Profit</p>
            <p className={`text-2xl font-bold ${p.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ৳{formatCurrency(p.netProfit)}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center">
          {p.soldCount || 0} phones sold · buy price vs sell price
        </p>
      </div>

      {/* ── VS LAST MONTH ── */}
      <SectionCard title="↔️ vs Last Month">
        <div className="space-y-0">
          <ComparisonRow label="Total Sales Amount" current={s.amount} previous={ps.amount} />
          <ComparisonRow label="Phones Sold" current={s.count} previous={ps.count} isCurrency={false} />
          <ComparisonRow label="Cash Sales" current={s.cashAmount} previous={ps.cashAmount} />
          <ComparisonRow label="Baki Sales" current={s.bakiAmount} previous={ps.bakiAmount} />
          <ComparisonRow label="Baki Cleared" current={b.clearedAmount} previous={pb.clearedAmount} />
          <ComparisonRow label="Net Cash Flow" current={c.netFlow} previous={pc.netFlow} />
          <ComparisonRow label="Expenses" current={c.expenses} previous={pc.expenses} invertColors={true} />
          <ComparisonRow label="Net Profit" current={p.netProfit} previous={pp.netProfit} />
          <ComparisonRow label="Current Balance" current={c.balance} previous={pc.balance} />
        </div>
      </SectionCard>
    </div>
  )
}
