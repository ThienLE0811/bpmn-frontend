export * from './format-date.pipe';
export * from './avatar-color.pipe';
export * from './user-initials.pipe';

import { FormatDatePipe } from './format-date.pipe';
import { AvatarColorPipe } from './avatar-color.pipe';
import { UserInitialsPipe } from './user-initials.pipe';

export const SHARED_PIPES = [
  FormatDatePipe,
  AvatarColorPipe,
  UserInitialsPipe,
] as const;
