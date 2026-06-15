import { UserRole } from "./UserRole";

export interface AuthResponse {
  token: string;
  expiresInSeconds: number;
  user: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
}
