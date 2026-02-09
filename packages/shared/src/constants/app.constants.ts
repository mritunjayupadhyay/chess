// ✅ Constants used by both frontend and backend should live here

import { UserRole } from "../types";

export const USER_ROLES: UserRole[] = ["admin", "user", "moderator"];

export const VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
} as const;

export const API_ENDPOINTS = {
  USERS: "/api/users",
  USER_BY_ID: (id: string) => `/api/users/${id}`,
} as const;

export const ERROR_MESSAGES = {
  NAME_REQUIRED: "Name is required",
  NAME_TOO_SHORT: `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`,
  NAME_TOO_LONG: `Name must be at most ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
  EMAIL_REQUIRED: "Email is required",
  EMAIL_INVALID: "Please enter a valid email address",
  ROLE_INVALID: `Role must be one of: ${USER_ROLES.join(", ")}`,
  USER_CREATED: "User created successfully",
  USER_CREATION_FAILED: "Failed to create user",
} as const;
