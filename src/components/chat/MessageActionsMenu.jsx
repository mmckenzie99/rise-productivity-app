import { MoreVertical, Flag, Ban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export default function MessageActionsMenu({ onReport, onBlock }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-current opacity-60 transition hover:opacity-100"
          aria-label="Message actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onReport} className="gap-2 text-foreground">
          <Flag className="h-3.5 w-3.5" /> Report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onBlock} className="gap-2 text-destructive focus:text-destructive">
          <Ban className="h-3.5 w-3.5" /> Block user
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}