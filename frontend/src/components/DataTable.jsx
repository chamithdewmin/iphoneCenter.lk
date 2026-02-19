import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown, Trash2, Pencil, Eye } from 'lucide-react';

const DataTable = ({
  title,
  count,
  data = [],
  columns = [],
  selected = [],
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onView,
  loading = false,
  emptyMessage = "No data found",
  emptyIcon: EmptyIcon,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  renderRowActions,
  getRowId = (row) => row.id,
}) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown className="w-3 h-3 text-gray-500" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  const allSelected = selected.length === data.length && data.length > 0;
  const someSelected = selected.length > 0 && selected.length < data.length;

  return (
    <div className="w-full bg-card rounded-2xl border border-secondary shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-secondary">
        <div className="flex items-center gap-3">
          <span className="text-foreground font-semibold text-lg">{title}</span>
          {count !== undefined && (
            <span className="bg-primary/20 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full border border-primary/30">
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          {EmptyIcon && <EmptyIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />}
          <h3 className="text-xl font-semibold mb-2 text-foreground">No Data Found</h3>
          <p className="text-muted-foreground text-center">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary text-muted-foreground text-xs uppercase tracking-wide">
                  {onSelectAll && (
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = someSelected;
                        }}
                        onChange={onSelectAll}
                        className="rounded border-input bg-background accent-primary cursor-pointer"
                      />
                    </th>
                  )}
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-left font-medium ${column.sortable !== false ? 'cursor-pointer hover:text-foreground' : ''}`}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                    >
                      <span className="flex items-center gap-1">
                        {column.label}
                        {column.sortable !== false && getSortIcon(column.key)}
                      </span>
                    </th>
                  ))}
                  {(onEdit || onDelete || onView || renderRowActions) && (
                    <th className="px-4 py-3" />
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => {
                  const rowId = getRowId(row);
                  const isSelected = selected.includes(rowId);
                  return (
                    <tr
                      key={rowId}
                      className={`border-b border-secondary hover:bg-secondary/50 transition-colors ${
                        isSelected ? 'bg-secondary/30' : ''
                      }`}
                    >
                      {onSelectAll && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelect(rowId)}
                            className="rounded border-input bg-background accent-primary cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={column.key} className="px-4 py-3">
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                      {(onEdit || onDelete || onView || renderRowActions) && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {renderRowActions ? (
                              renderRowActions(row)
                            ) : (
                              <>
                                {onDelete && (
                                  <button
                                    onClick={() => onDelete(row)}
                                    className="hover:text-destructive transition-colors p-1 rounded hover:bg-secondary"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                                {onEdit && (
                                  <button
                                    onClick={() => onEdit(row)}
                                    className="hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                                {onView && (
                                  <button
                                    onClick={() => onView(row)}
                                    className="hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && onPageChange && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-secondary">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors border border-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  if (i === 4 && page < totalPages - 1) {
                    return (
                      <React.Fragment key={page}>
                        <span className="w-8 h-8 flex items-center justify-center text-muted-foreground">...</span>
                        <button
                          onClick={() => onPageChange(totalPages)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === totalPages
                              ? 'bg-secondary text-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </React.Fragment>
                    );
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-secondary text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors border border-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataTable;
