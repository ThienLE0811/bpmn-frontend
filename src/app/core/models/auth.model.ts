import { User } from './user.model';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token?: string;
  token?: string;
  accessToken?: string;
  token_type?: string;
  expires_in?: number;
  user?: User;
  [key: string]: unknown;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}
