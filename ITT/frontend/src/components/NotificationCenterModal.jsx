import { useNavigate } from 'react-router-dom';
import { X, Bell, CheckCheck, Trash2, CheckCircle, AlertTriangle, Info, XCircle, ExternalLink } from 'lucide-react';

const NotificationCenterModal = ({ open, onClose, notifications = [], onMarkRead, onDeleteAll }) => {
  const navigate = useNavigate();
  if (!open) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (n) => {
    if (!n.isRead && onMarkRead) {
      onMarkRead(n.id);
    }
    const targetLink = n.link || n.metadata?.link;
    if (targetLink) {
      onClose();
      navigate(targetLink);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-slate-900 text-white min-h-screen shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">Notification Center</h3>
              <p className="text-xs text-slate-400">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-20 text-center text-slate-500 space-y-2">
              <Bell className="w-10 h-10 mx-auto text-slate-700" />
              <p className="font-semibold text-slate-400 text-sm">No notifications yet</p>
              <p className="text-xs text-slate-600">You will be notified about deposits, withdrawals & VIP updates here.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-start space-x-3.5 ${
                  n.isRead
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-80 hover:opacity-100'
                    : 'bg-slate-800/80 border-slate-700 shadow-md shadow-emerald-950/10 hover:border-emerald-500/50'
                }`}
              >
                {getIcon(n.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm font-bold truncate ${n.isRead ? 'text-slate-300' : 'text-white'}`}>
                      {n.title}
                    </h4>
                    {(n.link || n.metadata?.link) && (
                      <ExternalLink className="w-3 h-3 text-slate-500 hover:text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-500 block mt-2">
                    {new Date(n.createdAt || Date.now()).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
            <button
              onClick={() => notifications.forEach(n => !n.isRead && onMarkRead && onMarkRead(n.id))}
              className="text-emerald-400 hover:underline font-semibold flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" /> Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenterModal;
