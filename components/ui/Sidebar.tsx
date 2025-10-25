
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, BarChart2, UtensilsCrossed, LogOut, ChevronLeft, Users, BookMarked } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();

  const navLinkClasses = "flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-primary/10 hover:text-primary dark:hover:text-primary rounded-lg transition-colors duration-200";
  const activeNavLinkClasses = "bg-primary/10 text-primary dark:text-primary font-semibold";

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:flex-shrink-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700">
            <div className="flex items-center">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
              <span className="ml-3 text-xl font-bold text-gray-800 dark:text-white">RestoManager</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500 dark:text-gray-400">
                <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            <NavLink to="/tables" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
              <LayoutDashboard className="h-5 w-5" />
              <span className="ml-4">Tables</span>
            </NavLink>
            {user?.role === UserRole.ADMIN && (
              <>
                <NavLink to="/online-orders" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                  <ShoppingCart className="h-5 w-5" />
                  <span className="ml-4">Online Orders</span>
                </NavLink>
                <NavLink to="/sales" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                  <BarChart2 className="h-5 w-5" />
                  <span className="ml-4">Sales Analytics</span>
                </NavLink>
                <NavLink to="/captains" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                  <Users className="h-5 w-5" />
                  <span className="ml-4">Manage Captains</span>
                </NavLink>
                <NavLink to="/menu" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                  <BookMarked className="h-5 w-5" />
                  <span className="ml-4">Manage Menu</span>
                </NavLink>
              </>
            )}
          </nav>
          <div className="px-4 py-4 border-t dark:border-gray-700">
            <button onClick={logout} className={`${navLinkClasses} w-full`}>
              <LogOut className="h-5 w-5" />
              <span className="ml-4">Logout</span>
            </button>
          </div>
        </div>
      </div>
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/30 z-20 lg:hidden"></div>}
    </>
  );
};

export default Sidebar;