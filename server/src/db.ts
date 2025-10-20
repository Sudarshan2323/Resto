import fs from 'fs/promises';
import path from 'path';
import { Database, Table, OnlineOrder, Sale, User, MenuItem } from './types';

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readDb(): Promise<Database> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(raw) as Database;
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      const initial = getInitialDb();
      await writeDb(initial);
      return initial;
    }
    throw e;
  }
}

export async function writeDb(db: Database): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function getInitialDb(): Database {
  return {
    users: [
      { id: '1', email: 'admin@resto.com', password: '12345', role: 'admin', name: 'Admin User' },
      { id: '2', email: 'sub@resto.com', password: '23456', role: 'captain', name: 'Captain Jack' },
    ],
    tables: generateInitialTables(),
    menu: [
      { id: 'm1', name: 'Paneer Tikka', price: 250, category: 'Starters' },
      { id: 'm1a', name: 'Chicken 65', price: 320, category: 'Starters' },
      { id: 'm2', name: 'Dal Makhani', price: 300, category: 'Main Course' },
      { id: 'm2a', name: 'Butter Chicken', price: 450, category: 'Main Course' },
      { id: 'm3', name: 'Garlic Naan', price: 70, category: 'Main Course' },
      { id: 'm4', name: 'Brownie', price: 150, category: 'Desserts' },
      { id: 'm4a', name: 'Gulab Jamun', price: 120, category: 'Desserts' },
      { id: 'm5', name: 'Coke', price: 60, category: 'Beverages' },
      { id: 'm5a', name: 'Fresh Lime Soda', price: 80, category: 'Beverages' },
    ],
    onlineOrders: [],
    sales: [],
  };
}

function generateTables(prefix: string, count: number, category: string) {
  const tables: Table[] = [] as any;
  for (let i = 1; i <= count; i++) {
    tables.push({
      id: `${prefix.toLowerCase()}${i}`,
      name: `${prefix}${i}`,
      category: category as any,
      status: 'Available',
      kots: [],
      currentBill: 0,
    } as Table);
  }
  return tables;
}

function generateInitialTables(): Table[] {
  return [
    ...generateTables('D', 9, 'Dine-in'),
    ...generateTables('T', 10, 'Terrace'),
    ...generateTables('G', 5, 'Gazebo'),
    ...generateTables('B', 6, 'Banquet'),
    ...generateTables('P', 5, 'Parcel'),
  ];
}
