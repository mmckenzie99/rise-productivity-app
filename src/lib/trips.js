// Constants and utilities for Trip management.

export const TRAVEL_TYPES = ['Flight', 'Rental', 'Gas/Fuel', 'Personal Auto'];
export const DEPARTMENTS = ['Expense to Thrive', 'Expense to Engage', 'Expense Local Entity'];
export const PER_DIEM_TYPES = ['Full Day', 'Half Day'];
export const PER_DIEM_RATES = { 'Full Day': 60.0, 'Half Day': 30.0 };

export const defaultTravelEntry = () => ({ type: '', description: '', airline: '', departure_airport: '', arrival_airport: '', rental_company: '', rental_pickup_location: '', dropoff_location: '', cost: 0, receipt: { name: '', url: '' } });

export const defaultTrip = {
  place: '',
  department: '',
  leave_date: '',
  leave_time: '',
  return_date: '',
  return_time: '',
  departure_airport: '',
  rental_pickup_location: '',
  travel_entries: [],
  per_diem_days: [],
  expense_report: { name: '', url: '' },
  total_per_diem: 0,
  total_cost: 0
};

export const defaultPerDiemDay = () => ({ date: '', type: 'Full Day', amount: PER_DIEM_RATES['Full Day'] });

export const calcPerDiemTotal = (days) =>
  (days || []).reduce((sum, d) => sum + (d.amount || 0), 0);

export const calcTravelTotal = (entries) =>
  (entries || []).reduce((sum, e) => sum + (Number(e.cost) || 0), 0);

export const exportTripCSV = (trip) => {
  const esc = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const rows = [];
  const byType = calcTravelByType(trip.travel_entries);

  rows.push(['Engagement Log — Trip Details']);
  rows.push([]);
  rows.push(['Place', 'Department', 'Leave Date', 'Leave Time', 'Return Date', 'Return Time']);
  rows.push([trip.place || '', trip.department || '', trip.leave_date || '', trip.leave_time || '', trip.return_date || '', trip.return_time || '']);
  rows.push([]);

  rows.push(['Expense Breakdown']);
  rows.push(['Category', 'Type', 'Description', 'Date', 'Amount', 'Receipt']);
  (trip.travel_entries || []).forEach((e) => {
    const desc = e.type === 'Flight' ? e.airline : e.type === 'Rental' ? e.rental_company : '';
    rows.push(['Travel', e.type || '', desc, '', (e.cost || 0).toFixed(2), e.receipt?.name || '']);
  });
  (trip.per_diem_days || []).forEach((d) => {
    rows.push(['Per Diem', d.type || '', '', d.date || '', (d.amount || 0).toFixed(2), '']);
  });
  if (trip.expense_report?.url) {
    rows.push(['Expense Report', '', '', '', '', trip.expense_report.name || '']);
  }
  rows.push([]);

  rows.push(['Cost Summary']);
  rows.push(['Category', 'Amount']);
  if (byType.Flight > 0) rows.push(['Airfare', byType.Flight.toFixed(2)]);
  if (byType.Rental > 0) rows.push(['Rental', byType.Rental.toFixed(2)]);
  if (byType['Personal Auto'] > 0) rows.push(['Personal Auto', byType['Personal Auto'].toFixed(2)]);
  rows.push(['Per Diem', (trip.total_per_diem || 0).toFixed(2)]);
  rows.push(['Total Cost', (trip.total_cost || 0).toFixed(2)]);

  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trip-${(trip.place || 'export').replace(/\s+/g, '-').toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const calcTravelByType = (entries) => {
  const byType = { Flight: 0, Rental: 0, 'Personal Auto': 0 };
  (entries || []).forEach((e) => {
    if (byType[e.type] !== undefined) byType[e.type] += Number(e.cost) || 0;
  });
  return byType;
};

export const calcTotalCost = (travelTotal, perDiemTotal) =>
  (Number(travelTotal) || 0) + (Number(perDiemTotal) || 0);

export const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

export const getTripStatus = (trip) => {
  if (!trip.return_date) return 'upcoming';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const returnDate = new Date(trip.return_date + 'T00:00:00');
  return returnDate < today ? 'completed' : 'upcoming';
};