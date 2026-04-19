import { PageShell } from '../components/PageShell';
import { ModelManager } from '../components/ModelManager';
import { DebugChat } from '../components/DebugChat';
import { trpc } from '../trpc';

export function Settings() {
  const health = trpc.health.useQuery();
  const utils = trpc.useUtils();
  const autoApprove = trpc.approval.autoApprove.useQuery();
  const setAuto = trpc.approval.setAutoApprove.useMutation({
    onSuccess: () => utils.approval.autoApprove.invalidate(),
  });
  const autoBranch = trpc.git.autoBranch.useQuery();
  const setAutoBranch = trpc.git.setAutoBranch.useMutation({
    onSuccess: () => utils.git.autoBranch.invalidate(),
  });

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

          <div className="mt-8">
            <SectionTitle index="02" title="Safety" />
            <ToggleCard
              checked={!!autoApprove.data}
              disabled={setAuto.isPending}
              onChange={(v) => setAuto.mutate({ value: v })}
              title="auto-approve sensitive tools"
              description="When off, write_file / apply_patch / run_shell / run_tests will prompt for approval before executing. Recommended for unfamiliar workspaces."
            />
          </div>

          <div className="mt-8">
            <SectionTitle index="03" title="Git" />
            <ToggleCard
              checked={!!autoBranch.data}
              disabled={setAutoBranch.isPending}
              onChange={(v) => setAutoBranch.mutate({ value: v })}
              title="auto-branch per task"
              description="Each task checks out a fresh branch ase/<taskId> before code is written, and commits all changes on success. The repo is initialised on first use."
            />
          </div>
        </section>

        <section>
          <SectionTitle index="04" title="Debug Chat" />
          <DebugChat />

          <div className="mt-8">
            <SectionTitle index="05" title="System" />
            <Rows
              rows={[
                ['app.version', health.data?.app.version ?? '...'],
                ['db.path', health.data?.db.path ?? '...'],
                ['ollama.url', health.data?.ollama.url ?? '...'],
                [
                  'ollama.status',
                  health.data ? (health.data.ollama.ok ? 'online' : 'offline') : '...',
                ],
              ]}
            />
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function ToggleCard({
  checked,
  disabled,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded border border-ink-800 bg-ink-900/40 p-4 hover:border-ink-700">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-amber-500"
      />
      <div>
        <div className="font-serif text-sm text-ink-50">{title}</div>
        <div className="mt-1 font-mono text-[11px] text-ink-400">{description}</div>
      </div>
    </label>
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
