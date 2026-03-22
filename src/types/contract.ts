export interface HaulingOrder {
  commodity_id: string;
  scu_min: number;
  scu_max: number;
  max_container_scu: number;
  pickup_location_id: string;
  delivery_location_id: string;
}

export interface Requirements {
  min_reputation: number; // 0–5
  required_ship_tags: string[];
  max_crew_size: number | null;
}

export interface Contract {
  id: string;
  source?: 'game' | 'admin' | 'user';
  title: string;
  description: string;
  faction: string;
  hauling_orders: HaulingOrder[];
  reward_uec: number;
  collateral_uec: number;
  deadline: string; // ISO 8601 datetime
  requirements: Requirements;
  status: 'draft' | 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export type ContractCreate = Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'source'>;
export type ContractUpdate = Partial<ContractCreate>;
