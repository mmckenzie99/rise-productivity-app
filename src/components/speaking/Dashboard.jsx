import { CalendarDays,Clock3,Tags } from 'lucide-react';
import { daysUntil,asArray,formatDate } from '@/lib/speaking';
import PlaceBreakdown from './PlaceBreakdown';
import MonthBreakdown from './MonthBreakdown';
export default function Dashboard({items,onSelect}){
  const now=new Date(), y=now.getFullYear(), m=now.getMonth(), pad=n=>String(n).padStart(2,'0'), today=`${y}-${pad(m+1)}-${pad(now.getDate())}`, monthStart=`${y}-${pad(m+1)}-01`, nm=new Date(y,m+1,1), monthEnd=`${nm.getFullYear()}-${pad(nm.getMonth()+1)}-01`;
  const thisMonth=items.filter(x=>x.deploy_date&&x.deploy_date>=monthStart&&x.deploy_date<monthEnd).sort((a,b)=>(a.deploy_date||'').localeCompare(b.deploy_date||''));
  const thisMonthIds=new Set(thisMonth.map(x=>x.id));
  const laterUpcoming=items.filter(x=>!thisMonthIds.has(x.id)&&x.speaking_date>=today&&x.status!=='Completed').sort((a,b)=>(a.speaking_date||'').localeCompare(b.speaking_date||''));
  const urgentCount=[...thisMonth,...laterUpcoming].filter(x=>x.progress!=='Ready to Deploy'&&daysUntil(x.speaking_date||x.deploy_date)<=14).length;
  const types=items.reduce((a,x)=>{asArray(x.presentation_type).forEach(t=>{a[t]=(a[t]||0)+1});return a},{}),top=Object.entries(types).sort((a,b)=>b[1]-a[1])[0];
  const renderRow=(x,date)=>{const days=daysUntil(date),urgent=x.progress!=='Ready to Deploy'&&days<=14;return <li key={x.id}><button onClick={()=>onSelect(x)} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-xs transition hover:bg-[#F7F8FA]"><span className="truncate font-medium text-[#1B2A4B]">{x.place||'Place not set'}</span><span className={`shrink-0 font-mono ${urgent?'text-[#B43A2E] font-semibold':'text-[#5A6781]'}`}>{formatDate(date)}{urgent&&` · ${days}d`}</span></button></li>};
  return <section className="space-y-7"><div><h2 className="mb-3 font-display text-lg font-semibold">A Quick Look</h2><div className="grid gap-3 md:grid-cols-3 items-start">
    <article className="md:col-span-2 rounded-lg border border-[#D6DAE3] border-l-4 border-l-[#1B2A4B] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#5A6781]"><CalendarDays className="h-4 w-4"/>Upcoming Engagements</div>{urgentCount>0&&<span className="rounded-full bg-[#B43A2E]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#B43A2E]">{urgentCount} urgent</span>}</div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#5A6781]"><CalendarDays className="h-3 w-3"/>This Month</div>
          <p className="mt-1 font-display text-3xl font-bold">{thisMonth.length}</p>
          {thisMonth.length>0?(<ul className="mt-2 space-y-1">{thisMonth.map(x=>renderRow(x,x.deploy_date))}</ul>):<p className="mt-1 text-xs text-[#5A6781]">No engagements this month.</p>}
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#5A6781]"><Clock3 className="h-3 w-3"/>Later Upcoming</div>
          <p className="mt-1 font-display text-3xl font-bold">{laterUpcoming.length}</p>
          {laterUpcoming.length>0?(<ul className="mt-2 space-y-1">{laterUpcoming.map(x=>renderRow(x,x.speaking_date))}</ul>):<p className="mt-1 text-xs text-[#5A6781]">No later engagements.</p>}
        </div>
      </div>
    </article>
    <article className="rounded-lg border border-[#D6DAE3] border-l-4 border-l-[#D9A404] bg-white p-5 shadow-sm transition hover:-translate-y-0.5"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#5A6781]"><Tags className="h-4 w-4"/>Top presentation type</div><p className="mt-3 font-display text-4xl font-bold">{top?.[1]||0}</p><p className="mt-1 text-xs text-[#5A6781]">{top?.[0]||'No type set'}</p></article>
  </div></div><div className="grid gap-4 md:grid-cols-2"><PlaceBreakdown items={items} onSelect={onSelect}/><MonthBreakdown items={items}/></div></section>}