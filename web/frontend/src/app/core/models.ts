export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: { id: string; email: string; role: string };
  token: string;
}
