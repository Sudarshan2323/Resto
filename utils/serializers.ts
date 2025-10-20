import { KOT, KOTItem, OnlineOrder, Sale, Table } from '../types';

export function toClientTable(raw: any): Table {
  return {
    ...raw,
    orderStartTime: raw.orderStartTime ? new Date(raw.orderStartTime) : undefined,
    kots: Array.isArray(raw.kots) ? raw.kots.map(toClientKOT) : [],
  } as Table;
}

export function toClientKOT(raw: any): KOT {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    items: Array.isArray(raw.items) ? raw.items.map((i: any) => ({ ...i })) as KOTItem[] : [],
  } as KOT;
}

export function toClientOnlineOrder(raw: any): OnlineOrder {
  return { ...raw, timestamp: new Date(raw.timestamp) } as OnlineOrder;
}

export function toClientSale(raw: any): Sale {
  return { ...raw, settledAt: new Date(raw.settledAt) } as Sale;
}

export function toServerTable(table: Table): any {
  return {
    ...table,
    orderStartTime: table.orderStartTime ? table.orderStartTime.toISOString() : undefined,
    kots: table.kots.map(k => ({
      ...k,
      createdAt: (k.createdAt as Date).toISOString(),
    })),
  };
}
