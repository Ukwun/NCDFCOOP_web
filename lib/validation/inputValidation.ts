/**
 * Input Validation Utilities
 * Uses regex patterns and business logic for data validation
 */

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+234|0)[0-9]{10}$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  AMOUNT_MIN: 100,
  AMOUNT_MAX: 50000000,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
};

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL.test(email.trim().toLowerCase());
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain numbers');
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain special characters (@$!%*?&)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length >= VALIDATION_RULES.NAME_MIN_LENGTH && trimmed.length <= VALIDATION_RULES.NAME_MAX_LENGTH;
};

export const validateAmount = (amount: number | string): boolean => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num >= VALIDATION_RULES.AMOUNT_MIN && num <= VALIDATION_RULES.AMOUNT_MAX;
};

export const validatePhoneNumber = (phone: string): boolean => {
  return VALIDATION_RULES.PHONE.test(phone.replace(/\s/g, ''));
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateSignupData = (email: string, password: string, name: string) => {
  const errors: Record<string, string> = {};

  if (!validateEmail(email)) {
    errors.email = 'Invalid email address';
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.errors[0] || 'Invalid password';
  }

  if (!validateName(name)) {
    errors.name = `Name must be between ${VALIDATION_RULES.NAME_MIN_LENGTH} and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateLoginData = (email: string, password: string) => {
  const errors: Record<string, string> = {};

  if (!email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Invalid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateTransactionAmount = (amount: string | number): { valid: boolean; error?: string } => {
  if (!amount) {
    return { valid: false, error: 'Amount is required' };
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (num < VALIDATION_RULES.AMOUNT_MIN) {
    return { valid: false, error: `Minimum amount is ₦${VALIDATION_RULES.AMOUNT_MIN.toLocaleString()}` };
  }

  if (num > VALIDATION_RULES.AMOUNT_MAX) {
    return { valid: false, error: `Maximum amount is ₦${VALIDATION_RULES.AMOUNT_MAX.toLocaleString()}` };
  }

  return { valid: true };
};
