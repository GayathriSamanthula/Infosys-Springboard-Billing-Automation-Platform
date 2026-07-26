export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const PHONE_REGEX = /^[0-9+\s-]{10,15}$/;

export const validators = {
  required: (fieldName = 'Field') => `${fieldName} is required`,
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  minPrice: 'Price must be greater than or equal to 0',
};
