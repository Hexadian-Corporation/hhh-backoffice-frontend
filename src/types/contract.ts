export interface HaulingOrder {
  cargo_name: string;
  cargo_quantity_scu: number;
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
  title: string;
  description: string;
  contractor_name: string;
  contractor_logo_url: string;
  hauling_orders: HaulingOrder[];
  reward_aUEC: number;
  collateral_aUEC: number;
  deadline_minutes: number;
  max_acceptances: number;
  requirements: Requirements;
  status: 'draft' | 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export type ContractCreate = Omit<Contract, 'id' | 'created_at' | 'updated_at'>;
export type ContractUpdate = Partial<ContractCreate>;
