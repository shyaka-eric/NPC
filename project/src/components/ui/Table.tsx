import React from 'react';

type TableColumn<T> = {
  header: React.ReactNode;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
};

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  headerClassName?: string;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
}

function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
  headerClassName = '',
  rowClassName,
  onRowClick,
}: TableProps<T>) {
  const renderCell = (item: T, column: TableColumn<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    } else {
      return item[column.accessor] as React.ReactNode;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[100px] flex items-center justify-center">
        <div className="animate-pulse flex space-x-2 items-center">
          <div className="h-4 w-4 bg-slate-300 rounded-full"></div>
          <div className="h-4 w-20 bg-slate-300 rounded"></div>
          <span className="text-sm text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-slate-200 ${className}`}>
        <thead className={headerClassName || 'bg-slate-50'}>
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                scope="col"
                className={`py-3.5 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-sm text-center text-slate-500 font-medium"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={keyExtractor(item)}
                className={`${
                  onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''
                } ${rowClassName ? rowClassName(item, idx) : ''}`}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-4 text-sm text-slate-900 ${column.className || ''}`}
                  >
                    {renderCell(item, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;