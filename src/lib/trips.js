// Constants and utilities for Trip management.

export const TRAVEL_TYPES = ['Flight', 'Rental', 'Personal Auto'];
export const DEPARTMENTS = ['Expense to Thrive', 'Engage Department'];
export const PER_DIEM_TYPES = ['Full Day', 'Half Day'];
export const PER_DIEM_RATES = { 'Full Day': 60.0, 'Half Day': 30.0 };

export const defaultTrip = {
  engagement_id: '',
  engagement_title: '',
  department: '',
  leave_date: '',
  leave_time: '',
  return_date: '',
  return_time: '',
  travel_type: '',
  airline: '',
  rental_company: '',
  travel_cost: 0,
  travel_receipt: { name: '', url: '' },
  per_diem_days: [],
  expense_report: { name: '', url: '' },
  total_per_diem: 0,
  total_cost: 0
};

export const defaultPerDiemDay = () => ({ date: '', type: 'Full Day', amount: PER_DIEM_RATES['Full Day'] });

export const calcPerDiemTotal = (days) =>
  (days || []).reduce((sum, d) => sum + (d.amount || 0), 0);

export const calcTotalCost = (travelCost, perDiemTotal) =>
  (Number(travelCost) || 0) + (Number(perDiemTotal) || 0);

export const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);