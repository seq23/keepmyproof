export declare const DEVICE_CHECKS: string[];
export declare const LIST_LIFETIME_USD: number;
export declare const LEGAL_URLS: string[];
export declare function stops(input: {
  env: Record<string, string | undefined>; version: string; readJson: (path: string) => any;
  probe: (url: string) => Promise<number>; now?: number;
}): Promise<{ code: string; why: string }[]>;
