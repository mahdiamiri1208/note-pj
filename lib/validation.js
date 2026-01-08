/**
 * Utility functions for validation
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const USERNAME_REGEX = /^(?=.*[a-zA-Z])[a-zA-Z0-9._-]{3,}$/;

/**
 * Validate username (not email)
 * @param {string} username - Username to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
export function validateUsername(username) {
  if (!username || username.trim().length === 0) {
    return { isValid: false, message: 'Username is required' };
  }

  const trimmed = username.trim().toLowerCase();
  
  // بررسی طول
  if (trimmed.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters' };
  }
  
  if (trimmed.length > 30) {
    return { isValid: false, message: 'Username cannot exceed 30 characters' };
  }
  
  // بررسی کاراکترهای مجاز
  const validChars = /^[a-zA-Z0-9._-]+$/;
  if (!validChars.test(trimmed)) {
    return { 
      isValid: false, 
      message: 'Username can only contain letters (a-z), numbers, dots, hyphens, and underscores' 
    };
  }
  
  // بررسی اینکه فقط عدد نباشد (حداقل یک حرف داشته باشد)
  const hasLetter = /[a-zA-Z]/.test(trimmed);
  if (!hasLetter) {
    return { 
      isValid: false, 
      message: 'Username must contain at least one letter (a-z)' 
    };
  }
  
  // بررسی فارسی بودن (کاراکترهای غیر لاتین)
  const hasPersian = /[\u0600-\u06FF]/.test(username);
  if (hasPersian) {
    return { 
      isValid: false, 
      message: 'Username cannot contain Persian characters. Use English letters only.' 
    };
  }
  
  return { isValid: true, message: 'Username is valid' };
}

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
export function validateEmail(email) {
  if (!email || email.trim().length === 0) {
    return { isValid: false, message: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();
  
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true, message: 'Email is valid' };
}

/**
 * Check if input is email or username
 * @param {string} input - User input
 * @returns {Object} - { isEmail: boolean, value: string }
 */
export function identifyInput(input) {
  if (!input) return { isEmail: false, value: '' };
  
  const trimmed = input.trim().toLowerCase();
  const isEmail = EMAIL_REGEX.test(trimmed);
  
  return {
    isEmail,
    value: trimmed,
    type: isEmail ? 'email' : 'username'
  };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - { score: number, message: string, isValid: boolean }
 */
export function validatePassword(password) {
  if (!password) {
    return { score: 0, message: 'Password is required', isValid: false };
  }
  
  let score = 0;
  const messages = [];
  
  // طول
  if (password.length >= 8) score += 1;
  else messages.push('At least 8 characters');
  
  // حروف کوچک و بزرگ
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else messages.push('Lowercase & uppercase letters');
  
  // اعداد
  if (/\d/.test(password)) score += 1;
  else messages.push('Include numbers');
  
  // کاراکترهای خاص
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else messages.push('Special characters');
  
  const isValid = score >= 2; // حداقل امتیاز 2
  
  const strengthConfig = [
    { score: 0, message: messages[0] || 'Very weak' },
    { score: 1, message: 'Weak' },
    { score: 2, message: 'Medium' },
    { score: 3, message: 'Strong' },
    { score: 4, message: 'Very strong' },
  ];
  
  const config = strengthConfig.find(config => score <= config.score) || strengthConfig[4];
  
  return {
    score,
    message: config.message,
    isValid,
    details: messages
  };
}