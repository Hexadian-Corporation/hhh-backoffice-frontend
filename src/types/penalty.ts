export interface BoxSizePenalty {
  box_size_scu: number;     // 0.125, 1, 2, 4, 8, 16, 24, 32
  multiplier: number;        // e.g., 1.0 = no penalty, 1.5 = 50% slower
}

export interface ShipPenalty {
  ship_id: string;
  multiplier: number;
}

export interface PenaltyConfig {
  id: string;
  time_base_per_scu: number;          // seconds per SCU base
  box_size_penalties: BoxSizePenalty[];
  ship_penalties: ShipPenalty[];
}

export type PenaltyConfigUpdate = Omit<PenaltyConfig, 'id'>;
