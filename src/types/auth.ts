export interface UserContext {
  userId: string;
  username: string;
  groups: string[];
  roles: string[];
  permissions: string[];
  rsiHandle: string | null;
  rsiVerified: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}
