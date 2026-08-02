import { CalendarClock, ClipboardList, CheckCircle2, CalendarDays } from 'lucide-react';

const TONES = {
  gold: 'bg-[#FBF0D0] text-[#8A6A00]',
  navy: 'bg-[#E8EBF2] text-[#1B2A4B]',
  green: 'bg-[#D7F0DD] text-[#1E6B3A]',
  slate: 'bg-[#E8EAF0] text-[#5A6781]',
};

export default function StatCard({ label, value, icon: Icon, tone = 'navy' }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONES[tone]}`}>
          {Icon && <Icon className="h-4 w-4" />}
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}