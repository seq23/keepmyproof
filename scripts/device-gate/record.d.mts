export interface DeviceGateRecord {
  version: string; device: string; run: string; commit?: string;
  checks: Record<string, boolean>; evidence: Record<string, string>;
  purchase?: { build: string; date: string; tappedBy: string; restored: boolean; how: string };
}
export declare function record(result: unknown, o: { run: string; version: string | undefined; seen?: string }): DeviceGateRecord;
export declare function recordPurchase(existing: DeviceGateRecord | null, o: { build?: string; date?: string; by?: string; restored?: boolean; version: string | undefined; now?: number }): DeviceGateRecord & { purchase: NonNullable<DeviceGateRecord['purchase']> };
