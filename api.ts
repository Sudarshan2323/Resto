export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue }
export interface JsonArray extends Array<JsonValue> {}

const BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  // Menu
  getMenu: () => request('/menu'),
  // Tables
  getTables: () => request('/tables'),
  updateTable: (tableId: string, updated: any) =>
    request(`/tables/${tableId}`, { method: 'PUT', body: JSON.stringify(updated) }),
  addKot: (tableId: string, items: any[], captain: any) =>
    request(`/tables/${tableId}/kot`, { method: 'POST', body: JSON.stringify({ items, captain }) }),
  moveTable: (fromId: string, toId: string) =>
    request(`/tables/${fromId}/move/${toId}`, { method: 'POST' }),
  settleBill: (tableId: string, paymentMode: string) =>
    request(`/tables/${tableId}/settle`, { method: 'POST', body: JSON.stringify({ paymentMode }) }),
  // Online Orders
  getOnlineOrders: () => request('/online-orders'),
  updateOnlineOrder: (id: string, status: string) =>
    request(`/online-orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  // Sales
  getSales: () => request('/sales'),
};
