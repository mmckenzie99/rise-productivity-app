import { Bell, Trash2, CheckCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * App-wide toast renderer.
 *
 * Instead of showing each toast as a full-width banner (with the unreliable
 * dismiss X), this renders a single floating bell button — matching the nav bar
 * bell style — with an unread-count badge. Clicking it opens a dropdown listing
 * every active toast (title, description, and any action button such as Undo),
 * exactly as before, just relocated into the bell dropdown.
 *
 * The global `toast()` trigger API and all call sites are unchanged.
 */
export function Toaster() {
  const { toasts, dismiss } = useToast();
  const count = toasts.length;

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Notifications"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition hover:bg-accent lg:h-10 lg:w-10"
          >
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-80 p-0">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="font-display text-sm font-semibold">Notifications</span>
            {count > 0 && (
              <button
                onClick={() => dismiss()}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p>
            ) : (
              toasts.map(({ id, title, description, action }) => (
                <div
                  key={id}
                  className="flex items-start gap-2 border-b border-border p-3 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    {title && <p className="line-clamp-2 break-words text-sm font-medium leading-tight">{title}</p>}
                    {description && <p className="mt-0.5 break-words text-xs text-muted-foreground">{description}</p>}
                    {action && <div className="mt-2">{action}</div>}
                  </div>
                  <button
                    onClick={() => dismiss(id)}
                    className="shrink-0 rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    aria-label="Dismiss"
                    title="Dismiss"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}