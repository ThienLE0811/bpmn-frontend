import { describe, it, expect } from 'vitest';
import { User } from '@core/models';
import { canDeleteUser, canEditUser, isSameUser } from './user-permission.util';

const user = (overrides: Partial<User>): User =>
  ({
    id: 'u1',
    username: 'alice',
    fullName: 'Alice',
    email: 'alice@example.com',
    role: 'DEVELOPER',
    status: 'ACTIVE',
    ...overrides,
  }) as User;

const admin = user({ id: 'a1', username: 'root', role: 'ADMIN' });
const alice = user({});
const bob = user({ id: 'u2', username: 'bob' });

describe('user permissions', () => {
  it('matches the same account by id or by username ignoring case and spaces', () => {
    expect(isSameUser(alice, user({ username: 'other' }))).toBe(true);
    expect(isSameUser(alice, user({ id: 'x', username: '  ALICE ' }))).toBe(true);
    expect(isSameUser(alice, bob)).toBe(false);
  });

  it('lets an admin edit anyone and a user edit only themselves', () => {
    expect(canEditUser(admin, bob)).toBe(true);
    expect(canEditUser(alice, alice)).toBe(true);
    expect(canEditUser(alice, bob)).toBe(false);
    expect(canEditUser(null, bob)).toBe(false);
  });

  it('lets only an admin delete, and never their own account', () => {
    expect(canDeleteUser(admin, bob)).toBe(true);
    expect(canDeleteUser(admin, admin)).toBe(false);
    expect(canDeleteUser(alice, bob)).toBe(false);
  });
});
