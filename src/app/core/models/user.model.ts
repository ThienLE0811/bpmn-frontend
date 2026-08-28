export type UserRole = 'ADMIN' | 'MANAGER' | 'DESIGNER' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  avatar?: string;
  notes?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserQueryParams {
  search?: string;
  username?: string;
  fullName?: string;
  email?: string;
  role?: string;
  department?: string;
  status?: string;
  page?: number;
  size?: number;
  [key: string]: unknown;
}
