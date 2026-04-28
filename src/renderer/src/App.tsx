import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TitleBar } from './components/TitleBar';
import { Sessions } from './pages/Sessions';
import { KanbanBoard } from './pages/KanbanBoard';
import { Editor } from './pages/Editor';
import { Skills } from './pages/Skills';
import { Agents } from './pages/Agents';
import { Schedules } from './pages/Schedules';
import { Tools } from './pages/Tools';
import { Settings } from './pages/Settings';
import { trpc } from './trpc';
import { useUI } from './store/ui';

const NAV_ROUTES = ['/sessions', '/board', '/editor', '/skills', '/agents', '/schedules', '/tools', '/settings'];

export function App() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const theme = useUI((s) => s.theme);
  const setThemeLocal = useUI((s) => s.setTheme);
  const savedTheme = trpc.settings.theme.useQuery();
  const setTheme = trpc.settings.setTheme.useMutation({
    onSuccess: () => utils.settings.theme.invalidate(),
  });

  useEffect(() => {
    if (!savedTheme.data) return;
    setThemeLocal(savedTheme.data);
  }, [savedTheme.data, setThemeLocal]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;

      if (e.key >= '1' && e.key <= '8') {
        const idx = Number(e.key) - 1;
        const route = NAV_ROUTES[idx];
        if (!route) return;
        e.preventDefault();
        navigate(route);
        return;
      }

      if (e.key === ',') {
        e.preventDefault();
        navigate('/settings');
        return;
      }

      if (e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        const next = theme === 'dark' ? 'light' : 'dark';
        setThemeLocal(next);
        setTheme.mutate({ value: next });
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, setTheme, setThemeLocal, theme]);

  return (
    <div className="flex h-full flex-col bg-ink-950 text-ink-100">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="relative min-h-0 flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/sessions" replace />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/board" element={<KanbanBoard />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
