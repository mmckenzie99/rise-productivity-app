import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import MainLayout from '@/components/MainLayout';
import { lazy, Suspense } from 'react';
import useSystemDarkMode from '@/hooks/useSystemDarkMode';
import WorkspaceGate from '@/pages/WorkspaceGate';
import { getSession } from '@/lib/workspaceSession';
import { ImportantFlagsProvider } from '@/lib/ImportantFlagsProvider';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Home = lazy(() => import('@/pages/Home'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const Trips = lazy(() => import('@/pages/Trips'));
const Inbox = lazy(() => import('@/pages/Inbox'));
const Tasks = lazy(() => import('@/pages/Tasks'));
const Fitness = lazy(() => import('@/pages/Fitness'));

function AppRoutes() {
  return (
    <ImportantFlagsProvider>
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/engagements" element={<Home />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/fitness" element={<Fitness />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/tasks" element={<Tasks />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
    </ImportantFlagsProvider>
  );
}

// No-account access model: the app is gated by a workspace session, not by
// login. Without a session we show the create/join gate; with one, the main
// app. AuthProvider is kept (platform-managed) but provides no real user.
function Root() {
  useSystemDarkMode();
  if (!getSession()) return <WorkspaceGate />;
  return <AppRoutes />;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Root />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App