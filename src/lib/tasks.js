import { localDate, localTime } from '@/lib/inbox';
import { generateOccurrences } from '@/lib/recurrence';

// Build a CalendarEvent/Plan prefill from a Task, carrying its title and due
// date/time so the existing New Plan form opens ready to save.
export const buildPlanPrefillFromTask = (task) => ({
  title: task?.title || '',
  date: task?.due_date ? localDate(task.due_date) : '',
  all_day: false,
  end_date: '',
  start_time: task?.due_date ? localTime(task.due_date) : '',
  end_time: '',
  category: task?.category === 'Work' ? 'Work' : 'Personal',
  location_type: 'In-person',
  notes: task?.notes || '',
  assignee_id: '',
  assignee_name: '',
  completed: false,
  completed_date: '',
});

const genSeriesId = () => `ser_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Create a recurring CalendarEvent series from a plan form that carries the
// recurrence_* fields. `saveCalEvent` is the useCalendarEvents.save function.
// Returns the id of the first created occurrence (to link back from the task).
export const createRecurringPlanSeries = async (planForm, saveCalEvent) => {
  const seriesId = genSeriesId();
  const rule = JSON.stringify({
    freq: planForm.recurrence_freq || 'none',
    interval: Number(planForm.recurrence_interval) || 1,
    weekdays: planForm.recurrence_weekdays || [],
    monthly_mode: planForm.recurrence_monthly_mode || 'day_of_month',
    end_mode: planForm.recurrence_end_mode || 'never',
    end_count: Number(planForm.recurrence_end_count) || 1,
    end_until: planForm.recurrence_end_until || '',
  });
  const occurrences = generateOccurrences(planForm);
  let firstId = '';
  for (const occ of occurrences) {
    const saved = await saveCalEvent({ ...occ, series_id: seriesId, recurrence_rule: rule });
    if (!firstId && saved?.id) firstId = saved.id;
  }
  return firstId;
};