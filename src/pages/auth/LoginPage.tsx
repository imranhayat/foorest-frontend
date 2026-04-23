import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumber,
  type CountryCode,
} from 'libphonenumber-js';
import { SEND_OTP, VERIFY_OTP, type SendOtpData, type VerifyOtpData } from '@/graphql/auth';

interface Country {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

function toFlag(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join('');
}

function buildCountryList(): Country[] {
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  return getCountries()
    .map((code) => ({
      code,
      name: names.of(code) ?? code,
      dialCode: `+${getCountryCallingCode(code)}`,
      flag: toFlag(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function LoginPage() {
  const navigate = useNavigate();

  const countries = useMemo(buildCountryList, []);
  const defaultCountry = countries.find((c) => c.code === 'BD') ?? countries[0];

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [localPhone, setLocalPhone] = useState('');
  const [phoneE164, setPhoneE164] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  const [sendOtp, { loading: sendingOtp, error: sendOtpError }] =
    useMutation<SendOtpData>(SEND_OTP);

  const [verifyOtp, { loading: verifyingOtp, error: verifyOtpError }] =
    useMutation<VerifyOtpData>(VERIFY_OTP);

  const validateAndFormatPhone = (): string | null => {
    const raw = localPhone.trim();
    if (!raw) {
      setPhoneError('Phone number is required.');
      return null;
    }
    if (!isValidPhoneNumber(raw, country.code)) {
      setPhoneError(`Invalid phone number for ${country.name}.`);
      return null;
    }
    setPhoneError('');
    return parsePhoneNumber(raw, country.code).format('E.164');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = validateAndFormatPhone();
    if (!e164) return;

    const { data } = await sendOtp({ variables: { input: { phoneNumber: e164 } } });
    if (data?.sendOtp.success) {
      setPhoneE164(e164);
      setDevOtpCode(data.sendOtp.devOtpCode ?? null);
      setStep('otp');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) return;

    const { data } = await verifyOtp({
      variables: { input: { phoneNumber: phoneE164, code: otp } },
    });
    if (data) {
      localStorage.setItem('access_token', data.verifyOtp.accessToken);
      localStorage.setItem('refresh_token', data.verifyOtp.refreshToken);
      navigate('/');
    }
  };

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendOtp} noValidate>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign in</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your phone number to get started.</p>

        <div className="flex gap-2 mb-1">
          <select
            value={country.code}
            onChange={(e) => {
              const found = countries.find((c) => c.code === e.target.value);
              if (found) { setCountry(found); setPhoneError(''); }
            }}
            className="border border-gray-300 rounded-lg px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            aria-label="Country code"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.dialCode}
              </option>
            ))}
          </select>

          <input
            type="tel"
            value={localPhone}
            onChange={(e) => { setLocalPhone(e.target.value); setPhoneError(''); }}
            placeholder="01234 567890"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            autoComplete="tel-national"
          />
        </div>

        {phoneError && <p className="text-red-600 text-xs mb-3">{phoneError}</p>}
        {!phoneError && <p className="text-xs text-gray-400 mb-3">{country.name} {country.dialCode}</p>}

        {sendOtpError && (
          <p className="text-red-600 text-sm mb-4">{sendOtpError.message}</p>
        )}

        <button
          type="submit"
          disabled={sendingOtp || !localPhone.trim()}
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
        We sent a 6-digit code to <span className="font-medium">{phoneE164}</span>.
      </p>

      {devOtpCode && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-4">
          Dev code: <span className="font-mono font-semibold">{devOtpCode}</span>
        </div>
      )}

      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        maxLength={6}
        inputMode="numeric"
        placeholder="000000"
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand mb-4"
        autoFocus
      />

      {verifyOtpError && (
        <p className="text-red-600 text-sm mb-4">{verifyOtpError.message}</p>
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
        onClick={() => { setStep('phone'); setOtp(''); setDevOtpCode(null); }}
        className="w-full text-sm text-gray-500 hover:text-gray-700"
      >
        Back to phone number
      </button>
    </form>
  );
}
