import { PageShell } from '../components/PageShell';
import { ModelManager } from '../components/ModelManager';
import { DebugChat } from '../components/DebugChat';
import { trpc } from '../trpc';

export function Settings() {
  const health = trpc.health.useQuery();

  return (
    <PageShell
      path="settings"
      title="Settings"
      subtitle="Local configuration. All data stays on your machine."
    >
      <div className="grid grid-cols-[1fr_1fr] gap-8">
        <section>
          <SectionTitle index="01" title="LLM" />
          <ModelManager />
        </section>

        <section>
          <SectionTitle index="02" title="Debug Chat" />
          <DebugChat />

          <div className="mt-8">
            <SectionTitle index="03" title="System" />
            <Rows
              rows={[
                ['app.version', health.data?.app.version ?? '…'],
                ['db.path', health.data?.db.path ?? '…'],
                ['ollama.url', health.data?.ollama.url ?? '…'],
                [
                  'ollama.status',
                  health.data ? (health.data.ollama.ok ? 'online' : 'offline') : '…',
                ],
              ]}
            />
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="font-mono text-[10px] uppercase tracking-widest2 text-amber">{index}</span>
      <h2 className="font-serif text-2xl text-ink-50">{title}</h2>
    </div>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded border border-ink-800 bg-ink-900/40">
      {rows.map(([k, v], i) => (
        <div
          key={k}
          className={`grid grid-cols-[140px_1fr] gap-4 px-4 py-2.5 ${i ? 'border-t border-ink-800' : ''}`}
        >
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-ink-400">{k}</div>
          <div className="truncate font-mono text-[11px] text-ink-100">{v}</div>
        </div>
      ))}
    </div>
  );
}
