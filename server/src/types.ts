import { z } from 'zod';

export const UserRoleEnum = z.enum(['admin', 'captain']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().optional(),
  role: UserRoleEnum,
  name: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const TableStatusEnum = z.enum(['Available', 'Running', 'Billing', 'Closed']);
export type TableStatus = z.infer<typeof TableStatusEnum>;

export const TableCategoryEnum = z.enum(['Dine-in', 'Terrace', 'Banquet', 'Gazebo', 'Parcel']);
export type TableCategory = z.infer<typeof TableCategoryEnum>;

export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

export const KOTItemSchema = MenuItemSchema.extend({
  quantity: z.number(),
  notes: z.string().optional(),
});
export type KOTItem = z.infer<typeof KOTItemSchema>;

export const KOTSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  items: z.array(KOTItemSchema),
});
export type KOT = z.infer<typeof KOTSchema>;

export const TableSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: TableCategoryEnum,
  status: TableStatusEnum,
  orderStartTime: z.string().optional(),
  kots: z.array(KOTSchema),
  currentBill: z.number(),
  captainId: z.string().optional(),
  captainName: z.string().optional(),
});
export type Table = z.infer<typeof TableSchema>;

export const OnlineOrderStatusEnum = z.enum(['New', 'Accepted', 'Preparing', 'Out for Delivery', 'Completed']);
export type OnlineOrderStatus = z.infer<typeof OnlineOrderStatusEnum>;

export const OnlineOrderSchema = z.object({
  id: z.string(),
  platform: z.enum(['Zomato', 'Swiggy']),
  items: z.array(z.object({ name: z.string(), quantity: z.number() })),
  total: z.number(),
  status: OnlineOrderStatusEnum,
  timestamp: z.string(),
});
export type OnlineOrder = z.infer<typeof OnlineOrderSchema>;

export const SaleSchema = z.object({
  id: z.string(),
  tableId: z.string(),
  tableName: z.string(),
  captainId: z.string().optional(),
  captainName: z.string().optional(),
  amount: z.number(),
  paymentMode: z.string(),
  items: z.array(KOTItemSchema),
  settledAt: z.string(),
});
export type Sale = z.infer<typeof SaleSchema>;

export type Database = {
  users: User[];
  tables: Table[];
  menu: MenuItem[];
  onlineOrders: OnlineOrder[];
  sales: Sale[];
};
