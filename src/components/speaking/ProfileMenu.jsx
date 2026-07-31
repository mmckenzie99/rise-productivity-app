import { useState } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import DeleteAccountDialog from './DeleteAccountDialog';

export default function ProfileMenu() {
  const [delOpen, setDelOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Account" className="select-none h-11 w-11 lg:h-9 lg:w-9">
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className="text-[#B33A3A] focus:text-[#B33A3A] select-none" onClick={() => setDelOpen(true)}>
            Delete account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteAccountDialog open={delOpen} onClose={() => setDelOpen(false)} />
    </>
  );
}