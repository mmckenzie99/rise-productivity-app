import { MapPin, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

/**
 * Tappable address with a small menu offering to open the address in either
 * Google Maps or Apple Maps. The pin icon + address text act as the trigger.
 */
export default function AddressMapsMenu({ address, className = '', children }) {
  if (!address) return null;
  const q = encodeURIComponent(address);
  const trigger = children ? (
    children
  ) : (
    <button type="button" className={`flex items-start gap-2 text-left ${className}`}>
      <MapPin className="h-4 w-4 shrink-0 text-primary" />
      <span>{address}</span>
    </button>
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="inline-flex">{trigger}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem asChild>
          <a href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noreferrer" className="flex w-full items-center gap-2">
            <ExternalLink className="h-4 w-4" />Open in Google Maps
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`https://maps.apple.com/?q=${q}`} target="_blank" rel="noreferrer" className="flex w-full items-center gap-2">
            <ExternalLink className="h-4 w-4" />Open in Apple Maps
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}