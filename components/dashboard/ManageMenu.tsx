import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { MenuItem } from '../../types';
import { Plus, Trash2, Edit, X, Save, DollarSign, Tag, Utensils } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface MenuItemModalProps {
    item: MenuItem | null;
    onClose: () => void;
    onSave: (item: MenuItem | Omit<MenuItem, 'id'>) => void;
}

const MenuItemModal: React.FC<MenuItemModalProps> = ({ item, onClose, onSave }) => {
    const [name, setName] = useState(item?.name || '');
    const [price, setPrice] = useState<string>(item?.price?.toString() || '');
    const [category, setCategory] = useState(item?.category || '');
    const { addToast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const priceValue = parseFloat(price);
        if (!name.trim() || !category.trim() || isNaN(priceValue) || priceValue <= 0) {
            addToast('Please fill all fields with valid data.', 'error');
            return;
        }
        onSave({ ...item, name, price: priceValue, category });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative transform transition-all animate-fade-in-down">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={24} />
                </button>
                <h3 className="font-bold text-lg mb-6 text-gray-800 dark:text-white">{item?.id ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Name</label>
                        <div className="relative mt-1">
                            <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Paneer Butter Masala" required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <div className="relative mt-1">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                            <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Main Course" required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                         <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 350" required min="0" step="0.01" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                         <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                         <button type="submit" className="w-full flex-1 flex items-center justify-center space-x-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            <Save size={18}/>
                            <span>Save Item</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ManageMenu: React.FC = () => {
    const { menu, addMenuItem, updateMenuItem, deleteMenuItem } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    const menuByCategory = useMemo(() => {
        return menu.reduce((acc, item) => {
            const { category } = item;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {} as Record<string, MenuItem[]>);
    }, [menu]);

    const handleAddItem = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEditItem = (item: MenuItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDeleteItem = (item: MenuItem) => {
        if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
            deleteMenuItem(item.id);
        }
    };

    const handleSaveItem = (itemData: MenuItem | Omit<MenuItem, 'id'>) => {
        if ('id' in itemData && itemData.id) {
            updateMenuItem(itemData as MenuItem);
        } else {
            addMenuItem(itemData as Omit<MenuItem, 'id'>);
        }
        setIsModalOpen(false);
        setEditingItem(null);
    };

    return (
        <div className="space-y-6 animate-fade-in-down">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Menu</h1>
                <button onClick={handleAddItem} className="flex items-center justify-center space-x-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    <Plus size={18}/>
                    <span>Add Menu Item</span>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md">
                 <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Menu Items ({menu.length})</h3>
                 <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                    {Object.keys(menuByCategory).sort().map(category => (
                        <div key={category}>
                            <h3 className="text-md font-semibold text-primary dark:text-primary-dark mb-2 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-2 border-b dark:border-gray-700">{category}</h3>
                            <div className="space-y-2">
                                {menuByCategory[category].sort((a, b) => a.name.localeCompare(b.name)).map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-white">{item.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">₹{item.price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleEditItem(item)} className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full transition-colors">
                                                <Edit size={16}/>
                                            </button>
                                            <button onClick={() => handleDeleteItem(item)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {menu.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No menu items found. Add one to get started.</p>
                    )}
                 </div>
            </div>

            {isModalOpen && <MenuItemModal item={editingItem} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} />}
        </div>
    );
};

export default ManageMenu;