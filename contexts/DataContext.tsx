import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { Table, KOTItem, OnlineOrder, OnlineOrderStatus, Sale, User, MenuItem } from '../types';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { api } from '../api';
import { toClientOnlineOrder, toClientSale, toClientTable, toServerTable } from '../utils/serializers';

interface DataContextType {
    tables: Table[];
    onlineOrders: OnlineOrder[];
    sales: Sale[];
    menu: MenuItem[];
    updateTable: (updatedTable: Table) => Promise<void>;
    moveTable: (fromTableId: string, toTableId: string) => Promise<boolean>;
    addKotToTable: (tableId: string, kotItems: KOTItem[]) => Promise<void>;
    updateOnlineOrderStatus: (orderId: string, status: OnlineOrderStatus) => Promise<void>;
    settleBill: (tableId: string, paymentMode: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tables, setTables] = useState<Table[]>([]);
    const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const { addToast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        const load = async () => {
            try {
                const [tbls, orders, sls, mnu] = await Promise.all([
                    api.getTables(),
                    api.getOnlineOrders(),
                    api.getSales(),
                    api.getMenu(),
                ]);
                setTables((tbls as any[]).map(toClientTable));
                setOnlineOrders((orders as any[]).map(toClientOnlineOrder));
                setSales((sls as any[]).map(toClientSale));
                setMenu(mnu as MenuItem[]);
            } catch (e) {
                console.error(e);
                addToast('Failed to load data from server.', 'error');
            }
        };
        void load();
    }, []);

    const addKotToTable = async (tableId: string, kotItems: KOTItem[]) => {
        if (!user) {
            addToast('You must be logged in to perform this action.', 'error');
            return;
        }
        await api.addKot(tableId, kotItems as any[], user as any);
        const tbls = await api.getTables();
        setTables((tbls as any[]).map(toClientTable));
        addToast('KOT sent to kitchen!', 'success');
    };

    const updateTable = async (updatedTable: Table) => {
        await api.updateTable(updatedTable.id, toServerTable(updatedTable));
        const tbls = await api.getTables();
        setTables((tbls as any[]).map(toClientTable));
    };

    const moveTable = async (fromTableId: string, toTableId: string): Promise<boolean> => {
        const fromTableName = tables.find(t => t.id === fromTableId)?.name || '';
        const toTableName = tables.find(t => t.id === toTableId)?.name || '';
        try {
            await api.moveTable(fromTableId, toTableId);
            const tbls = await api.getTables();
            setTables((tbls as any[]).map(toClientTable));
            addToast(`Table ${fromTableName} moved to ${toTableName}.`, 'success');
            return true;
        } catch (e) {
            addToast('Move failed. Destination table is occupied.', 'error');
            return false;
        }
    };
    
    const settleBill = async (tableId: string, paymentMode: string) => {
        const tableName = tables.find(t => t.id === tableId)?.name || '';
        await api.settleBill(tableId, paymentMode);
        const [tbls, sls] = await Promise.all([api.getTables(), api.getSales()]);
        setTables((tbls as any[]).map(toClientTable));
        setSales((sls as any[]).map(toClientSale));
        addToast(`Bill for table ${tableName} settled with ${paymentMode}.`, 'success');
    };
    
    const updateOnlineOrderStatus = async (orderId: string, status: OnlineOrderStatus) => {
        await api.updateOnlineOrder(orderId, status as any);
        const orders = await api.getOnlineOrders();
        setOnlineOrders((orders as any[]).map(toClientOnlineOrder));
        addToast(`Order #${orderId} status updated to ${status}.`, 'info');
    };

    const value = { tables, onlineOrders, sales, menu, updateTable, moveTable, addKotToTable, updateOnlineOrderStatus, settleBill };

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
