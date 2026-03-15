export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface Location {
  id: string;
  name: string;
  location_type: string; // system | planet | moon | station | city | outpost
  parent_id: string | null;
  coordinates: Coordinates;
  has_trade_terminal: boolean;
  has_landing_pad: boolean;
  landing_pad_size: string | null; // small | medium | large | extra_large
}

export type LocationCreate = Omit<Location, 'id'>;
export type LocationUpdate = Partial<LocationCreate>;
