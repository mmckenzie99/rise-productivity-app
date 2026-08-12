import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function ShareToggle({ value, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div className="pr-4">
        <Label className="text-sm font-medium text-foreground">Share this with other users</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          When on, all users can view this record. When off, only you and admins can see it.
        </p>
      </div>
      <Switch checked={!!value} onCheckedChange={onChange} />
    </div>
  );
}