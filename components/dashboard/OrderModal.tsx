import React, { useState } from 'react';
import { Table, MenuItem, KOTItem, TableStatus, UserRole } from '../../types';
import { X, Plus, Minus, Printer, IndianRupee, Move, ShieldCheck, User } from 'lucide-react';
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
    const { tables, addKotToTable, moveTable, settleBill, updateTable } = useData();
    const { addToast } = useToast();
    const [view, setView] = useState<ModalView>(table.status === 'Available' ? 'create_kot' : 'main');
    const [kotItems, setKotItems] = useState<KOTItem[]>([]);
    const [moveToTableId, setMoveToTableId] = useState<string>('');
    const [adminPin, setAdminPin] = useState('');
    const [pinError, setPinError] = useState('');

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

    const handleSendKOT = async () => {
        if (kotItems.length > 0 && user) {
            const itemsToSend = kotItems.map(item => {
                const { notes, ...rest } = item;
                return notes ? item : rest;
            });
            await addKotToTable(table.id, itemsToSend);
            onClose(); 
        } else if (!user) {
            addToast('Cannot send KOT. User not found.', 'error');
        }
    };
    
    const handleMoveTable = async () => {
        const success = await moveTable(table.id, moveToTableId);
        if (success) {
            onClose();
        }
    };

    const handleSettleBill = async (paymentMode: string) => {
        await settleBill(table.id, paymentMode);
        onClose();
    };

    const handleGenerateBill = async () => {
        await updateTable({ ...table, status: TableStatus.BILLING });
        addToast(`Bill generated for table ${table.name}.`, 'info');
        onClose();
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
        const categories = [...new Set(menu.map(item => item.category))];
        return (
            <div>
                <h3 className="text-lg font-bold mb-4">Create KOT for {table.name}</h3>
                <div className="flex space-x-4">
                    <div className="w-1/2 h-96 overflow-y-auto pr-2">
                        {categories.map(category => (
                            <div key={category}>
                                <h4 className="font-semibold text-primary my-2">{category}</h4>
                                {menu.filter(item => item.category === category).map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <span>{item.name}</span>
                                        <div className="flex items-center space-x-2">
                                            <span>₹{item.price}</span>
                                            <button onClick={() => handleAddItem(item)} className="bg-primary text-white rounded-full p-1 h-6 w-6 flex items-center justify-center"><Plus size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="w-1/2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Current KOT</h4>
                        {kotItems.length === 0 ? <p className="text-sm text-gray-500">No items added yet.</p> : (
                            <div className="space-y-2 h-72 overflow-y-auto">
                                {kotItems.map(item => (
                                    <div key={item.id} className="text-sm border-b dark:border-gray-700 pb-2">
                                        <div className="flex justify-between items-center">
                                            <span>{item.name}</span>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleRemoveItem(item.id)} className="bg-gray-200 dark:bg-gray-600 rounded-full p-1 h-5 w-5 flex items-center justify-center"><Minus size={12}/></button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => handleAddItem(item)} className="bg-gray-200 dark:bg-gray-600 rounded-full p-1 h-5 w-5 flex items-center justify-center"><Plus size={12}/></button>
                                                <span>₹{item.price * item.quantity}</span>
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            value={item.notes || ''}
                                            onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                            placeholder="Add note (e.g., less spicy)"
                                            className="w-full text-xs px-2 py-1 mt-2 rounded border bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="border-t dark:border-gray-600 mt-4 pt-4">
                            <div className="flex justify-between font-bold">
                                <span>Total</span>
                                <span>₹{kotItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}</span>
                            </div>
                            <button onClick={handleSendKOT} className="w-full bg-green-500 text-white py-2 mt-4 rounded-lg hover:bg-green-600">Send KOT to Kitchen</button>
                        </div>
                    </div>
                </div>
                 <button onClick={() => setView('main')} className="mt-4 text-sm text-primary">Back to Main</button>
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
                {table.kots.length > 0 ? table.kots.map((kot, index) => (
                    <div key={kot.id} className="mb-4 text-sm">
                        <p className="font-semibold">KOT #{index + 1} - {new Date(kot.createdAt).toLocaleTimeString()}</p>
                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                            {kot.items.map(item => (
                                <li key={item.id}>
                                    {item.name} x {item.quantity}
                                    {item.notes && <span className="text-xs text-orange-500 italic ml-2">({item.notes})</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                )) : <p className="text-sm text-gray-500">No KOTs generated for this table yet.</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                {table.status !== TableStatus.AVAILABLE &&
                    <button onClick={() => setView('main')} className="flex items-center justify-center space-x-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        <User size={18}/><span>View KOTs</span>
                    </button>
                }
                <button onClick={() => setView('create_kot')} className="col-span-2 flex items-center justify-center space-x-2 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 font-bold">
                    <Plus size={18}/><span>Create KOT</span>
                </button>
                {table.status === TableStatus.RUNNING &&
                    <button onClick={() => setView('move_table')} className="flex items-center justify-center space-x-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        <Move size={18}/><span>Move Table</span>
                    </button>
                }
                {table.status !== TableStatus.AVAILABLE &&
                    <button onClick={handleGenerateBill} className="flex items-center justify-center space-x-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        <Printer size={18}/><span>Generate Bill</span>
                    </button>
                }
                {table.status === TableStatus.BILLING &&
                    <button onClick={() => setView('payment')} className="col-span-2 flex items-center justify-center space-x-2 p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 font-bold">
                        <IndianRupee size={18}/><span>Take Payment</span>
                    </button>
                }
                {user?.role === UserRole.CAPTAIN &&
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

    const renderPaymentView = () => (
        <div>
            <h3 className="text-lg font-bold mb-4">Settle Bill for {table.name} - ₹{table.currentBill.toFixed(2)}</h3>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleSettleBill('Cash')} className="p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 font-semibold">💵 Cash</button>
                <button onClick={() => handleSettleBill('Card')} className="p-4 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 font-semibold">💳 Card</button>
                <button onClick={() => handleSettleBill('UPI')} className="p-4 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 font-semibold">📱 UPI</button>
                 <button onClick={() => handleSettleBill('Other')} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold">Other</button>
            </div>
            <button onClick={() => setView('main')} className="mt-6 text-sm text-primary">Back</button>
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 relative transform transition-all">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={24} />
                </button>
                {view === 'main' && renderMainView()}
                {view === 'create_kot' && renderMenu()}
                {view === 'move_table' && renderMoveTableView()}
                {view === 'payment' && renderPaymentView()}
            </div>
        </div>
    );
};

export default OrderModal;