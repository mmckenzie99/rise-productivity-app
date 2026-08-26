import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function MonthlyChart({ data, showLogged = true }) {
  return (
    <div className="h-56 w-full sm:h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="24%" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={26} />
          <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12, boxShadow: 'none' }} />
          {showLogged && <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />}
          {showLogged && <Bar dataKey="logged" name="Logged" fill="#D9A404" radius={[6, 6, 0, 0]} maxBarSize={30} />}
          <Bar dataKey="completed" name="Completed" fill="#1B2A4B" radius={[6, 6, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}