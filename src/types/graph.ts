export interface Node {
  location_id: string;
  label: string;
}

export interface Edge {
  source_id: string;
  target_id: string;
  distance: number;
  travel_type: string;
  travel_time_seconds: number;
}

export interface Graph {
  id: string;
  name: string;
  hash: string;
  nodes: Node[];
  edges: Edge[];
}
