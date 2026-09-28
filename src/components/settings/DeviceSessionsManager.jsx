import React, { useState, useEffect, useCallback } from 'react';
import { 
  Laptop, Smartphone, Tablet, Globe, Shield, LogOut, 
  MapPin, Clock, RefreshCw, AlertTriangle, CheckCircle2, 
  Sparkles, Loader2, Monitor, ShieldCheck
} from 'lucide-react';
import { useUser, useSession, useSessionList } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import API_BASE from '../../utils/api';
import socket from '../../services/socket';
import useCurrentDevice from '../../hooks/useCurrentDevice';

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
};

const getDeviceIcon = (deviceType, os = '') => {
  const osLower = (os || '').toLowerCase();
  if (deviceType === 'mobile' || osLower.includes('android') || osLower.includes('ios') || osLower.includes('iphone')) {
    return Smartphone;
  }
  if (deviceType === 'tablet' || osLower.includes('ipad')) {
    return Tablet;
  }
  return Laptop;
};

const DeviceSessionsManager = () => {
  const { user } = useUser();
  const { session: currentSession } = useSession();
  const { sessions: clerkSessions } = useSessionList();
  const currentDeviceInfo = useCurrentDevice();

  const [dbSessions, setDbSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State for Revoking a Single Session
  const [sessionToRevoke, setSessionToRevoke] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Modal State for Revoking All Other Sessions
  const [isRevokeAllOpen, setIsRevokeAllOpen] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // Fetch active sessions from backend
  const fetchSessions = useCallback(async (quiet = false) => {
    if (!user?.id) return;
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(`${API_BASE}/api/device-sessions/list?clerkId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions)) {
          setDbSessions(data.sessions);
        }
      }
    } catch (err) {
      console.error('Failed to load device sessions:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSessions();

    // Listen for real-time socket updates when sessions change
    const onSessionsUpdated = () => {
      fetchSessions(true);
    };

    socket.on('device_sessions_updated', onSessionsUpdated);

    return () => {
      socket.off('device_sessions_updated', onSessionsUpdated);
    };
  }, [fetchSessions]);

  // Combine MongoDB records with Clerk session objects to ensure zero missed devices
  const allSessions = React.useMemo(() => {
    const list = [...dbSessions];
    const existingIds = new Set(list.map(s => s.sessionId));

    // If Clerk has sessions not yet in Mongo, synthesize preview entries
    if (Array.isArray(clerkSessions)) {
      clerkSessions.forEach(cs => {
        if (!existingIds.has(cs.id) && cs.status === 'active') {
          list.push({
            sessionId: cs.id,
            clerkId: user?.id,
            deviceName: `${cs.latestActivity?.browserName || 'Browser'} on ${cs.latestActivity?.deviceType || 'Device'}`,
            browser: cs.latestActivity?.browserName || 'Browser',
            os: cs.latestActivity?.deviceType || 'Device',
            deviceType: cs.latestActivity?.isMobile ? 'mobile' : 'desktop',
            ipAddress: cs.latestActivity?.ipAddress || '',
            city: cs.latestActivity?.city || '',
            country: cs.latestActivity?.country || '',
            lastActiveAt: cs.lastActiveAt,
            isOnline: cs.id === currentSession?.id,
            status: 'active',
          });
        }
      });
    }

    return list;
  }, [dbSessions, clerkSessions, user?.id, currentSession?.id]);

  // Split into current session vs other sessions
  const currentSessId = currentSession?.id;
  const currentDevice = allSessions.find(s => s.sessionId === currentSessId) || {
    sessionId: currentSessId || 'current',
    deviceName: `${currentDeviceInfo.browser} on ${currentDeviceInfo.os}`,
    browser: currentDeviceInfo.browser,
    os: currentDeviceInfo.os,
    deviceType: currentDeviceInfo.deviceType,
    ipAddress: currentDeviceInfo.ip,
    city: currentDeviceInfo.city,
    country: currentDeviceInfo.country,
    isOnline: true,
    lastActiveAt: new Date(),
    status: 'active',
  };

  const otherDevices = allSessions.filter(s => s.sessionId !== currentSessId && s.status === 'active');

  // Revoke single device session
  const handleRevokeSingle = async () => {
    if (!sessionToRevoke || !user?.id) return;
    setIsRevoking(true);

    try {
      // 1. Call backend to mark revoked and push socket disconnect
      const res = await fetch(`${API_BASE}/api/device-sessions/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          sessionIdToRevoke: sessionToRevoke.sessionId,
          currentDeviceInfo,
        }),
      });

      // 2. Also revoke in Clerk client if session object exists
      const clerkSessionObj = clerkSessions?.find(cs => cs.id === sessionToRevoke.sessionId);
      if (clerkSessionObj && typeof clerkSessionObj.revoke === 'function') {
        try {
          await clerkSessionObj.revoke();
        } catch (e) {}
      }

      // 3. Emit via socket for instant zero-latency push
      socket.emit('revoke_device_session', {
        clerkId: user.id,
        sessionIdToRevoke: sessionToRevoke.sessionId,
        currentDeviceInfo,
      });

      toast.success(`Logged out from ${sessionToRevoke.deviceName || 'device'} successfully`);
      setSessionToRevoke(null);
      fetchSessions(true);
    } catch (err) {
      console.error('Revoke failed:', err);
      toast.error('Failed to log out of device. Please try again.');
    } finally {
      setIsRevoking(false);
    }
  };

  // Revoke all other device sessions
  const handleRevokeAllOthers = async () => {
    if (!user?.id || !currentSessId) return;
    setIsRevokingAll(true);

    try {
      const res = await fetch(`${API_BASE}/api/device-sessions/revoke-all-others`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          currentSessionId: currentSessId,
          currentDeviceInfo,
        }),
      });

      // Also revoke in Clerk
      if (Array.isArray(clerkSessions)) {
        for (const cs of clerkSessions) {
          if (cs.id !== currentSessId && typeof cs.revoke === 'function') {
            try { await cs.revoke(); } catch (e) {}
          }
        }
      }

      const data = await res.json();
      toast.success(data.message || 'Logged out of all other devices successfully');
      setIsRevokeAllOpen(false);
      fetchSessions(true);
    } catch (err) {
      console.error('Revoke all failed:', err);
      toast.error('Failed to log out of other devices');
    } finally {
      setIsRevokingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Active Devices & Sessions
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage devices currently signed into your account. You can remotely disconnect any session anytime.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchSessions(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted/40 hover:bg-muted text-foreground border border-border/50 transition-all cursor-pointer disabled:opacity-60"
            title="Refresh active sessions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>Sync Status</span>
          </button>

          {otherDevices.length > 0 && (
            <button
              type="button"
              onClick={() => setIsRevokeAllOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 transition-all cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out All Other Devices ({otherDevices.length})</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center bg-muted/20 border border-border/40 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Checking active devices & real-time sessions...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* SECTION 1: THIS DEVICE (CURRENT SESSION) */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <span>Current Device</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-2 border-primary/30 shadow-sm relative overflow-hidden transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  {(() => {
                    const Icon = getDeviceIcon(currentDevice.deviceType, currentDevice.os);
                    return (
                      <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
                        <Icon className="w-5 h-5" />
                      </div>
                    );
                  })()}

                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h4 className="text-sm font-bold text-foreground truncate max-w-[280px] sm:max-w-md">
                        {currentDeviceInfo.browser} on {currentDeviceInfo.os}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        This Device • Active Now
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        {[currentDeviceInfo.city, currentDeviceInfo.country].filter(Boolean).join(', ') || 'Detecting Location...'}
                        {currentDeviceInfo.ip && currentDeviceInfo.ip !== 'Fetching...' && (
                          <span className="text-muted-foreground/70">({currentDeviceInfo.ip})</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                        Active now
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-2 sm:pt-0 pl-14 sm:pl-0">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                    Active Session
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: OTHER LOGGED IN DEVICES */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
              <span>Other Logged-in Devices ({otherDevices.length})</span>
              {otherDevices.length === 0 && (
                <span className="text-muted-foreground/80 font-normal capitalize">No other active devices</span>
              )}
            </div>

            {otherDevices.length === 0 ? (
              <div className="p-5 rounded-2xl bg-muted/20 border border-border/50 text-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500/80 mx-auto mb-2" />
                <h5 className="text-sm font-semibold text-foreground">No other active devices</h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your account is currently only signed in on this device.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {otherDevices.map((device) => {
                  const Icon = getDeviceIcon(device.deviceType, device.os);
                  const isOnline = device.isOnline;
                  const locationStr = [device.city, device.country].filter(Boolean).join(', ') || 'Unknown Location';

                  return (
                    <div
                      key={device.sessionId}
                      className="p-4 rounded-2xl bg-muted/20 hover:bg-muted/40 border border-border/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-muted/60 text-muted-foreground border border-border/50 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 group-hover:text-foreground transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h5 className="text-sm font-bold text-foreground truncate max-w-[260px] sm:max-w-md">
                              {device.deviceName || `${device.browser} on ${device.os}`}
                            </h5>
                            {isOnline ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active Now
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border/40">
                                Last seen {formatTimeAgo(device.lastActiveAt)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                              {locationStr}
                              {device.ipAddress && (
                                <span className="text-muted-foreground/70">({device.ipAddress})</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Log out / Disconnect Button */}
                      <div className="shrink-0 pt-2 sm:pt-0 pl-13 sm:pl-0 flex items-center">
                        <button
                          type="button"
                          onClick={() => setSessionToRevoke(device)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground border border-destructive/20 transition-all cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Confirm Single Device Disconnect */}
      {sessionToRevoke && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border/60 rounded-3xl p-6 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-foreground mb-2">
              Disconnect this Device?
            </h3>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
              You are about to log out from <strong className="text-foreground">{sessionToRevoke.deviceName || 'this device'}</strong>.
              The account on that device will be disconnected instantly, and they will receive a notification that their session was terminated.
            </p>

            <div className="bg-muted/40 border border-border/50 rounded-xl p-3 text-xs text-left mb-6 space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Device:</span>
                <span className="font-semibold text-foreground truncate max-w-[200px]">{sessionToRevoke.deviceName}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-semibold text-foreground">{sessionToRevoke.city || 'Unknown'}, {sessionToRevoke.country || ''}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSessionToRevoke(null)}
                disabled={isRevoking}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border/60 text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeSingle}
                disabled={isRevoking}
                className="flex-1 py-2.5 px-4 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-destructive/20"
              >
                {isRevoking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Disconnect All Other Devices */}
      {isRevokeAllOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border/60 rounded-3xl p-6 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-foreground mb-2">
              Log Out of All Other Devices?
            </h3>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              This will immediately sign out of your CampusBridge account on all <strong className="text-foreground">{otherDevices.length} other devices</strong>.
              All those devices will be immediately disconnected. Only this current device will stay signed in.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRevokeAllOpen(false)}
                disabled={isRevokingAll}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border/60 text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeAllOthers}
                disabled={isRevokingAll}
                className="flex-1 py-2.5 px-4 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-destructive/20"
              >
                {isRevokingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Out All Devices'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceSessionsManager;
