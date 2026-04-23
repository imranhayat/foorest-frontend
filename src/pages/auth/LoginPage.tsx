import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import {
  getCountries,
  getCountryCallingCode,
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

interface GqlError {
  message: string;
  extensions?: { originalError?: { message?: string | string[] } };
}

function extractErrorMessage(error: { graphQLErrors?: GqlError[]; message?: string } | undefined): string | null {
  if (!error) return null;
  const gqlError = error.graphQLErrors?.[0];
  if (gqlError) {
    const orig = gqlError.extensions?.originalError;
    if (orig?.message) {
      const m = orig.message;
      return Array.isArray(m) ? m[0] : m;
    }
    return gqlError.message;
  }
  return error.message ?? null;
}

function CountryDropdown({
  countries,
  selected,
  onSelect,
}: {
  countries: Country[];
  selected: Country;
  onSelect: (c: Country) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q),
    );
  }, [countries, search]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand whitespace-nowrap"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected.flag}</span>
        <span className="text-gray-700">{selected.dialCode}</span>
        <svg className="w-3 h-3 text-gray-400 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand"
              autoFocus
            />
          </div>
          <ul className="max-h-52 overflow-y-auto" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400">No results</li>
            ) : (
              filtered.map((c) => (
                <li
                  key={c.code}
                  role="option"
                  aria-selected={c.code === selected.code}
                  onClick={() => { onSelect(c); setOpen(false); setSearch(''); }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                    c.code === selected.code ? 'bg-gray-50 font-medium' : ''
                  }`}
                >
                  <span>{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-gray-400 text-xs">{c.dialCode}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
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

  const validateAndFormat = (): string | null => {
    const raw = localPhone.trim();
    if (!raw) {
      setPhoneError('Phone number is required.');
      return null;
    }
    try {
      const parsed = parsePhoneNumber(raw, country.code);
      if (!parsed.isValid()) throw new Error();
      setPhoneError('');
      return parsed.format('E.164');
    } catch {
      setPhoneError(`Invalid phone number for ${country.name}.`);
      return null;
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = validateAndFormat();
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
    const serverError = extractErrorMessage(sendOtpError);

    return (
      <form onSubmit={handleSendOtp} noValidate>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign in</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your phone number to get started.</p>

        <div className="flex gap-2 mb-1">
          <CountryDropdown
            countries={countries}
            selected={country}
            onSelect={(c) => { setCountry(c); setPhoneError(''); }}
          />
          <input
            type="tel"
            value={localPhone}
            onChange={(e) => { setLocalPhone(e.target.value); setPhoneError(''); }}
            placeholder="01234 567890"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            autoComplete="tel-national"
          />
        </div>

        {phoneError ? (
          <p className="text-red-600 text-xs mb-4">{phoneError}</p>
        ) : (
          <p className="text-xs text-gray-400 mb-4">{country.name} {country.dialCode}</p>
        )}

        {serverError && (
          <p className="text-red-600 text-sm mb-4">{serverError}</p>
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

  const serverError = extractErrorMessage(verifyOtpError);

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

      {serverError && (
        <p className="text-red-600 text-sm mb-4">{serverError}</p>
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
