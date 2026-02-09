// ✅ Interfaces that both frontend and backend use should live here

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface ICreateUserRequest {
  name: string;
  email: string;
  role: UserRole;
}

export interface ICreateUserResponse {
  success: boolean;
  message: string;
  data: IUser | null;
}

export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export type UserRole = "admin" | "user" | "moderator";
