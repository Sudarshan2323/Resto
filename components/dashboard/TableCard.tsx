
import React, { useState, useEffect } from 'react';
import { Table, TableStatus } from '../../types';
import { Clock, IndianRupee, Users } from 'lucide-react';

interface TableCardProps {
  table: Table;
  onClick: () => void;
}

const statusColors: Record<TableStatus, string> = {
  [TableStatus.AVAILABLE]: 'bg-status-available',
  [TableStatus.RUNNING]: 'bg-status-running',
  [TableStatus.BILLING]: 'bg-status-billing',
  [TableStatus.CLOSED]: 'bg-status-closed',
};

const TableCard: React.FC<TableCardProps> = ({ table, onClick }) => {
  const [elapsedTime, setElapsedTime] = useState('00:00');

  useEffect(() => {
    if (table.status === TableStatus.RUNNING && table.orderStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(table.orderStartTime!);
        const diff = now.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setElapsedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
        setElapsedTime('00:00');
    }
  }, [table.status, table.orderStartTime]);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
    >
      <div className={`p-4 ${statusColors[table.status]}`}>
        <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-white">{table.name}</h3>
            <span className="text-sm font-semibold bg-white/30 text-white px-3 py-1 rounded-full">{table.status}</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">{elapsedTime}</span>
        </div>
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <IndianRupee className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">{table.currentBill.toFixed(2)}</span>
        </div>
         <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Users className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">{table.category}</span>
        </div>
      </div>
    </div>
  );
};

export default TableCard;
