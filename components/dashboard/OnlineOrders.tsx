
import React from 'react';
import { useData } from '../../contexts/DataContext';
import { OnlineOrder, OnlineOrderStatus } from '../../types';
import { ChefHat, CheckCircle, Ban, Bike, Box, CircleDot } from 'lucide-react';

const statusInfo: Record<OnlineOrderStatus, { icon: React.ReactNode; color: string; actions: OnlineOrderStatus[] }> = {
    [OnlineOrderStatus.NEW]: { icon: <CircleDot size={18} />, color: 'text-blue-500', actions: [OnlineOrderStatus.ACCEPTED, OnlineOrderStatus.PREPARING] },
    [OnlineOrderStatus.ACCEPTED]: { icon: <CheckCircle size={18} />, color: 'text-green-500', actions: [OnlineOrderStatus.PREPARING] },
    [OnlineOrderStatus.PREPARING]: { icon: <ChefHat size={18} />, color: 'text-orange-500', actions: [OnlineOrderStatus.OUT_FOR_DELIVERY] },
    [OnlineOrderStatus.OUT_FOR_DELIVERY]: { icon: <Bike size={18} />, color: 'text-purple-500', actions: [OnlineOrderStatus.COMPLETED] },
    [OnlineOrderStatus.COMPLETED]: { icon: <Box size={18} />, color: 'text-gray-500', actions: [] },
};

const OnlineOrders: React.FC = () => {
    const { onlineOrders, updateOnlineOrderStatus } = useData();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Online Orders</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {onlineOrders.map(order => (
                    <OrderCard key={order.id} order={order} onStatusChange={updateOnlineOrderStatus} />
                ))}
            </div>
        </div>
    );
};

interface OrderCardProps {
    order: OnlineOrder;
    onStatusChange: (orderId: string, status: OnlineOrderStatus) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusChange }) => {
    const { icon, color, actions } = statusInfo[order.status];
    const platformColor = order.platform === 'Zomato' ? 'bg-red-500' : 'bg-orange-500';

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
            <div className={`p-4 flex justify-between items-center ${platformColor}`}>
                <h3 className="font-bold text-lg text-white">{order.platform} #{order.id}</h3>
                <span className="text-white font-semibold">₹{order.total}</span>
            </div>
            <div className="p-4">
                <div className="flex items-center font-semibold mb-3">
                    <span className={`mr-2 ${color}`}>{icon}</span>
                    <span className={`capitalize ${color}`}>{order.status}</span>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                    {order.items.map(item => (
                        <li key={item.name} className="flex justify-between">
                            <span>{item.name}</span>
                            <span className="font-medium">x{item.quantity}</span>
                        </li>
                    ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                    {order.status === OnlineOrderStatus.NEW && (
                        <button onClick={() => alert('Order declined!')} className="flex-1 text-sm px-3 py-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800">
                            Decline
                        </button>
                    )}
                    {actions.map(action => (
                         <button key={action} onClick={() => onStatusChange(order.id, action)} className="flex-1 text-sm px-3 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 font-semibold">
                            Mark as {action}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OnlineOrders;
