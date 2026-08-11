import { useState } from 'react'
import AddPhone from './pages/AddPhone'
import InventoryList from './pages/InventoryList'
import SalesList from './pages/SalesList'
import BakiLedger from './pages/BakiLedger'
import CashBook from './pages/CashBook'
import Reports from './pages/Reports'

const NAV = [
  {
    id: 'inventory',
    label: 'Inventory',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
      </svg>
    ),
    desc: 'Manage phone stock',
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
      </svg>
    ),
    desc: 'View sales history',
  },
  {
    id: 'baki',
    label: 'Baki Ledger',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
    desc: 'Track credit & baki',
  },
  {
    id: 'cashbook',
    label: 'Cash Book',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    desc: 'Cash in & out flow',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    ),
    desc: 'Monthly P&L reports',
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleAddSuccess() {
    setActiveTab('inventory')
  }

  const PAGE_TITLES = {
    inventory: { title: 'Inventory', sub: 'Manage your phone stock' },
    sales: { title: 'Sales', sub: 'View all sales history' },
    baki: { title: 'Baki Ledger', sub: 'Track credit & baki payments' },
    cashbook: { title: 'Cash Book', sub: 'Track cash transactions' },
    reports: { title: 'Reports', sub: 'Monthly reports & profit/loss' },
  }
  const { title: pageTitle, sub: pageSub } = PAGE_TITLES[activeTab] || {}

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#111827' }}>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-gray-700"
        style={{ backgroundColor: '#111827' }}>
        {/* Gradient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-neon-green to-neon-blue shrink-0" />

        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0, 255, 136, 0.15)', boxShadow: '0 0 12px rgba(0, 255, 136, 0.2)' }}
            >
              <svg className="w-4 h-4" style={{ color: '#00FF88' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
            </div>
            <h1 className="text-sm font-bold" style={{ color: '#00FF88' }}>PhoneLedger</h1>
          </div>
          <p className="text-xs ml-9" style={{ color: '#00D4FF' }}>Business Dashboard</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                activeTab === item.id
                  ? 'bg-neon-green/10'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
              style={activeTab !== item.id ? { color: '#9CA3AF' } : {}}
            >
              {activeTab === item.id && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ backgroundColor: '#00FF88', boxShadow: '0 0 8px rgba(0, 255, 136, 0.6)' }}
                />
              )}
              <span style={{ color: activeTab === item.id ? '#00FF88' : '#9CA3AF' }}>{item.icon}</span>
              <span style={{ color: activeTab === item.id ? '#00FF88' : '#9CA3AF' }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-700 px-5 py-4">
          <p className="text-xs" style={{ color: '#6B7280' }}>v1.0 — PhoneLedger</p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 border-b px-4 py-3"
        style={{ backgroundColor: '#111827', borderColor: '#374151' }}>
        <button
          className="btn-ghost btn-sm"
          onClick={() => setSidebarOpen(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 255, 136, 0.15)', boxShadow: '0 0 8px rgba(0, 255, 136, 0.2)' }}
          >
            <svg className="w-3.5 h-3.5" style={{ color: '#00FF88' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
          </div>
          <h1 className="text-sm font-bold" style={{ color: '#00FF88' }}>PhoneLedger</h1>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside
            className="relative w-64 pt-6 px-3 shadow-xl flex flex-col"
            style={{ backgroundColor: '#111827' }}
          >
            <div className="px-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0, 255, 136, 0.15)', boxShadow: '0 0 12px rgba(0, 255, 136, 0.2)' }}
                >
                  <svg className="w-4 h-4" style={{ color: '#00FF88' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h1 className="text-sm font-bold" style={{ color: '#00FF88' }}>PhoneLedger</h1>
              </div>
              <button className="btn-ghost btn-sm" onClick={() => setSidebarOpen(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="h-px mx-3 mb-4" style={{ backgroundColor: '#374151' }} />
            <nav className="flex-1 px-2 space-y-0.5">
              {NAV.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-neon-green/10'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                  style={activeTab !== item.id ? { color: '#9CA3AF' } : {}}
                >
                  <span style={{ color: activeTab === item.id ? '#00FF88' : '#9CA3AF' }}>{item.icon}</span>
                  <div className="text-left">
                    <p style={{ color: activeTab === item.id ? '#00FF88' : '#D1D5DB' }}>{item.label}</p>
                    <p className="text-xs font-normal" style={{ color: '#6B7280' }}>{item.desc}</p>
                  </div>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:pt-10">
          {/* Mobile top padding */}
          <div className="md:hidden h-14" />

          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#E5E7EB' }}>{pageTitle}</h2>
              <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{pageSub}</p>
            </div>
            {activeTab === 'inventory' && (
              <button
                className="btn-primary"
                onClick={() => setActiveTab('add')}
                style={{
                  background: 'linear-gradient(135deg, #00FF88, #00D4FF)',
                  border: 'none',
                  boxShadow: '0 0 16px rgba(0, 255, 136, 0.3), 0 0 16px rgba(0, 212, 255, 0.2)'
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                Add Phone
              </button>
            )}
          </div>

          {/* Pages */}
          {activeTab === 'add' && (
            <div className="max-w-lg">
              <div className="card p-6">
                <h3 className="text-base font-semibold mb-4" style={{ color: '#E5E7EB' }}>Add New Phone</h3>
                <AddPhone
                  onSuccess={handleAddSuccess}
                  onCancel={() => setActiveTab('inventory')}
                />
              </div>
            </div>
          )}

          {activeTab === 'inventory' && <InventoryList />}
          {activeTab === 'sales' && <SalesList />}
          {activeTab === 'baki' && <BakiLedger />}
          {activeTab === 'cashbook' && <CashBook />}
          {activeTab === 'reports' && <Reports />}
        </div>
      </main>
    </div>
  )
}
