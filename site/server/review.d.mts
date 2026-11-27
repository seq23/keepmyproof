export declare const RC: string;
export declare const LIMITS: { perIpDaily: number; perNet48Daily: number; globalWarnDaily: number; globalDaily: number; burstPerMinute: number; newSlotsPerIpDaily: number; maxDevices: number };
export declare function ipPrefix(ip: string, bits?: number): string;
export declare function reviewOpen(env: Record<string, any>, now: number): boolean;
export declare function reviewStatus(env: Record<string, any>, now?: number): Promise<Response>;
export declare function reviewUnlock(request: Request, env: Record<string, any>, opts?: { now?: number; fetcher?: typeof fetch; waitUntil?: (p: Promise<unknown>) => unknown }): Promise<Response>;
