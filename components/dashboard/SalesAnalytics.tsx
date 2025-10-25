import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, ShoppingBag, UserCheck } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useData } from '../../contexts/DataContext';
import { Sale } from '../../types';

const COLORS = ['#E23744', '#f97316', '#3b82f6', '#22c55e', '#8b5cf6'];

const SalesAnalytics: React.FC = () => {
    const [timeRange, setTimeRange] = useState('Month');
    const [dishOfTheDay, setDishOfTheDay] = useState('');
    const [loadingDish, setLoadingDish] = useState(false);
    const { sales } = useData();

    const filteredSales = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return sales.filter(sale => {
            const saleDate = new Date(sale.settledAt);
            switch(timeRange) {
                case 'Today':
                    return saleDate >= today;
                case 'Week':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    return saleDate >= weekStart;
                case 'Month':
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    return saleDate >= monthStart;
                case 'Year':
                     const yearStart = new Date(now.getFullYear(), 0, 1);
                     return saleDate >= yearStart;
                default:
                    return true;
            }
        });
    }, [sales, timeRange]);

    const analyticsData = useMemo(() => {
        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
        const totalOrders = filteredSales.length;

        const topItemsMap = filteredSales
            .flatMap(sale => sale.items)
            .reduce((acc, item) => {
                acc.set(item.name, (acc.get(item.name) || 0) + item.quantity);
                return acc;
            }, new Map<string, number>());
        
        const topItemsData = Array.from(topItemsMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const captainPerformanceMap = filteredSales.reduce((acc, sale) => {
            if (sale.captainName) {
                acc.set(sale.captainName, (acc.get(sale.captainName) || 0) + sale.amount);
            }
            return acc;
        }, new Map<string, number>());

        const captainPerformanceData = Array.from(captainPerformanceMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const salesByDay = filteredSales.reduce((acc, sale) => {
            const day = new Date(sale.settledAt).toLocaleDateString('en-US', { weekday: 'short' });
            acc.set(day, (acc.get(day) || 0) + sale.amount);
            return acc;
        }, new Map<string, number>());
        
        const salesChartData = Array.from(salesByDay.entries()).map(([name, sales]) => ({ name, sales }));

        return { totalSales, totalOrders, topItemsData, captainPerformanceData, salesChartData };

    }, [filteredSales]);
    
    const fetchDishOfTheDay = async () => {
        setLoadingDish(true);
        setDishOfTheDay('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const topItemsString = analyticsData.topItemsData.map(item => item.name).join(', ');
            if (!topItemsString) {
                setDishOfTheDay("Not enough sales data to generate a suggestion.");
                return;
            }
            const prompt = `Based on these top selling items (${topItemsString}), suggest a creative and appealing "Dish of the Day" with a short, exciting description.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            // FIX: Per @google/genai guidelines, the .text property should be used to access the generated text content directly from the response.
            const text = response.text;
            if (text) {
                setDishOfTheDay(text);
            } else {
                setDishOfTheDay('Could not fetch suggestion. Please check your API key and connection.');
            }

        } catch(e) {
            console.error(e);
            setDishOfTheDay('Could not fetch suggestion. Please check your API key and connection.');
        } finally {
            setLoadingDish(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Sales Analytics</h1>
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-900 p-1 rounded-full shadow">
                    {['Today', 'Week', 'Month', 'Year'].map(range => (
                        <button key={range} onClick={() => setTimeRange(range)} className={`px-3 py-1 text-sm font-semibold rounded-full ${timeRange === range ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                            {range}
                        </button>
                    ))}
                    <button className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Calendar size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<TrendingUp />} title="Total Sales" value={`₹${analyticsData.totalSales.toLocaleString('en-IN')}`} />
                <StatCard icon={<ShoppingBag />} title="Total Orders" value={analyticsData.totalOrders.toString()} />
                <StatCard icon={<ShoppingBag />} title="Avg. Order Value" value={analyticsData.totalOrders > 0 ? `₹${(analyticsData.totalSales / analyticsData.totalOrders).toFixed(2)}` : '₹0.00'} />
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md">
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Gemini: Dish of the Day Suggestion</h3>
                {dishOfTheDay ? (
                     <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{dishOfTheDay}</p>
                ) : (
                    <p className="text-sm text-gray-500">Click the button to get a suggestion from Gemini based on your top-selling items for the selected period.</p>
                )}
                <button onClick={fetchDishOfTheDay} disabled={loadingDish} className="mt-4 px-4 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400">
                    {loadingDish ? 'Thinking...' : 'Generate Suggestion'}
                </button>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md">
                    <h3 className="font-bold text-lg mb-4">Sales Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.salesChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.5rem', color: 'white' }} cursor={{fill: 'rgba(226, 55, 68, 0.1)'}} />
                            <Legend />
                            <Bar dataKey="sales" fill="#E23744" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md">
                    <h3 className="font-bold text-lg mb-4">Top Selling Items</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={analyticsData.topItemsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {analyticsData.topItemsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md">
                <h3 className="font-bold text-lg mb-4">Captain Performance</h3>
                 {analyticsData.captainPerformanceData.length > 0 ? analyticsData.captainPerformanceData.map(captain => (
                    <div key={captain.name} className="flex items-center justify-between py-2 border-b last:border-b-0 dark:border-gray-700">
                        <span className="font-medium">{captain.name}</span>
                        <span className="font-semibold text-primary">₹{captain.value.toLocaleString('en-IN')}</span>
                    </div>
                )) : <p className="text-sm text-gray-500">No sales recorded for captains in this period.</p>}
            </div>
        </div>
    );
};

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value }) => (
    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-md flex items-start justify-between">
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
        </div>
        <div className="bg-primary/10 text-primary p-3 rounded-full">
            {icon}
        </div>
    </div>
);

export default SalesAnalytics;