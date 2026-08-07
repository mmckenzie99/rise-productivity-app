import Logo from './Logo';

export default function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <Logo className="h-12 w-12 rounded-full" />
      <div>
        <h1 className="font-display text-2xl font-semibold leading-none text-foreground">RISE</h1>
        {!compact && <p className="mt-1 text-[11px] italic text-muted-foreground">Where life and work move together.</p>}
      </div>
    </div>
  );
}