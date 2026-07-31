import { Bell, Bookmark, CheckCheck, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, TIMEZONES } from '@/lib/speaking';
import useNotifications from '@/hooks/useNotifications';

export default function NotificationBell() {
  const { notifications, loading, keepForReview, deleteNotification, markAllAsRead, unreadCount } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-11 w-11 lg:h-9 lg:w-9 text-[#1B2A4B] hover:bg-[#F0F2F6]" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D9A404] px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-white">
        <div className="flex items-center justify-between border-b border-[#D6DAE3] p-3">
          <span className="font-display text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs text-[#D9A404] hover:underline">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-center text-sm text-[#5A6781]">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-[#5A6781]">No notifications yet</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-2 border-b border-[#D6DAE3] p-3 last:border-0 ${!n.read ? 'bg-[#D9A404]/5' : ''}`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium leading-tight">{n.engagement_title}</p>
                  <p className="mt-0.5 text-xs text-[#5A6781]">
                    {n.window_label==='Assigned to you'||n.window_label==='Completed'?n.window_label:`${n.window_label} reminder`} · {formatDate(n.speaking_date)}
                    {n.speaking_time && ` · ${formatTime(n.speaking_time)}`}
                  </p>
                  {n.email_sent && (
                    <p className="mt-0.5 text-[10px] font-mono uppercase text-[#5A6781]">Email sent</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!n.read && (
                    <button
                      onClick={() => keepForReview(n.id)}
                      className="shrink-0 rounded p-1 text-[#1B2A4B] hover:bg-[#F0F2F6]"
                      aria-label="Keep for review"
                      title="Keep for review"
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="shrink-0 rounded p-1 text-[#B43A2E] hover:bg-[#B43A2E]/10"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}