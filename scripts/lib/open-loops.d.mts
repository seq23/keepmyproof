export declare const INTAKE: string;
type Stop = { code: string; why?: string };
type Opts = { repo: string; business: string; finish: string; known: string[]; stops: Stop[]; words?: Record<string, { title?: string; next_step?: string; owner?: string }> };
export declare function intakePosts(opts: Opts): Array<Record<string, unknown>>;
export declare function reportToOpenLoops(opts: Opts, deps?: { token?: string; fetchImpl?: typeof fetch; log?: (s: string) => void }): Promise<{ sent: number; failed: number; skipped: number }>;
