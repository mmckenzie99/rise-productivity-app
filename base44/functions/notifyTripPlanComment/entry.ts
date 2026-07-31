import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Fires when a PlanComment is created. It links the commented calendar plan to
// any trip whose date range contains the plan's date, then notifies the trip
// creator plus the assignees of the calendar events tied to that trip. Comments
// containing the word "urgent" are flagged high-priority (is_urgent). No email
// is sent — the alert is an in-app record only, per the chosen configuration.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    let body: any = {};
    try {
      body = await req.json();
    } catch (_e) {
      body = {};
    }
    const planCommentId = body?.plan_comment_id;
    if (!planCommentId) {
      return Response.json({ error: 'plan_comment_id required' }, { status: 400 });
    }

    let comment;
    try {
      comment = await base44.asServiceRole.entities.PlanComment.get(planCommentId);
    } catch (_e) {
      return Response.json({ status: 'comment_not_found', notified: 0 });
    }
    if (!comment || !comment.calendar_event_id) return Response.json({ status: 'no_event', notified: 0 });

    let event;
    try {
      event = await base44.asServiceRole.entities.CalendarEvent.get(comment.calendar_event_id);
    } catch (_e) {
      return Response.json({ status: 'no_event', notified: 0 });
    }
    if (!event || !event.date) return Response.json({ status: 'no_event_date', notified: 0 });

    // Trips whose [leave_date, return_date] range contains the plan's date.
    // Dates are ISO yyyy-MM-dd strings, so lexicographic compare is correct.
    const allTrips = await base44.asServiceRole.entities.Trip.list('-leave_date', 500);
    const trips = allTrips.filter(
      (t: any) => t.leave_date && t.return_date && t.leave_date <= event.date && t.return_date >= event.date
    );
    if (!trips.length) return Response.json({ status: 'no_matching_trips', notified: 0 });

    const isUrgent = String(comment.body || '').toLowerCase().includes('urgent');
    const snippet = String(comment.body || '').slice(0, 160);
    const authorName = comment.author_name || '';
    const authorId = comment.created_by_id || '';

    // Collect recipients: each trip's creator + assignees of calendar events
    // whose date falls within that trip's range.
    const allEvents = await base44.asServiceRole.entities.CalendarEvent.list('-date', 1000);
    const recipientIds = new Set<string>();
    for (const trip of trips) {
      if (trip.created_by_id) recipientIds.add(trip.created_by_id);
      const tied = allEvents.filter(
        (te: any) => te.date && trip.leave_date <= te.date && te.date <= trip.return_date
      );
      for (const te of tied) {
        if (te.assignee_id) recipientIds.add(te.assignee_id);
      }
    }

    // Don't notify the person who wrote the comment.
    if (authorId) recipientIds.delete(authorId);
    if (!recipientIds.size) return Response.json({ status: 'no_recipients', notified: 0 });

    // Resolve display names for recipients.
    const users = await base44.asServiceRole.entities.User.list();
    const nameMap: Record<string, string> = {};
    for (const u of users) nameMap[u.id] = u.full_name || '';

    const idArr = [...recipientIds];

    // One notification per (trip, recipient) so each person gets their own record.
    const notifications = [];
    for (const trip of trips) {
      for (const rid of idArr) {
        notifications.push({
          trip_id: trip.id,
          plan_comment_id: comment.id,
          comment_snippet: snippet,
          author_name: authorName,
          recipient_id: rid,
          recipient_name: nameMap[rid] || '',
          is_urgent: isUrgent,
          read: false,
        });
      }
    }

    if (notifications.length) {
      await base44.asServiceRole.entities.TripPlanNotification.bulkCreate(notifications);
    }

    return Response.json({
      status: 'ok',
      notified: notifications.length,
      urgent: isUrgent,
      trips: trips.length,
      recipients: idArr.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}