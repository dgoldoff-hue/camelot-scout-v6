import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Layout from '@/components/Layout';

export default function App() {
      return (
              <Router>
                    <Routes>
                            <Route path="/" element={<Layout><Dashboard /></Layout>Layout>} />
                                    <Route path="/dashboard" element={<Layout><Dashboard /></Layout>Layout>} />
                                    </Route>Routes>
                            </Route>Router>
                      );
                        }</Router>
