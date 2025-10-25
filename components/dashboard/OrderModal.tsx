import React, { useState, useMemo, useEffect } from 'react';
import { Table, MenuItem, KOTItem, TableStatus, UserRole } from '../../types';
// FIX: Aliased `User` icon from `lucide-react` to `UserIcon` to avoid a name collision with the `User` type.
import { X, Plus, Minus, Printer, IndianRupee, Move, ShieldCheck, User as UserIcon, XCircle, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    table: Table;
    menu: MenuItem[];
}

type ModalView = 'main' | 'create_kot' | 'move_table' | 'payment';

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, table, menu }) => {
    const { user } = useAuth();
    const { tables, addKotToTable, moveTable, settleBill, updateTable, cancelKotItem } = useData();
    const { addToast } = useToast();
    const [view, setView] = useState<ModalView>(table.status === 'Available' ? 'create_kot' : 'main');
    const [kotItems, setKotItems] = useState<KOTItem[]>([]);
    const [moveToTableId, setMoveToTableId] = useState<string>('');
    const [adminPin, setAdminPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [confirmingPaymentMode, setConfirmingPaymentMode] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [cancellingItem, setCancellingItem] = useState<{ kotId: string; item: KOTItem } | null>(null);

    const filteredMenu = useMemo(() => {
        if (!searchTerm.trim()) {
            return menu;
        }
        return menu.filter(item =>
            item.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        );
    }, [menu, searchTerm]);

    useEffect(() => {
        if (isOpen) {
            setView(table.status === 'Available' ? 'create_kot' : 'main');
            setKotItems([]);
            setMoveToTableId('');
            setAdminPin('');
            setPinError('');
            setConfirmingPaymentMode(null);
            setSearchTerm('');
            setCancellingItem(null);
        }
    }, [isOpen, table]);

    if (!isOpen) return null;

    const handleAddItem = (item: MenuItem) => {
        const existingItem = kotItems.find(i => i.id === item.id);
        if (existingItem) {
            setKotItems(kotItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setKotItems([...kotItems, { ...item, quantity: 1, notes: '' }]);
        }
    };
    
    const handleRemoveItem = (itemId: string) => {
        const existingItem = kotItems.find(i => i.id === itemId);
        if (existingItem && existingItem.quantity > 1) {
            setKotItems(kotItems.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
        } else {
            setKotItems(kotItems.filter(i => i.id !== itemId));
        }
    };
    
    const handleNoteChange = (itemId: string, note: string) => {
        setKotItems(currentItems =>
            currentItems.map(item =>
                item.id === itemId ? { ...item, notes: note } : item
            )
        );
    };

    const handleSendKOT = () => {
        if (kotItems.length > 0 && user) {
            const itemsToSend = kotItems.map(item => {
                const { notes, ...rest } = item;
                // Only include notes if it's not an empty string
                return notes ? item : rest;
            });
            addKotToTable(table.id, itemsToSend);
            onClose(); 
        } else if (!user) {
            addToast('Cannot send KOT. User not found.', 'error');
        }
    };
    
    const handleMoveTable = () => {
        if (moveTable(table.id, moveToTableId)) {
            onClose();
        }
    };

    const handleSettleBill = (paymentMode: string) => {
        settleBill(table.id, paymentMode);
        onClose();
    };

    const handleGenerateBill = () => {
        updateTable({ ...table, status: TableStatus.BILLING });
        addToast(`Bill generated for table ${table.name}.`, 'info');
        onClose();
    };
    
    const handleConfirmCancelItem = () => {
        if (!cancellingItem) return;

        if (adminPin !== '5566') {
            setPinError('Invalid Admin PIN.');
            return;
        }

        cancelKotItem(table.id, cancellingItem.kotId, cancellingItem.item.id);
        
        setCancellingItem(null);
        setAdminPin('');
        setPinError('');
    };
    
    const handleAdminAccess = () => {
        if (adminPin === '5566') {
            addToast('Admin access granted!', 'success');
            setPinError('');
            // Here you would unlock admin-specific features in the modal
        } else {
            setPinError('Invalid PIN');
        }
    };
    
    const renderMenu = () => {
        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Create KOT for Table {table.name}</h3>
                    {table.status !== 'Available' && (
                        <button onClick={() => setView('main')} className="text-sm text-primary font-semibold hover:underline">
                            Back to Details
                        </button>
                    )}
                </div>
                <div className="flex space-x-4 h-[50vh]">
                    {/* Menu Items Panel */}
                    <div className="w-1/2 flex flex-col">
                        <div className="flex-shrink-0 mb-3">
                            <input
                                type="text"
                                placeholder="Search for an item..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                            />
                        </div>
                        <div className="flex-grow overflow-y-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden]">
                             <div className="space-y-2">
                                 {filteredMenu.length > 0 ? filteredMenu.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-white">{item.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">₹{item.price}</p>
                                        </div>
                                        <button onClick={() => handleAddItem(item)} className="bg-primary/20 text-primary rounded-full p-2 h-8 w-8 flex items-center justify-center hover:bg-primary/30 transition-colors">
                                            <Plus size={16}/>
                                        </button>
                                    </div>
                                 )) : <p className="text-center text-gray-500 pt-10">No items match your search.</p>}
                             </div>
                        </div>
                    </div>

                    {/* KOT Summary Panel */}
                    <div className="w-1/2 bg-gray-100 dark:bg-gray-900 p-4 rounded-lg flex flex-col">
                        <h4 className="font-semibold text-lg mb-3 flex-shrink-0">Current KOT</h4>
                        {kotItems.length === 0 ? (
                            <div className="flex-grow flex items-center justify-center">
                                <p className="text-sm text-gray-500">Select items to add them here.</p>
                            </div>
                         ) : (
                            <div className="space-y-2 overflow-y-auto flex-grow pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden]">
                                {kotItems.map(item => (
                                    <div key={item.id} className="text-sm py-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-800 dark:text-white">{item.name}</span>
                                            <span className="font-semibold">₹{item.price * item.quantity}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleRemoveItem(item.id)} className="bg-gray-200 dark:bg-gray-700 rounded-full p-1 h-5 w-5 flex items-center justify-center"><Minus size={12}/></button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => handleAddItem(item)} className="bg-gray-200 dark:bg-gray-700 rounded-full p-1 h-5 w-5 flex items-center justify-center"><Plus size={12}/></button>
                                            </div>
                                            <input
                                                type="text"
                                                value={item.notes || ''}
                                                onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                                placeholder="Note..."
                                                className="w-1/2 text-xs px-2 py-1 rounded border bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="border-t dark:border-gray-700 mt-4 pt-4 flex-shrink-0">
                            <div className="flex justify-between font-bold text-lg mb-4">
                                <span>Total</span>
                                <span>₹{kotItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={handleSendKOT} 
                                disabled={kotItems.length === 0}
                                className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-bold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    Send KOT to Kitchen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderMainView = () => (
        <div>
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">Table {table.name}</h2>
                    <p className="text-gray-500">Total Bill: ₹{table.currentBill.toFixed(2)}</p>
                </div>
                 <span className={`px-3 py-1 text-sm font-semibold rounded-full text-white bg-status-${table.status.toLowerCase()}`}>{table.status}</span>
            </div>
            <div className="my-6 max-h-60 overflow-y-auto border-t border-b dark:border-gray-700 py-4">
                <h3 className="font-semibold mb-2">KOT Details</h3>
                {table.kots.length > 0 ? table.kots.map((kot, index) => {
                    return (
                        <div key={kot.id} className="mb-4 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                            <p className="font-semibold text-gray-800 dark:text-white mb-2">KOT #{index + 1} - {new Date(kot.createdAt).toLocaleTimeString()}</p>
                            <ul className="mt-1 space-y-1">
                                {kot.items.map(item => (
                                    <li key={item.id} className={`flex justify-between items-center ${item.cancelled ? 'text-gray-400 line-through dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                                        <span>
                                            {item.name} x {item.quantity}
                                            {item.notes && <span className="text-xs text-orange-500 italic ml-2">({item.notes})</span>}
                                        </span>
                                        {!item.cancelled && table.status !== TableStatus.AVAILABLE && (
                                            <button 
                                                onClick={() => setCancellingItem({ kotId: kot.id, item: item })}
                                                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                                                aria-label={`Cancel item ${item.name}`}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                }) : <p className="text-sm text-gray-500">No KOTs generated for this table yet.</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setView('create_kot')} className="col-span-2 flex items-center justify-center space-x-2 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 font-bold">
                    <Plus size={18}/><span>Create KOT</span>
                </button>
                {table.status === TableStatus.RUNNING &&
                    <button onClick={() => setView('move_table')} className="flex items-center justify-center space-x-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        <Move size={18}/><span>Move Table</span>
                    </button>
                }
                {table.status !== TableStatus.AVAILABLE && table.status !== TableStatus.BILLING &&
                    <button onClick={handleGenerateBill} className="flex items-center justify-center space-x-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        <Printer size={18}/><span>Generate Bill</span>
                    </button>
                }
                {table.status === TableStatus.BILLING &&
                    <button onClick={() => setView('payment')} className="col-span-2 flex items-center justify-center space-x-2 p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 font-bold">
                        <IndianRupee size={18}/><span>Take Payment</span>
                    </button>
                }
                {user?.role === UserRole.CAPTAIN && table.status === TableStatus.BILLING &&
                    <div className="col-span-2 mt-2">
                        <p className="text-xs text-center text-gray-500 mb-2">Need to edit bill?</p>
                        <div className="flex">
                            <input type="password" value={adminPin} onChange={e => setAdminPin(e.target.value)} placeholder="Admin PIN" className="w-full px-2 py-1 text-sm border rounded-l-md dark:bg-gray-700 dark:border-gray-600"/>
                            <button onClick={handleAdminAccess} className="flex items-center justify-center space-x-1 px-3 bg-yellow-400 text-yellow-900 rounded-r-md hover:bg-yellow-500 text-sm">
                                <ShieldCheck size={16}/><span>Unlock</span>
                            </button>
                        </div>
                        {pinError && <p className="text-xs text-red-500 mt-1 text-center">{pinError}</p>}
                    </div>
                }
            </div>
        </div>
    );
    
    const renderMoveTableView = () => (
        <div>
            <h3 className="text-lg font-bold mb-4">Move from {table.name} to...</h3>
            <select onChange={(e) => setMoveToTableId(e.target.value)} value={moveToTableId} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                <option value="">Select a table</option>
                {tables.filter(t => t.status === TableStatus.AVAILABLE).map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                ))}
            </select>
            <div className="flex justify-end space-x-2 mt-4">
                 <button onClick={() => setView('main')} className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-600">Cancel</button>
                 <button onClick={handleMoveTable} disabled={!moveToTableId} className="px-4 py-2 text-sm rounded-lg bg-primary text-white disabled:bg-gray-400">Move</button>
            </div>
        </div>
    );
    
    const renderCancelItemView = () => (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex justify-center items-center">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl w-full max-w-sm border dark:border-gray-700">
                <h3 className="text-lg font-bold mb-2">Cancel Item</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Cancel <span className="font-semibold text-gray-800 dark:text-white">{cancellingItem?.item.name}</span> (Qty: {cancellingItem?.item.quantity})? 
                    Admin PIN required.
                </p>
                <div className="flex">
                    <input
                        type="password"
                        value={adminPin}
                        onChange={e => {
                            setAdminPin(e.target.value);
                            if (pinError) setPinError('');
                        }}
                        placeholder="Enter Admin PIN"
                        className="w-full px-3 py-2 text-sm border rounded-l-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary focus:border-primary"
                        autoFocus
                    />
                    <button onClick={handleConfirmCancelItem} className="flex items-center justify-center space-x-2 px-4 bg-red-500 text-white rounded-r-md hover:bg-red-600 text-sm font-semibold">
                        <Trash2 size={16}/>
                        <span>Confirm</span>
                    </button>
                </div>
                {pinError && <p className="text-xs text-red-500 mt-2 text-center">{pinError}</p>}
                <button onClick={() => { setCancellingItem(null); setAdminPin(''); setPinError(''); }} className="mt-6 text-sm text-primary w-full text-center">
                    Back
                </button>
            </div>
        </div>
    );

    const renderPaymentView = () => {
        if (confirmingPaymentMode) {
            return (
                <div>
                    <h3 className="text-lg font-bold mb-4">Confirm Settlement</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        Are you sure you want to settle the bill for <span className="font-bold">₹{table.currentBill.toFixed(2)}</span> using <span className="font-bold">{confirmingPaymentMode}</span>?
                    </p>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button onClick={() => setConfirmingPaymentMode(null)} className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button onClick={() => handleSettleBill(confirmingPaymentMode)} className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark">Yes, Settle</button>
                    </div>
                </div>
            );
        }

        return (
            <div>
                <h3 className="text-lg font-bold mb-4">Settle Bill for {table.name} - ₹{table.currentBill.toFixed(2)}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setConfirmingPaymentMode('Cash')} className="p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 font-semibold">💵 Cash</button>
                    <button onClick={() => setConfirmingPaymentMode('Card')} className="p-4 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 font-semibold">💳 Card</button>
                    <button onClick={() => setConfirmingPaymentMode('UPI')} className="p-4 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 font-semibold">📱 UPI</button>
                    <button onClick={() => setConfirmingPaymentMode('Other')} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold">Other</button>
                </div>
                <button onClick={() => setView('main')} className="mt-6 text-sm text-primary">Back</button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full p-6 relative transform transition-all ${view === 'create_kot' ? 'max-w-4xl' : 'max-w-lg'}`}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-20">
                    <X size={24} />
                </button>
                {view === 'main' && renderMainView()}
                {view === 'create_kot' && renderMenu()}
                {view === 'move_table' && renderMoveTableView()}
                {view === 'payment' && renderPaymentView()}
                {cancellingItem && renderCancelItemView()}
            </div>
        </div>
    );
};

export default OrderModal;