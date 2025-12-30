import { z } from 'zod';

// =====================================================
// FILE VALIDATION
// =====================================================

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file for upload
 * - Max size: 20MB
 * - Allowed types: PDF, JPG, PNG
 * - Sanitizes filename
 */
export const validateFile = (file: File): FileValidationResult => {
  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Le fichier dépasse la taille maximale de 20MB (${(file.size / 1024 / 1024).toFixed(2)}MB)` };
  }

  // Check MIME type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: `Type de fichier non autorisé. Formats acceptés: PDF, JPG, PNG` };
  }

  // Check extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: `Extension de fichier non autorisée. Extensions acceptées: ${ALLOWED_EXTENSIONS.join(', ')}` };
  }

  return { valid: true };
};

/**
 * Sanitizes a filename for safe storage
 * - Removes special characters
 * - Removes spaces
 * - Removes potential scripts
 */
export const sanitizeFileName = (fileName: string): string => {
  // Get extension
  const parts = fileName.split('.');
  const extension = parts.pop()?.toLowerCase() || '';
  const name = parts.join('.');

  // Remove special characters, spaces, and scripts
  const sanitized = name
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^\w\-_.]/g, '') // Keep only word chars, dashes, underscores, dots
    .replace(/\.+/g, '.') // Remove multiple dots
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .slice(0, 100); // Limit length

  return `${sanitized}.${extension}`;
};

/**
 * Generates a structured file path for storage
 * Format: year/month/type/filename
 */
export const generateStructuredPath = (
  fileName: string,
  type: 'transactions' | 'documents' | 'justificatifs' | 'apports' = 'documents'
): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now();
  const sanitized = sanitizeFileName(fileName);

  return `${year}/${month}/${type}/${timestamp}_${sanitized}`;
};

// =====================================================
// AMOUNT VALIDATION
// =====================================================

export const MAX_AMOUNT = 10_000_000_000; // 10 milliards FCFA
export const MIN_AMOUNT = 1; // Minimum 1 FCFA
export const DECIMAL_PRECISION = 2;

/**
 * Zod schema for financial amounts
 */
export const amountSchema = z.string()
  .min(1, 'Le montant est requis')
  .transform((val) => val.replace(/[\s,]/g, '').replace(/\./g, ','))
  .refine((val) => !isNaN(parseFloat(val.replace(',', '.'))), {
    message: 'Le montant doit être un nombre valide'
  })
  .transform((val) => parseFloat(val.replace(',', '.')))
  .refine((val) => val >= MIN_AMOUNT, {
    message: `Le montant minimum est ${MIN_AMOUNT} FCFA`
  })
  .refine((val) => val <= MAX_AMOUNT, {
    message: `Le montant maximum est ${MAX_AMOUNT.toLocaleString('fr-FR')} FCFA`
  })
  .refine((val) => {
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= DECIMAL_PRECISION;
  }, {
    message: `Maximum ${DECIMAL_PRECISION} décimales autorisées`
  });

/**
 * Parses and validates an amount string
 */
export const parseAmount = (value: string): { valid: boolean; amount?: number; error?: string } => {
  try {
    const cleaned = value.replace(/[\s,]/g, '').replace(/\./g, ',');
    const amount = parseFloat(cleaned.replace(',', '.'));

    if (isNaN(amount)) {
      return { valid: false, error: 'Le montant doit être un nombre valide' };
    }

    if (amount < MIN_AMOUNT) {
      return { valid: false, error: `Le montant minimum est ${MIN_AMOUNT} FCFA` };
    }

    if (amount > MAX_AMOUNT) {
      return { valid: false, error: `Le montant maximum est ${MAX_AMOUNT.toLocaleString('fr-FR')} FCFA` };
    }

    const decimalPart = amount.toString().split('.')[1];
    if (decimalPart && decimalPart.length > DECIMAL_PRECISION) {
      return { valid: false, error: `Maximum ${DECIMAL_PRECISION} décimales autorisées` };
    }

    return { valid: true, amount };
  } catch {
    return { valid: false, error: 'Montant invalide' };
  }
};

/**
 * Formats an amount for display
 */
export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: DECIMAL_PRECISION
  });
};

// =====================================================
// DATE VALIDATION
// =====================================================

export const dateSchema = z.string()
  .min(1, 'La date est requise')
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'Date invalide'
  })
  .refine((val) => new Date(val) <= new Date(), {
    message: 'La date ne peut pas être dans le futur'
  });

// =====================================================
// TEXT VALIDATION
// =====================================================

export const sanitizeText = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};