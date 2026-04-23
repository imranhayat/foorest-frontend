import { gql } from '@apollo/client';

export const SEND_OTP = gql`
  mutation SendOtp($input: SendOtpInput!) {
    sendOtp(input: $input) {
      success
      devOtpCode
    }
  }
`;

export const VERIFY_OTP = gql`
  mutation VerifyOtp($input: VerifyOtpInput!) {
    verifyOtp(input: $input) {
      accessToken
      refreshToken
      user { id phoneNumber name isVerified }
    }
  }
`;

export interface SendOtpData {
  sendOtp: { success: boolean; devOtpCode?: string | null };
}

export interface VerifyOtpData {
  verifyOtp: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      phoneNumber: string;
      name: string | null;
      isVerified: boolean;
    };
  };
}
