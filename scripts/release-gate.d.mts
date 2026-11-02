export declare const DEVICE_CHECKS: string[];
export declare const LIST_LIFETIME_USD: number;
export declare const LEGAL_URLS: string[];
export declare const SUPPORT_DOMAIN: string;
export declare function stops(input: {
  env: Record<string, string | undefined>; version: string; readJson: (path: string) => any;
  probe: (url: string) => Promise<number>; supportEmail?: string; mx: (domain: string) => Promise<number>; now?: number;
}): Promise<{ code: string; why: string }[]>;
export declare const STOP_WORDS: Record<string, { title: string; next_step: string }>;
export declare const OPEN_LOOPS: { repo: string; business: string; finish: string };
export declare function knownHere(eas: boolean): string[];
