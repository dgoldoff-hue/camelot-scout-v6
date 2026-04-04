/**
 * LeadCaptureModal — Email capture gate before showing full intelligence report.
 * 
 * Collects name, email, company, phone, and role from prospective leads.
 * Stores lead data in Supabase (scout_report_leads) and reveals the report.
 */

import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { X, FileText, Mail, User, Building2, Phone, Briefcase } from 'lucide-react';

export type LeadRole = 'investor' | 'broker' | 'owner' | 'attorney' | 'other';

export interface LeadData {
  name: string;
  email: string;
  company: string;
  phone: string;
  role: LeadRole;
}

interface LeadCaptureModalProps {
  /** The report ID to link this lead to */
  reportId: string;
  /** Building address for display */
  address: string;
  /** Called when user submits their info — lead stored, show the report */
  onSubmit: (lead: LeadData) => void;
  /** Called when user bypasses (team member) */
  onBypass: () => void;
  /** Called to close modal without action */
  onClose: () => void;
}

const ROLE_OPTIONS: { value: LeadRole; label: string }[] = [
  { value: 'investor', label: 'Investor' },
  { value: 'broker', label: 'Broker' },
  { value: 'owner', label: 'Property Owner' },
  { value: 'attorney', label: 'Attorney' },
  { value: 'other', label: 'Other' },
];

export default function LeadCaptureModal({ reportId, address, onSubmit, onBypass, onClose }: LeadCaptureModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<LeadRole>('investor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Store lead in Supabase if configured
      if (isSupabaseConfigured()) {
        await supabase.from('scout_report_leads').insert({
          report_id: reportId,
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || null,
          phone: phone.trim() || null,
          role,
        });
      }

      onSubmit({ name: name.trim(), email: email.trim(), company: company.trim(), phone: phone.trim(), role });
    } catch (err) {
      console.error('Lead capture error:', err);
      // Still allow access even if storage fails
      onSubmit({ name: name.trim(), email: email.trim(), company: company.trim(), phone: phone.trim(), role });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-camelot-navy border border-camelot-navy-lighter rounded-xl shadow-2xl overflow-hidden">
        {/* Gold accent top bar */}
        <div className="h-1 bg-gradient-to-r from-camelot-gold to-camelot-gold-light" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-camelot-gold/10 mb-3">
            <FileText className="w-6 h-6 text-camelot-gold" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">
            Access Full Intelligence Report
          </h2>
          <p className="text-sm text-slate-400">
            Enter your details to view the complete report for
          </p>
          <p className="text-sm font-semibold text-camelot-gold mt-1">
            {address}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-4 space-y-3">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                className="w-full pl-10 pr-4 py-2.5 bg-camelot-navy-light border border-camelot-navy-lighter rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 focus:border-camelot-gold"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-camelot-navy-light border border-camelot-navy-lighter rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 focus:border-camelot-gold"
                required
              />
            </div>
          </div>

          {/* Company & Phone row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Company
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company name"
                  className="w-full pl-10 pr-3 py-2.5 bg-camelot-navy-light border border-camelot-navy-lighter rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 focus:border-camelot-gold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Phone <span className="text-slate-600">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(212) 555-0000"
                  className="w-full pl-10 pr-3 py-2.5 bg-camelot-navy-light border border-camelot-navy-lighter rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 focus:border-camelot-gold"
                />
              </div>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              I am a...
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as LeadRole)}
                className="w-full pl-10 pr-4 py-2.5 bg-camelot-navy-light border border-camelot-navy-lighter rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 focus:border-camelot-gold"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-camelot-navy">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full py-3 rounded-lg font-semibold text-sm transition-all',
              'bg-camelot-gold text-camelot-dark hover:bg-camelot-gold-light',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {isSubmitting ? 'Processing...' : 'Get Report'}
          </button>
        </form>

        {/* Bypass link */}
        <div className="px-6 pb-5 text-center">
          <button
            onClick={onBypass}
            className="text-xs text-slate-500 hover:text-camelot-gold transition-colors underline underline-offset-2"
          >
            No thanks, I'm a Camelot team member
          </button>
        </div>

        {/* Pricing note */}
        <div className="px-6 pb-4 text-center border-t border-camelot-navy-lighter pt-3">
          <p className="text-xs text-slate-500">
            💰 <span className="text-camelot-gold font-medium">$200 per report</span> — Coming Soon
          </p>
        </div>
      </div>
    </div>
  );
}
