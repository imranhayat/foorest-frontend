import { z } from 'zod';

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .regex(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number with country code (e.g. +1234567890)');

export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must be numeric');
