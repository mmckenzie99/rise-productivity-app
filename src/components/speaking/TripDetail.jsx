import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, FileText, Plane, Car, CalendarDays, Building2, DollarSign, Download, MapPin } from 'lucide-react';
import { formatCurrency, calcTravelByType, exportTripCSV } from '@/lib/trips';
import { formatTime } from '@/lib/speaking';

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#5A6781]" />
      <span className="text-sm text-[#5A6781] min-w-[120px]">{label}</span>
      <span className="text-sm text-[#1B2A4B] font-medium">{children}</span>
    </div>
  );
}

export default function TripDetail({ trip, onClose, onEdit, onDelete, isAdmin }) {
  if (!trip) return null;
  const travelByType = calcTravelByType(trip.travel_entries);

  return (
    <Dialog open={!!trip} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Trip Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Engagement + Department */}
          <div className="rounded-lg border border-[#D6DAE3] bg-white p-4">
            <Row icon={MapPin} label="Place">{trip.place || 'No place set'}</Row>
            <Row icon={Building2} label="Department">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${trip.department === 'Expense to Thrive' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                {trip.department}
              </span>
            </Row>
          </div>

          {/* Travel Schedule */}
          <div className="rounded-lg border border-[#D6DAE3] bg-white p-4">
            <h3 className="font-display text-sm font-semibold text-[#1B2A4B] mb-2">Travel Schedule</h3>
            <Row icon={CalendarDays} label="Leave">{trip.leave_date} {trip.leave_time && `at ${formatTime(trip.leave_time)}`}</Row>
            <Row icon={CalendarDays} label="Return">{trip.return_date} {trip.return_time && `at ${formatTime(trip.return_time)}`}</Row>
          </div>

          {/* Travel Details */}
          <div className="rounded-lg border border-[#D6DAE3] bg-white p-4">
            <h3 className="font-display text-sm font-semibold text-[#1B2A4B] mb-2">Travel Details</h3>
            {trip.departure_airport && <Row icon={Plane} label="Departure Airport">{trip.departure_airport}</Row>}
            {trip.rental_pickup_location && <Row icon={MapPin} label="Rental Pickup">{trip.rental_pickup_location}</Row>}
            {trip.travel_entries?.length ? (
              trip.travel_entries.map((entry, i) => (
                <div key={i} className="space-y-1 border-b border-[#E8EAF0] pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
                  <Row icon={entry.type === 'Flight' ? Plane : Car} label="Type">{entry.type || '—'}</Row>
                  {entry.type === 'Flight' && <Row icon={Plane} label="Airline">{entry.airline || '—'}</Row>}
                  {entry.type === 'Rental' && <Row icon={Car} label="Company">{entry.rental_company || '—'}</Row>}
                  <Row icon={DollarSign} label="Cost">{formatCurrency(entry.cost)}</Row>
                  {entry.receipt?.url && (
                    <div className="flex items-center gap-2 py-1.5">
                      <FileText className="h-4 w-4 text-[#5A6781]" />
                      <span className="text-sm text-[#5A6781] min-w-[120px]">Receipt</span>
                      <a href={entry.receipt.url} target="_blank" rel="noreferrer" className="text-sm text-[#D9A404] underline">{entry.receipt.name}</a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-[#5A6781]">No travel details.</p>
            )}
          </div>

          {/* Per Diem */}
          <div className="rounded-lg border border-[#D6DAE3] bg-white p-4">
            <h3 className="font-display text-sm font-semibold text-[#1B2A4B] mb-2">Per Diem</h3>
            {trip.per_diem_days?.length ? (
              <div className="space-y-1">
                {trip.per_diem_days.map((d, i) => (
                  <div key={i} className="flex justify-between border-b border-[#E8EAF0] py-1 text-sm last:border-0">
                    <span className="text-[#1B2A4B]">{d.date} · {d.type}</span>
                    <span className="font-medium text-[#1B2A4B]">{formatCurrency(d.amount)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-[#5A6781]">No per diem days.</p>}
            {trip.expense_report?.url && (
              <div className="flex items-center gap-2 py-2 mt-2 border-t border-[#E8EAF0]">
                <FileText className="h-4 w-4 text-[#5A6781]" />
                <span className="text-sm text-[#5A6781]">Expense Report:</span>
                <a href={trip.expense_report.url} target="_blank" rel="noreferrer" className="text-sm text-[#D9A404] underline">{trip.expense_report.name}</a>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <span className="text-sm text-[#5A6781]">Per Diem Subtotal</span>
              <span className="text-sm font-semibold text-[#1B2A4B]">{formatCurrency(trip.total_per_diem)}</span>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="rounded-lg border border-[#D6DAE3] bg-white p-4">
            <h3 className="font-display text-sm font-semibold text-[#1B2A4B] mb-2">Cost Summary</h3>
            <div className="space-y-1.5 text-sm">
              {travelByType.Flight > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#5A6781]">Airfare</span>
                  <span className="font-medium text-[#1B2A4B]">{formatCurrency(travelByType.Flight)}</span>
                </div>
              )}
              {travelByType.Rental > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#5A6781]">Rental</span>
                  <span className="font-medium text-[#1B2A4B]">{formatCurrency(travelByType.Rental)}</span>
                </div>
              )}
              {travelByType['Personal Auto'] > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#5A6781]">Personal Auto</span>
                  <span className="font-medium text-[#1B2A4B]">{formatCurrency(travelByType['Personal Auto'])}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#E8EAF0] pt-1.5">
                <span className="text-[#5A6781]">Per Diem</span>
                <span className="font-medium text-[#1B2A4B]">{formatCurrency(trip.total_per_diem)}</span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between rounded-lg bg-[#1B2A4B] px-4 py-3 text-white">
            <span className="text-sm font-medium">Total Cost</span>
            <span className="font-display text-lg font-semibold text-[#D9A404]">{formatCurrency(trip.total_cost)}</span>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => exportTripCSV(trip)} className="border-[#D6DAE3] bg-white"><Download className="mr-1.5 h-4 w-4" />Export CSV</Button>
            {isAdmin && (
              <>
                <Button variant="outline" onClick={onEdit} className="border-[#D6DAE3] bg-white"><Pencil className="mr-1.5 h-4 w-4" />Edit</Button>
                <Button variant="destructive" onClick={onDelete}><Trash2 className="mr-1.5 h-4 w-4" />Delete</Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}