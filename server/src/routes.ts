import { Router } from 'express';
import { readDb, writeDb } from './db';
import { v4 as uuid } from 'uuid';
import {
  KOTItem,
  OnlineOrderStatus,
  Table,
  TableStatus,
  Sale,
  User,
} from './types';

export const api = Router();

api.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Auth
api.post('/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const db = await readDb();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _p, ...safeUser } = user;
  res.json(safeUser);
});

// Users (admin can manage captains later)
api.get('/users', async (_req, res) => {
  const db = await readDb();
  res.json(db.users.map(({ password, ...rest }) => rest));
});

// Menu
api.get('/menu', async (_req, res) => {
  const db = await readDb();
  res.json(db.menu);
});

// Tables
api.get('/tables', async (_req, res) => {
  const db = await readDb();
  res.json(db.tables);
});

api.put('/tables/:id', async (req, res) => {
  const tableId = req.params.id;
  const updated: Table = req.body;
  const db = await readDb();
  const idx = db.tables.findIndex(t => t.id === tableId);
  if (idx === -1) return res.status(404).json({ error: 'Table not found' });
  db.tables[idx] = updated;
  await writeDb(db);
  res.json(db.tables[idx]);
});

api.post('/tables/:id/kot', async (req, res) => {
  const tableId = req.params.id;
  const items: KOTItem[] = req.body?.items ?? [];
  const captain: User | undefined = req.body?.captain;
  const db = await readDb();
  const table = db.tables.find(t => t.id === tableId);
  if (!table) return res.status(404).json({ error: 'Table not found' });
  const kotId = `kot-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const kot = { id: kotId, createdAt, items };
  const kotTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  table.kots.push(kot as any);
  table.currentBill += kotTotal;
  table.status = 'Running';
  table.orderStartTime = table.orderStartTime ?? createdAt;
  if (captain) {
    table.captainId = captain.id;
    table.captainName = captain.name;
  }
  await writeDb(db);
  res.json(table);
});

api.post('/tables/:from/move/:to', async (req, res) => {
  const { from, to } = req.params;
  const db = await readDb();
  const fromTable = db.tables.find(t => t.id === from);
  const toTable = db.tables.find(t => t.id === to);
  if (!fromTable || !toTable) return res.status(404).json({ error: 'Table not found' });
  if (toTable.status !== 'Available') return res.status(400).json({ error: 'Destination occupied' });
  const fromData = { ...fromTable };
  // reset from
  fromTable.status = 'Available';
  fromTable.orderStartTime = undefined;
  fromTable.kots = [] as any;
  fromTable.currentBill = 0;
  fromTable.captainId = undefined;
  fromTable.captainName = undefined;
  // move into to
  toTable.status = fromData.status;
  toTable.orderStartTime = fromData.orderStartTime;
  toTable.kots = fromData.kots;
  toTable.currentBill = fromData.currentBill;
  toTable.captainId = fromData.captainId;
  toTable.captainName = fromData.captainName;
  await writeDb(db);
  res.json({ ok: true });
});

api.post('/tables/:id/settle', async (req, res) => {
  const tableId = req.params.id;
  const paymentMode: string = req.body?.paymentMode ?? 'Cash';
  const db = await readDb();
  const table = db.tables.find(t => t.id === tableId);
  if (!table) return res.status(404).json({ error: 'Table not found' });
  const sale: Sale = {
    id: `sale-${Date.now()}`,
    tableId: table.id,
    tableName: table.name,
    captainId: table.captainId,
    captainName: table.captainName,
    amount: table.currentBill,
    paymentMode,
    items: table.kots.flatMap(k => k.items) as any,
    settledAt: new Date().toISOString(),
  };
  db.sales.push(sale);
  // reset table
  table.status = 'Available';
  table.orderStartTime = undefined;
  table.kots = [] as any;
  table.currentBill = 0;
  table.captainId = undefined;
  table.captainName = undefined;
  await writeDb(db);
  res.json(sale);
});

// Online orders
api.get('/online-orders', async (_req, res) => {
  const db = await readDb();
  res.json(db.onlineOrders);
});

api.patch('/online-orders/:id', async (req, res) => {
  const id = req.params.id;
  const status: OnlineOrderStatus | undefined = req.body?.status;
  const db = await readDb();
  const idx = db.onlineOrders.findIndex(o => o.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  if (!status) return res.status(400).json({ error: 'Missing status' });
  db.onlineOrders[idx].status = status;
  await writeDb(db);
  res.json(db.onlineOrders[idx]);
});

// Sales
api.get('/sales', async (_req, res) => {
  const db = await readDb();
  res.json(db.sales);
});
