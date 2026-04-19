import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TitleBar } from './components/TitleBar';
import { Sessions } from './pages/Sessions';
import { Editor } from './pages/Editor';
import { Skills } from './pages/Skills';
import { Agents } from './pages/Agents';
import { Schedules } from './pages/Schedules';
import { Tools } from './pages/Tools';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <div className="flex h-full flex-col bg-ink-950 text-ink-100">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="relative min-h-0 flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/sessions" replace />} />
            <Route path="/sessions" element={<Sessions />} />
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
