const TONES = {
  gold: 'bg-amber-50 text-amber-600',
  navy: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-50 text-emerald-600',
  slate: 'bg-slate-100 text-slate-500',
};

export default function StatCard({ label, value, icon: Icon, tone = 'navy' }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
          {Icon && <Icon className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-semibold leading-tight text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}