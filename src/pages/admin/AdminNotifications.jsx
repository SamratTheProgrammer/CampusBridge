import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Bell, Check, Clock, Volume2, VolumeX, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/modals/ConfirmModal'
import ringtoneService from '../../utils/ringtone'
import { sendBrowserNotification } from '../../utils/pushManager'

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('campusbridge_notification_sound') !== 'false'
  )

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    const onSoundChange = (e) => {
      if (typeof e.detail === 'boolean') {
        setSoundEnabled(e.detail)
      }
    }
    window.addEventListener('campusbridge_notification_sound_change', onSoundChange)
    return () => window.removeEventListener('campusbridge_notification_sound_change', onSoundChange)
  }, [])

  const handleToggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    localStorage.setItem('campusbridge_notification_sound', next.toString())
    window.dispatchEvent(new CustomEvent('campusbridge_notification_sound_change', { detail: next }))
    if (next) {
      try { ringtoneService.playNotificationSound(true) } catch(e){}
      toast.success('Notification sound turned ON 🔔')
    } else {
      toast.success('Notification sound turned OFF 🔕')
    }
  }

  const confirmDelete = (id, title) => {
    setDeleteTarget({ id, title })
    setIsConfirmOpen(true)
  }

  const handleDelete = () => {
    if (!deleteTarget) return;
    setNotifications(notifications.filter(n => n.id !== deleteTarget.id))
    toast.success('Notification removed.')
    setIsConfirmOpen(false)
    setDeleteTarget(null)
  }

  const handleCreate = () => {
    const title = prompt('Enter Notification Title:')
    if (!title) return
    const audience = prompt('Enter Target Audience (Students, Mentor, All Users):', 'All Users')
    const type = prompt('Enter Delivery Type (In-App, Browser, Email):', 'In-App & Browser')
    
    setNotifications([
      ...notifications,
      { id: notifications.length + 1, title, audience, type, sent: 'Just now', status: 'Sent' }
    ])

    // Play notification sound if enabled
    if (soundEnabled) {
      ringtoneService.playNotificationSound(true)
    }

    // Trigger browser notification
    sendBrowserNotification(title, {
      body: `Audience: ${audience} | Sent via CampusBridge Admin`,
      playSound: false // sound already triggered above
    })

    toast.success(soundEnabled ? 'Notification sent with sound alert! 🔔' : 'Notification sent (sound muted) 🔕')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Send, schedule, and review system announcements and user broadcasts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSound}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20'
            }`}
            title={soundEnabled ? 'Notification Sound is ON - click to mute' : 'Notification Sound is OFF - click to unmute'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Sound: {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>
          <button 
            onClick={handleCreate}
            className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/10 text-sm self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" /> New Notification
          </button>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="whitespace-nowrap w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Audience</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Sent On</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary shrink-0" />
                      {n.title}
                    </td>
                    <td className="px-6 py-4 text-foreground">{n.audience}</td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">{n.type}</td>
                    <td className="px-6 py-4 text-muted-foreground">{n.sent}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        n.status === 'Sent' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {n.status === 'Sent' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {n.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => confirmDelete(n.id, n.title)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Delete Notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                    No notifications created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Notification"
        message={`Are you sure you want to delete notification "${deleteTarget?.title}"?`}
      />
    </div>
  )
}

export default AdminNotifications
