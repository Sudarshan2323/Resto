import { Table, OnlineOrder, KOT, KOTItem, TableStatus, OnlineOrderStatus, User, Sale, UserRole, MenuItem } from '../types';
import { INITIAL_TABLES, INITIAL_ONLINE_ORDERS, INITIAL_USERS, INITIAL_MENU } from './mockData';

// Custom JSON reviver to handle Date objects during parsing
const dateReviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
        return new Date(value);
    }
    return value;
};

type Listener<T> = (data: T) => void;

class RealtimeStore<T> {
    private listeners: Set<Listener<T[]>> = new Set();
    private data: T[];
    private storageKey: string;

    constructor(storageKey: string, initialData: T[]) {
        try {
            const storedData = localStorage.getItem(this.storageKey);
            this.data = storedData ? JSON.parse(storedData, dateReviver) : initialData;
        } catch (e) {
            console.error(`Failed to load data from localStorage for key "${storageKey}"`, e);
            this.data = initialData;
        }
        window.addEventListener('storage', this.handleStorageChange);
    }

    private handleStorageChange = (event: StorageEvent) => {
      if (event.key === this.storageKey && event.newValue) {
        try {
            this.data = JSON.parse(event.newValue, dateReviver);
            this.notify();
        } catch (e) {
            console.error('Error parsing storage update:', e);
        }
      }
    }

    subscribe(listener: Listener<T[]>) {
        this.listeners.add(listener);
        listener(this.data);
        return () => {
            this.listeners.delete(listener);
            // Consider calling a destroy method if the component unmounts
        };
    }

    destroy() {
        window.removeEventListener('storage', this.handleStorageChange);
    }

    private notify() {
        this.listeners.forEach(listener => listener(this.data));
    }

    getState() {
        return this.data;
    }
    
    setState(newData: T[] | ((prevData: T[]) => T[])) {
        if (typeof newData === 'function') {
            this.data = newData(this.data);
        } else {
            this.data = newData;
        }
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        this.notify();
    }
}

export const userStore = new RealtimeStore<User>('resto-users', INITIAL_USERS);
export const tableStore = new RealtimeStore<Table>('resto-tables', INITIAL_TABLES);
export const onlineOrderStore = new RealtimeStore<OnlineOrder>('resto-online-orders', INITIAL_ONLINE_ORDERS);
export const salesStore = new RealtimeStore<Sale>('resto-sales', []);
export const menuStore = new RealtimeStore<MenuItem>('resto-menu', INITIAL_MENU);

export const db = {
    addKotToTable: (tableId: string, kotItems: KOTItem[], captain: User) => {
        tableStore.setState(prevTables =>
            prevTables.map(table => {
                if (table.id === tableId) {
                    const newKot: KOT = { id: `kot-${Date.now()}`, createdAt: new Date(), items: kotItems };
                    const kotTotal = kotItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
                    const newBill = table.currentBill + kotTotal;
                    return {
                        ...table,
                        status: TableStatus.RUNNING,
                        orderStartTime: table.orderStartTime || new Date(),
                        kots: [...table.kots, newKot],
                        currentBill: newBill,
                        captainId: captain.id,
                        captainName: captain.name,
                    };
                }
                return table;
            })
        );
    },
    updateTable: (updatedTable: Table) => {
        tableStore.setState(prevTables =>
            prevTables.map(table => (table.id === updatedTable.id ? updatedTable : table))
        );
    },
    moveTable: (fromTableId: string, toTableId: string): boolean => {
        const fromTable = tableStore.getState().find(t => t.id === fromTableId);
        const toTable = tableStore.getState().find(t => t.id === toTableId);
        if (!fromTable || !toTable || toTable.status !== TableStatus.AVAILABLE) return false;

        tableStore.setState(prevTables => prevTables.map(t => {
            if (t.id === fromTableId) {
                return { ...t, status: TableStatus.AVAILABLE, orderStartTime: undefined, kots: [], currentBill: 0, captainId: undefined, captainName: undefined };
            }
            if (t.id === toTableId) {
                return { ...fromTable, id: toTableId, name: toTable.name, category: toTable.category };
            }
            return t;
        }));
        return true;
    },
    settleBill: (tableId: string, paymentMode: string) => {
        const tableToSettle = tableStore.getState().find(t => t.id === tableId);
        if (!tableToSettle) return;
        
        const newSale: Sale = {
            id: `sale-${Date.now()}`,
            tableId: tableToSettle.id,
            tableName: tableToSettle.name,
            captainId: tableToSettle.captainId,
            captainName: tableToSettle.captainName,
            amount: tableToSettle.currentBill,
            paymentMode,
            items: tableToSettle.kots.flatMap(kot => kot.items),
            settledAt: new Date()
        };
        salesStore.setState(prevSales => [...prevSales, newSale]);

        tableStore.setState(prevTables => prevTables.map(t => {
            if (t.id === tableId) {
                return { ...t, status: TableStatus.AVAILABLE, orderStartTime: undefined, kots: [], currentBill: 0, captainId: undefined, captainName: undefined };
            }
            return t;
        }));
    },
    cancelKotItem: (tableId: string, kotId: string, itemId: string) => {
        tableStore.setState(prevTables =>
            prevTables.map(table => {
                if (table.id === tableId) {
                    let itemPriceToDeduct = 0;
                    const updatedKots = table.kots.map(kot => {
                        if (kot.id === kotId) {
                            const updatedItems = kot.items.map(item => {
                                if (item.id === itemId && !item.cancelled) {
                                    itemPriceToDeduct = item.price * item.quantity;
                                    return { ...item, cancelled: true };
                                }
                                return item;
                            });
                            return { ...kot, items: updatedItems };
                        }
                        return kot;
                    });
    
                    const newBill = table.currentBill - itemPriceToDeduct;
    
                    return {
                        ...table,
                        kots: updatedKots,
                        currentBill: newBill < 0 ? 0 : newBill,
                    };
                }
                return table;
            })
        );
    },
    updateOnlineOrderStatus: (orderId: string, status: OnlineOrderStatus) => {
        onlineOrderStore.setState(prevOrders =>
            prevOrders.map(order => (order.id === orderId ? { ...order, status } : order))
        );
    },
    addCaptain: (captainData: Omit<User, 'id' | 'role'>): { success: boolean, message: string } => {
        const existingUser = userStore.getState().find(u => u.email === captainData.email);
        if (existingUser) {
            return { success: false, message: 'Email is already in use.' };
        }

        if (!captainData.password || captainData.password.length < 5) {
            return { success: false, message: 'Password must be at least 5 characters long.' };
        }

        const newCaptain: User = {
            id: `user-${Date.now()}`,
            name: captainData.name,
            email: captainData.email,
            password: captainData.password,
            role: UserRole.CAPTAIN,
        };
        userStore.setState(prevUsers => [...prevUsers, newCaptain]);
        return { success: true, message: 'Captain added successfully.' };
    },
    deleteCaptain: (userId: string) => {
        userStore.setState(prevUsers => prevUsers.filter(user => user.id !== userId));
    },
    addMenuItem: (itemData: Omit<MenuItem, 'id'>) => {
        const newItem: MenuItem = {
            id: `menu-${Date.now()}`,
            ...itemData,
        };
        menuStore.setState(prevMenu => [...prevMenu, newItem]);
    },
    updateMenuItem: (updatedItem: MenuItem) => {
        menuStore.setState(prevMenu =>
            prevMenu.map(item => (item.id === updatedItem.id ? updatedItem : item))
        );
    },
    deleteMenuItem: (itemId: string) => {
        menuStore.setState(prevMenu => prevMenu.filter(item => item.id !== itemId));
    },
};