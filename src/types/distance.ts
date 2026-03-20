export interface LocationDistance {
  id: string;
  from_location_id: string;
  to_location_id: string;
  distance: number;       // meters
  travel_type: string;    // "quantum" | "scm" | "on_foot"
}

export interface DistanceCreate {
  from_location_id: string;
  to_location_id: string;
  distance: number;
  travel_type: string;
}
