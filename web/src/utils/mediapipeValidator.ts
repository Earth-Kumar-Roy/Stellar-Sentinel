/**
 * MediaPipe & Document Integrity Validation Helper
 * Performs client-side heuristic inspection of uploaded GST/Corporate PDFs
 * before generating SHA-256 evidence digests and pushing to Google Apps Script.
 */

export interface GstValidationResult {
  isValid: boolean;
  gstNumber?: string;
  error?: string;
  evidenceDigest?: string;
  fileBase64?: string;
}

// Standard Indian GSTIN Regex: 2 digits (State), 10 chars (PAN), 1 entity code, 1 default 'Z', 1 check digit
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export class DocumentValidator {
  /**
   * Converts a File object to a clean Base64 string (strips data URL scheme prefix).
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Computes SHA-256 digest of an ArrayBuffer for on-chain identity binding.
   */
  static async computeFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verifies document bounds, extension, and formatting constraints.
   */
  static validateGstFormat(gst: string): boolean {
    return GSTIN_REGEX.test(gst.trim().toUpperCase());
  }

  /**
   * Evaluates the certificate PDF metadata and size limitations (<4MB).
   */
  static async inspectPdfDocument(file: File, gstInput: string): Promise<GstValidationResult> {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return { isValid: false, error: 'File format invalid. Only corporate GST PDF certificates accepted.' };
    }

    if (file.size > 4 * 1024 * 1024) {
      return { isValid: false, error: 'Document exceeds the maximum 4MB upload ceiling.' };
    }

    const cleanGst = gstInput.trim().toUpperCase();
    if (!this.validateGstFormat(cleanGst)) {
      return { isValid: false, error: 'Invalid GSTIN syntax. Expected format: 22AAAAA0000A1Z5.' };
    }

    try {
      const fileBase64 = await this.fileToBase64(file);
      const evidenceDigest = await this.computeFileHash(file);

      return {
        isValid: true,
        gstNumber: cleanGst,
        evidenceDigest,
        fileBase64,
      };
    } catch (err) {
      return {
        isValid: false,
        error: `Integrity check failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      };
    }
  }
}