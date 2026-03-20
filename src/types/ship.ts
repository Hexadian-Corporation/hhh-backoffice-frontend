export interface CargoHold {
  name: string;
  volume_scu: number;
}

export interface Ship {
  id: string;
  name: string;
  manufacturer: string;
  cargo_holds: CargoHold[];
  total_scu: number;
  scm_speed: number;
  quantum_speed: number;
  landing_time_seconds: number;
  loading_time_per_scu_seconds: number;
}

export type ShipCreate = Omit<Ship, 'id'>;
export type ShipUpdate = Partial<ShipCreate>;
