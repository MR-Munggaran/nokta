import { getScheduleEvents } from "@/actions/schedule";
import { getSession }        from "@/actions/auth";
import { ScheduleClient }    from "@/components/schedule/ScheduleClient";

/**
 * /schedule
 *
 * Fetches events for a wide window (±90 days from today) so the client
 * can navigate freely without additional fetches.  For a production app
 * with many events you'd instead fetch per-view range via a Server Action
 * called on cursor change.
 */
export default async function SchedulePage() {
  const session = await getSession();
  if (!session.ok) return null;

  // Build a generous 6-month window around today
  const now   = new Date();
  const from  = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    .toISOString().split("T")[0];
  const to    = new Date(now.getFullYear(), now.getMonth() + 4, 0)
    .toISOString().split("T")[0];

  const events = await getScheduleEvents(from, to);

  return <ScheduleClient initialEvents={events} />;
}