import { Archive as ArchiveIcon } from 'lucide-react';
import ResponsiveSelect from './ResponsiveSelect';
import { PROGRESS, STATUSES } from '@/lib/speaking';

export default function Filters({ filters, setFilters, onArchive }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <ResponsiveSelect
        value={filters.status}
        onValueChange={(status) => setFilters({ ...filters, status })}
        options={[{ value: 'all', label: 'All statuses' }, ...STATUSES.map((x) => ({ value: x, label: x }))]}
        triggerClassName="bg-white sm:w-44"
        label="Status"
      />
      <ResponsiveSelect
        value={filters.progress}
        onValueChange={(progress) => setFilters({ ...filters, progress })}
        options={[{ value: 'all', label: 'All progress' }, ...PROGRESS.map((x) => ({ value: x, label: x }))]}
        triggerClassName="bg-white sm:w-48"
        label="Progress"
      />
      <button onClick={onArchive} className="inline-flex items-center gap-1.5 rounded-md border border-[#D6DAE3] bg-white px-3 h-9 text-sm font-medium text-[#1B2A4B] transition hover:border-[#D9A404] hover:text-[#D9A404]">
        <ArchiveIcon className="h-3.5 w-3.5" />Archive
      </button>
    </div>
  );
}