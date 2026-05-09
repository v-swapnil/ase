import { cn } from '../../lib/utils';

export function StatusPill({ status, compact }: { status: string; compact?: boolean }) {
  const palette: Record<string, string> = {
    queued: 'border-ink-700 text-ink-300',
    running: 'border-amber-700/60 text-amber-300',
    succeeded: 'border-emerald-700/60 text-emerald-300',
    failed: 'border-rose-800/60 text-rose-300',
    cancelled: 'border-ink-700 text-ink-400',
  };
  return (
    <span
      className={cn(
        'rounded border font-mono !text-ui-xs uppercase tracking-widest2',
        compact ? 'px-1.5 py-0' : 'px-2 py-0.5',
        palette[status] ?? 'border-ink-700 text-ink-400',
      )}
    >
      {status}
    </span>
  );
}
