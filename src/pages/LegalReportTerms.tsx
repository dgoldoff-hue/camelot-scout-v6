import { FileText, Mail, Scale, ShieldCheck } from 'lucide-react';

const terms = [
  {
    title: 'Confidential Report Use',
    body: 'Camelot Property Intelligence Reports are confidential and proprietary to Camelot Realty Group. Reports are prepared for the named recipient, board, owner, or authorized decision-maker and may not be copied, distributed, published, or disclosed without prior written consent.',
  },
  {
    title: 'Informational Purpose',
    body: 'Report content is provided for business discussion and property-management evaluation only. It is not legal, financial, tax, engineering, insurance, lending, or investment advice. Boards and owners should verify material facts with their professional advisers before taking action.',
  },
  {
    title: 'Data Sources and Limits',
    body: 'Jackie may reference NYC Open Data, HPD, DOB, DOF, ACRIS, OATH/ECB, property tax records, StreetEasy, RealtyMX, PropertyShark-style market intelligence, building websites, uploaded materials, and other third-party databases. Public and third-party data can be incomplete, delayed, or revised after a report is generated.',
  },
  {
    title: 'AI-Assisted Review',
    body: 'SCOUT, Jackie, Merlin AI, ConciergePlus, Prisma, Parity, and Camelot Central support research, drafting, automation, and quality control. AI-assisted analysis is reviewed by licensed real estate professionals, but all public-record signals, images, addresses, legal parties, and compliance items should be verified before board-facing release.',
  },
  {
    title: 'Intellectual Property',
    body: 'Report layout, copy, scoring logic, research methods, automation workflows, and platform references are protected by copyright, trade secret, and other applicable law. Camelot retains all rights in its proprietary systems, templates, report language, and generated work product.',
  },
  {
    title: 'Governing Law',
    body: 'These report terms are governed by the laws of the State of New York. Venue for any dispute relating to a Camelot Property Intelligence Report is New York County, unless otherwise agreed in a signed written agreement.',
  },
];

export default function LegalReportTerms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-camelot-gold/30 bg-camelot-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-camelot-gold">
              <ShieldCheck size={14} />
              Camelot Realty Group
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">Report Legal Terms</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Confidentiality, permitted use, data-source limits, AI review, licensing, and contact information for Camelot Property Intelligence Reports.
            </p>
          </div>
          <div className="hidden rounded-lg bg-camelot-gold px-5 py-4 text-center text-slate-950 shadow-sm sm:block">
            <div className="text-xl font-semibold tracking-[0.35em]">CAMELOT</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.45em]">Realty Group</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {terms.map((term) => (
            <section key={term.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-slate-950">
                <Scale size={18} className="text-camelot-gold" />
                <h2 className="text-lg font-semibold">{term.title}</h2>
              </div>
              <p className="text-sm leading-6 text-slate-600">{term.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-950">
            <FileText size={18} className="text-camelot-gold" />
            <h2 className="text-lg font-semibold">Licensing and Contact</h2>
          </div>
          <div className="grid gap-4 text-sm leading-6 text-slate-600 md:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-800">Camelot Realty Group</p>
              <p>57 West 57th Street, Suite 410, New York, NY 10019</p>
              <p>Camelot Brokerage Services Corp #10311208308</p>
              <p>Camelot Realty Group LLC #10491200104</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Questions About a Report</p>
              <p>David A. Goldoff, Founder & President</p>
              <p>(212) 206-9939 ext. 701 | (646) 523-9068</p>
              <div className="mt-2 flex flex-wrap gap-3">
                <a className="inline-flex items-center gap-2 font-semibold text-camelot-gold hover:underline" href="mailto:valerie@camelot.nyc">
                  <Mail size={14} />
                  valerie@camelot.nyc
                </a>
                <a className="font-semibold text-camelot-gold hover:underline" href="https://www.camelot.nyc" target="_blank" rel="noopener">
                  www.camelot.nyc
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
