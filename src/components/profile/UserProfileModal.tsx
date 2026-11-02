import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Save,
  LogIn,
  UserPlus,
  Compass,
  Download,
} from 'lucide-react';
import { UserProfile, Currency, SUPPORTED_CURRENCIES } from '../../types.ts';
import * as api from '../../api.ts';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserUpdated: (user: UserProfile) => void;
  onLogout: () => void;
  currency: Currency;
  onSelectCurrency: (c: Currency) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onLogout,
  currency,
  onSelectCurrency,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'auth'>('profile');

  // Profile Edit State
  const [name, setName] = useState(currentUser?.name || 'Sakshi Pawar');
  const [monthlyIncome, setMonthlyIncome] = useState(String(currentUser?.monthlyIncome || 75000));
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(currency.code);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sign In / Register State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setMonthlyIncome(String(currentUser.monthlyIncome));
      setSelectedCurrencyCode(currentUser.currencyCode || currency.code);
    }
  }, [currentUser, currency]);

  if (!isOpen) return null;

  const getInitials = (fullName: string) => {
    if (!fullName) return 'SP';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Name cannot be empty' });
      return;
    }
    const incomeNum = parseFloat(monthlyIncome);
    if (isNaN(incomeNum) || incomeNum < 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid monthly allocation figure' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      const updated = await api.updateUserProfile({
        name: name.trim(),
        monthlyIncome: incomeNum,
        currencyCode: selectedCurrencyCode,
      });

      const matchedCurr = SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrencyCode);
      if (matchedCurr) {
        onSelectCurrency(matchedCurr);
      }

      onUserUpdated(updated);
      setFeedback({ type: 'success', message: 'Profile & preferences updated successfully' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update profile' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'New password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      await api.updateUserPassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFeedback({ type: 'success', message: 'Password changed successfully' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to change password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      setIsSubmitting(true);
      if (authMode === 'login') {
        const res = await api.loginUser(authEmail, authPassword);
        onUserUpdated(res.user);
        setFeedback({ type: 'success', message: `Welcome back, ${res.user.name}` });
        setAuthEmail('');
        setAuthPassword('');
        setActiveTab('profile');
      } else {
        const res = await api.registerUser({
          name: authName,
          email: authEmail,
          password: authPassword,
        });
        onUserUpdated(res.user);
        setFeedback({ type: 'success', message: `Account created! Welcome, ${res.user.name}` });
        setAuthName('');
        setAuthEmail('');
        setAuthPassword('');
        setActiveTab('profile');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Authentication failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#112217]/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#fdfcf9] rounded-lg shadow-2xl border border-[#e5dfd4] max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#f7f4ed] border-b border-[#e5dfd4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1b3829] border border-[#c5a265] text-[#d8b87b] flex items-center justify-center font-serif text-sm font-bold shadow-xs">
              {getInitials(currentUser?.name || name)}
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1b3829]">User Profile &amp; Account</h2>
              <p className="text-xs text-[#716556] truncate max-w-[240px]">
                {currentUser?.email || 'sakshipawar@gmail.com'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8c7e6c] hover:text-[#1b3829] hover:bg-[#e8dfd1] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#e5dfd4] bg-[#fdfcf9] px-6 text-xs">
          <button
            onClick={() => {
              setActiveTab('profile');
              setFeedback(null);
            }}
            className={`py-3 px-4 font-semibold font-serif border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-[#1b3829] text-[#1b3829]'
                : 'border-transparent text-[#716556] hover:text-[#1b3829]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile &amp; Allocations</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('security');
              setFeedback(null);
            }}
            className={`py-3 px-4 font-semibold font-serif border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-[#1b3829] text-[#1b3829]'
                : 'border-transparent text-[#716556] hover:text-[#1b3829]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('auth');
              setFeedback(null);
            }}
            className={`py-3 px-4 font-semibold font-serif border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'auth'
                ? 'border-[#1b3829] text-[#1b3829]'
                : 'border-transparent text-[#716556] hover:text-[#1b3829]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Switch / Login</span>
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded text-xs flex items-center gap-2 border ${
              feedback.type === 'success'
                ? 'bg-[#edf4ef] text-[#1b3829] border-[#c0dac7]'
                : 'bg-[#fdf0f2] text-[#842e3b] border-[#f3ccd1]'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1b3829]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#842e3b]" />
            )}
            <span>{typeof feedback.message === 'object' ? JSON.stringify(feedback.message) : String(feedback.message ?? '')}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: PROFILE & ALLOCATIONS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2c261e] mb-1">Full Legal Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8c7e6c]">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#d6cec0] rounded font-sans text-[#1b3829] focus:outline-none focus:border-[#1b3829]"
                    placeholder="Your Full Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2c261e] mb-1">Registered Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8c7e6c]">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || 'sakshipawar@gmail.com'}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#f7f4ed] border border-[#e5dfd4] rounded font-mono text-[#716556] cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-[#8c7e6c] mt-1 font-mono">
                  Primary identifier for your private financial records
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2c261e] mb-1">
                    Monthly Capital Budget ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#d6cec0] rounded font-mono text-[#1b3829] tabular-nums focus:outline-none focus:border-[#1b3829]"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2c261e] mb-1">
                    Preferred Currency
                  </label>
                  <select
                    value={selectedCurrencyCode}
                    onChange={(e) => setSelectedCurrencyCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#d6cec0] rounded font-sans text-[#1b3829] focus:outline-none focus:border-[#1b3829]"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Archive & Export */}
              <div className="p-3 bg-[#f7f4ed] rounded border border-[#e5dfd4] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-[#1b3829] font-serif">Ledger Vault Backup</div>
                  <div className="text-[11px] text-[#716556]">
                    Download a secure JSON archive of your personal categories and transaction history.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => api.exportLedgerBackup()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ffffff] hover:bg-[#f4efe6] text-[#1b3829] border border-[#d6cec0] rounded text-xs font-semibold shrink-0 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#b58c49]" />
                  <span>Download Backup</span>
                </button>
              </div>

              <div className="pt-3 border-t border-[#e5dfd4] flex items-center justify-between">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#842e3b] hover:bg-[#fdf0f2] rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1b3829] hover:bg-[#142a1e] text-[#fbfaf6] text-xs font-semibold rounded shadow-xs transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2c261e] mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password (if set)"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#d6cec0] rounded font-mono text-[#1b3829] focus:outline-none focus:border-[#1b3829]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2c261e] mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#d6cec0] rounded font-mono text-[#1b3829] focus:outline-none focus:border-[#1b3829]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2c261e] mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#d6cec0] rounded font-mono text-[#1b3829] focus:outline-none focus:border-[#1b3829]"
                />
              </div>

              <div className="pt-3 border-t border-[#e5dfd4] flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1b3829] hover:bg-[#142a1e] text-[#fbfaf6] text-xs font-semibold rounded shadow-xs transition-colors disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: AUTHENTICATION (SIGN IN / REGISTER) */}
          {activeTab === 'auth' && (
            <div className="space-y-4">
              <div className="flex rounded bg-[#f7f4ed] p-1 border border-[#e5dfd4] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-1.5 rounded transition-colors text-center ${
                    authMode === 'login'
                      ? 'bg-[#1b3829] text-white font-semibold'
                      : 'text-[#716556] hover:text-[#1b3829]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-1.5 rounded transition-colors text-center ${
                    authMode === 'register'
                      ? 'bg-[#1b3829] text-white font-semibold'
                      : 'text-[#716556] hover:text-[#1b3829]'
                  }`}
                >
                  Register Account
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-3 pt-2">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#2c261e] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. Sakshi Pawar"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#d6cec0] rounded text-[#1b3829] focus:outline-none focus:border-[#1b3829]"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#2c261e] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#d6cec0] rounded text-[#1b3829] focus:outline-none focus:border-[#1b3829]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2c261e] mb-1">Password</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#d6cec0] rounded font-mono text-[#1b3829] focus:outline-none focus:border-[#1b3829]"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#1b3829] hover:bg-[#142a1e] text-[#fbfaf6] text-xs font-semibold rounded shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {authMode === 'login' ? (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? 'Signing in...' : 'Sign In to Account'}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? 'Registering...' : 'Create Account'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
