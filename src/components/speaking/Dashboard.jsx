import { CalendarDays,Clock3,Tags } from 'lucide-react';
import { daysUntil,asArray,formatDate } from '@/lib/speaking';
import PlaceBreakdown from './PlaceBreakdown';
import MonthBreakdown from './MonthBreakdown';
export default function Dashboard({items,onSelect}){
  const today=new Date().toISOString().slice(0,10), now=new Date(), monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10), monthEnd=new Date(now.getFullYear(),now.getMonth()+1,1).toISOString().slice(0,10), upcoming=items.filter(x=>x.speaking_date>=today&&x.status!=='Completed'), thisMonth=items.filter(x=>x.deploy_date&&x.deploy_date>=monthStart&&x.deploy_date<monthEnd).sort((a,b)=>(a.deploy_date||'').localeCompare(b.deploy_date||''));
  const urgent=upcoming.filter(x=>x.progress!=='Ready to Deploy'&&daysUntil(x.speaking_date)<=14);
  const types=items.reduce((a,x)=>{asArray(x.presentation_type).forEach(t=>{a[t]=(a[t]||0)+1});return a},{}),top=Object.entries(types).sort((a,b)=>b[1]-a[1])[0];
  const metrics=[{icon:Clock3,label:'Upcoming deadlines',value:urgent.length,note:'Within 14 days',accent:'border-l-[#B43A2E]'},{icon:Tags,label:'Top presentation type',value:top?.[1]||0,note:top?.[0]||'No type set',accent:'border-l-[#D9A404]'}];
  return <section className="space-y-7"><div><h2 className="mb-3 font-display text-lg font-semibold">A Quick Look</h2><div className="grid gap-3 md:grid-cols-3 items-start">
    <article className="rounded-lg border border-[#D6DAE3] border-l-4 border-l-[#1B2A4B] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#5A6781]"><CalendarDays className="h-4 w-4"/>Upcoming engagements · This month</div>
      <p className="mt-3 font-display text-4xl font-bold">{thisMonth.length}</p>
      {thisMonth.length>0?(
        <ul className="mt-3 space-y-1">
          {thisMonth.map(x=>(<li key={x.id}><button onClick={()=>onSelect(x)} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-xs transition hover:bg-[#F7F8FA]"><span className="truncate font-medium text-[#1B2A4B]">{x.place||'Place not set'}</span><span className="shrink-0 font-mono text-[#5A6781]">{formatDate(x.deploy_date)}</span></button></li>))}
        </ul>
      ):<p className="mt-2 text-xs text-[#5A6781]">No engagements this month.</p>}
    </article>
    {metrics.map(({icon:Icon,label,value,note,accent})=><article key={label} className={`rounded-lg border border-[#D6DAE3] border-l-4 ${accent} bg-white p-5 shadow-sm transition hover:-translate-y-0.5`}><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#5A6781]"><Icon className="h-4 w-4"/>{label}</div><p className="mt-3 font-display text-4xl font-bold">{value}</p><p className="mt-1 text-xs text-[#5A6781]">{note}</p></article>)}
  </div></div><div className="grid gap-4 md:grid-cols-2"><PlaceBreakdown items={items} onSelect={onSelect}/><MonthBreakdown items={items}/></div></section>}