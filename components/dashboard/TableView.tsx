import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Table, TableCategory } from '../../types';
import TableCard from './TableCard';
import OrderModal from './OrderModal';
import { MOCK_MENU } from '../../data/mockData';

const TableView: React.FC = () => {
    const { tables } = useData();
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);

    const handleTableClick = (table: Table) => {
        setSelectedTable(table);
    };

    const handleCloseModal = () => {
        setSelectedTable(null);
    };

    const tablesByCategory = useMemo(() => {
        return tables.reduce((acc, table) => {
            const { category } = table;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(table);
            return acc;
        }, {} as Record<TableCategory, Table[]>);
    }, [tables]);

    const categoryOrder: TableCategory[] = [
        TableCategory.DINE_IN,
        TableCategory.TERRACE,
        TableCategory.GAZEBO,
        TableCategory.BANQUET,
        TableCategory.PARCEL,
    ];

    return (
        <div className="space-y-8">
            {categoryOrder.map(category =>
                tablesByCategory[category]?.length > 0 ? (
                    <div key={category}>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{category}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                            {tablesByCategory[category].map(table => (
                                <TableCard key={table.id} table={table} onClick={() => handleTableClick(table)} />
                            ))}
                        </div>
                    </div>
                ) : null
            )}

            {selectedTable && (
                <OrderModal
                    isOpen={!!selectedTable}
                    onClose={handleCloseModal}
                    table={selectedTable}
                    menu={MOCK_MENU}
                />
            )}
        </div>
    );
};

export default TableView;
