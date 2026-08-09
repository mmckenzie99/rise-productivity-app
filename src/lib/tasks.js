import { localDate, localTime } from '@/lib/inbox';

// Build a CalendarEvent/Plan prefill from a Task, carrying its title and due
// date/time so the existing New Plan form opens ready to save.
export const buildPlanPrefillFromTask = (task) => ({
  title: task?.title || '',
  date: task?.due_date ? localDate(task.due_date) : '',
  all_day: false,
  end_date: '',
  start_time: task?.due_date ? localTime(task.due_date) : '',
  end_time: '',
  category: 'Personal',
  location_type: 'In-person',
  notes: task?.notes || '',
  assignee_id: '',
  assignee_name: '',
  completed: false,
  completed_date: '',
});