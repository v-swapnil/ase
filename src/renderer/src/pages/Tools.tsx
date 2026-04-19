import { PageShell } from '../components/PageShell';
import { ToolPlayground } from '../components/ToolPlayground';

export function Tools() {
  return (
    <PageShell
      path="tools"
      title="Tools"
      subtitle="Invoke any tool the agents have access to. Useful for sanity-checking the sandbox and patch applier."
    >
      <ToolPlayground />
    </PageShell>
  );
}
