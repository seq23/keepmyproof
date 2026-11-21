export type PageDate = { published: string; modified: string; hash: string };
export declare const PUB: string, MOD: string;
export declare const pubOn: (lang: string) => string, modOn: (lang: string) => string;
export declare const todayCentral: (now?: Date) => string;
export declare const contentHash: (html: string) => string;
export declare function stampDates(files: Record<string, string>, opts: { ledger?: Record<string, PageDate>; today?: string; format: (lang: string, iso: string) => string }): { ledger: Record<string, PageDate>; changed: boolean };
