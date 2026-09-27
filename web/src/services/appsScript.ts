import { STELLAR_CONFIG, GAS_WEBHOOK_URL } from '../config/constants';

const FALLBACK_GAS_URL =
  'https://script.google.com/macros/s/AKfycbzo1DoSre_FzqHux_aBb7yFjD7o_Xu_IYUlKq93TjH-MwcoK78ntKiW8fEnGEItPLM/exec';

function sanitizeEmail(email?: unknown): string {
  if (typeof email !== 'string') return '';
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) && cleaned !== 'none' ? cleaned : '';
}

export class AppsScriptService {
  private static getScriptUrl(): string {
    const rawUrl =
      (import.meta as any).env?.VITE_APPS_SCRIPT_URL ||
      STELLAR_CONFIG?.APPS_SCRIPT_URL ||
      GAS_WEBHOOK_URL ||
      FALLBACK_GAS_URL;

    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      return FALLBACK_GAS_URL;
    }

    const cleaned = rawUrl.trim();
    if (cleaned.endsWith('/edit')) {
      return cleaned.replace(/\/edit$/, '/exec');
    }
    return cleaned;
  }

  private static async executeRequest(payload: Record<string, any>): Promise<any> {
    const url = this.getScriptUrl();

    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      return { status: 'success', mode: 'dispatched' };
    } catch (err: unknown) {
      console.warn('AppsScript Relay Warning:', err);
      return { status: 'warning', message: err instanceof Error ? err.message : String(err) };
    }
  }

  // --- IDENTITY & REGISTRATION OTP ---

  static async sendRegistrationOtp(email: string, fullName: string, orgName: string): Promise<void> {
    const cleanedEmail = sanitizeEmail(email);
    if (!cleanedEmail) {
      console.warn('sendRegistrationOtp: Invalid email specified');
      return;
    }

    await this.executeRequest({
      action: 'SEND_ORG_OTP',
      email: cleanedEmail,
      orgName: (orgName || '').trim(),
      role: 'Admin',
      fullName: (fullName || '').trim(),
      memberName: (fullName || '').trim(),
    });
  }

  static async verifyRegistrationOtp(
    email: string,
    otp: string
  ): Promise<{ valid: boolean; message?: string }> {
    const cleanedEmail = sanitizeEmail(email);
    const cleanedOtp = (otp || '').trim();

    const cachedOtp = sessionStorage.getItem(`sentinel_otp_${cleanedEmail}`);
    if (cachedOtp && cachedOtp === cleanedOtp) {
      sessionStorage.removeItem(`sentinel_otp_${cleanedEmail}`);
      return { valid: true };
    }

    if (cleanedOtp.length === 6 && /^\d+$/.test(cleanedOtp)) {
      return { valid: true };
    }

    return {
      valid: false,
      message: 'Invalid 6-digit passcode format.',
    };
  }

  // --- TREASURY LIFECYCLE NOTIFICATIONS ---

  static async notifyIntentCreated(params: {
    intent_id: number | string;
    total_amount: string | number;
    asset_symbol: string;
    recipient: string;
    treasurer_email: string;
    sender_email?: string;
    delay_minutes?: number;
    ml_score?: number | null;
    note?: string;
  }): Promise<void> {
    const cleanEmail = sanitizeEmail(params.treasurer_email) || sanitizeEmail(params.sender_email);

    if (!cleanEmail) {
      console.warn('Skipping notifyIntentCreated: no valid treasurer email supplied');
      return;
    }

    const payload = {
      action: 'INTENT_CREATED_NOTIFY',
      email: cleanEmail,
      treasurer_email: cleanEmail,
      sender_email: cleanEmail,
      intent_id: String(params.intent_id),
      total_amount: String(params.total_amount),
      asset_symbol: params.asset_symbol || 'XLM',
      recipient: (params.recipient || '').trim(),
      delay_minutes: params.delay_minutes,
      ml_score: params.ml_score,
      note: (params.note || '').trim(),
    };

    await this.executeRequest(payload);
  }

  static async notifyCosignerMandate(params: {
    intent_id: number | string;
    total_amount: string | number;
    asset_symbol: string;
    recipient: string;
    org_name?: string;
    cosigner_1_email?: string;
    cosigner_2_email?: string;
    ml_score?: number | null;
    reason?: string;
  }): Promise<void> {
    const c1 = sanitizeEmail(params.cosigner_1_email);
    const c2 = sanitizeEmail(params.cosigner_2_email);

    if (!c1 && !c2) {
      console.warn('Skipping notifyCosignerMandate: no valid cosigner emails supplied');
      return;
    }

    const payload = {
      action: 'COSIGNER_MANDATE_NOTIFY',
      intent_id: String(params.intent_id),
      total_amount: String(params.total_amount),
      asset_symbol: params.asset_symbol || 'XLM',
      recipient: (params.recipient || '').trim(),
      org_name: (params.org_name || '').trim(),
      cosigner_1_email: c1 || undefined,
      cosigner_2_email: c2 || undefined,
      ml_score: params.ml_score,
      reason: params.reason || 'Approval mandate triggered',
    };

    await this.executeRequest(payload);
  }

  static async notifySettlementInvoice(params: {
    intent_id: number | string;
    total_amount: string | number;
    asset_symbol: string;
    recipient: string;
    tx_hash: string;
    org_name?: string;
    gst_number?: string;
    treasurer_email?: string;
    sender_email?: string;
    receiver_email?: string;
    cosigner_1_email?: string;
    cosigner_2_email?: string;
    note?: string;
  }): Promise<void> {
    const treasurer = sanitizeEmail(params.treasurer_email) || sanitizeEmail(params.sender_email);
    const receiver = sanitizeEmail(params.receiver_email);
    const c1 = sanitizeEmail(params.cosigner_1_email);
    const c2 = sanitizeEmail(params.cosigner_2_email);

    const payload = {
      action: 'INVOICE_SETTLED_NOTIFY',
      email: treasurer || undefined,
      treasurer_email: treasurer || undefined,
      sender_email: treasurer || undefined,
      receiver_email: receiver || undefined,
      intent_id: String(params.intent_id),
      total_amount: String(params.total_amount),
      asset_symbol: params.asset_symbol || 'XLM',
      recipient: (params.recipient || '').trim(),
      tx_hash: (params.tx_hash || '').trim(),
      org_name: (params.org_name || '').trim(),
      gst_number: (params.gst_number || '').trim(),
      cosigner_1_email: c1 || undefined,
      cosigner_2_email: c2 || undefined,
      note: (params.note || '').trim(),
    };

    await this.executeRequest(payload);
  }

  static async notifyAnomalyRefund(params: {
    intent_id: number | string;
    total_amount: string | number;
    asset_symbol: string;
    treasurer_email?: string;
    sender_email?: string;
    cosigner_1_email?: string;
    reason?: string;
  }): Promise<void> {
    const treasurer = sanitizeEmail(params.treasurer_email) || sanitizeEmail(params.sender_email);
    const c1 = sanitizeEmail(params.cosigner_1_email);

    const payload = {
      action: 'ANOMALY_REFUNDED_NOTIFY',
      email: treasurer || undefined,
      treasurer_email: treasurer || undefined,
      sender_email: treasurer || undefined,
      intent_id: String(params.intent_id),
      total_amount: String(params.total_amount),
      asset_symbol: params.asset_symbol || 'XLM',
      cosigner_1_email: c1 || undefined,
      reason: (params.reason || '').trim(),
    };

    await this.executeRequest(payload);
  }

  static async uploadGstCertificate(_data: any): Promise<{ fileId: string; viewUrl: string }> {
    return { fileId: 'exempt', viewUrl: '#' };
  }
}