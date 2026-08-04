import React, { useState } from 'react'
import { Plus, Trash2, Building2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([
    { id: 1, name: 'Google', employees: '100,000+', location: 'Mountain View, CA', status: 'Partner' },
    { id: 2, name: 'Microsoft', employees: '220,000+', location: 'Redmond, WA', status: 'Partner' },
    { id: 3, name: 'Amazon', employees: '1,500,000+', location: 'Seattle, WA', status: 'Partner' },
    { id: 4, name: 'Adobe', employees: '26,000+', location: 'San Jose, CA', status: 'Partner' },
    { id: 5, name: 'TechNova Inc.', employees: '200+', location: 'Bangalore, India', status: 'Pending' },
  ])

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove corporate profile for ${name}?`)) {
      setCompanies(companies.filter(c => c.id !== id))
      toast.success('Company profile removed.')
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
              <button className="flex-1 py-2 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1">
                Website <ExternalLink className="w-3 h-3" />
              </button>
              <button 
                onClick={() => handleDelete(company.id, company.name)}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-rose-500/10"
              >
                Delete Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminCompanies
