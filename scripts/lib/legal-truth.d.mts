type Lang = 'en' | 'es' | 'zh' | 'ko';
export declare const ACCESS_CODE: Record<Lang, { androidOnly: RegExp; iosNone: RegExp; reviewers: RegExp }>;
export declare function accessCodeProblems(lang: string, text: string | null | undefined): string[];
export declare const LIVE_PRIVACY: Array<[string, Lang]>;
type Got = { status: number; error?: string; text?: () => Promise<string> };
export declare function livePrivacyProblems(get: (path: string) => Promise<Got>, pages?: Array<[string, Lang]>): Promise<string[]>;
