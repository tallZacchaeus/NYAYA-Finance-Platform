'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from './animate-in';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyState,
  className = '',
}: DataTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={`w-full overflow-x-auto rounded-xl ${className}`}
      style={{ border: '1px solid #2D1A73' }}>
      <table className="w-full text-sm font-body border-collapse">
        <thead>
          <tr style={{ background: '#13093B', borderBottom: '1px solid #2D1A73' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${col.className ?? ''}`}
                style={{ color: '#A89FB8' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {data.map((row, i) => (
            <motion.tr
              key={keyExtractor(row, i)}
              variants={staggerItem}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
              style={{ borderBottom: '1px solid #1A0F4D' }}
              whileHover={onRowClick ? { background: '#13093B' } : {}}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3.5 ${col.className ?? ''}`}
                  style={{ color: '#F5E8D3' }}
                >
                  {col.render(row, i)}
                </td>
              ))}
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}
