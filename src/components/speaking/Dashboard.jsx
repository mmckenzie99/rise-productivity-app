import PlaceBreakdown from './PlaceBreakdown';
import MonthBreakdown from './MonthBreakdown';
export default function Dashboard({items,onSelect}){
  return <section className="space-y-7"><div className="grid gap-4 md:grid-cols-2"><PlaceBreakdown items={items} onSelect={onSelect}/><MonthBreakdown items={items}/></div></section>}