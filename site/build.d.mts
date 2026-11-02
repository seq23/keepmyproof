export interface SitePage {
  path: string; file: string; group: string; index: boolean; external?: boolean;
  alt: Record<string, string> | null;
  state?: { folder: string; subtopic: string; code: string; lang: string; facts: number };
}
export interface SiteInput { facts: Record<string, any[]>; verified: Record<string, Record<string, string>>; translations?: Record<string, any>; toolFacts?: any[] }
export declare function render(input?: SiteInput): Record<string, string>;
export declare function renderAll(input?: SiteInput): { files: Record<string, string>; pages: SitePage[]; stops: string[]; model: Record<string, any[]> };
export declare function build(dist: string): { files: number; pages: SitePage[]; stops: string[] };
export declare function legalSections(markdown: string): { privacy: string[]; terms: string[] };
export declare function quotableAnswer(claims: string[], tails: string[], lang?: string): string | null;
export declare function questionGate(html: string): string[];
