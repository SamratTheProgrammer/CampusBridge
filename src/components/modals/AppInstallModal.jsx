import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Smartphone, 
  ArrowDownToLine, 
  Apple, 
  QrCode, 
  Share, 
  PlusSquare, 
  Zap, 
  Video, 
  Bell, 
  Copy, 
  Check 
} from 'lucide-react'
import ModalPortal from './ModalPortal'

const AppInstallModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('android') // 'android' | 'ios' | 'qr'
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const apkUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/downloads/CampusBridge.apk` 
    : '/downloads/CampusBridge.apk'
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=svg&data=${encodeURIComponent(apkUrl)}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(apkUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md">
        {/* Backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                  CampusBridge Mobile App
                </h3>
                <p className="text-xs text-muted-foreground">Version 1.0.0 • Native Capacitor Experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border/50 px-6 bg-muted/20">
            <button
              onClick={() => setActiveTab('android')}
              className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'android'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownToLine className="w-4 h-4" /> Android (APK)
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'qr'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <QrCode className="w-4 h-4" /> Scan QR
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ios'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Apple className="w-4 h-4" /> iOS / iPhone
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            {activeTab === 'android' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-foreground">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm sm:text-base">Android APK Package</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Compatible with Android 8.0 through Android 15</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400">
                      7.2 MB
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">How to install on Android:</p>
                  <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
                    <li>Click the <strong>Download APK</strong> button below.</li>
                    <li>When downloaded, tap the notification or file in your Downloads folder.</li>
                    <li>If prompted, allow <em>"Install unknown apps"</em> for your browser.</li>
                    <li>Tap <strong>Install</strong> to enjoy instant alerts & 1-on-1 mentorship calls!</li>
                  </ol>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/downloads/CampusBridge.apk"
                    download="CampusBridge.apk"
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 active:scale-95 transition-all text-center"
                  >
                    <ArrowDownToLine className="w-4 h-4" /> Download CampusBridge APK
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-3 rounded-xl border border-border/80 hover:bg-muted font-medium text-xs text-foreground inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Link Copied' : 'Copy APK Link'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'qr' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Scan this QR code with your phone camera or Google Lens to download the APK directly onto your mobile device:
                </p>

                <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200">
                  <img
                    src={qrCodeUrl}
                    alt="CampusBridge APK Download QR Code"
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Direct link: <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">{apkUrl}</code></span>
                </div>
              </motion.div>
            )}

            {activeTab === 'ios' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-foreground">
                  <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <Apple className="w-4 h-4" /> iOS / iPhone Installation
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Install CampusBridge to your iPhone home screen for an ultra-fast, fullscreen app experience with gesture navigation.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-foreground">Open in Safari</p>
                      <p className="text-muted-foreground">Visit CampusBridge in Apple Safari on your iPhone or iPad.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        Tap Share <Share className="w-3.5 h-3.5 inline text-primary" />
                      </p>
                      <p className="text-muted-foreground">Tap the Share icon at the bottom of the Safari toolbar.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        Select "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 inline text-primary" />
                      </p>
                      <p className="text-muted-foreground">Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Feature Highlights Banner */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-center">
              <div className="p-2 rounded-xl bg-muted/30">
                <Bell className="w-4 h-4 mx-auto text-purple-500 mb-1" />
                <p className="text-[10px] font-bold text-foreground">Push Alerts</p>
              </div>
              <div className="p-2 rounded-xl bg-muted/30">
                <Video className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                <p className="text-[10px] font-bold text-foreground">WebRTC Calls</p>
              </div>
              <div className="p-2 rounded-xl bg-muted/30">
                <Zap className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <p className="text-[10px] font-bold text-foreground">Native Speed</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  )
}

export default AppInstallModal
