import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';
import Search from '@/pages/Search';
import Results from '@/pages/Results';
import Saved from '@/pages/Saved';
import Import from '@/pages/Import';
import Pipeline from '@/pages/Pipeline';
import Outreach from '@/pages/Outreach';
import Chat from '@/pages/Chat';
import Archive from '@/pages/Archive';
import Export from '@/pages/Export';
import Bots from '@/pages/Bots';
import Settings from '@/pages/Settings';
import { useAuth } from '@/hooks/useAuth';
import { useBuildings } from '@/hooks/useBuildings';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { loadBuildings } = useBuildings();

  useEffect(() => {
    if (isAuthenticated) {
      loadBuildings();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-camelot-navy">
        <div className="text-center">
          <div className="text-4xl mb-4">🏰</div>
          <h1 className="text-2xl font-bold text-white mb-2">Camelot Scout</h1>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1f36',
            color: '#fff',
            border: '1px solid rgba(197, 165, 90, 0.3)',
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/results" element={<Results />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/import" element={<Import />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/outreach" element={<Outreach />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/export" element={<Export />} />
          <Route path="/bots" element={<Bots />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </>
  );
}
