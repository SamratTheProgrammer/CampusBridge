import React, { useState } from 'react'
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Ban, 
  CheckCircle,
  X,
  GraduationCap
} from 'lucide-react'
import toast from 'react-hot-toast'

const AdminUserManagement = () => {
  const [students, setStudents] = useState([
    { id: 1, name: 'Rahul Sharma', email: 'rahul@gmail.com', dept: 'Computer Science', year: '3rd Year', status: 'Active' },
    { id: 2, name: 'Priya Singh', email: 'priya@gmail.com', dept: 'IT', year: '2nd Year', status: 'Active' },
    { id: 3, name: 'Aman Verma', email: 'aman@gmail.com', dept: 'ECE', year: '4th Year', status: 'Active' },
    { id: 4, name: 'Sneha Patel', email: 'sneha@gmail.com', dept: 'CSE', year: '1st Year', status: 'Blocked' },
    { id: 5, name: 'Karan Mehta', email: 'karan@gmail.com', dept: 'AI & ML', year: '2nd Year', status: 'Active' },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')
  const [yearFilter, setYearFilter] = useState('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // Form State
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newDept, setNewDept] = useState('Computer Science')
  const [newYear, setNewYear] = useState('1st Year')

  const handleToggleStatus = (id) => {
    setStudents(students.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'Active' ? 'Blocked' : 'Active'
        toast.success(`${s.name} is now ${nextStatus}`)
        return { ...s, status: nextStatus }
      }
      return s
    }))
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      setStudents(students.filter(s => s.id !== id))
      toast.success(`${name} has been removed.`)
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
      status: 'Active'
    }
    setStudents([...students, newStudent])
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">User Management - Students</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all registered student records on the platform.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/10 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5" /> Add Student
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search students..." 
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
              <option value="AI & ML">AI & ML</option>
            </select>

            <select 
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold focus:outline-none cursor-pointer appearance-none min-w-[120px]"
            >
              <option value="All">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>

            <button className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-foreground text-xs font-semibold flex items-center gap-2 hover:bg-muted/60 transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">{student.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{student.email}</td>
                    <td className="px-6 py-4 text-foreground">{student.dept}</td>
                    <td className="px-6 py-4 text-muted-foreground">{student.year}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        student.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button 
                        onClick={() => handleToggleStatus(student.id)}
                        className={`p-2 rounded-lg transition-colors inline-flex items-center justify-center ${
                          student.status === 'Active' 
                            ? 'text-rose-500 hover:bg-rose-500/10' 
                            : 'text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                        title={student.status === 'Active' ? 'Block Student' : 'Activate Student'}
                      >
                        {student.status === 'Active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id, student.name)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                    No student records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-muted/10 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <p>Showing 1 to {filteredStudents.length} of {students.length}</p>
          <div className="flex gap-1.5">
            <button className="px-3 py-1.5 border border-border/50 rounded-lg hover:bg-muted font-medium transition-colors" disabled>Prev</button>
            <button className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg transition-colors">1</button>
            <button className="px-3 py-1.5 border border-border/50 rounded-lg hover:bg-muted font-medium transition-colors">Next</button>
          </div>
        </div>
      </div>

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Department</label>
                  <select 
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer appearance-none"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="AI & ML">AI & ML</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Year</label>
                  <select 
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full px-3 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer appearance-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
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

    </div>
  )
}

export default AdminUserManagement
