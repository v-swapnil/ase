import { PageShell, EmptyHint } from '../components/PageShell';
export function Schedules() {
  return (
    <PageShell
      path="schedules"
      title="Schedules"
      subtitle="Cron-triggered task templates that run in the background. Phase 8."
    >
      <EmptyHint>cron schedules</EmptyHint>
    </PageShell>
  );
}
