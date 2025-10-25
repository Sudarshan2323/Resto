
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/ui/Header';
import Sidebar from '../components/ui/Sidebar';
import TableView from '../components/dashboard/TableView';
import SalesAnalytics from '../components/dashboard/SalesAnalytics';
import OnlineOrders from '../components/dashboard/OnlineOrders';
import ManageCaptains from '../components/dashboard/ManageCaptains';
import ManageMenu from '../components/dashboard/ManageMenu';
import { UserRole } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(prev => !prev)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-800 p-4 sm:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="tables" replace />} />
            <Route path="tables" element={<TableView />} />
            {user?.role === UserRole.ADMIN && (
              <>
                <Route path="sales" element={<SalesAnalytics />} />
                <Route path="online-orders" element={<OnlineOrders />} />
                <Route path="captains" element={<ManageCaptains />} />
                <Route path="menu" element={<ManageMenu />} />
              </>
            )}
            <Route path="*" element={<Navigate to="tables" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;