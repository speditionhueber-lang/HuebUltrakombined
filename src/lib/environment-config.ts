export type AppEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface AppBuildInfo {
  version: string;
  buildId: string;
  builtAt: string;
  environment: AppEnvironment;
}

export interface ProductionSafetyConfig {
  externalEmailEnabled: boolean;
  allowedTestRecipients: string[];
  automationExecutionEnabled: boolean;
  invoiceSendingEnabled: boolean;
  paymentReminderSendingEnabled: boolean;
  destructiveActionsEnabled: boolean;
}

// Default Safety Configuration for Development, Test, and Staging
const DEFAULT_SAFETY_CONFIG: ProductionSafetyConfig = {
  externalEmailEnabled: false,
  allowedTestRecipients: [
    'officespeditionhueber@gmail.com',
    'test@spedition-hueber.de',
    'pilot@spedition-hueber.de',
    'erika@muster.com',
    'max@example.com'
  ],
  automationExecutionEnabled: false,
  invoiceSendingEnabled: false,
  paymentReminderSendingEnabled: false,
  destructiveActionsEnabled: false
};

let currentEnvironment: AppEnvironment = (import.meta as any).env?.VITE_APP_ENV as AppEnvironment || 'staging';
let currentSafetyConfig: ProductionSafetyConfig = { ...DEFAULT_SAFETY_CONFIG };

export function getAppEnvironment(): AppEnvironment {
  return currentEnvironment;
}

export function setAppEnvironment(env: AppEnvironment): void {
  currentEnvironment = env;
}

export function isStaging(): boolean {
  return currentEnvironment === 'staging';
}

export function isProduction(): boolean {
  return currentEnvironment === 'production';
}

export function isTest(): boolean {
  return currentEnvironment === 'test';
}

export function isDevelopment(): boolean {
  return currentEnvironment === 'development';
}

export function getBuildInfo(): AppBuildInfo {
  return {
    version: '1.0.0-staging',
    buildId: 'BUILD-2026-08-04-01',
    builtAt: '2026-08-04T00:00:00.000Z',
    environment: currentEnvironment
  };
}

export function getProductionSafetyConfig(): ProductionSafetyConfig {
  return { ...currentSafetyConfig };
}

export function updateProductionSafetyConfig(config: Partial<ProductionSafetyConfig>): void {
  currentSafetyConfig = {
    ...currentSafetyConfig,
    ...config
  };
}

export function resetProductionSafetyConfig(): void {
  currentSafetyConfig = { ...DEFAULT_SAFETY_CONFIG };
}

export function isEmailRecipientAllowed(recipientEmail: string): boolean {
  if (!recipientEmail) return false;
  const normalized = recipientEmail.toLowerCase().trim();
  
  if (currentEnvironment === 'production') {
    return currentSafetyConfig.externalEmailEnabled;
  }
  
  // In dev/test/staging, only allow strictly listed test recipients
  return currentSafetyConfig.allowedTestRecipients.some(
    allowed => allowed.toLowerCase().trim() === normalized
  );
}

export function canSendExternalEmail(recipientEmail: string): boolean {
  if (!isEmailRecipientAllowed(recipientEmail)) {
    return false;
  }
  if (currentEnvironment === 'production') {
    return currentSafetyConfig.externalEmailEnabled;
  }
  return true; // Allowed test recipient in non-prod
}

export function canExecuteDestructiveAction(): boolean {
  if (currentEnvironment === 'production') {
    return currentSafetyConfig.destructiveActionsEnabled;
  }
  return currentSafetyConfig.destructiveActionsEnabled;
}

export function canSendInvoice(): boolean {
  if (currentEnvironment === 'production') {
    return currentSafetyConfig.invoiceSendingEnabled;
  }
  return currentSafetyConfig.invoiceSendingEnabled;
}

export function canSendPaymentReminder(): boolean {
  if (currentEnvironment === 'production') {
    return currentSafetyConfig.paymentReminderSendingEnabled;
  }
  return currentSafetyConfig.paymentReminderSendingEnabled;
}
