import { PageShell, EmptyHint } from '../components/PageShell';
export function Agents() {
  return (
    <PageShell
      path="agents"
      title="Agents"
      subtitle="Configurable personas (role + model + system prompt) used inside the LangGraph loop. Phase 5."
    >
      <EmptyHint>agent presets</EmptyHint>
    </PageShell>
  );
}
