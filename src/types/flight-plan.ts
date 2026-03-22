import type { Route } from './route';

export interface FlightPlan {
  id: string;
  contract_ids: string[];
  ship_id: string;
  cargo_limit_scu: number | null;
  distance_graph_id: string;
  distance_route: Route | null;
  time_route: Route | null;
}

export interface FlightPlanCreate {
  contract_ids: string[];
  ship_id: string;
  cargo_limit_scu?: number | null;
}

export interface PrecomputedData {
  flight_plan_id: string;
  ship_total_scu: number;
  cargo_limit_scu: number | null;
  distance_graph_id: string;
  distance_edges: Record<string, unknown>[];
  time_edges: Record<string, unknown>[];
  hauling_orders: Record<string, unknown>[];
  locations: Record<string, unknown>[];
}

export interface FlightPlanCreateResponse {
  flight_plan: FlightPlan;
  precomputed: PrecomputedData;
}
