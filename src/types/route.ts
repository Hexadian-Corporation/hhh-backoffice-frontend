export interface RouteStop {
  location_id: string;
  location_name: string;
  action: 'pickup' | 'delivery';
  contract_id: string;
  cargo_name: string;
  cargo_scu: number;
}

export interface RouteLeg {
  from_location_id: string;
  to_location_id: string;
  distance: number;         // meters
  travel_time_seconds: number;
  travel_type: 'quantum' | 'scm';
}

export interface Route {
  id: string;
  stops: RouteStop[];
  legs: RouteLeg[];
  total_distance: number;
  total_time_seconds: number;
  contracts_fulfilled: number;
  stale?: boolean;
  stale_reason?: string | null;
  stale_since?: string | null;
}

export interface RouteCreate {
  flight_plan_id: string;
  strategy: 'min_time' | 'min_distance';
  stops: RouteStop[];
  legs: RouteLeg[];
  total_distance: number;
  total_time_seconds: number;
  contracts_fulfilled: number;
}
