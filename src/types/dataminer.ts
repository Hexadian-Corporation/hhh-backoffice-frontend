export interface SyncResult {
  entity: string;
  count: number;
}

export interface SyncResponse {
  results: SyncResult[];
}

export interface SourceInfo {
  name: string;
  available: boolean;
}

export interface SourcesResponse {
  sources: SourceInfo[];
}
