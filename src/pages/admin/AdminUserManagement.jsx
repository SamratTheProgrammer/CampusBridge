import AdminSpinner from '../../components/admin/AdminSpinner'
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Trash2, 
  Ban, 
  CheckCircle,
  X,
  GraduationCap,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  ChevronDown,
  FileSpreadsheet,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/modals/ConfirmModal'
import API_BASE from '../../utils/api'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const AdminUserManagement = () => {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/admin/users`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.users) {
          const formatted = data.users.map(u => ({
            id: u._id,
            clerkId: u.clerkId,
            username: u.username || u.clerkId || u._id,
            imageUrl: u.imageUrl || u.avatar || '',
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'User',
            email: u.email,
            dept: u.headline || 'General',
            year: u.role ? u.role.toUpperCase() : 'STUDENT',
            status: u.isBlocked ? 'Blocked' : 'Active',
            isBlocked: !!u.isBlocked,
            blockReason: u.blockReason || ''
          }))
          setStudents(formatted)
        }
      }
    } catch (err) {
      console.error('Failed to fetch users for admin management:', err)
      toast.error('Failed to load user records')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [yearFilter, setYearFilter] = useState('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // Form State for Adding Student
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newDept, setNewDept] = useState('Computer Science')
  const [newYear, setNewYear] = useState('1st Year')

  // Block Modal State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [blockTargetUser, setBlockTargetUser] = useState(null)
  const [blockReasonInput, setBlockReasonInput] = useState('')
  const [isBlocking, setIsBlocking] = useState(false)

  // Delete Confirmation State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Export State & Handlers
  const [isExportOpen, setIsExportOpen] = useState(false)
  const exportRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setIsExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getExportData = () => {
    const list = filteredStudents.length > 0 ? filteredStudents : students
    return list.map((student, idx) => ({
      index: idx + 1,
      id: student.id,
      name: student.name,
      username: student.username || '',
      email: student.email,
      dept: student.dept,
      role: student.year,
      status: student.status,
      isBlocked: student.isBlocked ? 'Yes' : 'No',
      blockReason: student.blockReason || ''
    }))
  }

  const exportToExcel = () => {
    try {
      const data = getExportData()
      if (data.length === 0) {
        toast.error('No user records found to export')
        return
      }

      const rows = data.map(u => ({
        '#': u.index,
        'Name': u.name,
        'Username': u.username ? `@${u.username}` : '',
        'Email Address': u.email,
        'Role': u.role,
        'Department / Headline': u.dept,
        'Status': u.status,
        'Blocked': u.isBlocked,
        'Block Reason': u.blockReason || 'None',
        'User ID': u.id
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 22 },
        { wch: 32 },
        { wch: 14 },
        { wch: 28 },
        { wch: 12 },
        { wch: 10 },
        { wch: 30 },
        { wch: 26 }
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Registered Users')
      const fileName = `CampusBridge_Users_${new Date().toISOString().slice(0, 10)}.xlsx`
      XLSX.writeFile(wb, fileName)
      toast.success(`Exported ${data.length} users to Excel successfully!`)
      setIsExportOpen(false)
    } catch (err) {
      console.error('Export Excel error:', err)
      toast.error('Failed to export to Excel')
    }
  }

  const exportToPDF = () => {
    try {
      const data = getExportData()
      if (data.length === 0) {
        toast.error('No user records found to export')
        return
      }

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.width

      // Brand Header Banner
      doc.setFillColor(124, 58, 237)
      doc.rect(0, 0, pageWidth, 55, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('CampusBridge - User Management Report', 36, 35)

      // Subheader Info
      doc.setTextColor(70, 70, 70)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const now = new Date().toLocaleString()
      const filterText = deptFilter !== 'All' ? ` | Department: ${deptFilter}` : ''
      const searchTxt = searchQuery ? ` | Search: "${searchQuery}"` : ''
      doc.text(`Generated on: ${now} | Total Records: ${data.length}${filterText}${searchTxt}`, 36, 75)

      const tableRows = data.map(u => [
        u.index,
        u.name,
        u.username ? `@${u.username}` : '-',
        u.email,
        u.role,
        u.dept,
        u.status
      ])

      const autoTableFunc = autoTable.default || autoTable
      autoTableFunc(doc, {
        startY: 90,
        head: [['#', 'Name', 'Username', 'Email Address', 'Role', 'Department / Headline', 'Status']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [124, 58, 237],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [30, 30, 30]
        },
        alternateRowStyles: {
          fillColor: [248, 249, 253]
        },
        margin: { left: 36, right: 36, bottom: 36 },
        didDrawPage: () => {
          const pageCount = doc.internal.getNumberOfPages()
          doc.setFontSize(8)
          doc.setTextColor(140, 140, 140)
          doc.text(`Page ${pageCount} | CampusBridge Administration Portal • Confidential`, 36, doc.internal.pageSize.height - 18)
        }
      })

      const fileName = `CampusBridge_Users_${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(fileName)
      toast.success(`Exported ${data.length} users to PDF successfully!`)
      setIsExportOpen(false)
    } catch (err) {
      console.error('Export PDF error:', err)
      toast.error('Failed to export to PDF')
    }
  }

  const exportToCSV = () => {
    try {
      const data = getExportData()
      if (data.length === 0) {
        toast.error('No user records found to export')
        return
      }

      const rows = data.map(u => ({
        '#': u.index,
        'Name': u.name,
        'Username': u.username ? `@${u.username}` : '',
        'Email Address': u.email,
        'Role': u.role,
        'Department / Headline': u.dept,
        'Status': u.status,
        'Blocked': u.isBlocked,
        'Block Reason': u.blockReason || 'None',
        'User ID': u.id
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Users')
      const fileName = `CampusBridge_Users_${new Date().toISOString().slice(0, 10)}.csv`
      XLSX.writeFile(wb, fileName, { bookType: 'csv' })
      toast.success(`Exported ${data.length} users to CSV successfully!`)
      setIsExportOpen(false)
    } catch (err) {
      console.error('Export CSV error:', err)
      toast.error('Failed to export to CSV')
    }
  }

  // Open Block Modal
  const openBlockModal = (student) => {
    setBlockTargetUser(student)
    setBlockReasonInput('Violation of platform community terms and guidelines')
    setIsBlockModalOpen(true)
  }

  // Submit Block API
  const handleBlockUser = async (e) => {
    e.preventDefault()
    if (!blockTargetUser) return

    try {
      setIsBlocking(true)
      const res = await fetch(`${API_BASE}/api/admin/users/${blockTargetUser.id}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: true, blockReason: blockReasonInput })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setStudents(prev => prev.map(s => s.id === blockTargetUser.id ? { 
          ...s, 
          status: 'Blocked', 
          isBlocked: true, 
          blockReason: blockReasonInput 
        } : s))
        toast.success(`${blockTargetUser.name} has been blocked!`)
        setIsBlockModalOpen(false)
        setBlockTargetUser(null)
      } else {
        toast.error(data.message || 'Failed to block user')
      }
    } catch (err) {
      console.error('Error blocking user:', err)
      toast.error('Failed to communicate with server')
    } finally {
      setIsBlocking(false)
    }
  }

  // Unblock API
  const handleUnblockUser = async (student) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${student.id}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: false })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setStudents(prev => prev.map(s => s.id === student.id ? { 
          ...s, 
          status: 'Active', 
          isBlocked: false, 
          blockReason: '' 
        } : s))
        toast.success(`${student.name} is now unblocked and active!`)
      } else {
        toast.error(data.message || 'Failed to unblock user')
      }
    } catch (err) {
      console.error('Error unblocking user:', err)
      toast.error('Failed to unblock user')
    }
  }

  const confirmDelete = (id, name) => {
    setDeleteTarget({ id, name })
    setIsConfirmOpen(true)
  }

  // Delete User API (Deletes from MongoDB + Clerk Authentication)
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStudents(prev => prev.filter(s => s.id !== deleteTarget.id))
        toast.success(`${deleteTarget.name} deleted from Database & Clerk.`)
      } else {
        toast.error(data.message || 'Failed to delete user from database')
      }
    } catch (err) {
      console.error('Error deleting user:', err)
      toast.error('Error deleting user')
    } finally {
      setIsConfirmOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleAddStudent = (e) => {
    e.preventDefault()
    if (!newName || !newEmail) {
      toast.error('Name and Email are required.')
      return
    }
    const newStudent = {
      id: students.length + 1,
      name: newName,
      email: newEmail,
      dept: newDept,
      year: newYear,
      status: 'Active',
      isBlocked: false,
      blockReason: ''
    }
    setStudents([newStudent, ...students])
    setIsAddModalOpen(false)
    setNewName('')
    setNewEmail('')
    toast.success(`${newName} added successfully!`)
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDept = deptFilter === 'All' || student.dept === deptFilter
    const matchesYear = yearFilter === 'All' || student.year === yearFilter
    return matchesSearch && matchesDept && matchesYear
  })

  return (
    <div className="w-full space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage, moderate, block, or remove registered user records.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button 
            onClick={fetchUsers}
            disabled={isLoading}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-muted border border-border/60 text-foreground hover:bg-muted/80 transition-all flex items-center gap-1.5"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Refresh
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/10 text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search user by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
            <select 
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold focus:outline-none cursor-pointer appearance-none min-w-[120px]"
            >
              <option value="All">All Depts</option>
              <option value="Computer Science">Computer Science</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
            </select>

            <div className="relative" ref={exportRef}>
              <button 
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold flex items-center gap-2 hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-primary" />
                <span>Export</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border/60 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40">
                    Export {filteredStudents.length} Records
                  </div>
                  <button 
                    onClick={exportToExcel}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-bold">Excel Sheet</div>
                      <div className="text-[10px] text-muted-foreground font-normal">.xlsx spreadsheet format</div>
                    </div>
                  </button>
                  <button 
                    onClick={exportToPDF}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <div className="font-bold">PDF Document</div>
                      <div className="text-[10px] text-muted-foreground font-normal">.pdf formatted table report</div>
                    </div>
                  </button>
                  <button 
                    onClick={exportToCSV}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <div className="font-bold">CSV File</div>
                      <div className="text-[10px] text-muted-foreground font-normal">.csv plain tabular format</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <AdminSpinner message="Loading registered users from database..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="whitespace-nowrap w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Department / Headline</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr 
                      key={student.id} 
                      onClick={() => navigate(`/admin/users/${student.username || student.clerkId || student.id}`)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {student.imageUrl ? (
                            <img 
                              src={student.imageUrl} 
                              alt={student.name} 
                              className="w-9 h-9 rounded-full object-cover border border-border/50 shrink-0" 
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 border border-primary/20">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                              {student.name}
                            </div>
                            {student.username && (
                              <div className="text-[11px] text-muted-foreground">@{student.username}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{student.email}</td>
                      <td className="px-6 py-4 text-foreground text-xs">{student.dept}</td>
                      <td className="px-6 py-4 text-muted-foreground font-semibold text-xs">{student.year}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          student.status === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        {student.isBlocked ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUnblockUser(student); }}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Unblock User Account"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); openBlockModal(student); }}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Block User Account"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); confirmDelete(student.id, student.name); }}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Delete User (MongoDB & Clerk)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                      No user records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Block User Modal */}
      {isBlockModalOpen && blockTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/60 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsBlockModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-foreground text-lg">Block User Account</h3>
                <p className="text-xs text-muted-foreground">Restrict access for {blockTargetUser.name}</p>
              </div>
            </div>

            <form onSubmit={handleBlockUser} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Reason for Block / Suspension Note *</label>
                <textarea 
                  rows="4"
                  required
                  placeholder="Specify the reason for blocking this user (e.g. Violation of community guidelines, credentials mismatch, or policy breach)..."
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                ></textarea>
                <p className="text-[11px] text-muted-foreground">This reason will be displayed on the user's screen when they attempt to access their dashboard.</p>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-border/40">
                <button 
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 border border-border/60 hover:bg-muted text-foreground font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isBlocking}
                  className="px-5 py-2 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/10 disabled:opacity-50 cursor-pointer"
                >
                  {isBlocking && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Block User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-xl animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-foreground text-lg">Add New Student</h3>
                <p className="text-xs text-muted-foreground">Register a student manually</p>
              </div>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full mt-2 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/95 transition-all text-sm shadow-md shadow-primary/10"
              >
                Add Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete User Account"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This will permanently remove the user from MongoDB database AND Clerk authentication system.`}
      />
    </div>
  )
}

export default AdminUserManagement
