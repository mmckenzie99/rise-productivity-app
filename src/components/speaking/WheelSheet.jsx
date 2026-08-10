import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import useIsDarkMode from '@/hooks/useIsDarkMode';
import { cn } from '@/lib/utils';

/**
 * Universal container for a rolling-wheel picker.
 *
 * Mobile (<768px) → Vaul bottom sheet (the established native-style UX).
 * Desktop (≥768px) → centered Radix Dialog.
 *
 * Both surfaces render with EXPLICIT theme tokens (bg-background /
 * text-foreground / border-border) AND carry the active theme class (`dark`)
 * directly on the portaled content. Vaul/Radix portals mount to document.body,
 * so we cannot rely on inheriting the `dark` class from a React-tree wrapper or
 * from <html> if portal inheritance is unreliable in the runtime environment —
 * mirroring documentElement's theme class onto the portal guarantees the wheel
 * sheet always matches the surrounding dialog in BOTH light and dark mode.
 *
 * The wheel itself is always rendered (single source of truth); this component
 * only chooses the chrome around it. The committed value is governed entirely
 * by WheelColumn's centered-row centering fix, which is preserved unchanged.
 */
export default function WheelSheet({ open, onOpenChange, trigger, label, children }) {
  const isMobile = useIsMobile();
  const isDark = useIsDarkMode();
  const themeCls = isDark ? 'dark' : '';

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className={cn('bg-background text-foreground border-border pb-safe', themeCls)}>
          {label && (
            <DrawerHeader className="text-left">
              <DrawerTitle>{label}</DrawerTitle>
            </DrawerHeader>
          )}
          <div className="px-4 pb-2">{children}</div>
          <DrawerFooter className="flex-row justify-end gap-2">
            <DrawerClose asChild>
              <Button variant="outline" size="sm">Done</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn('bg-background text-foreground border-border sm:max-w-sm', themeCls)}>
        {label && (
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
        )}
        <div className="px-1 pb-1">{children}</div>
        <DialogFooter className="flex-row justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}