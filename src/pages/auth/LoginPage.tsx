import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { SEND_OTP, VERIFY_OTP, type SendOtpData, type VerifyOtpData } from '@/graphql/auth';

export function LoginPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  const [sendOtp, { loading: sendingOtp, error: sendOtpError }] =
    useMutation<SendOtpData>(SEND_OTP);

  const [verifyOtp, { loading: verifyingOtp, error: verifyOtpError }] =
    useMutation<VerifyOtpData>(VERIFY_OTP);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    const { data } = await sendOtp({ variables: { input: { phoneNumber: phone.trim() } } });
    if (data?.sendOtp.success) {
      setDevOtpCode(data.sendOtp.devOtpCode ?? null);
      setStep('otp');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) return;

    const { data } = await verifyOtp({
      variables: { input: { phoneNumber: phone.trim(), code: otp } },
    });
    if (data) {
      localStorage.setItem('access_token', data.verifyOtp.accessToken);
      localStorage.setItem('refresh_token', data.verifyOtp.refreshToken);
      navigate('/');
    }
  };

  const activeError = step === 'phone' ? sendOtpError : verifyOtpError;

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendOtp} noValidate>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign in</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your phone number to get started.</p>

        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 234 567 8900"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand mb-4"
          required
        />

        {activeError && (
          <p className="text-red-600 text-sm mb-4">{activeError.message}</p>
        )}

        <button
          type="submit"
          disabled={sendingOtp || !phone.trim()}
          className="w-full bg-brand text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-50"
        >
          {sendingOtp ? 'Sending...' : 'Send Code'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} noValidate>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Enter code</h2>
      <p className="text-sm text-gray-500 mb-6">
        We sent a 6-digit code to {phone}.
      </p>

      {devOtpCode && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-4">
          Dev code: {devOtpCode}
        </div>
      )}

      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        maxLength={6}
        pattern="\d{6}"
        inputMode="numeric"
        placeholder="000000"
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand mb-4"
        required
      />

      {activeError && (
        <p className="text-red-600 text-sm mb-4">{activeError.message}</p>
      )}

      <button
        type="submit"
        disabled={verifyingOtp || !/^\d{6}$/.test(otp)}
        className="w-full bg-brand text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-50 mb-4"
      >
        {verifyingOtp ? 'Verifying...' : 'Verify'}
      </button>

      <button
        type="button"
        onClick={() => { setStep('phone'); setOtp(''); }}
        className="w-full text-sm text-gray-500 hover:text-gray-700"
      >
        Back to phone number
      </button>
    </form>
  );
}
