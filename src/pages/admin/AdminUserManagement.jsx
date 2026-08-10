import React, { useState, useEffect } from 'react'
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
  ShieldAlert
} from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/modals/ConfirmModal'

const AdminUserManagement = () => {
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.users) {
          const formatted = data.users.map(u => ({
            id: u._id,
            clerkId: u.clerkId,
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
      const res = await fetch(`/api/admin/users/${blockTargetUser.id}/block`, {
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
      const res = await fetch(`/api/admin/users/${student.id}/block`, {
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
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
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
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
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

            <button className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold flex items-center gap-2 hover:bg-muted/60 transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Loading registered users from database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
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
                    <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{student.name}</td>
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
                      <td className="px-6 py-4 text-right space-x-1">
                        {student.isBlocked ? (
                          <button 
                            onClick={() => handleUnblockUser(student)}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Unblock User Account"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => openBlockModal(student)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Block User Account"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => confirmDelete(student.id, student.name)}
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
          <div className="bg-card border border-border/60 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200">
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
