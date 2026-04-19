import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ipcLink } from 'electron-trpc/renderer';
import { HashRouter } from 'react-router-dom';
import { trpc } from './trpc';
import { App } from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

const trpcClient = trpc.createClient({
  links: [ipcLink()],
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </HashRouter>
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>,
);
