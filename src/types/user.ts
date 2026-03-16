export interface User {
  _id: string;
  username: string;
  email: string;
  roles: string[];
  is_active: boolean;
  rsi_handle: string | null;
  rsi_verified: boolean;
}

export interface VerificationResult {
  verification_code: string | null;
  verified: boolean;
  message: string;
}
