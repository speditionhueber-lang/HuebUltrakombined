import { getAppEnvironment, getBuildInfo, AppEnvironment } from './environment-config';

export interface PrivacyErrorTelemetryEntry {
  id: string;
  errorCode: string;
  service: string;
  action: string;
  caseId?: string;
  timestamp: string;
  sanitizedMessage: string;
  appVersion: string;
  environment: AppEnvironment;
}

const TELEMETRY_STORAGE_KEY = 'spedition_hueber_error_telemetry';
const MAX_TELEMETRY_ENTRIES = 100;

function sanitizeErrorMessage(message: string): string {
  if (!message) return 'Unknown error';
  
  let sanitized = message;
  
  // Strip Bearer / Auth tokens
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9-_.~+/=]+/gi, '[REDACTED_TOKEN]');
  sanitized = sanitized.replace(/token[=:\s]+[A-Za-z0-9-_.~+/=]+/gi, '[REDACTED_TOKEN]');
  
  // Strip Passwords / Secrets
  sanitized = sanitized.replace(/(password|secret|apiKey|key)[=:\s]+[^\s,;&]+/gi, '[REDACTED_SECRET]');
  
  // Strip Base64 Data URLs (PDFs, images)
  sanitized = sanitized.replace(/data:[^;]+;base64,[A-Za-z0-9+/=]+/gi, '[REDACTED_BASE64_DATA]');
  
  // Strip Raw Email Bodies or excessive PII strings
  sanitized = sanitized.replace(/(body|content|emailBody|rawEmail)[=:\s]+".*?"/gi, '$1="[REDACTED_CONTENT]"');
  
  return sanitized;
}

export class ErrorTelemetryService {
  private memoryEntries: PrivacyErrorTelemetryEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(TELEMETRY_STORAGE_KEY);
        if (stored) {
          this.memoryEntries = JSON.parse(stored);
        }
      }
    } catch {
      this.memoryEntries = [];
    }
  }

  private saveToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(this.memoryEntries));
      }
    } catch {
      // Ignore storage errors
    }
  }

  public recordError(params: {
    errorCode: string;
    service: string;
    action: string;
    caseId?: string;
    message: string;
  }): PrivacyErrorTelemetryEntry {
    const buildInfo = getBuildInfo();
    const sanitized = sanitizeErrorMessage(params.message);

    const entry: PrivacyErrorTelemetryEntry = {
      id: `telemetry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      errorCode: params.errorCode,
      service: params.service,
      action: params.action,
      caseId: params.caseId,
      timestamp: new Date().toISOString(),
      sanitizedMessage: sanitized,
      appVersion: buildInfo.version,
      environment: getAppEnvironment()
    };

    this.memoryEntries.unshift(entry);
    if (this.memoryEntries.length > MAX_TELEMETRY_ENTRIES) {
      this.memoryEntries = this.memoryEntries.slice(0, MAX_TELEMETRY_ENTRIES);
    }

    this.saveToStorage();
    return entry;
  }

  public getTelemetryEntries(): PrivacyErrorTelemetryEntry[] {
    return [...this.memoryEntries];
  }

  public clearTelemetry(): void {
    this.memoryEntries = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TELEMETRY_STORAGE_KEY);
    }
  }
}

export const errorTelemetry = new ErrorTelemetryService();
