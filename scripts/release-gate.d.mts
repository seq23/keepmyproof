export declare const DEVICE_CHECKS: string[];
export declare const PURCHASE_CHECK: string;
export declare const SIMULATOR_CHECKS: string[];
export interface PurchaseRecord { build?: unknown; date?: unknown; tappedBy?: unknown; restored?: unknown; how?: string }
export declare function purchaseProblems(purchase: unknown, opts?: { build?: string; now?: number }): string[];
export declare const LIST_LIFETIME_USD: number;
export declare const LEGAL_URLS: string[];
export declare const SUPPORT_DOMAIN: string;
export declare function stops(input: {
  env: Record<string, string | undefined>; version: string; readJson: (path: string) => any;
  probe: (url: string) => Promise<number>; supportEmail?: string; mx: (domain: string) => Promise<number>; now?: number; readText?: (file: string) => string;
  stage?: 'upload' | 'submit' | string; build?: string;
}): Promise<{ code: string; why: string }[]>;
export declare const STOP_WORDS: Record<string, { title: string; next_step: string }>;
export declare const OPEN_LOOPS: { repo: string; business: string; finish: string };
export declare function knownHere(eas: boolean, stage?: 'upload' | 'submit'): string[];
export declare const BETA_PROFILES: Record<string, 'ios' | 'android'>;
export declare function gateFor(input: { profile?: string; platform?: string; eas: unknown }): 'full' | 'tester' | 'none';
export declare function betaStops(input: { env: Record<string, string | undefined>; platform?: 'ios' | 'android' }): { code: string; why: string }[];
export declare const PHONE_WORDS: RegExp;
export declare const ANDROID_ONLY_KEYS: string[];
export declare const IOS_STORE_FILES: string[];
export declare function phoneWording(stringsSource: string, storeFiles?: Record<string, string>): string[];
export declare function gateDeps(): { version: string; readJson: (path: string) => any; probe: (url: string) => Promise<number>; mx: (domain: string) => Promise<number>; supportEmail: string };
