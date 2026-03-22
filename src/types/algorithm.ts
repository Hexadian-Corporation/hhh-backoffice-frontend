export interface AlgorithmEntry {
  algorithm: string; // dijkstra | astar | aco | ford_fulkerson
  enabled: boolean;
  complexity_min: number;
  complexity_max: number | null;
}

export interface AlgorithmConfig {
  id: string;
  entries: AlgorithmEntry[];
}

export interface AlgorithmConfigUpdate {
  entries: AlgorithmEntry[];
}
