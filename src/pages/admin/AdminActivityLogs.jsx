import React, { useState } from 'react'
import { Search, Download, Filter, Eye, ShieldCheck, History } from 'lucide-react'

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([
    { id: 1, user: 'Admin', action: 'Logged In', details: 'Admin logged in', ip: '192.168.1.1', time: 'May 28, 2026 10:30 AM' },
    { id: 2, user: 'Rahul Sharma', action: 'Profile Updated', details: 'Updated profile details', ip: '192.168.1.2', time: 'May 28, 2026 10:25 AM' },
    { id: 3, user: 'Priya Verma', action: 'Mentor Verified', details: 'Mentor verified', ip: '192.168.1.3', time: 'May 28, 2026 10:20 AM' },
    { id: 4, user: 'TechNova Inc.', action: 'Job Posted', details: 'New job posted', ip: '192.168.1.4', time: 'May 28, 2026 10:15 AM' },
    { id: 5, user: 'Sneha Patel', action: 'Account Blocked', details: 'Account blocked by admin', ip: '192.168.1.5', time: 'May 28, 2026 10:10 AM' },
  ])

  const [search, setSearch] = useState('')

  const filteredLogs = logs.filter(l => 
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">Track all important audit trails and operational activities on the platform.</p>
        </div>
        <button className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold flex items-center gap-2 hover:bg-muted/60 transition-colors self-start sm:self-auto">
          <Download className="w-4 h-4" /> Export Logs
        </button>
      </div>

      {/* Filter Options */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by user, action or details..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        <button className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold flex items-center gap-2 hover:bg-muted/60 transition-colors w-full md:w-auto justify-center">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2">
                      <History className="w-4 h-4 text-primary shrink-0" />
                      {log.user}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                        log.action === 'Logged In'
                          ? 'bg-blue-500/10 text-blue-500'
                          : log.action === 'Account Blocked'
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{log.details}</td>
                    <td className="px-6 py-4 text-muted-foreground font-semibold">{log.ip}</td>
                    <td className="px-6 py-4 text-muted-foreground">{log.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    No activity logs found matching constraints.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminActivityLogs
