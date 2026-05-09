import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trpc } from '../../trpc';
import { useActiveWorkspace } from '../../hooks/useActiveWorkspace';
import { SessionTreeNode } from './SessionTreeNode';
import { SessionDetail } from './SessionDetail';

export function Sessions() {
  const { workspaceId } = useActiveWorkspace();
  const utils = trpc.useUtils();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionsQ = trpc.session.list.useQuery(
    { workspaceId: workspaceId ?? undefined },
    { enabled: !!workspaceId },
  );
  const [sessionId, setSessionId] = useState<string | null>(searchParams.get('id'));
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const create = trpc.session.create.useMutation({
    onSuccess: async (s) => {
      await utils.session.list.invalidate();
      setSessionId(s.id);
      setExpandedSessions((prev) => new Set(prev).add(s.id));
    },
  });
  const del = trpc.session.delete.useMutation({
    onSuccess: async () => {
      await utils.session.list.invalidate();
      setSessionId(null);
      setFocusedTaskId(null);
    },
  });

  useEffect(() => {
    if (searchParams.has('id')) {
      searchParams.delete('id');
      setSearchParams(searchParams, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sessionId && sessionsQ.data?.length) {
      const first = sessionsQ.data[0]!;
      setSessionId(first.id);
      setExpandedSessions((prev) => new Set(prev).add(first.id));
    }
  }, [sessionId, sessionsQ.data]);

  // Auto-expand selected session
  useEffect(() => {
    if (sessionId) setExpandedSessions((prev) => new Set(prev).add(sessionId));
  }, [sessionId]);

  const toggleExpand = (id: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="grid h-full grid-cols-[340px_1fr] gap-6 p-6">
      <aside className="flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-mono text-ui-xs uppercase tracking-widest2 text-ink-400">
            sessions
          </div>
          <button
            className="rounded border border-ink-700 px-2 py-0.5 font-mono text-ui-xs uppercase tracking-widest2 text-ink-200 hover:border-amber-500 hover:text-amber-400 disabled:opacity-40"
            disabled={!workspaceId || create.isPending}
            onClick={() =>
              create.mutate({
                workspaceId: workspaceId!,
                title: `session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              })
            }
          >
            + new
          </button>
        </div>

        {!workspaceId && (
          <div className="font-mono text-ui-sm text-ink-500">no active workspace</div>
        )}

        <div className="flex-1 space-y-0.5 overflow-y-auto">
          {sessionsQ.data?.map((s) => (
            <SessionTreeNode
              key={s.id}
              session={s}
              isActive={sessionId === s.id}
              isExpanded={expandedSessions.has(s.id)}
              focusedTaskId={focusedTaskId}
              onSelect={() => {
                setSessionId(s.id);
                setFocusedTaskId(null);
              }}
              onToggle={() => toggleExpand(s.id)}
              onDelete={() => {
                if (confirm(`Delete session "${s.title}"?`)) del.mutate({ id: s.id });
              }}
              onTaskSelect={(taskId) => {
                setSessionId(s.id);
                setFocusedTaskId(taskId);
              }}
            />
          ))}
          {sessionsQ.data?.length === 0 && (
            <div className="font-mono text-ui-sm text-ink-500">no sessions yet</div>
          )}
        </div>
      </aside>

      <main className="min-w-0">
        {sessionId ? (
          <SessionDetail
            sessionId={sessionId}
            key={sessionId}
            focusedTaskId={focusedTaskId}
            onTaskFocus={setFocusedTaskId}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-ui-sm text-ink-500">
            select or create a session
          </div>
        )}
      </main>
    </div>
  );
}
