import { useMemo } from 'react';
import type { ApprovalReq } from './types';

export function ApprovalModal({
  req,
  remaining,
  onDecide,
}: {
  req: ApprovalReq;
  remaining: number;
  onDecide: (d: 'approve' | 'approve_session' | 'deny') => void;
}) {
  const argsPretty = useMemo(() => {
    try {
      return JSON.stringify(req.args, null, 2);
    } catch {
      return String(req.args);
    }
  }, [req.args]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[560px] max-w-[90vw] rounded border border-amber-700/60 bg-ink-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-800 px-4 py-3">
          <div>
            <div className="font-mono text-ui-xs uppercase tracking-widest2 text-amber-400">
              approval required{remaining > 0 ? ` · ${remaining} more queued` : ''}
            </div>
            <div className="font-serif text-lg text-ink-50">{req.tool}</div>
          </div>
          <div className="font-mono text-ui-xs text-ink-500">
            {new Date(req.ts).toLocaleTimeString([], { hour12: false })}
          </div>
        </div>
        <pre className="max-h-[40vh] overflow-y-auto px-4 py-3 font-mono text-ui-sm leading-snug text-ink-100">
          {argsPretty}
        </pre>
        <div className="flex items-center justify-end gap-2 border-t border-ink-800 px-4 py-3">
          <button
            onClick={() => onDecide('deny')}
            className="rounded border border-rose-800/60 px-3 py-1 font-mono text-ui-sm uppercase tracking-widest2 text-rose-300 hover:bg-rose-950/40"
          >
            deny
          </button>
          <button
            onClick={() => onDecide('approve_session')}
            className="rounded border border-ink-700 px-3 py-1 font-mono text-ui-sm uppercase tracking-widest2 text-ink-200 hover:bg-ink-900"
          >
            allow this task
          </button>
          <button
            onClick={() => onDecide('approve')}
            className="rounded border border-amber-700/60 bg-amber-950/30 px-3 py-1 font-mono text-ui-sm uppercase tracking-widest2 text-amber-300 hover:bg-amber-950/60"
          >
            approve once
          </button>
        </div>
      </div>
    </div>
  );
}
