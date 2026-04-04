/**
 * IntelligenceReportPDF — Professional client-facing Building Intelligence Report
 * 
 * Uses @react-pdf/renderer to generate a multi-page PDF with full NYC data.
 * Color scheme: Navy (#0f1629) headers, Gold (#C5A55A) accents, white body.
 */

import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font, Link,
} from '@react-pdf/renderer';

// ============================================================
// Types
// ============================================================

export interface ReportData {
  address: string;
  borough?: string;
  reportId: string;
  generatedAt: string;
  dof: {
    bbl?: string;
    owner?: string;
    marketValue: number;
    assessedValue: number;
    landValue: number;
    yearBuilt: number;
    units: number;
    lotArea: number;
    buildingArea: number;
    stories: number;
    buildingClass?: string;
    taxClass?: string;
  } | null;
  registration: {
    owner: string | null;
    managementCompany: string | null;
    registrationId: string | null;
    buildingId: string | null;
  };
  violations: {
    total: number;
    open: number;
    items: any[];
    lastDate?: string;
  };
  permits: {
    count: number;
    items: any[];
    hasRecent: boolean;
  };
  energy: {
    energyStarScore: number | null;
    siteEUI: number | null;
    ghgEmissions: number | null;
    occupancy?: string;
    propertyName?: string;
  } | null;
  acris: {
    records: any[];
    deeds: any[];
    mortgages: any[];
    lastSaleDate?: string;
    lastSalePrice?: number;
    lastSaleBuyer?: string;
    lastSaleSeller?: string;
    acrisUrl: string;
    borough: string;
    block: string;
    lot: string;
  } | null;
  ecb: {
    violations: any[];
    count: number;
    totalPenaltyBalance: number;
  };
  litigation: {
    cases: any[];
    count: number;
    hasActive: boolean;
  };
  rentStabilization: {
    data: any[];
    isStabilized: boolean;
  };
}

// ============================================================
// Color Palette
// ============================================================

const COLORS = {
  navy: '#0f1629',
  navyLight: '#1a1f36',
  gold: '#C5A55A',
  goldLight: '#D4BA78',
  white: '#ffffff',
  offWhite: '#f8f9fa',
  gray100: '#f1f3f5',
  gray200: '#e9ecef',
  gray400: '#adb5bd',
  gray600: '#6c757d',
  gray800: '#343a40',
  red: '#dc3545',
  green: '#198754',
  amber: '#fd7e14',
  blue: '#0d6efd',
};

// ============================================================
// Styles
// ============================================================

const s = StyleSheet.create({
  // Pages
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLORS.gray800,
    backgroundColor: COLORS.white,
    paddingBottom: 60,
  },
  coverPage: {
    fontFamily: 'Helvetica',
    backgroundColor: COLORS.navy,
    color: COLORS.white,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 6.5,
    color: COLORS.gray400,
  },
  pageNumber: {
    fontSize: 7,
    color: COLORS.gray400,
  },

  // Section headers
  sectionHeader: {
    backgroundColor: COLORS.navy,
    color: COLORS.white,
    padding: 12,
    paddingLeft: 16,
    marginBottom: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 8,
    color: COLORS.goldLight,
    marginTop: 2,
  },

  // Content areas
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },

  // Tables
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray600,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: COLORS.offWhite,
  },
  tableCell: {
    fontSize: 8,
    color: COLORS.gray800,
  },

  // Key-value pairs
  kvRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  kvLabel: {
    width: '40%',
    fontSize: 8,
    color: COLORS.gray600,
    fontFamily: 'Helvetica-Bold',
  },
  kvValue: {
    width: '60%',
    fontSize: 8.5,
    color: COLORS.gray800,
  },

  // Stats cards row
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 3,
    padding: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.navy,
  },
  statLabel: {
    fontSize: 7,
    color: COLORS.gray600,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Gold accent bar
  goldBar: {
    height: 3,
    backgroundColor: COLORS.gold,
    marginBottom: 12,
  },

  // Badge
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  badgeGreen: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  badgeRed: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  badgeAmber: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeBlue: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },

  // TOC
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  tocTitle: {
    fontSize: 10,
    color: COLORS.gray800,
  },
  tocPage: {
    fontSize: 10,
    color: COLORS.gold,
    fontFamily: 'Helvetica-Bold',
  },

  // Paragraph text
  paragraph: {
    fontSize: 8.5,
    lineHeight: 1.5,
    color: COLORS.gray800,
    marginBottom: 8,
  },
  label: {
    fontSize: 8,
    color: COLORS.gray600,
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  heading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.navy,
    marginBottom: 8,
    marginTop: 12,
  },

  // Empty state
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
    borderRadius: 3,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 9,
    color: COLORS.gray400,
    fontStyle: 'italic',
  },
});

// ============================================================
// Helpers
// ============================================================

function fmtCurrency(val: number | null | undefined): string {
  if (!val) return 'N/A';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

function fmtNumber(val: number | null | undefined): string {
  if (val === null || val === undefined) return 'N/A';
  return val.toLocaleString();
}

function fmtDate(val: string | null | undefined): string {
  if (!val) return 'N/A';
  try {
    return new Date(val).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return val;
  }
}

// ============================================================
// Reusable Components
// ============================================================

function PageFooter({ pageNum }: { pageNum: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>
        Report generated by Camelot Scout | Camelot Property Management Services Corp | (212) 206-9939 | www.camelot.nyc
      </Text>
      <Text style={s.pageNumber}>Page {pageNum}</Text>
    </View>
  );
}

function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {subtitle && <Text style={s.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function KVRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.kvRow}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue}>{value}</Text>
    </View>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={s.emptyState}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

// ============================================================
// Page Components
// ============================================================

/** Page 1: Cover */
function CoverPage({ data }: { data: ReportData }) {
  return (
    <Page size="LETTER" style={s.coverPage}>
      {/* Top gold accent */}
      <View style={{ width: 80, height: 3, backgroundColor: COLORS.gold, marginBottom: 40 }} />

      {/* Branding */}
      <Text style={{ fontSize: 12, letterSpacing: 3, color: COLORS.gold, marginBottom: 6, fontFamily: 'Helvetica-Bold' }}>
        CAMELOT PROPERTY MANAGEMENT
      </Text>
      <Text style={{ fontSize: 8, letterSpacing: 2, color: COLORS.gray400, marginBottom: 60 }}>
        SERVICES CORP
      </Text>

      {/* Title */}
      <Text style={{ fontSize: 32, fontFamily: 'Helvetica-Bold', letterSpacing: 1, marginBottom: 8 }}>
        Building Intelligence
      </Text>
      <Text style={{ fontSize: 32, fontFamily: 'Helvetica-Bold', letterSpacing: 1, marginBottom: 30 }}>
        Report
      </Text>

      {/* Gold divider */}
      <View style={{ width: 120, height: 2, backgroundColor: COLORS.gold, marginBottom: 30 }} />

      {/* Address */}
      <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 6, textAlign: 'center' }}>
        {data.address}
      </Text>
      {data.borough && (
        <Text style={{ fontSize: 10, color: COLORS.gray400, marginBottom: 40 }}>
          {data.borough}, New York
        </Text>
      )}

      {/* Report metadata */}
      <View style={{ flexDirection: 'row', gap: 30, marginBottom: 20 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 7, color: COLORS.gray400, letterSpacing: 1, marginBottom: 3 }}>REPORT DATE</Text>
          <Text style={{ fontSize: 9, color: COLORS.white }}>
            {new Date(data.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 7, color: COLORS.gray400, letterSpacing: 1, marginBottom: 3 }}>REPORT ID</Text>
          <Text style={{ fontSize: 9, color: COLORS.white }}>{data.reportId.slice(0, 8).toUpperCase()}</Text>
        </View>
        {data.dof?.bbl && (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 7, color: COLORS.gray400, letterSpacing: 1, marginBottom: 3 }}>BBL</Text>
            <Text style={{ fontSize: 9, color: COLORS.white }}>{data.dof.bbl}</Text>
          </View>
        )}
      </View>

      {/* Bottom bar */}
      <View style={{ position: 'absolute', bottom: 30, left: 50, right: 50, alignItems: 'center' }}>
        <Text style={{ fontSize: 7, color: COLORS.gray400, letterSpacing: 0.5 }}>
          CONFIDENTIAL — Prepared exclusively for authorized recipients
        </Text>
      </View>
    </Page>
  );
}

/** Page 1b: Table of Contents */
function TOCPage({ data }: { data: ReportData }) {
  const tocItems = [
    { title: 'Property Overview', page: '3' },
    { title: 'Ownership & Transfer History', page: '4' },
    { title: 'HPD Violations', page: '5' },
    { title: 'ECB/OATH Violations', page: '6' },
    { title: 'DOB Permits & Construction', page: '7' },
    { title: 'Energy & LL97 Compliance', page: '8' },
    { title: 'Housing Litigation', page: '9' },
    { title: 'Rent Stabilization', page: '10' },
    { title: 'Executive Summary & Recommendations', page: '11' },
  ];

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.body}>
        <View style={s.goldBar} />
        <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.navy, marginBottom: 6 }}>
          Table of Contents
        </Text>
        <Text style={{ fontSize: 8, color: COLORS.gray600, marginBottom: 24 }}>
          {data.address}
        </Text>

        {tocItems.map((item, i) => (
          <View style={s.tocItem} key={i}>
            <Text style={s.tocTitle}>
              {i + 1}. {item.title}
            </Text>
            <Text style={s.tocPage}>{item.page}</Text>
          </View>
        ))}

        {/* Key highlights box */}
        <View style={{ marginTop: 30, padding: 16, backgroundColor: COLORS.offWhite, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 3 }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.navy, marginBottom: 10 }}>
            Key Highlights
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.navy }}>
                {data.violations.total}
              </Text>
              <Text style={{ fontSize: 7, color: COLORS.gray600, marginTop: 2 }}>HPD VIOLATIONS</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: data.violations.open > 0 ? COLORS.red : COLORS.green }}>
                {data.violations.open}
              </Text>
              <Text style={{ fontSize: 7, color: COLORS.gray600, marginTop: 2 }}>OPEN VIOLATIONS</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.navy }}>
                {data.ecb.count}
              </Text>
              <Text style={{ fontSize: 7, color: COLORS.gray600, marginTop: 2 }}>ECB VIOLATIONS</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: data.litigation.hasActive ? COLORS.red : COLORS.green }}>
                {data.litigation.count}
              </Text>
              <Text style={{ fontSize: 7, color: COLORS.gray600, marginTop: 2 }}>LITIGATION CASES</Text>
            </View>
          </View>
        </View>
      </View>
      <PageFooter pageNum={2} />
    </Page>
  );
}

/** Page 2: Property Overview */
function PropertyOverviewPage({ data }: { data: ReportData }) {
  const dof = data.dof;

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.body}>
        <SectionHead title="Property Overview" subtitle="NYC Department of Finance — PLUTO Data" />

        {!dof ? (
          <EmptyState text="No Department of Finance data found for this property." />
        ) : (
          <>
            {/* Stats row */}
            <View style={s.statsRow}>
              <StatCard value={fmtCurrency(dof.marketValue)} label="Market Value" />
              <StatCard value={fmtCurrency(dof.assessedValue)} label="Assessed Value" />
              <StatCard value={String(dof.yearBuilt || 'N/A')} label="Year Built" />
              <StatCard value={String(dof.units || 'N/A')} label="Res. Units" />
            </View>

            {/* Property details */}
            <Text style={s.heading}>Property Details</Text>
            <KVRow label="Address" value={data.address} />
            <KVRow label="BBL" value={dof.bbl || 'N/A'} />
            <KVRow label="Owner of Record" value={dof.owner || 'N/A'} />
            <KVRow label="Building Class" value={dof.buildingClass || 'N/A'} />
            <KVRow label="Tax Class" value={dof.taxClass || 'N/A'} />
            <KVRow label="Number of Stories" value={String(dof.stories || 'N/A')} />
            <KVRow label="Residential Units" value={fmtNumber(dof.units)} />
            <KVRow label="Lot Area (sq ft)" value={fmtNumber(dof.lotArea)} />
            <KVRow label="Building Area (sq ft)" value={fmtNumber(dof.buildingArea)} />
            <KVRow label="Land Value" value={fmtCurrency(dof.landValue)} />
            <KVRow label="Full Market Value" value={fmtCurrency(dof.marketValue)} />
            <KVRow label="Assessed Total Value" value={fmtCurrency(dof.assessedValue)} />

            {/* Registration info */}
            {data.registration && (
              <>
                <Text style={s.heading}>HPD Registration</Text>
                <KVRow label="Registered Owner" value={data.registration.owner || 'N/A'} />
                <KVRow label="Management Company" value={data.registration.managementCompany || 'N/A'} />
                <KVRow label="Registration ID" value={data.registration.registrationId || 'N/A'} />
              </>
            )}
          </>
        )}
      </View>
      <PageFooter pageNum={3} />
    </Page>
  );
}

/** Page 3: Ownership & Transfers */
function OwnershipPage({ data }: { data: ReportData }) {
  const acris = data.acris;

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.body}>
        <SectionHead title="Ownership & Transfer History" subtitle="ACRIS — Automated City Register Information System" />

        {!acris || acris.records.length === 0 ? (
          <EmptyState text="No ACRIS records found for this property." />
        ) : (
          <>
            {/* Last sale summary */}
            {acris.lastSaleDate && (
              <View style={{ marginBottom: 16, padding: 12, backgroundColor: COLORS.offWhite, borderLeftWidth: 3, borderLeftColor: COLORS.gold, borderRadius: 2 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.navy, marginBottom: 6 }}>
                  Last Recorded Sale
                </Text>
                <View style={{ flexDirection: 'row', gap: 30 }}>
                  <View>
                    <Text style={{ fontSize: 7, color: COLORS.gray600 }}>DATE</Text>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{fmtDate(acris.lastSaleDate)}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 7, color: COLORS.gray600 }}>PRICE</Text>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{fmtCurrency(acris.lastSalePrice)}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 7, color: COLORS.gray600 }}>BUYER</Text>
                    <Text style={{ fontSize: 9 }}>{acris.lastSaleBuyer || 'N/A'}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 7, color: COLORS.gray600 }}>SELLER</Text>
                    <Text style={{ fontSize: 9 }}>{acris.lastSaleSeller || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Deed History */}
            <Text style={s.heading}>Deed Transfers ({acris.deeds.length})</Text>
            {acris.deeds.length === 0 ? (
              <EmptyState text="No deed transfers found in the past 10 years." />
            ) : (
              <View style={s.table}>
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, { width: '18%' }]}>Date</Text>
                  <Text style={[s.tableHeaderCell, { width: '18%' }]}>Amount</Text>
                  <Text style={[s.tableHeaderCell, { width: '32%' }]}>Buyer</Text>
                  <Text style={[s.tableHeaderCell, { width: '32%' }]}>Seller</Text>
                </View>
                {acris.deeds.slice(0, 15).map((deed, i) => {
                  const buyer = deed.parties.find((p: any) => p.type === 'buyer');
                  const seller = deed.parties.find((p: any) => p.type === 'seller');
                  return (
                    <View style={i % 2 === 0 ? s.tableRow : s.tableRowAlt} key={deed.documentId}>
                      <Text style={[s.tableCell, { width: '18%' }]}>{fmtDate(deed.date)}</Text>
                      <Text style={[s.tableCell, { width: '18%' }]}>{fmtCurrency(deed.amount)}</Text>
                      <Text style={[s.tableCell, { width: '32%' }]}>{buyer?.name || 'N/A'}</Text>
                      <Text style={[s.tableCell, { width: '32%' }]}>{seller?.name || 'N/A'}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Mortgage History */}
            <Text style={s.heading}>Mortgages & Assignments ({acris.mortgages.length})</Text>
            {acris.mortgages.length === 0 ? (
              <EmptyState text="No mortgage records found in the past 10 years." />
            ) : (
              <View style={s.table}>
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, { width: '18%' }]}>Date</Text>
                  <Text style={[s.tableHeaderCell, { width: '15%' }]}>Type</Text>
                  <Text style={[s.tableHeaderCell, { width: '18%' }]}>Amount</Text>
                  <Text style={[s.tableHeaderCell, { width: '49%' }]}>Parties</Text>
                </View>
                {acris.mortgages.slice(0, 15).map((mtg, i) => {
                  const partyNames = mtg.parties.map((p: any) => p.name).join(', ');
                  return (
                    <View style={i % 2 === 0 ? s.tableRow : s.tableRowAlt} key={mtg.documentId}>
                      <Text style={[s.tableCell, { width: '18%' }]}>{fmtDate(mtg.date)}</Text>
                      <Text style={[s.tableCell, { width: '15%' }]}>{mtg.documentTypeLabel}</Text>
                      <Text style={[s.tableCell, { width: '18%' }]}>{fmtCurrency(mtg.amount)}</Text>
                      <Text style={[s.tableCell, { width: '49%' }]}>{partyNames || 'N/A'}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>
      <PageFooter pageNum={4} />
    </Page>
  );
}

/** Page 4: HPD Violations */
function HPDViolationsPage({ data }: { data: ReportData }) {
  const { violations } = data;

  // Violation class breakdown
  const classBreakdown = { A: 0, B: 0, C: 0, Other: 0 };
  violations.items.forEach((v: any) => {
    const cls = (v.class || '').toUpperCase();
    if (cls === 'A') classBreakdown.A++;
    else if (cls === 'B') classBreakdown.B++;
    else if (cls === 'C') classBreakdown.C++;
    else classBreakdown.Other++;
  });

  // Year trend (last 5 years)
  const now = new Date().getFullYear();
  const yearBuckets: Record<number, number> = {};
  for (let y = now - 4; y <= now; y++) yearBuckets[y] = 0;
  violations.items.forEach((v: any) => {
    const yr = new Date(v.inspectiondate || '').getFullYear();
    if (yearBuckets[yr] !== undefined) yearBuckets[yr]++;
  });

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.body}>
        <SectionHead title="HPD Violations" subtitle="NYC Housing Preservation & Development" />

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard value={String(violations.total)} label="Total Violations" />
          <StatCard value={String(violations.open)} label="Open Violations" />
          <StatCard value={String(classBreakdown.C)} label="Class C (Hazardous)" />
          <StatCard value={fmtDate(violations.lastDate)} label="Last Inspection" />
        </View>

        {/* Class breakdown */}
        <Text style={s.heading}>Violation Class Breakdown</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <View style={{ flex: 1, padding: 10, backgroundColor: '#fef3c7', borderRadius: 3, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#92400e' }}>{classBreakdown.A}</Text>
            <Text style={{ fontSize: 7, color: '#92400e', marginTop: 2 }}>CLASS A</Text>
            <Text style={{ fontSize: 6, color: '#92400e' }}>Non-Hazardous</Text>
          </View>
          <View style={{ flex: 1, padding: 10, backgroundColor: '#fed7aa', borderRadius: 3, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#9a3412' }}>{classBreakdown.B}</Text>
            <Text style={{ fontSize: 7, color: '#9a3412', marginTop: 2 }}>CLASS B</Text>
            <Text style={{ fontSize: 6, color: '#9a3412' }}>Hazardous</Text>
          </View>
          <View style={{ flex: 1, padding: 10, backgroundColor: '#fee2e2', borderRadius: 3, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#991b1b' }}>{classBreakdown.C}</Text>
            <Text style={{ fontSize: 7, color: '#991b1b', marginTop: 2 }}>CLASS C</Text>
            <Text style={{ fontSize: 6, color: '#991b1b' }}>Immediately Hazardous</Text>
          </View>
        </View>

        {/* Year trend */}
        <Text style={s.heading}>Annual Violation Trend</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            {Object.keys(yearBuckets).map((yr) => (
              <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'center' }]} key={yr}>{yr}</Text>
            ))}
          </View>
          <View style={s.tableRow}>
            {Object.values(yearBuckets).map((count, i) => (
              <Text style={[s.tableCell, { flex: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]} key={i}>{count}</Text>
            ))}
          </View>
        </View>

        {/* Recent violations list */}
        <Text style={s.heading}>Recent Violations (up to 20)</Text>
        {violations.items.length === 0 ? (
          <EmptyState text="No HPD violations found for this property." />
        ) : (
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderCell, { width: '14%' }]}>Date</Text>
              <Text style={[s.tableHeaderCell, { width: '8%' }]}>Class</Text>
              <Text style={[s.tableHeaderCell, { width: '10%' }]}>Status</Text>
              <Text style={[s.tableHeaderCell, { width: '8%' }]}>Apt</Text>
              <Text style={[s.tableHeaderCell, { width: '60%' }]}>Description</Text>
            </View>
            {violations.items.slice(0, 20).map((v: any, i: number) => (
              <View style={i % 2 === 0 ? s.tableRow : s.tableRowAlt} key={v.violationid || i}>
                <Text style={[s.tableCell, { width: '14%' }]}>{fmtDate(v.inspectiondate)}</Text>
                <Text style={[s.tableCell, { width: '8%', fontFamily: 'Helvetica-Bold', color: v.class === 'C' ? COLORS.red : COLORS.gray800 }]}>
                  {v.class || '—'}
                </Text>
                <Text style={[s.tableCell, { width: '10%' }]}>{v.currentstatus || v.violationstatus || '—'}</Text>
                <Text style={[s.tableCell, { width: '8%' }]}>{v.apartment || '—'}</Text>
                <Text style={[s.tableCell, { width: '60%' }]}>{(v.novdescription || '').slice(0, 120)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <PageFooter pageNum={5} />
    </Page>
  );
}

/** Page 5: ECB/OATH Violations */
function ECBViolationsPage({ data }: { data: ReportData }) {
  const { ecb } = data;

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.body}>
        <SectionHead title="ECB/OATH Violations" subtitle="Environmental Control Board / Office of Administrative Trials & Hearings" />

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard value={String(ecb.count)} label="Total ECB Violations" />
          <StatCard value={fmtCurrency(ecb.totalPenaltyBalance)} label="Penalty Balance Due" />
        </View>

        {ecb.violations.length === 0 ? (
          <EmptyState text="No ECB/OATH violations found for this property." />
        ) : (
          <>
            <Text style={s.heading}>Violation List (up to 25)</Text>
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { width: '15%' }]}>Violation #</Text>
                <Text style={[s.tableHeaderCell, { width: '12%' }]}>Date</Text>
                <Text style={[s.tableHeaderCell, { width: '12%' }]}>Status</Text>
                <Text style={[s.tableHeaderCell, { width: '14%' }]}>Penalty Due</Text>
                <Text style={[s.tableHeaderCell, { width: '47%' }]}>Description</Text>
              </View>
              {ecb.violations.slice(0, 25).map((v: any, i: number) => (
                <View style={i % 2 === 0 ? s.tableRow : s.tableRowAlt} key={v.ecb_violation_number || i}>
                  <Text style={[s.tableCell, { width: '15%' }]}>{v.ecb_violation_number || '—'}</Text>
                  <Text style={[s.tableCell, { width: '12%' }]}>{fmtDate(v.violation_date)}</Text>
                  <Text style={[s.tableCell, { width: '12%' }]}>{v.ecb_violation_status || '—'}</Text>
                  <Text style={[s.tableCell, { width: '14%', fontFamily: 'Helvetica-Bold' }]}>
                    {v.penalty_balance_due ? fmtCurrency(parseFloat(v.penalty_balance_due)) : '—'}
                  </Text>
                  <Text style={[s.tableCell, { width: '47%' }]}>{(v.violation_description || '').slice(0, 100)}</Text>
                </View>
              ))}
            </View>

            {ecb.violations.length > 25 && (
              <Text style={[s.paragraph, { fontStyle: 'italic', color: COLORS.gray400 }]}>
                Showing 25 of {ecb.count} violations. Full list available on request.
              </Text>
            )}
          </>
        )}
      </View>
      <PageFooter pageNum={6} />
    </Page>
  );
}

/** Page 6: DOB Permits */
function DOBPermitsPage({ data }: { data: ReportData }) {
  const { permits } = data;

  // Job type breakdown
  const jobTypes: Record<string, number> = {};
  permits.items.forEach((p: any) => {
    const jt = p.job_type || 'Unknown';
    jobTypes[jt] = (jobTypes[jt] || 0) + 1;
  });

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.body}>
        <SectionHead title="DOB Permits & Construction" subtitle="NYC Department of Buildings" />

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard value={String(permits.count)} label="Total Permits" />
          <StatCard value={permits.hasRecent ? 'Yes' : 'No'} label="Recent Activity (2yr)" />
          <StatCard value={String(Object.keys(jobTypes).length)} label="Job Types" />
        </View>

        {/* Job type breakdown */}
        {Object.keys(jobTypes).length > 0 && (
          <>
            <Text style={s.heading}>Permit Types</Text>
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { width: '60%' }]}>Job Type</Text>
                <Text style={[s.tableHeaderCell, { width: '40%' }]}>Count</Text>
              </View>
              {Object.entries(jobTypes).sort((a, b) => b[1] - a[1]).map(([type, count], i) => (
                <View style={i % 2 === 0 ? s.tableRow : s.tableRowAlt} key={type}>
                  <Text style={[s.tableCell, { width: '60%' }]}>{type}</Text>
                  <Text style={[s.tableCell, { width: '40%', fontFamily: 'Helvetica-Bold' }]}>{count}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Permit list */}
        <Text style={s.heading}>Recent Permits (up to 20)</Text>
        {permits.items.length === 0 ? (
          <EmptyState text="No DOB permits found for this property." />
        ) : (
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderCell, { width: '12%' }]}>Filing Date</Text>
              <Text style={[s.tableHeaderCell, { width: '10%' }]}>Job #</Text>
              <Text style={[s.tableHeaderCell, { width: '10%' }]}>Type</Text>
              <Text style={[s.tableHeaderCell, { width: '12%' }]}>Status</Text>
              <Text style={[s.tableHeaderCell, { width: '56%' }]}>Description</Text>
            </View>
            {permits.items.slice(0, 20).map((p: any, i: number) => (
              <View style={i % 2 === 0 ? s.tableRow : s.tableRowAlt} key={p.job_ || i}>
                <Text style={[s.tableCell, { width: '12%' }]}>{fmtDate(p.filing_date)}</Text>
                <Text style={[s.tableCell, { width: '10%' }]}>{p.job_ || '—'}</Text>
                <Text style={[s.tableCell, { width: '10%' }]}>{p.job_type || '—'}</Text>
                <Text style={[s.tableCell, { width: '12%' }]}>{p.job_status_descrp || p.job_status || '—'}</Text>
                <Text style={[s.tableCell, { width: '56%' }]}>{(p.job_description || '').slice(0, 100)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <PageFooter pageNum={7} />
    </Page>
  );
}

/** Page 7: Energy & LL97 Compliance */
function EnergyPage({ data }: { data: ReportData }) {
  const energy = data.energy;

  const getComplianceStatus = () => {
    if (!energy?.energyStarScore) return { label: 'Unknown', color: COLORS.gray400 };
    if (energy.energyStarScore >= 75) return { label: 'Likely Compliant', color: COLORS.green };
    if (energy.energyStarScore >= 50) return { label: 'At Risk', color: COLORS.amber };
    return { label: 'Non-Compliant Risk', color: COLORS.red };
  };

  const compliance = getComplianceStatus();

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.body}>
        <SectionHead title="Energy & LL97 Compliance" subtitle="NYC Energy Benchmarking — Local Law 97" />

        {!energy ? (
          <EmptyState text="No energy benchmarking data found for this property." />
        ) : (
          <>
            {/* Stats */}
            <View style={s.statsRow}>
              <StatCard
                value={energy.energyStarScore !== null ? String(energy.energyStarScore) : 'N/A'}
                label="Energy Star Score"
              />
              <StatCard
                value={energy.siteEUI !== null ? `${energy.siteEUI.toFixed(1)}` : 'N/A'}
                label="Site EUI (kBtu/ft²)"
              />
              <StatCard
                value={energy.ghgEmissions !== null ? `${energy.ghgEmissions.toFixed(1)}` : 'N/A'}
                label="GHG (MT CO2e)"
              />
            </View>

            {/* Compliance status */}
            <View style={{ padding: 14, backgroundColor: COLORS.offWhite, borderLeftWidth: 4, borderLeftColor: compliance.color, borderRadius: 2, marginBottom: 16 }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.navy, marginBottom: 4 }}>
                LL97 Compliance Assessment
              </Text>
              <Text style={{ fontSize: 9, color: compliance.color, fontFamily: 'Helvetica-Bold', marginBottom: 6 }}>
                Status: {compliance.label}
              </Text>
              <Text style={s.paragraph}>
                {energy.energyStarScore !== null && energy.energyStarScore >= 75
                  ? 'This building has a strong Energy Star score and is likely meeting current LL97 emission caps. Continue monitoring for Period 2 (2030-2034) when limits tighten.'
                  : energy.energyStarScore !== null && energy.energyStarScore >= 50
                  ? 'This building\'s energy performance is moderate. It may face penalties under LL97 Period 1 (2024-2029) or Period 2. An energy audit is recommended.'
                  : energy.energyStarScore !== null
                  ? 'This building\'s low Energy Star score suggests it is at high risk of LL97 non-compliance. Immediate energy efficiency improvements should be evaluated. Penalties are $268/metric ton CO2 over the cap.'
                  : 'Insufficient data to assess LL97 compliance. An energy audit is recommended.'}
              </Text>
            </View>

            {/* Details */}
            <Text style={s.heading}>Benchmarking Details</Text>
            <KVRow label="Property Name" value={energy.propertyName || 'N/A'} />
            <KVRow label="Energy Star Score" value={energy.energyStarScore !== null ? String(energy.energyStarScore) : 'N/A'} />
            <KVRow label="Site EUI (kBtu/ft²)" value={energy.siteEUI !== null ? energy.siteEUI.toFixed(1) : 'N/A'} />
            <KVRow label="Total GHG Emissions" value={energy.ghgEmissions !== null ? `${energy.ghgEmissions.toFixed(1)} MT CO2e` : 'N/A'} />
            <KVRow label="Occupancy" value={energy.occupancy || 'N/A'} />

            {/* LL97 context */}
            <Text style={s.heading}>About Local Law 97</Text>
            <Text style={s.paragraph}>
              Local Law 97 requires most buildings over 25,000 square feet to meet annual carbon emission limits starting in 2024.
              Buildings that exceed their limits must pay a penalty of $268 per metric ton of CO2 equivalent over the cap.
              Period 1 (2024-2029) has more lenient caps, while Period 2 (2030-2034) significantly tightens requirements.
            </Text>
          </>
        )}
      </View>
      <PageFooter pageNum={8} />
    </Page>
  );
}

/** Page 8: Housing Litigation */
function LitigationPage({ data }: { data: ReportData }) {
  const { litigation } = data;

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.body}>
        <SectionHead title="Housing Litigation" subtitle="NYC Housing Court — HPD Litigation Cases" />

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard value={String(litigation.count)} label="Total Cases" />
          <StatCard value={litigation.hasActive ? 'YES' : 'NO'} label="Active Litigation" />
        </View>

        {litigation.hasActive && (
          <View style={{ padding: 10, backgroundColor: '#fee2e2', borderRadius: 3, marginBottom: 12 }}>
            <Text style={{ fontSize: 8.5, color: '#991b1b', fontFamily: 'Helvetica-Bold' }}>
              ⚠ Active housing litigation detected. This building may be under heightened regulatory scrutiny.
            </Text>
          </View>
        )}

        {litigation.cases.length === 0 ? (
          <EmptyState text="No housing litigation cases found for this property." />
        ) : (
          <>
            <Text style={s.heading}>Case History</Text>
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { width: '15%' }]}>Case ID</Text>
                <Text style={[s.tableHeaderCell, { width: '20%' }]}>Type</Text>
                <Text style={[s.tableHeaderCell, { width: '18%' }]}>Opened</Text>
                <Text style={[s.tableHeaderCell, { width: '15%' }]}>Status</Text>
                <Text style={[s.tableHeaderCell, { width: '32%' }]}>Address</Text>
              </View>
              {litigation.cases.map((c: any, i: number) => (
                <View style={i % 2 === 0 ? s.tableRow : s.tableRowAlt} key={c.litigationid || i}>
                  <Text style={[s.tableCell, { width: '15%' }]}>{c.litigationid || '—'}</Text>
                  <Text style={[s.tableCell, { width: '20%' }]}>{c.casetype || '—'}</Text>
                  <Text style={[s.tableCell, { width: '18%' }]}>{fmtDate(c.caseopendate)}</Text>
                  <Text style={[s.tableCell, { width: '15%', fontFamily: 'Helvetica-Bold', color: (c.casestatus || '').toLowerCase() === 'open' ? COLORS.red : COLORS.gray800 }]}>
                    {c.casestatus || '—'}
                  </Text>
                  <Text style={[s.tableCell, { width: '32%' }]}>
                    {[c.housenumber, c.streetname].filter(Boolean).join(' ') || '—'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
      <PageFooter pageNum={9} />
    </Page>
  );
}

/** Page 9: Rent Stabilization */
function RentStabilizationPage({ data }: { data: ReportData }) {
  const { rentStabilization } = data;
  const rsData = rentStabilization.data[0];

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.body}>
        <SectionHead title="Rent Stabilization" subtitle="NYC Rent Guidelines Board — DHCR Data" />

        {/* Status */}
        <View style={[s.statsRow, { marginBottom: 0 }]}>
          <View style={[s.statCard, { backgroundColor: rentStabilization.isStabilized ? '#dbeafe' : COLORS.offWhite }]}>
            <Text style={[s.statValue, { color: rentStabilization.isStabilized ? COLORS.blue : COLORS.gray400 }]}>
              {rentStabilization.isStabilized ? 'YES' : 'NO'}
            </Text>
            <Text style={s.statLabel}>Rent Stabilized</Text>
          </View>
        </View>

        {!rentStabilization.isStabilized ? (
          <View style={{ marginTop: 16 }}>
            <EmptyState text="This property does not appear in the NYC Rent Stabilization database." />
            <Text style={[s.paragraph, { marginTop: 8 }]}>
              This building may be market-rate, a condo/co-op, or may have exited stabilization.
              This data is based on the NYC Rent Stabilization dataset and may not reflect very recent changes.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[s.heading, { marginTop: 16 }]}>Rent Stabilization Details</Text>
            {rsData && (
              <>
                <KVRow label="Building Address" value={rsData.building_address || data.address} />
                <KVRow label="Borough" value={rsData.borough || data.borough || 'N/A'} />
                <KVRow label="Postcode" value={rsData.postcode || 'N/A'} />
                {rsData.uc2007 && <KVRow label="Unit Count (2007)" value={rsData.uc2007} />}
                {rsData.est2007 && <KVRow label="Estimated (2007)" value={rsData.est2007} />}
                {rsData.dhcr2009 && <KVRow label="DHCR (2009)" value={rsData.dhcr2009} />}
              </>
            )}

            <Text style={[s.heading, { marginTop: 12 }]}>Implications</Text>
            <Text style={s.paragraph}>
              Rent-stabilized buildings are subject to NYC Rent Guidelines Board annual increase limits.
              Management of these properties requires strict compliance with DHCR regulations,
              including proper lease renewals, MCI/IAI applications, and accurate rent registration.
              Non-compliance can lead to penalties, rent rollbacks, and treble damages.
            </Text>
          </>
        )}
      </View>
      <PageFooter pageNum={10} />
    </Page>
  );
}

/** Page 10: Executive Summary & Recommendations */
function ExecutiveSummaryPage({ data }: { data: ReportData }) {
  // Build dynamic recommendations
  const risks: string[] = [];
  const opportunities: string[] = [];

  // HPD Violations
  if (data.violations.open > 20) {
    risks.push(`High open violation count (${data.violations.open}). Indicates potential management deficiency or deferred maintenance.`);
    opportunities.push('Immediate violation correction program could reduce regulatory exposure and improve building conditions.');
  } else if (data.violations.open > 5) {
    risks.push(`Moderate open violations (${data.violations.open}). Should be addressed in a structured compliance program.`);
  }

  // Class C violations
  const classC = data.violations.items.filter((v: any) => v.class === 'C' && v.currentstatus !== 'CLOSE').length;
  if (classC > 0) {
    risks.push(`${classC} open Class C (Immediately Hazardous) violations require urgent attention — 24-hour cure period.`);
  }

  // ECB Penalties
  if (data.ecb.totalPenaltyBalance > 10000) {
    risks.push(`Outstanding ECB penalty balance of ${fmtCurrency(data.ecb.totalPenaltyBalance)} — exposure to liens and additional penalties.`);
  }

  // Litigation
  if (data.litigation.hasActive) {
    risks.push('Active housing litigation detected. Building may be subject to 7A administration or court-ordered repairs.');
    opportunities.push('Proactive management takeover and compliance plan could resolve litigation and stabilize the property.');
  }

  // Energy
  if (data.energy?.energyStarScore !== null && data.energy?.energyStarScore !== undefined && data.energy.energyStarScore < 50) {
    risks.push(`Low Energy Star score (${data.energy.energyStarScore}) — high risk of LL97 penalties starting 2024.`);
    opportunities.push('Energy retrofit and sustainability program could reduce operating costs and avoid LL97 penalties ($268/MT CO2).');
  }

  // Rent Stabilization
  if (data.rentStabilization.isStabilized) {
    risks.push('Rent-stabilized building requires strict DHCR compliance and annual rent registration.');
    opportunities.push('Experienced stabilized-building management can navigate MCI/IAI applications to optimize revenue within regulations.');
  }

  // General opportunities
  if (data.dof && data.dof.units > 20) {
    opportunities.push(`${data.dof.units}-unit property represents significant management fee revenue opportunity.`);
  }
  if (data.permits.hasRecent) {
    opportunities.push('Recent permit activity indicates capital improvement investment — new management could optimize project delivery.');
  }

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.body}>
        <SectionHead title="Executive Summary & Recommendations" subtitle="Camelot Scout Analysis" />

        {/* Property summary */}
        <View style={{ padding: 14, backgroundColor: COLORS.offWhite, borderRadius: 3, marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.navy, marginBottom: 6 }}>
            {data.address}
          </Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            {data.dof && (
              <>
                <Text style={{ fontSize: 8, color: COLORS.gray600 }}>
                  {data.dof.units} units • {data.dof.stories} stories • Built {data.dof.yearBuilt}
                </Text>
                <Text style={{ fontSize: 8, color: COLORS.gray600 }}>
                  Market Value: {fmtCurrency(data.dof.marketValue)}
                </Text>
              </>
            )}
            {data.registration.owner && (
              <Text style={{ fontSize: 8, color: COLORS.gray600 }}>
                Owner: {data.registration.owner}
              </Text>
            )}
          </View>
        </View>

        {/* Data Summary Table */}
        <Text style={s.heading}>Data Summary</Text>
        <KVRow label="HPD Violations (Total / Open)" value={`${data.violations.total} / ${data.violations.open}`} />
        <KVRow label="ECB Violations" value={`${data.ecb.count} (${fmtCurrency(data.ecb.totalPenaltyBalance)} penalties)`} />
        <KVRow label="DOB Permits" value={`${data.permits.count} on file`} />
        <KVRow label="Housing Litigation" value={`${data.litigation.count} cases${data.litigation.hasActive ? ' (ACTIVE)' : ''}`} />
        <KVRow label="Rent Stabilized" value={data.rentStabilization.isStabilized ? 'Yes' : 'No'} />
        <KVRow label="Energy Star Score" value={data.energy?.energyStarScore !== null ? String(data.energy?.energyStarScore) : 'N/A'} />
        <KVRow label="ACRIS Records" value={`${data.acris?.records.length || 0} transactions`} />

        {/* Risk factors */}
        {risks.length > 0 && (
          <>
            <Text style={[s.heading, { color: COLORS.red }]}>Risk Factors</Text>
            {risks.map((risk, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 4, paddingLeft: 4 }}>
                <Text style={{ fontSize: 8, color: COLORS.red, marginRight: 4 }}>•</Text>
                <Text style={[s.paragraph, { flex: 1, marginBottom: 2 }]}>{risk}</Text>
              </View>
            ))}
          </>
        )}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <>
            <Text style={[s.heading, { color: COLORS.green }]}>Opportunities</Text>
            {opportunities.map((opp, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 4, paddingLeft: 4 }}>
                <Text style={{ fontSize: 8, color: COLORS.green, marginRight: 4 }}>•</Text>
                <Text style={[s.paragraph, { flex: 1, marginBottom: 2 }]}>{opp}</Text>
              </View>
            ))}
          </>
        )}

        {/* Disclaimer */}
        <View style={{ marginTop: 20, padding: 10, backgroundColor: COLORS.gray100, borderRadius: 3 }}>
          <Text style={{ fontSize: 6.5, color: COLORS.gray400, lineHeight: 1.5 }}>
            DISCLAIMER: This report is generated from publicly available NYC Open Data sources and is provided for informational purposes only.
            Data accuracy depends on the source agencies (HPD, DOF, DOB, ACRIS, OATH). Camelot Property Management Services Corp
            does not guarantee the completeness or accuracy of this information. This report does not constitute legal, financial, or
            professional advice. Please verify critical data points independently before making business decisions.
          </Text>
        </View>
      </View>
      <PageFooter pageNum={11} />
    </Page>
  );
}

// ============================================================
// Main Document Component
// ============================================================

interface IntelligenceReportPDFProps {
  data: ReportData;
}

export default function IntelligenceReportPDF({ data }: IntelligenceReportPDFProps) {
  return (
    <Document
      title={`Building Intelligence Report — ${data.address}`}
      author="Camelot Property Management Services Corp"
      subject="Building Intelligence Report"
      creator="Camelot Scout v6"
    >
      <CoverPage data={data} />
      <TOCPage data={data} />
      <PropertyOverviewPage data={data} />
      <OwnershipPage data={data} />
      <HPDViolationsPage data={data} />
      <ECBViolationsPage data={data} />
      <DOBPermitsPage data={data} />
      <EnergyPage data={data} />
      <LitigationPage data={data} />
      <RentStabilizationPage data={data} />
      <ExecutiveSummaryPage data={data} />
    </Document>
  );
}
