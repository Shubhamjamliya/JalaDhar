/**
 * Bank & Payout Details Validator for Indian Banking System
 */

/**
 * Validate Indian Bank Account Number
 * Typically 9 to 18 digits, numeric only, non-zero
 * @param {string|number} accountNumber
 * @returns {{ isValid: boolean, message?: string, sanitized?: string }}
 */
const validateAccountNumber = (accountNumber) => {
  if (!accountNumber) {
    return { isValid: false, message: 'Bank account number is required' };
  }
  const clean = String(accountNumber).replace(/[\s-]/g, '').trim();
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, message: 'Bank account number must contain numbers only' };
  }
  if (clean.length < 9 || clean.length > 18) {
    return { isValid: false, message: `Bank account number must be between 9 and 18 digits (current: ${clean.length})` };
  }
  if (/^0+$/.test(clean)) {
    return { isValid: false, message: 'Invalid bank account number (cannot be all zeros)' };
  }
  return { isValid: true, sanitized: clean };
};

/**
 * Validate Confirm Account Number matches Account Number
 * @param {string|number} accountNumber
 * @param {string|number} confirmAccountNumber
 * @returns {{ isValid: boolean, message?: string }}
 */
const validateConfirmAccountNumber = (accountNumber, confirmAccountNumber) => {
  if (!confirmAccountNumber) {
    return { isValid: false, message: 'Please confirm your bank account number' };
  }
  const cleanAcc = String(accountNumber || '').replace(/[\s-]/g, '').trim();
  const cleanConfirm = String(confirmAccountNumber || '').replace(/[\s-]/g, '').trim();
  if (cleanAcc !== cleanConfirm) {
    return { isValid: false, message: 'Account numbers do not match' };
  }
  return { isValid: true };
};

/**
 * Validate Indian Financial System Code (IFSC)
 * Exactly 11 characters: 4 letters (bank code), '0' (reserved), 6 alphanumeric (branch code)
 * Example: SBIN0001234, HDFC0000001
 * @param {string} ifscCode
 * @returns {{ isValid: boolean, message?: string, sanitized?: string }}
 */
const validateIFSC = (ifscCode) => {
  if (!ifscCode) {
    return { isValid: false, message: 'IFSC code is required' };
  }
  const clean = String(ifscCode).replace(/[\s-]/g, '').trim().toUpperCase();
  if (clean.length !== 11) {
    return { isValid: false, message: `IFSC code must be exactly 11 characters (current: ${clean.length})` };
  }
  if (!/^[A-Z]{4}/.test(clean)) {
    return { isValid: false, message: 'First 4 characters of IFSC code must be letters representing the bank' };
  }
  if (clean[4] !== '0') {
    return { isValid: false, message: '5th character of IFSC code must be 0 (Zero)' };
  }
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) {
    return {
      isValid: false,
      message: 'Invalid IFSC format. Must be 4 uppercase letters, a 0 (zero), followed by 6 letters or numbers (e.g. SBIN0001234)'
    };
  }
  return { isValid: true, sanitized: clean };
};

/**
 * Validate Account Holder Name
 * Must be at least 3 characters and contain valid name characters
 * @param {string} name
 * @returns {{ isValid: boolean, message?: string, sanitized?: string }}
 */
const validateAccountHolderName = (name) => {
  if (!name || !String(name).trim()) {
    return { isValid: false, message: 'Account holder name is required' };
  }
  const clean = String(name).trim();
  if (clean.length < 3) {
    return { isValid: false, message: 'Account holder name must be at least 3 characters' };
  }
  if (clean.length > 100) {
    return { isValid: false, message: 'Account holder name cannot exceed 100 characters' };
  }
  if (!/^[a-zA-Z\s.'-]+$/.test(clean)) {
    return { isValid: false, message: 'Account holder name should only contain letters and spaces' };
  }
  return { isValid: true, sanitized: clean };
};

/**
 * Validate Bank Name
 * @param {string} bankName
 * @returns {{ isValid: boolean, message?: string, sanitized?: string }}
 */
const validateBankName = (bankName) => {
  if (!bankName || !String(bankName).trim()) {
    return { isValid: false, message: 'Bank name is required' };
  }
  const clean = String(bankName).trim();
  if (clean.length < 2) {
    return { isValid: false, message: 'Bank name must be at least 2 characters' };
  }
  return { isValid: true, sanitized: clean };
};

/**
 * Validate complete bank details object
 * @param {object} details
 * @param {object} [options]
 * @param {boolean} [options.requireConfirm=false]
 * @param {boolean} [options.requireHolder=true]
 * @param {boolean} [options.requireBankName=true]
 * @returns {{ isValid: boolean, message?: string, sanitized?: object }}
 */
const validateBankDetails = (details, options = {}) => {
  const { requireConfirm = false, requireHolder = true, requireBankName = true } = options;
  if (!details || typeof details !== 'object') {
    return { isValid: false, message: 'Bank account details are required' };
  }

  // 1. Account Holder Name
  let sanitizedHolder = '';
  if (requireHolder || details.accountHolderName) {
    const holderCheck = validateAccountHolderName(details.accountHolderName);
    if (!holderCheck.isValid) return holderCheck;
    sanitizedHolder = holderCheck.sanitized;
  }

  // 2. Account Number
  const accCheck = validateAccountNumber(details.accountNumber);
  if (!accCheck.isValid) return accCheck;

  // 3. Confirm Account Number (if enabled or provided)
  if (requireConfirm || details.confirmAccountNumber) {
    const confirmCheck = validateConfirmAccountNumber(details.accountNumber, details.confirmAccountNumber);
    if (!confirmCheck.isValid) return confirmCheck;
  }

  // 4. IFSC Code
  const ifscCheck = validateIFSC(details.ifscCode);
  if (!ifscCheck.isValid) return ifscCheck;

  // 5. Bank Name
  let sanitizedBank = '';
  if (requireBankName || details.bankName) {
    const bankCheck = validateBankName(details.bankName);
    if (!bankCheck.isValid) return bankCheck;
    sanitizedBank = bankCheck.sanitized;
  }

  return {
    isValid: true,
    sanitized: {
      accountHolderName: sanitizedHolder,
      accountNumber: accCheck.sanitized,
      ifscCode: ifscCheck.sanitized,
      bankName: sanitizedBank,
      branchName: details.branchName ? String(details.branchName).trim() : null
    }
  };
};

/**
 * Validate UPI ID / VPA
 * Format: user@bankhandle (e.g. name@okhdfcbank, 9876543210@paytm)
 * @param {string} upiId
 * @returns {{ isValid: boolean, message?: string, sanitized?: string }}
 */
const validateUPI = (upiId) => {
  if (!upiId) {
    return { isValid: false, message: 'UPI ID is required' };
  }
  const clean = String(upiId).trim();
  if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$/.test(clean)) {
    return { isValid: false, message: 'Invalid UPI ID format (e.g. name@upi, 9876543210@paytm)' };
  }
  return { isValid: true, sanitized: clean };
};

/**
 * Lookup bank details by IFSC code via RBI public database
 * @param {string} ifscCode
 * @returns {Promise<{ isValid: boolean, bank?: string, branch?: string, city?: string, state?: string, message?: string, sanitized?: string }>}
 */
const lookupIFSC = async (ifscCode) => {
  const check = validateIFSC(ifscCode);
  if (!check.isValid) return check;

  try {
    const res = await fetch(`https://ifsc.razorpay.com/${check.sanitized}`);
    if (res.status === 404) {
      return {
        isValid: false,
        message: `IFSC code "${check.sanitized}" was not found in the RBI bank database`
      };
    }
    if (!res.ok) {
      return { isValid: true, sanitized: check.sanitized };
    }
    const data = await res.json();
    return {
      isValid: true,
      sanitized: check.sanitized,
      bank: data.BANK || '',
      branch: data.BRANCH || '',
      city: data.CITY || '',
      state: data.STATE || ''
    };
  } catch (err) {
    return { isValid: true, sanitized: check.sanitized };
  }
};

module.exports = {
  validateAccountNumber,
  validateConfirmAccountNumber,
  validateIFSC,
  validateAccountHolderName,
  validateBankName,
  validateBankDetails,
  validateUPI,
  lookupIFSC
};
