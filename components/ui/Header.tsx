
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Sun, Moon, LogOut, Menu, UserCircle, Bell } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleDarkMode = () => setIsDark(!isDark);

    return (
        <header className="bg-white dark:bg-gray-900 shadow-sm p-4 flex items-center justify-between z-10">
            <div className="flex items-center">
                <button onClick={onMenuClick} className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden">
                    <Menu className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold ml-4 text-gray-800 dark:text-white hidden sm:block">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
                <button onClick={toggleDarkMode} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-primary ring-2 ring-white dark:ring-gray-900"></span>
                </button>
                <div className="flex items-center">
                    <UserCircle className="h-8 w-8 text-gray-400" />
                    <div className="ml-2 hidden md:block">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                    </div>
                </div>
                 <button onClick={logout} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </header>
    );
};

export default Header;
