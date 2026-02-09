import { ICreateUserRequest, UserRole } from "../types";
import {
  VALIDATION_RULES,
  USER_ROLES,
  ERROR_MESSAGES,
} from "../constants";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates a create user request.
 * This function runs on BOTH frontend (for instant feedback)
 * and backend (for security). Single source of truth!
 */
export function validateCreateUser(data: ICreateUserRequest): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = ERROR_MESSAGES.NAME_REQUIRED;
  } else if (data.name.trim().length < VALIDATION_RULES.NAME_MIN_LENGTH) {
    errors.name = ERROR_MESSAGES.NAME_TOO_SHORT;
  } else if (data.name.trim().length > VALIDATION_RULES.NAME_MAX_LENGTH) {
    errors.name = ERROR_MESSAGES.NAME_TOO_LONG;
  }

  // Validate email
  if (!data.email || data.email.trim().length === 0) {
    errors.email = ERROR_MESSAGES.EMAIL_REQUIRED;
  } else if (!isValidEmail(data.email)) {
    errors.email = ERROR_MESSAGES.EMAIL_INVALID;
  }

  // Validate role
  if (!USER_ROLES.includes(data.role as UserRole)) {
    errors.role = ERROR_MESSAGES.ROLE_INVALID;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Simple email validation - shared between frontend & backend
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
