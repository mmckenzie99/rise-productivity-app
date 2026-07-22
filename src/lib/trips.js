// Constants and utilities for Trip management.

export const TRAVEL_TYPES = ['Flight', 'Rental', 'Personal Auto'];
export const DEPARTMENTS = ['Expense to Thrive', 'Engage Department'];
export const PER_DIEM_TYPES = ['Full Day', 'Half Day'];
export const PER_DIEM_RATES = { 'Full Day': 60.0, 'Half Day': 30.0 };

export const defaultTravelEntry = () => ({ type: '', airline: '', rental_company: '', cost: 0, receipt: { name: '', url: '' } });

export const defaultTrip = {
  engagement_id: '',
  engagement_title: '',
  department: '',
  leave_date: '',
  leave_time: '',
  return_date: '',
  return_time: '',
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