
// FIX: Removed self-import of UserRole which was causing a conflict with the local declaration.
export enum UserRole {
  ADMIN = 'admin',
  CAPTAIN = 'captain'
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  name: string;
}

export enum TableStatus {
  AVAILABLE = 'Available',
  RUNNING = 'Running',
  BILLING = 'Billing',
  CLOSED = 'Closed'
}

export enum TableCategory {
  DINE_IN = 'Dine-in',
  TERRACE = 'Terrace',
  BANQUET = 'Banquet',
  GAZEBO = 'Gazebo',
  PARCEL = 'Parcel'
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface KOTItem extends MenuItem {
  quantity: number;
  notes?: string;
}

export interface KOT {
  id: string;
  createdAt: Date;
  items: KOTItem[];
}

export interface Table {
  id: string;
  name: string;
  category: TableCategory;
  status: TableStatus;
  orderStartTime?: Date;
  kots: KOT[];
  currentBill: number;
  captainId?: string;
  captainName?: string;
}

export enum OnlineOrderStatus {
  NEW = 'New',
  ACCEPTED = 'Accepted',
  PREPARING = 'Preparing',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  COMPLETED = 'Completed'
}

export interface OnlineOrder {
  id: string;
  platform: 'Zomato' | 'Swiggy';
  items: { name: string; quantity: number }[];
  total: number;
  status: OnlineOrderStatus;
  timestamp: Date;
}

export interface Sale {
  id: string;
  tableId: string;
  tableName: string;
  captainId?: string;
  captainName?: string;
  amount: number;
  paymentMode: string;
  items: KOTItem[];
  settledAt: Date;
}