import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Building2, ExternalLink, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/modals/ConfirmModal'
import API_BASE from '../../utils/api'

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE}/api/admin/companies`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.companies) {
          setCompanies(data.companies)
        }
      } else {
        toast.error('Failed to fetch companies')
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
      toast.error('Server error while fetching companies')
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDelete = (id, name) => {
    setDeleteTarget({ id, name })
    setIsConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/companies/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setCompanies(companies.filter(c => c.id !== deleteTarget.id))
          toast.success('Company profile removed successfully.')
        } else {
          toast.error(data.message || 'Failed to remove company')
        }
      } else {
        toast.error('Failed to remove company')
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      toast.error('Server error while deleting company')
    } finally {
      setIsConfirmOpen(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Companies</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage corporate partners, recruiters, and organization verification profiles.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading companies...</p>
        </div>
      ) : companies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    company.status === 'Partner' 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {company.status}
                  </span>
                </div>
                <h3 className="font-extrabold text-foreground text-lg">{company.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{company.location}</p>
                <p className="text-sm font-semibold text-foreground mt-4">Employees: <span className="text-primary">{company.employees}</span></p>
              </div>
              <div className="flex gap-2 mt-6">
                {company.website ? (
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    Website <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <button className="flex-1 py-2 border border-border/50 text-muted-foreground text-xs font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1" disabled>
                    No Website
                  </button>
                )}
                <button 
                  onClick={() => confirmDelete(company.id, company.name)}
                  className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-rose-500/10"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-card border border-border/50 rounded-2xl">
          <p className="text-muted-foreground">No companies found.</p>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Remove Company"
        message={`Are you sure you want to remove corporate profile for ${deleteTarget?.name}?`}
      />
    </div>
  )
}

export default AdminCompanies
