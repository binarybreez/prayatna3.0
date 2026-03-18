/** Validate Indian phone number */
export const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\s+/g, '').replace('+91', '');
  return /^[6-9]\d{9}$/.test(cleaned);
};

/** Validate OTP (6 digits) */
export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

/** Validate name */
export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

/** Format phone number for display */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};
