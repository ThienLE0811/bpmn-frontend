export type UserRole = 'ADMIN' | 'DEVELOPER' | 'MANAGER' | 'DESIGNER' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
  createdAt: string;
  updatedAt: string;
}


export interface UserQueryParams {
  search?: string;
  username?: string;
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
  page?: number;
  size?: number;
  [key: string]: unknown;
}
