import { useState } from 'react'
import AddPhone from './pages/AddPhone'
import InventoryList from './pages/InventoryList'
import SalesList from './pages/SalesList'

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
    desc: 'Add & manage phone stock',
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
    desc: 'View all sales history',
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleAddSuccess() {
    setActiveTab('inventory')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-slate-200 bg-white pt-6 px-3">
        {/* Logo */}
        <div className="px-3 mb-6">
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">
            📱 PhoneLedger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Inventory Manager</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 pb-6 px-3">
          <p className="text-xs text-slate-300">v1.0</p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 bg-white border-b border-slate-200 px-4 py-3">
        <button
          className="btn-ghost btn-sm"
          onClick={() => setSidebarOpen(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <h1 className="text-sm font-bold text-slate-900">📱 PhoneLedger</h1>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 bg-white pt-6 px-3 shadow-xl flex flex-col">
            <div className="px-3 mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-sm font-bold text-slate-900">📱 PhoneLedger</h1>
                <p className="text-xs text-slate-400">Inventory</p>
              </div>
              <button className="btn-ghost btn-sm" onClick={() => setSidebarOpen(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {NAV.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <div className="text-left">
                    <p>{item.label}</p>
                    <p className="text-xs text-slate-400 font-normal">{item.desc}</p>
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
              <h2 className="text-xl font-bold text-slate-900">
                {activeTab === 'inventory' && 'Inventory'}
                {activeTab === 'sales' && 'Sales'}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {activeTab === 'inventory' && 'Manage your phone stock'}
                {activeTab === 'sales' && 'View all sales history'}
              </p>
            </div>
            {activeTab === 'inventory' && (
              <button
                className="btn-primary"
                onClick={() => setActiveTab('add')}
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
                <h3 className="text-base font-semibold text-slate-900 mb-4">Add New Phone</h3>
                <AddPhone
                  onSuccess={handleAddSuccess}
                  onCancel={() => setActiveTab('inventory')}
                />
              </div>
            </div>
          )}

          {activeTab === 'inventory' && <InventoryList />}
          {activeTab === 'sales' && <SalesList />}
        </div>
      </main>
    </div>
  )
}
