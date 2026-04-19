import { PageShell, EmptyHint } from '../components/PageShell';
export function Skills() {
  return (
    <PageShell
      path="skills"
      title="Skills"
      subtitle="Markdown-defined capabilities the planner can attach to a task. Phase 7."
    >
      <EmptyHint>skills registry</EmptyHint>
    </PageShell>
  );
}
