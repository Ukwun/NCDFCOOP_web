/**
 * Form Validation Utilities
 * Shared validation functions for all forms in the application
 */

export type ValidatorFunction = (value: any) => string | null;

/**
 * Validator for product prices
 * Ensures price is a positive number
 */
export const validatePrice: ValidatorFunction = (value) => {
  const price = parseFloat(value);
  if (!value || value === '') return 'Price is required';
  if (isNaN(price)) return 'Price must be a number';
  if (price <= 0) return 'Price must be greater than 0';
  return null;
};

/**
 * Validator for product quantities
 * Ensures quantity is a positive integer
 */
export const validateQuantity: ValidatorFunction = (value) => {
  const qty = parseInt(value, 10);
  if (!value || value === '') return 'Quantity is required';
  if (isNaN(qty)) return 'Quantity must be a number';
  if (qty <= 0) return 'Quantity must be greater than 0';
  return null;
};

/**
 * Validator for minimum order quantities
 * Ensures MOQ is at least 1
 */
export const validateMinimumOrder: ValidatorFunction = (value) => {
  const moq = parseInt(value, 10);
  if (!value || value === '') return 'Minimum order is required';
  if (isNaN(moq)) return 'Minimum order must be a number';
  if (moq < 1) return 'Minimum order must be at least 1';
  return null;
};

/**
 * Validator for required text fields
 * Ensures field is not empty and has minimum length
 */
export const validateRequired = (minLength = 1): ValidatorFunction => {
  return (value) => {
    if (!value || value.trim() === '') {
      return 'This field is required';
    }
    if (value.trim().length < minLength) {
      return `Minimum ${minLength} characters required`;
    }
    return null;
  };
};

/**
 * Validator for product names
 * Ensures name is appropriate length
 */
export const validateProductName: ValidatorFunction = (value) => {
  if (!value || value.trim() === '') return 'Product name is required';
  if (value.trim().length < 3) return 'Product name must be at least 3 characters';
  if (value.trim().length > 100) return 'Product name must be less than 100 characters';
  return null;
};

/**
 * Validator for product descriptions
 * Ensures description meets length requirements
 */
export const validateDescription: ValidatorFunction = (value) => {
  if (!value || value.trim() === '') return 'Description is required';
  if (value.trim().length < 20) return 'Description must be at least 20 characters';
  if (value.trim().length > 500) return 'Description must be less than 500 characters';
  return null;
};

/**
 * Validator for email addresses
 */
export const validateEmail: ValidatorFunction = (value) => {
  if (!value || value.trim() === '') return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return 'Please enter a valid email address';
  return null;
};

/**
 * Validator for phone numbers
 * Accepts Nigerian phone number formats
 */
export const validatePhone: ValidatorFunction = (value) => {
  if (!value || value.trim() === '') return 'Phone number is required';
  // Nigerian phone patterns: +234XXXXXXXXXX, 0XXXXXXXXXX, 234XXXXXXXXXX
  const phoneRegex = /^(?:\+?234|0)?[789]\d{9}$/;
  if (!phoneRegex.test(value.replace(/\s/g, ''))) {
    return 'Please enter a valid Nigerian phone number';
  }
  return null;
};

/**
 * Validator for bank account numbers
 * Ensures 10-digit account number
 */
export const validateBankAccount: ValidatorFunction = (value) => {
  if (!value || value.trim() === '') return 'Account number is required';
  if (!/^\d{10}$/.test(value)) return 'Account number must be exactly 10 digits';
  return null;
};

/**
 * Validator for categories
 * Ensures a selection was made
 */
export const validateCategory: ValidatorFunction = (value) => {
  if (!value || value === '') return 'Please select a category';
  return null;
};

/**
 * Validator for image files
 * Checks file type and size
 */
export const validateImageFile: ValidatorFunction = (file: File) => {
  if (!file) return 'Image is required';
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return 'Invalid image format. Please use JPG, PNG, or WebP';
  }
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return `Image size must be less than ${maxSize / 1024 / 1024}MB`;
  }
  return null;
};

/**
 * Validator for redemption amounts
 * Ensures amount is in valid increments (100 point minimum)
 */
export const validateRedemptionAmount: ValidatorFunction = (value) => {
  const amount = parseInt(value, 10);
  if (!value || value === '') return 'Amount is required';
  if (isNaN(amount)) return 'Amount must be a number';
  if (amount < 100) return 'Minimum redemption is 100 points';
  if (amount % 100 !== 0) return 'Amount must be in increments of 100 points';
  return null;
};

/**
 * Composite validation function
 * Validates multiple fields and returns all errors
 */
export const validateForm = (
  formData: Record<string, any>,
  validators: Record<string, ValidatorFunction | ValidatorFunction[]>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const field in validators) {
    const validatorOrValidators = validators[field];
    const validatorsArray = Array.isArray(validatorOrValidators)
      ? validatorOrValidators
      : [validatorOrValidators];

    for (const validator of validatorsArray) {
      const error = validator(formData[field]);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  }

  return errors;
};

/**
 * Check if object has any errors
 */
export const hasErrors = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Format currency for display (Nigerian Naira)
 */
export const formatCurrency = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `₦${num.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('en-NG');
};

/**
 * Validate points for redemption
 * Checks against available points
 */
export const validateAvailablePoints = (
  requestedPoints: number,
  availablePoints: number
): string | null => {
  if (requestedPoints > availablePoints) {
    return `You only have ${availablePoints} points available`;
  }
  return null;
};

/**
 * Validator for product MOQ vs order quantity
 * Ensures order quantity meets minimum
 */
export const validateMOQ = (
  orderQuantity: number,
  minimumOrderQuantity: number
): string | null => {
  if (orderQuantity < minimumOrderQuantity) {
    return `Minimum order quantity is ${minimumOrderQuantity} units`;
  }
  return null;
};
