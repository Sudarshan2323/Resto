import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  getCountFromServer,
} from 'firebase/firestore';
import { firestoreDb, firebaseConfigured } from './firebase';
import {
  Table,
  OnlineOrder,
  KOTItem,
  KOT,
  TableStatus,
  OnlineOrderStatus,
  User,
  Sale,
} from '../types';
import { INITIAL_ONLINE_ORDERS, INITIAL_TABLES, INITIAL_USERS } from './mockData';

if (!firebaseConfigured || !firestoreDb) {
  throw new Error('Firebase is not configured, but firebaseDb was imported.');
}

// ---------- Type mappers (Dates as ISO strings in Firestore) ----------
const toIso = (d?: Date) => (d ? d.toISOString() : undefined);
const fromIso = (s?: any): Date | undefined => (typeof s === 'string' ? new Date(s) : undefined);

function mapKotToFirestore(kot: KOT) {
  return {
    id: kot.id,
    createdAt: toIso(kot.createdAt),
    items: kot.items.map((i) => ({ ...i } as KOTItem)),
  };
}
function mapKotFromFirestore(data: any): KOT {
  return {
    id: data.id,
    createdAt: new Date(data.createdAt),
    items: (data.items || []) as KOTItem[],
  };
}

function mapTableToFirestore(table: Table) {
  return {
    id: table.id,
    name: table.name,
    category: table.category,
    status: table.status,
    orderStartTime: toIso(table.orderStartTime),
    kots: (table.kots || []).map(mapKotToFirestore),
    currentBill: table.currentBill,
    captainId: table.captainId ?? null,
    captainName: table.captainName ?? null,
  };
}
function mapTableFromFirestore(data: any): Table {
  return {
    id: data.id,
    name: data.name,
    category: data.category,
    status: data.status,
    orderStartTime: fromIso(data.orderStartTime),
    kots: (data.kots || []).map(mapKotFromFirestore),
    currentBill: data.currentBill || 0,
    captainId: data.captainId || undefined,
    captainName: data.captainName || undefined,
  } as Table;
}

function mapOnlineOrderToFirestore(order: OnlineOrder) {
  return {
    id: order.id,
    platform: order.platform,
    items: order.items,
    total: order.total,
    status: order.status,
    timestamp: toIso(order.timestamp),
  };
}
function mapOnlineOrderFromFirestore(data: any): OnlineOrder {
  return {
    id: data.id,
    platform: data.platform,
    items: data.items || [],
    total: data.total || 0,
    status: data.status,
    timestamp: new Date(data.timestamp),
  } as OnlineOrder;
}

function mapSaleToFirestore(sale: Sale) {
  return {
    id: sale.id,
    tableId: sale.tableId,
    tableName: sale.tableName,
    captainId: sale.captainId ?? null,
    captainName: sale.captainName ?? null,
    amount: sale.amount,
    paymentMode: sale.paymentMode,
    items: sale.items,
    settledAt: toIso(sale.settledAt),
  };
}
function mapSaleFromFirestore(data: any): Sale {
  return {
    id: data.id,
    tableId: data.tableId,
    tableName: data.tableName,
    captainId: data.captainId || undefined,
    captainName: data.captainName || undefined,
    amount: data.amount || 0,
    paymentMode: data.paymentMode,
    items: data.items || [],
    settledAt: new Date(data.settledAt),
  } as Sale;
}

// ---------- Firestore-backed observable stores ----------

type Listener<T> = (data: T[]) => void;

class FirestoreStore<T> {
  private listeners: Set<Listener<T>> = new Set();
  private data: T[] = [];
  private readonly collectionName: string;
  private readonly fromData: (d: any) => T;
  private unsubscribeSnapshot: (() => void) | null = null;

  constructor(collectionName: string, fromData: (d: any) => T) {
    this.collectionName = collectionName;
    this.fromData = fromData;
    this.startSnapshot();
  }

  private startSnapshot() {
    const collRef = collection(firestoreDb!, this.collectionName);
    this.unsubscribeSnapshot = onSnapshot(collRef, (snap) => {
      this.data = snap.docs.map((d) => this.fromData({ id: d.id, ...d.data() }));
      this.notify();
    });
  }

  private notify() {
    for (const l of this.listeners) l(this.data);
  }

  subscribe(listener: Listener<T>) {
    this.listeners.add(listener);
    listener(this.data);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.data;
  }

  // Included for compatibility with local store API; performs full replace writes.
  async setState(_newData: T[] | ((prev: T[]) => T[])) {
    // Not used in current app codepaths when using Firestore.
    return;
  }
}

export const userStore = new FirestoreStore<User>('users', (d) => ({
  id: d.id,
  email: d.email,
  password: d.password,
  role: d.role,
  name: d.name,
} as User));

export const tableStore = new FirestoreStore<Table>('tables', mapTableFromFirestore);
export const onlineOrderStore = new FirestoreStore<OnlineOrder>('onlineOrders', mapOnlineOrderFromFirestore);
export const salesStore = new FirestoreStore<Sale>('sales', mapSaleFromFirestore);

// ---------- Domain operations using transactions ----------

export const db = {
  addKotToTable: async (tableId: string, kotItems: KOTItem[], captain: User) => {
    const tableRef = doc(firestoreDb!, 'tables', tableId);
    await runTransaction(firestoreDb!, async (tx) => {
      const tableSnap = await tx.get(tableRef);
      if (!tableSnap.exists()) throw new Error('Table not found');
      const table = mapTableFromFirestore({ id: tableSnap.id, ...tableSnap.data() });
      const newKot: KOT = { id: `kot-${Date.now()}`, createdAt: new Date(), items: kotItems };
      const kotTotal = kotItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const updated: Table = {
        ...table,
        status: TableStatus.RUNNING,
        orderStartTime: table.orderStartTime || new Date(),
        kots: [...table.kots, newKot],
        currentBill: (table.currentBill || 0) + kotTotal,
        captainId: captain.id,
        captainName: captain.name,
      };
      tx.set(tableRef, mapTableToFirestore(updated));
    });
  },

  updateTable: async (updatedTable: Table) => {
    const tableRef = doc(firestoreDb!, 'tables', updatedTable.id);
    await setDoc(tableRef, mapTableToFirestore(updatedTable));
  },

  moveTable: async (fromTableId: string, toTableId: string): Promise<boolean> => {
    const fromRef = doc(firestoreDb!, 'tables', fromTableId);
    const toRef = doc(firestoreDb!, 'tables', toTableId);
    try {
      await runTransaction(firestoreDb!, async (tx) => {
        const fromSnap = await tx.get(fromRef);
        const toSnap = await tx.get(toRef);
        if (!fromSnap.exists() || !toSnap.exists()) throw new Error('Table not found');
        const fromTable = mapTableFromFirestore({ id: fromSnap.id, ...fromSnap.data() });
        const toTable = mapTableFromFirestore({ id: toSnap.id, ...toSnap.data() });
        if (toTable.status !== TableStatus.AVAILABLE) throw new Error('Destination occupied');
        const clearedFrom: Table = {
          ...fromTable,
          status: TableStatus.AVAILABLE,
          orderStartTime: undefined,
          kots: [],
          currentBill: 0,
          captainId: undefined,
          captainName: undefined,
        };
        const movedTo: Table = {
          ...fromTable,
          id: toTableId,
          name: toTable.name,
          category: toTable.category,
        };
        tx.set(fromRef, mapTableToFirestore(clearedFrom));
        tx.set(toRef, mapTableToFirestore(movedTo));
      });
      return true;
    } catch {
      return false;
    }
  },

  settleBill: async (tableId: string, paymentMode: string) => {
    const tableRef = doc(firestoreDb!, 'tables', tableId);
    const salesRef = collection(firestoreDb!, 'sales');
    await runTransaction(firestoreDb!, async (tx) => {
      const tableSnap = await tx.get(tableRef);
      if (!tableSnap.exists()) return;
      const table = mapTableFromFirestore({ id: tableSnap.id, ...tableSnap.data() });
      const newSale: Sale = {
        id: `sale-${Date.now()}`,
        tableId: table.id,
        tableName: table.name,
        captainId: table.captainId,
        captainName: table.captainName,
        amount: table.currentBill,
        paymentMode,
        items: table.kots.flatMap((k) => k.items),
        settledAt: new Date(),
      };
      const saleDocRef = doc(salesRef, newSale.id);
      tx.set(saleDocRef, mapSaleToFirestore(newSale));
      const cleared: Table = {
        ...table,
        status: TableStatus.AVAILABLE,
        orderStartTime: undefined,
        kots: [],
        currentBill: 0,
        captainId: undefined,
        captainName: undefined,
      };
      tx.set(tableRef, mapTableToFirestore(cleared));
    });
  },

  updateOnlineOrderStatus: async (orderId: string, status: OnlineOrderStatus) => {
    const orderRef = doc(firestoreDb!, 'onlineOrders', orderId);
    await updateDoc(orderRef, { status });
  },
};

// ---------- Seeding initial data if collections are empty ----------
async function seedIfEmpty() {
  const collUsers = collection(firestoreDb!, 'users');
  const collTables = collection(firestoreDb!, 'tables');
  const collOrders = collection(firestoreDb!, 'onlineOrders');

  const [usersCount, tablesCount, ordersCount] = await Promise.all([
    getCountFromServer(collUsers),
    getCountFromServer(collTables),
    getCountFromServer(collOrders),
  ]);

  if (usersCount.data().count === 0) {
    await Promise.all(
      INITIAL_USERS.map((u) => setDoc(doc(collUsers, u.id), { ...u }))
    );
  }
  if (tablesCount.data().count === 0) {
    await Promise.all(
      INITIAL_TABLES.map((t) => setDoc(doc(collTables, t.id), mapTableToFirestore(t)))
    );
  }
  if (ordersCount.data().count === 0 && INITIAL_ONLINE_ORDERS.length > 0) {
    await Promise.all(
      INITIAL_ONLINE_ORDERS.map((o) => setDoc(doc(collOrders, o.id), mapOnlineOrderToFirestore(o)))
    );
  }
}

void seedIfEmpty();
