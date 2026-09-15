import React from 'react';
import { usePOS } from '../../context/POSContext';
import { TableGrid } from './SubComponents/TableGrid';
import { OrderPOS } from './SubComponents/OrderPOS';
import { TableItem } from '../../types';

interface PosTabProps {
  onCheckoutTable: (table: TableItem) => void;
  onSplitMergeTable: (table: TableItem) => void;
  onDeliveryOrder?: () => void;
}

export const PosTab: React.FC<PosTabProps> = ({
  onCheckoutTable,
  onSplitMergeTable,
  onDeliveryOrder,
}) => {
  const { activeTable, setActiveTable } = usePOS();

  return (
    <div className="w-full h-full">
      {activeTable ? (
        <OrderPOS
          table={activeTable}
          onBack={() => setActiveTable(null)}
          onCheckout={() => onCheckoutTable(activeTable)}
          onDeliveryOrder={onDeliveryOrder}
        />
      ) : (
        <TableGrid
          onSelectTable={(table) => setActiveTable(table)}
          onCheckoutTable={onCheckoutTable}
          onSplitMergeTable={onSplitMergeTable}
        />
      )}
    </div>
  );
};
