import {Building2, Check, Copy, X} from 'lucide-react';
import {useState} from 'react';
import type {PaymentRequest} from '../types/learning';

interface MembershipModalProps {
  isOpen: boolean;
  token: string;
  defaultSenderName: string;
  latestRequest: PaymentRequest | null;
  onClose: () => void;
  onSubmitted: (req: PaymentRequest) => void;
}

export function MembershipModal({
  isOpen,
  token,
  defaultSenderName,
  latestRequest,
  onClose,
  onSubmitted,
}: MembershipModalProps) {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [referenceNote, setReferenceNote] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const monthlyAmount = 5000;
  const yearlyAmount = monthlyAmount * 12; // 60,000 Naira

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText('7062449465');
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch {
      setCopiedAccount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/memberships/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({plan, senderName, referenceNote}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not submit payment confirmation.');
        return;
      }
      onSubmitted(data.request);
    } catch {
      setError('Network error submitting payment confirmation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-modal-title"
    >
      <div className="studio-surface w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border p-6 sm:p-8 text-slate-900 dark:text-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Learning HQ Membership
            </p>
            <h2
              id="membership-modal-title"
              className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white"
            >
              Register as Member
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Unlock all intermediate &amp; advanced lessons plus Mastery Arena challenges across
              all 50 languages &amp; web technologies.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close membership modal"
            className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Plan Math Comparison */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPlan('monthly')}
            className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
              plan === 'monthly'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Monthly Plan
              </span>
              {plan === 'monthly' && (
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Selected
                </span>
              )}
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              ₦5,000
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                {' '}
                / month
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Five thousand naira per month
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPlan('yearly')}
            className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
              plan === 'yearly'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Yearly Plan
              </span>
              {plan === 'yearly' && (
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Selected
                </span>
              )}
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              ₦{yearlyAmount.toLocaleString()}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                {' '}
                / year
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Calculated: ₦5,000 × 12 months = ₦60,000
            </p>
          </button>
        </div>

        {/* Moniepoint Bank Transfer Box */}
        <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 p-5 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            <Building2 className="h-4 w-4 text-blue-400" />
            <span>Bank Transfer Payment Details</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">Bank</p>
              <p className="mt-0.5 font-display text-base font-semibold text-white">Moniepoint</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Account Number</p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="font-mono text-base font-semibold text-white tabular-nums">
                  7062449465
                </p>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {copiedAccount ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400">Account Name</p>
              <p className="mt-0.5 font-display text-base font-semibold text-white">
                Enenche Dominion
              </p>
            </div>
          </div>

          <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-300">
            Transfer{' '}
            <span className="font-mono font-semibold text-white tabular-nums">
              ₦{plan === 'monthly' ? '5,000' : '60,000'}
            </span>{' '}
            to the Moniepoint account above, then submit your transfer reference below for admin
            activation.
          </p>
        </div>

        {latestRequest && latestRequest.status === 'pending' && (
          <div className="mt-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-200">
            <p className="font-semibold">
              Pending Verification —{' '}
              {latestRequest.plan === 'monthly' ? 'Monthly (₦5,000)' : 'Yearly (₦60,000)'}
            </p>
            <p className="mt-1">
              Reference <span className="font-mono font-semibold">{latestRequest.referenceNote}</span>{' '}
              is awaiting approval in the Admin Dashboard. You can also submit an updated transfer
              below if needed.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="pay-sender"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Sender Account Name
              </label>
              <input
                id="pay-sender"
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Name on your bank transfer"
                className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div>
              <label
                htmlFor="pay-ref"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Transfer Reference / Session ID
              </label>
              <input
                id="pay-ref"
                type="text"
                required
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                placeholder="e.g. MONIE-904218"
                className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3.5 py-2 text-xs font-medium text-red-700 dark:text-red-300"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting
                ? 'Submitting...'
                : `Submit Transfer (₦${plan === 'monthly' ? '5,000' : '60,000'})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
