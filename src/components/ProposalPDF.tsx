/**
 * ProposalPDF — React-PDF document component
 * Professional property management proposal for Camelot.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { ProposalData } from '@/lib/proposal-generator';

// ============================================================
// Color Palette
// ============================================================

const NAVY = '#0f1629';
const GOLD = '#C5A55A';
const GOLD_LIGHT = '#D4BA78';
const WHITE = '#FFFFFF';
const LIGHT_GRAY = '#F5F5F5';
const MEDIUM_GRAY = '#888888';
const DARK_TEXT = '#1a1a2e';

// ============================================================
// Styles
// ============================================================

const s = StyleSheet.create({
  // Global
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: DARK_TEXT,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },

  // Cover page
  coverPage: {
    fontFamily: 'Helvetica',
    backgroundColor: NAVY,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  coverLogoArea: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GOLD,
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverLogoText: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textAlign: 'center',
  },
  coverCompany: {
    fontSize: 14,
    fontFamily: 'Helvetica',
    color: GOLD_LIGHT,
    letterSpacing: 3,
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 16,
    color: GOLD,
    textAlign: 'center',
    marginBottom: 4,
  },
  coverDivider: {
    width: 80,
    height: 2,
    backgroundColor: GOLD,
    marginVertical: 30,
  },
  coverAddress: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 6,
  },
  coverMeta: {
    fontSize: 11,
    color: MEDIUM_GRAY,
    textAlign: 'center',
    marginBottom: 4,
  },
  coverFooter: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    textAlign: 'center',
  },
  coverFooterText: {
    fontSize: 8,
    color: MEDIUM_GRAY,
    textAlign: 'center',
  },

  // Section headers
  sectionHeader: {
    backgroundColor: NAVY,
    color: WHITE,
    padding: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: GOLD_LIGHT,
    marginTop: 2,
  },

  // Sub-section headers
  subHeader: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 14,
  },

  // Body text
  body: {
    fontSize: 10,
    lineHeight: 1.6,
    color: DARK_TEXT,
    marginBottom: 8,
  },
  bodySmall: {
    fontSize: 9,
    color: MEDIUM_GRAY,
    lineHeight: 1.5,
  },

  // Key-value row
  kvRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  kvLabel: {
    width: '40%',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },
  kvValue: {
    width: '60%',
    fontSize: 10,
    color: DARK_TEXT,
  },

  // Tables
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 2,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  tableRowAlt: {
    backgroundColor: LIGHT_GRAY,
  },
  tableCell: {
    fontSize: 9,
    color: DARK_TEXT,
  },

  // Highlight box
  highlight: {
    backgroundColor: '#FDF8ED',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 4,
    padding: 12,
    marginVertical: 10,
  },
  highlightTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
  },

  // Advantages grid
  advantageItem: {
    marginBottom: 10,
  },
  advantageTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 2,
  },
  advantageDesc: {
    fontSize: 9,
    color: DARK_TEXT,
    lineHeight: 1.5,
  },

  // Bullet
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bulletDot: {
    width: 14,
    fontSize: 10,
    color: GOLD,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: DARK_TEXT,
    lineHeight: 1.5,
  },

  // Page footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: MEDIUM_GRAY,
  },

  // Two-column
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  col50: {
    width: '48%',
  },

  // Pricing summary columns
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  pricingLabel: {
    fontSize: 10,
    color: DARK_TEXT,
  },
  pricingValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },
  pricingTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: NAVY,
  },
  pricingTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },
  pricingTotalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
  },
});

// ============================================================
// Helpers
// ============================================================

function fmtCurrency(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function sectionEnabled(data: ProposalData, id: string): boolean {
  return data.sections.find((sec) => sec.id === id)?.enabled ?? true;
}

// ============================================================
// Page Footer
// ============================================================

function PageFooter({ data, pageNum }: { data: ProposalData; pageNum: number }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Confidential — Prepared for {data.buildingAddress}</Text>
      <Text style={s.footerText}>{data.company.name}</Text>
      <Text style={s.footerText}>Page {pageNum}</Text>
    </View>
  );
}

// ============================================================
// Cover Page
// ============================================================

function CoverPage({ data }: { data: ProposalData }) {
  return (
    <Page size="LETTER" style={s.coverPage}>
      <View style={s.coverLogoArea}>
        <Text style={s.coverLogoText}>C</Text>
      </View>
      <Text style={s.coverCompany}>Camelot</Text>
      <Text style={s.coverTitle}>Property Management</Text>
      <Text style={s.coverTitle}>Proposal</Text>
      <View style={s.coverDivider} />
      <Text style={s.coverAddress}>
        {data.buildingName ? `${data.buildingName}` : data.buildingAddress}
      </Text>
      {data.buildingName && <Text style={s.coverMeta}>{data.buildingAddress}</Text>}
      <Text style={s.coverMeta}>
        {data.units} Units • {data.buildingType.replace('-', ' ')}
        {data.borough ? ` • ${data.borough}` : ''}
      </Text>
      {data.contactName && (
        <Text style={{ ...s.coverMeta, marginTop: 12 }}>Prepared for: {data.contactName}</Text>
      )}
      <Text style={s.coverMeta}>
        {fmtDate(data.generatedAt)} • Proposal #{data.proposalNumber}
      </Text>
      <View style={s.coverFooter}>
        <Text style={s.coverFooterText}>
          {data.company.name} • {data.company.address}
        </Text>
        <Text style={s.coverFooterText}>
          {data.company.phone} • {data.company.website}
        </Text>
      </View>
    </Page>
  );
}

// ============================================================
// Executive Summary Page
// ============================================================

function ExecutiveSummaryPage({ data }: { data: ProposalData }) {
  const buildingLabel = data.buildingName || data.buildingAddress;
  const violationMsg =
    data.openViolationsCount > 0
      ? `With ${data.openViolationsCount} open HPD violations currently on record (${data.violationsCount} total), ${buildingLabel} faces regulatory pressure that requires experienced management to resolve efficiently.`
      : `${buildingLabel} maintains a clean violation record — and with Camelot's proactive compliance approach, we'll keep it that way.`;

  const energyMsg =
    data.energyStarScore != null && data.energyStarScore < 50
      ? `The building's Energy Star score of ${data.energyStarScore} signals potential Local Law 97 compliance risk. Our energy team can develop a carbon reduction strategy to avoid significant penalties beginning in 2024.`
      : data.energyStarScore != null
        ? `With an Energy Star score of ${data.energyStarScore}, the building is reasonably positioned for LL97 compliance, but ongoing monitoring is essential.`
        : '';

  const mgmtMsg =
    !data.currentManagement || data.currentManagement === 'Unknown' || data.currentManagement === 'Self-managed'
      ? `Currently ${data.currentManagement === 'Self-managed' ? 'self-managed' : 'without established management'}, ${buildingLabel} would benefit from professional oversight that brings institutional-grade systems while preserving the personal attention boards expect.`
      : `As the building transitions management, Camelot offers a seamless onboarding process refined over 42+ building transitions.`;

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Executive Summary</Text>
        <Text style={s.sectionSubtitle}>Why {buildingLabel} Deserves Camelot</Text>
      </View>

      <Text style={s.body}>
        Camelot Property Management is pleased to present this proposal for the management of{' '}
        {buildingLabel}, a {data.units}-unit {data.buildingType.replace('-', ' ')} property
        {data.borough ? ` in ${data.borough}` : ''}
        {data.yearBuilt ? `, built in ${data.yearBuilt}` : ''}.
      </Text>

      <Text style={s.body}>{violationMsg}</Text>

      {energyMsg ? <Text style={s.body}>{energyMsg}</Text> : null}

      <Text style={s.body}>{mgmtMsg}</Text>

      <Text style={s.body}>
        Our approach combines hands-on property oversight with cutting-edge technology,
        delivering the responsiveness of a boutique firm with the systems and scale of a
        full-service management company. We manage over {data.company.portfolio.buildings}{' '}
        buildings and {data.company.portfolio.sqft} sq ft — and every client receives direct
        principal-level attention.
      </Text>

      {data.signals.length > 0 && (
        <>
          <Text style={s.subHeader}>Key Observations</Text>
          {data.signals.map((signal, i) => (
            <View style={s.bulletRow} key={i}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{signal}</Text>
            </View>
          ))}
        </>
      )}

      <PageFooter data={data} pageNum={2} />
    </Page>
  );
}

// ============================================================
// Building Analysis Page
// ============================================================

function BuildingAnalysisPage({ data }: { data: ProposalData }) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Building Analysis</Text>
        <Text style={s.sectionSubtitle}>
          Data-Driven Assessment of {data.buildingName || data.buildingAddress}
        </Text>
      </View>

      {/* Property Overview */}
      <Text style={s.subHeader}>Property Overview</Text>
      <View>
        <View style={s.kvRow}>
          <Text style={s.kvLabel}>Address</Text>
          <Text style={s.kvValue}>{data.buildingAddress}</Text>
        </View>
        {data.buildingName && (
          <View style={s.kvRow}>
            <Text style={s.kvLabel}>Building Name</Text>
            <Text style={s.kvValue}>{data.buildingName}</Text>
          </View>
        )}
        <View style={s.kvRow}>
          <Text style={s.kvLabel}>Type</Text>
          <Text style={s.kvValue}>{data.buildingType.replace('-', ' ')}</Text>
        </View>
        <View style={s.kvRow}>
          <Text style={s.kvLabel}>Units</Text>
          <Text style={s.kvValue}>{data.units}</Text>
        </View>
        {data.yearBuilt && (
          <View style={s.kvRow}>
            <Text style={s.kvLabel}>Year Built</Text>
            <Text style={s.kvValue}>{data.yearBuilt}</Text>
          </View>
        )}
        {data.stories && (
          <View style={s.kvRow}>
            <Text style={s.kvLabel}>Stories</Text>
            <Text style={s.kvValue}>{data.stories}</Text>
          </View>
        )}
        {data.borough && (
          <View style={s.kvRow}>
            <Text style={s.kvLabel}>Borough / Neighborhood</Text>
            <Text style={s.kvValue}>
              {data.borough}
              {data.neighborhood ? ` — ${data.neighborhood}` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Violations Summary */}
      <Text style={s.subHeader}>HPD Violations</Text>
      <View style={s.row}>
        <View style={s.col50}>
          <View style={s.kvRow}>
            <Text style={s.kvLabel}>Total Violations</Text>
            <Text style={s.kvValue}>{data.violationsCount}</Text>
          </View>
          <View style={s.kvRow}>
            <Text style={s.kvLabel}>Open Violations</Text>
            <Text style={s.kvValue}>{data.openViolationsCount}</Text>
          </View>
        </View>
        <View style={s.col50}>
          {data.lastViolationDate && (
            <View style={s.kvRow}>
              <Text style={s.kvLabel}>Last Violation</Text>
              <Text style={s.kvValue}>{fmtDate(data.lastViolationDate)}</Text>
            </View>
          )}
          <View style={s.kvRow}>
            <Text style={s.kvLabel}>Scout Grade</Text>
            <Text style={s.kvValue}>
              {data.grade} (Score: {data.score}/100)
            </Text>
          </View>
        </View>
      </View>

      {/* Energy Compliance */}
      {(data.energyStarScore != null || data.siteEUI != null) && (
        <>
          <Text style={s.subHeader}>Energy & LL97 Compliance</Text>
          <View>
            {data.energyStarScore != null && (
              <View style={s.kvRow}>
                <Text style={s.kvLabel}>Energy Star Score</Text>
                <Text style={s.kvValue}>
                  {data.energyStarScore}/100
                  {data.energyStarScore < 50 ? ' — Below median, LL97 risk' : ''}
                </Text>
              </View>
            )}
            {data.siteEUI != null && (
              <View style={s.kvRow}>
                <Text style={s.kvLabel}>Site EUI</Text>
                <Text style={s.kvValue}>{data.siteEUI} kBtu/ft²</Text>
              </View>
            )}
            {data.ghgEmissions != null && (
              <View style={s.kvRow}>
                <Text style={s.kvLabel}>GHG Emissions</Text>
                <Text style={s.kvValue}>{data.ghgEmissions} metric tons CO₂e</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* Ownership / Valuation */}
      {(data.dofOwner || data.marketValue) && (
        <>
          <Text style={s.subHeader}>Ownership & Valuation</Text>
          <View>
            {data.dofOwner && (
              <View style={s.kvRow}>
                <Text style={s.kvLabel}>DOF Owner</Text>
                <Text style={s.kvValue}>{data.dofOwner}</Text>
              </View>
            )}
            {data.marketValue && (
              <View style={s.kvRow}>
                <Text style={s.kvLabel}>Market Value</Text>
                <Text style={s.kvValue}>{fmtCurrency(data.marketValue)}</Text>
              </View>
            )}
            {data.assessedValue && (
              <View style={s.kvRow}>
                <Text style={s.kvLabel}>Assessed Value</Text>
                <Text style={s.kvValue}>{fmtCurrency(data.assessedValue)}</Text>
              </View>
            )}
          </View>
        </>
      )}

      {data.currentManagement && (
        <>
          <Text style={s.subHeader}>Current Management</Text>
          <Text style={s.body}>{data.currentManagement}</Text>
        </>
      )}

      <PageFooter data={data} pageNum={3} />
    </Page>
  );
}

// ============================================================
// Services & Pricing Page
// ============================================================

function ServicesPricingPage({ data }: { data: ProposalData }) {
  const { pricing } = data;

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Services & Pricing</Text>
        <Text style={s.sectionSubtitle}>Comprehensive Management for {data.units} Units</Text>
      </View>

      {/* Standard Services Table */}
      <Text style={s.subHeader}>Standard Services (Included)</Text>
      <View style={s.tableHeader}>
        <Text style={{ ...s.tableHeaderCell, width: '35%' }}>Service</Text>
        <Text style={{ ...s.tableHeaderCell, width: '65%' }}>Description</Text>
      </View>
      {data.standardServices.map((svc, i) => (
        <View style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]} key={i}>
          <Text style={{ ...s.tableCell, width: '35%', fontFamily: 'Helvetica-Bold' }}>
            {svc.name}
          </Text>
          <Text style={{ ...s.tableCell, width: '65%' }}>{svc.description}</Text>
        </View>
      ))}

      {/* Premium Services */}
      <Text style={{ ...s.subHeader, marginTop: 18 }}>Premium Services</Text>
      <View style={s.tableHeader}>
        <Text style={{ ...s.tableHeaderCell, width: '35%' }}>Service</Text>
        <Text style={{ ...s.tableHeaderCell, width: '50%' }}>Description</Text>
        <Text style={{ ...s.tableHeaderCell, width: '15%', textAlign: 'center' }}>Included</Text>
      </View>
      {data.premiumServices.map((svc, i) => (
        <View style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]} key={i}>
          <Text style={{ ...s.tableCell, width: '35%', fontFamily: 'Helvetica-Bold' }}>
            {svc.name}
          </Text>
          <Text style={{ ...s.tableCell, width: '50%' }}>{svc.description}</Text>
          <Text style={{ ...s.tableCell, width: '15%', textAlign: 'center' }}>
            {svc.included ? '✓' : '—'}
          </Text>
        </View>
      ))}

      {/* Pricing Breakdown */}
      <View style={{ ...s.highlight, marginTop: 18 }}>
        <Text style={s.highlightTitle}>Pricing Summary</Text>
        <View style={s.pricingRow}>
          <Text style={s.pricingLabel}>
            Base Management ({pricing.baseRateLabel})
          </Text>
          <Text style={s.pricingValue}>{fmtCurrency(pricing.baseRate)}/unit/mo</Text>
        </View>
        {pricing.rentStabilizedSurcharge > 0 && (
          <View style={s.pricingRow}>
            <Text style={s.pricingLabel}>Rent Stabilization Admin</Text>
            <Text style={s.pricingValue}>
              +{fmtCurrency(pricing.rentStabilizedSurcharge)}/unit/mo
            </Text>
          </View>
        )}
        {pricing.ll97Surcharge > 0 && (
          <View style={s.pricingRow}>
            <Text style={s.pricingLabel}>LL97 Compliance Services</Text>
            <Text style={s.pricingValue}>+{fmtCurrency(pricing.ll97Surcharge)}/unit/mo</Text>
          </View>
        )}
        <View style={s.pricingRow}>
          <Text style={s.pricingLabel}>
            Total Per Unit ({data.units} units)
          </Text>
          <Text style={s.pricingValue}>{fmtCurrency(pricing.totalPerUnit)}/unit/mo</Text>
        </View>
        <View style={s.pricingRow}>
          <Text style={s.pricingLabel}>Monthly Total</Text>
          <Text style={s.pricingValue}>{fmtCurrency(pricing.totalMonthly)}</Text>
        </View>
        <View style={s.pricingTotal}>
          <Text style={s.pricingTotalLabel}>Annual Total</Text>
          <Text style={s.pricingTotalValue}>{fmtCurrency(pricing.totalAnnual)}</Text>
        </View>
      </View>

      <Text style={s.bodySmall}>
        Pricing is based on building size and complexity. Final rates may be adjusted following
        a comprehensive on-site assessment. All prices exclude applicable taxes.
      </Text>

      <PageFooter data={data} pageNum={4} />
    </Page>
  );
}

// ============================================================
// Why Camelot Page
// ============================================================

function WhyCamelotPage({ data }: { data: ProposalData }) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Why Camelot</Text>
        <Text style={s.sectionSubtitle}>
          Trusted by {data.company.portfolio.buildings} Buildings Across NYC
        </Text>
      </View>

      <Text style={s.body}>
        Camelot Property Management combines institutional-grade systems with the personalized
        service of a boutique firm. Here's what sets us apart:
      </Text>

      {data.advantages.map((adv, i) => (
        <View style={s.advantageItem} key={i}>
          <Text style={s.advantageTitle}>
            {i + 1}. {adv.title}
          </Text>
          <Text style={s.advantageDesc}>{adv.description}</Text>
        </View>
      ))}

      <View style={{ ...s.highlight, marginTop: 10 }}>
        <Text style={s.highlightTitle}>By the Numbers</Text>
        <View style={s.row}>
          <View style={s.col50}>
            <View style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>
                {data.company.portfolio.buildings} buildings under management
              </Text>
            </View>
            <View style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>
                {data.company.portfolio.sqft} sq ft managed
              </Text>
            </View>
            <View style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>All five boroughs covered</Text>
            </View>
          </View>
          <View style={s.col50}>
            <View style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>98% board renewal rate</Text>
            </View>
            <View style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>Average 15% operating cost reduction</Text>
            </View>
            <View style={s.bulletRow}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>24/7 emergency response</Text>
            </View>
          </View>
        </View>
      </View>

      <PageFooter data={data} pageNum={5} />
    </Page>
  );
}

// ============================================================
// Next Steps & Contact Page
// ============================================================

function NextStepsPage({ data }: { data: ProposalData }) {
  const steps = [
    {
      step: '1',
      title: 'Introductory Meeting',
      desc: 'We schedule a call or in-person meeting to discuss your building\'s needs, concerns, and goals.',
    },
    {
      step: '2',
      title: 'Property Walkthrough',
      desc: 'Our team conducts a comprehensive on-site inspection, reviewing physical conditions, systems, staffing, and vendor contracts.',
    },
    {
      step: '3',
      title: 'Detailed Proposal',
      desc: 'Based on our assessment, we present a customized management plan with finalized pricing and transition timeline.',
    },
    {
      step: '4',
      title: 'Board Presentation',
      desc: 'We present our proposal to the full board, answering questions and addressing any concerns.',
    },
    {
      step: '5',
      title: 'Seamless Transition',
      desc: 'Our dedicated onboarding team manages the transition — typically completed within 30–45 days with zero disruption to residents.',
    },
  ];

  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Next Steps</Text>
        <Text style={s.sectionSubtitle}>Getting Started with Camelot</Text>
      </View>

      {steps.map((item) => (
        <View style={{ flexDirection: 'row', marginBottom: 12 }} key={item.step}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: GOLD,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
              marginTop: 2,
            }}
          >
            <Text
              style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: NAVY, textAlign: 'center' }}
            >
              {item.step}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 2 }}>
              {item.title}
            </Text>
            <Text style={s.body}>{item.desc}</Text>
          </View>
        </View>
      ))}

      {/* Contact Information */}
      <View style={{ ...s.highlight, marginTop: 16 }}>
        <Text style={s.highlightTitle}>Contact Us</Text>
        <View style={s.kvRow}>
          <Text style={s.kvLabel}>Company</Text>
          <Text style={s.kvValue}>{data.company.name}</Text>
        </View>
        <View style={s.kvRow}>
          <Text style={s.kvLabel}>Address</Text>
          <Text style={s.kvValue}>{data.company.address}</Text>
        </View>
        <View style={s.kvRow}>
          <Text style={s.kvLabel}>Phone</Text>
          <Text style={s.kvValue}>{data.company.phone}</Text>
        </View>
        <View style={s.kvRow}>
          <Text style={s.kvLabel}>Website</Text>
          <Text style={s.kvValue}>{data.company.website}</Text>
        </View>
      </View>

      {/* License Info */}
      <View style={{ marginTop: 16 }}>
        <Text style={s.bodySmall}>Licensed Entities:</Text>
        {data.company.licenses.map((lic, i) => (
          <Text style={s.bodySmall} key={i}>
            {lic.entity} — {lic.number}
          </Text>
        ))}
      </View>

      <Text style={{ ...s.bodySmall, marginTop: 12, textAlign: 'center' }}>
        This proposal is confidential and intended solely for the recipient. Pricing is
        subject to on-site assessment. Valid for 60 days from date of issue.
      </Text>

      <PageFooter data={data} pageNum={6} />
    </Page>
  );
}

// ============================================================
// Main Document
// ============================================================

interface ProposalPDFProps {
  data: ProposalData;
}

export default function ProposalPDF({ data }: ProposalPDFProps) {
  return (
    <Document
      title={`Camelot Proposal — ${data.buildingAddress}`}
      author={data.company.name}
      subject="Property Management Proposal"
    >
      <CoverPage data={data} />
      {sectionEnabled(data, 'executive_summary') && <ExecutiveSummaryPage data={data} />}
      {sectionEnabled(data, 'building_analysis') && <BuildingAnalysisPage data={data} />}
      {sectionEnabled(data, 'pricing') && <ServicesPricingPage data={data} />}
      {sectionEnabled(data, 'why_camelot') && <WhyCamelotPage data={data} />}
      {sectionEnabled(data, 'next_steps') && <NextStepsPage data={data} />}
    </Document>
  );
}


