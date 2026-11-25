export declare const FOLDERS: string[];
export declare function fetchSourceText(url: string): Promise<string>;
export declare function notThePage(code: number, body: Buffer): string | null;
export declare function readFactsFiles(folders?: string[]): { folder: string; file: string; data: any }[];
export declare function verifyFacts(files: { folder: string; file: string; data: any }[], opts?: { fetchText?: (url: string) => Promise<string>; today?: string; previous?: Record<string, any>; keepOnFetchError?: boolean; concurrency?: number }): Promise<Record<string, { facts: Record<string, string>; stops: string[]; pages: number; checked: number }>>;
