import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Crown, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const TEAM_MEMBERS = [
  { name: 'David Goldoff', email: 'dgoldoff@camelot.nyc', role: 'Owner', initials: 'DG' },
  { name: 'Sam Lodge', email: 'sam@camelot.nyc', role: 'Indexing Lead', initials: 'SL' },
  { name: 'Carl Harkien', email: 'carl@camelot.nyc', role: 'HubSpot / Sales', initials: 'CH' },
  { name: 'Luigi', email: 'luigi@camelot.nyc', role: 'Operations', initials: 'LU' },
];

export default function Login() {
  const { signIn } = useAuth();
    const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const handleSignIn = async (e?: React.FormEvent, overrideEmail?: string) => {
    e?.preventDefault();
    const loginEmail = overrideEmail || email;
    if (!loginEmail.trim() || !password.trim()) {
      toast.error('Enter your email and password');
      return;
    }
    setLoading(true);
    try {
      await signIn(loginEmail, password);
      toast.success('Welcome back!');
          navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed — check your credentials');
    } finally {
      setLoading(false);
    }
  };

  const selectMember = (memberEmail: string) => {
    setEmail(memberEmail);
    setSelectedMember(memberEmail);
  };

  return (
    <div className="min-h-screen bg-camelot-navy flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-camelot-gold rounded-2xl mb-4 shadow-xl shadow-camelot-gold/20">
            <Crown size={32} className="text-camelot-navy" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Camelot Scout</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Quick-select team members */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 text-center">Quick Select</p>
          <div className="grid grid-cols-2 gap-2">
            {TEAM_MEMBERS.map((member) => (
              <button
                key={member.email}
                onClick={() => selectMember(member.email)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedMember === member.email
                    ? 'border-camelot-gold bg-camelot-gold/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  selectedMember === member.email
                    ? 'bg-camelot-gold text-camelot-navy'
                    : 'bg-white/10 text-white'
                }`}>
                  {member.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{member.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-500 truncate">{member.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSignIn} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@camelot.nyc"
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-camelot-gold/60 focus:border-camelot-gold transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-camelot-gold/60 focus:border-camelot-gold transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-camelot-gold text-camelot-navy font-bold rounded-xl hover:bg-camelot-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Signing in...</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Camelot Property Management · 477 Madison Ave, NYC
        </p>
      </div>
    </div>
  );
}
