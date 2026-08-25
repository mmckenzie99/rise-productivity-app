import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { getSession } from '@/lib/workspaceSession';

// In the no-account model there are no user accounts to manage. The profile
// menu shows the active workspace and offers to leave it (clears the session
// and returns to the workspace gate).
export default function ProfileMenu() {
  const { logout } = useAuth();
  const session = getSession();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Workspace" className="select-none h-11 w-11 lg:h-9 lg:w-9">
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <div className="font-medium text-foreground truncate">{session?.name || 'Workspace'}</div>
          <div className="truncate">{session?.workspace_id}</div>
        </div>
        <DropdownMenuItem className="text-destructive focus:text-destructive select-none" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Leave workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}