export default function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <img src="https://media.base44.com/images/public/6a60116b6ae7a4bd8b520b63/ff8ff372c_App_Logo.png" alt="RISE logo" className="h-12 w-12 rounded-full object-contain" />
      <div>
        <h1 className="font-display text-2xl font-semibold leading-none text-foreground">RISE</h1>
        {!compact && <p className="mt-1 text-[11px] italic text-muted-foreground">Where life and work move together.</p>}
      </div>
    </div>
  );
}