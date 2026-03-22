export interface Commodity {
  id: string;
  name: string;
  code: string;
  category?: string;
  price_buy?: number;
  price_sell?: number;
}

export type CommodityCreate = Omit<Commodity, 'id'>;
export type CommodityUpdate = Partial<CommodityCreate>;
