import { UserRole, Table, TableStatus, TableCategory, MenuItem, OnlineOrder, OnlineOrderStatus, User } from '../types';

export const INITIAL_USERS: User[] = [
  { id: '1', email: 'admin@resto.com', password: '12345', role: UserRole.ADMIN, name: 'Admin User' },
  { id: '2', email: 'sub@resto.com', password: '23456', role: UserRole.CAPTAIN, name: 'Captain Jack' },
];

const generateTables = (prefix: string, count: number, category: TableCategory): Table[] => {
  const tables: Table[] = [];
  for (let i = 1; i <= count; i++) {
    tables.push({
      id: `${prefix.toLowerCase()}${i}`,
      name: `${prefix}${i}`,
      category,
      status: TableStatus.AVAILABLE,
      kots: [],
      currentBill: 0,
    });
  }
  return tables;
};

const terraceTables = generateTables('T', 10, TableCategory.TERRACE);
const gazeboTables = generateTables('G', 5, TableCategory.GAZEBO);
const banquetTables = generateTables('B', 6, TableCategory.BANQUET);
const dineInTables = generateTables('D', 9, TableCategory.DINE_IN);
const parcelTables = generateTables('P', 5, TableCategory.PARCEL);

const allTables: Table[] = [
  ...dineInTables,
  ...terraceTables,
  ...gazeboTables,
  ...banquetTables,
  ...parcelTables,
];

export const INITIAL_TABLES: Table[] = allTables;

export const INITIAL_MENU: MenuItem[] = [
  { id: 'm1', name: 'Paneer Tikka', price: 250, category: 'Starters' },
  { id: 'm1a', name: 'Chicken 65', price: 320, category: 'Starters' },
  { id: 'm2', name: 'Dal Makhani', price: 300, category: 'Main Course' },
  { id: 'm2a', name: 'Butter Chicken', price: 450, category: 'Main Course' },
  { id: 'm3', name: 'Garlic Naan', price: 70, category: 'Main Course' },
  { id: 'm4', name: 'Brownie', price: 150, category: 'Desserts' },
  { id: 'm4a', name: 'Gulab Jamun', price: 120, category: 'Desserts' },
  { id: 'm5', name: 'Coke', price: 60, category: 'Beverages' },
  { id: 'm5a', name: 'Fresh Lime Soda', price: 80, category: 'Beverages' },
];

export const INITIAL_ONLINE_ORDERS: OnlineOrder[] = [];