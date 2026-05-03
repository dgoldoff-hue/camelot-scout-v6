import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';
import GuidedTour, { useTour } from '@/components/GuidedTour';
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
import Tutorials from '@/pages/Tutorials';
import Compliance from '@/pages/Compliance';
import Alerts from '@/pages/Alerts';
import Proposals from '@/pages/Proposals';
import InstantProposal from '@/pages/InstantProposal';
import Intelligence from '@/pages/Intelligence';
import Reports from '@/pages/Reports';
import ReportCenter from '@/pages/ReportCenter';
import Agreements from '@/pages/Agreements';
import Sentinel from '@/pages/Sentinel';
import Violations from '@/pages/Violations';
import LegalReportTerms from '@/pages/LegalReportTerms';
import { useBuildings } from '@/hooks/useBuildings';

export default function App() {
  const { loadBuildings } = useBuildings();
  const { isOpen: isTourOpen, startTour, closeTour } = useTour();

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

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
      <GuidedTour isOpen={isTourOpen} onClose={closeTour} />
      <Layout onStartTour={startTour}>
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
          <Route path="/tutorials" element={<Tutorials />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/instant-proposal" element={<InstantProposal />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/intelligence" element={<Intelligence />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/report-center" element={<ReportCenter />} />
          <Route path="/agreements" element={<Agreements />} />
          <Route path="/sentinel" element={<Sentinel />} />
          <Route path="/violations" element={<Violations />} />
          <Route path="/legal-report-terms" element={<LegalReportTerms />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </>
  );
}
