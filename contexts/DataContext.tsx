import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { Table, KOTItem, OnlineOrder, OnlineOrderStatus, Sale, User, MenuItem } from '../types';
import { tableStore, onlineOrderStore, salesStore, userStore, menuStore, db } from '../data/realtimeDb';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

interface DataContextType {
    tables: Table[];
    onlineOrders: OnlineOrder[];
    sales: Sale[];
    users: User[];
    menu: MenuItem[];
    updateTable: (updatedTable: Table) => void;
    moveTable: (fromTableId: string, toTableId: string) => boolean;
    addKotToTable: (tableId: string, kotItems: KOTItem[]) => void;
    updateOnlineOrderStatus: (orderId: string, status: OnlineOrderStatus) => void;
    settleBill: (tableId: string, paymentMode: string) => void;
    addCaptain: (captainData: Omit<User, 'id' | 'role'>) => void;
    deleteCaptain: (userId: string) => void;
    addMenuItem: (itemData: Omit<MenuItem, 'id'>) => void;
    updateMenuItem: (updatedItem: MenuItem) => void;
    deleteMenuItem: (itemId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tables, setTables] = useState<Table[]>([]);
    const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const { addToast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        const unsubscribeTables = tableStore.subscribe(setTables);
        const unsubscribeOrders = onlineOrderStore.subscribe(setOnlineOrders);
        const unsubscribeSales = salesStore.subscribe(setSales);
        const unsubscribeUsers = userStore.subscribe(setUsers);
        const unsubscribeMenu = menuStore.subscribe(setMenu);
        return () => {
            unsubscribeTables();
            unsubscribeOrders();
            unsubscribeSales();
            unsubscribeUsers();
            unsubscribeMenu();
        };
    }, []);

    const addKotToTable = (tableId: string, kotItems: KOTItem[]) => {
        if (!user) {
            addToast('You must be logged in to perform this action.', 'error');
            return;
        }
        db.addKotToTable(tableId, kotItems, user);
        addToast('KOT sent to kitchen!', 'success');
    };

    const updateTable = (updatedTable: Table) => {
        db.updateTable(updatedTable);
    };

    const moveTable = (fromTableId: string, toTableId: string): boolean => {
        const fromTableName = tables.find(t => t.id === fromTableId)?.name || '';
        const toTableName = tables.find(t => t.id === toTableId)?.name || '';
        const success = db.moveTable(fromTableId, toTableId);
        if (success) {
            addToast(`Table ${fromTableName} moved to ${toTableName}.`, 'success');
        } else {
            addToast('Move failed. Destination table is occupied.', 'error');
        }
        return success;
    };
    
    const settleBill = (tableId: string, paymentMode: string) => {
        const tableName = tables.find(t => t.id === tableId)?.name || '';
        db.settleBill(tableId, paymentMode);
        addToast(`Bill for table ${tableName} settled with ${paymentMode}.`, 'success');
    };
    
    const updateOnlineOrderStatus = (orderId: string, status: OnlineOrderStatus) => {
        db.updateOnlineOrderStatus(orderId, status);
        addToast(`Order #${orderId} status updated to ${status}.`, 'info');
    };
    
    const addCaptain = (captainData: Omit<User, 'id' | 'role'>) => {
        const result = db.addCaptain(captainData);
        if (result.success) {
            addToast(result.message, 'success');
        } else {
            addToast(result.message, 'error');
        }
    };

    const deleteCaptain = (userId: string) => {
        db.deleteCaptain(userId);
        addToast('Captain removed successfully.', 'success');
    };

    const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
        db.addMenuItem(itemData);
        addToast('Menu item added successfully!', 'success');
    };

    const updateMenuItem = (updatedItem: MenuItem) => {
        db.updateMenuItem(updatedItem);
        addToast('Menu item updated successfully!', 'success');
    };

    const deleteMenuItem = (itemId: string) => {
        db.deleteMenuItem(itemId);
        addToast('Menu item deleted.', 'success');
    };

    const value = { tables, onlineOrders, sales, users, menu, updateTable, moveTable, addKotToTable, updateOnlineOrderStatus, settleBill, addCaptain, deleteCaptain, addMenuItem, updateMenuItem, deleteMenuItem };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};