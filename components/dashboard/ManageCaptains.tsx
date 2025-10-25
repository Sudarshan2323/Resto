import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { UserRole } from '../../types';
import { Plus, Trash2, UserCircle, Mail, KeyRound } from 'lucide-react';

const ManageCaptains: React.FC = () => {
    const { users, addCaptain, deleteCaptain } = useData();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const captains = users.filter(u => u.role === UserRole.CAPTAIN);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password) {
            alert('Please fill all fields.');
            return;
        }
        addCaptain({ name, email, password });
        setName('');
        setEmail('');
        setPassword('');
    };

    const handleDelete = (userId: string, userName: string) => {
        if (window.confirm(`Are you sure you want to delete captain "${userName}"? This action cannot be undone.`)) {
            deleteCaptain(userId);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-down">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Captains</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-1 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Add New Captain</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <div className="relative mt-1">
                                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jack Sparrow" required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400" />
                            </div>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. captain@resto.com" required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                             <div className="relative mt-1">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 5 characters" required className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400" />
                            </div>
                        </div>
                        <button type="submit" className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            <Plus size={18}/>
                            <span>Add Captain</span>
                        </button>
                    </form>
                </div>
                
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md">
                     <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Existing Captains ({captains.length})</h3>
                     <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {captains.length > 0 ? captains.map(captain => (
                             <div key={captain.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-white">{captain.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{captain.email}</p>
                                </div>
                                <button onClick={() => handleDelete(captain.id, captain.name)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No captains found. Add one using the form.</p>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ManageCaptains;
