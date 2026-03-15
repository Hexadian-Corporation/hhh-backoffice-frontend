export interface Commodity {
  id: string;
  name: string;
  code: string;
}

export type CommodityCreate = Omit<Commodity, 'id'>;
export type CommodityUpdate = Partial<CommodityCreate>;
