// Aether Table Component
// Data table with sortable and pagination support

import { __createElement, __setAttr, __bindAttr } from '../dom.ts';
import { __effect, Effect } from '../signal.ts';

interface TableColumnProps {
  key: string;
  header?: string;
  sortable?: boolean;
  class?: string;
  children?: (row: Record<string, unknown>) => unknown;
}

interface TableProps {
  data?: Record<string, unknown>[];
  sortable?: boolean;
  paginate?: number;
  class?: string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onPage?: (page: number) => void;
  children?: unknown;
}

interface SortState {
  key: string | null;
  direction: 'asc' | 'desc';
}

// Table Column component
export function TableColumn(props: TableColumnProps): HTMLTableCellElement {
  const el = __createElement('th');
  el.className = 'aether-table-column';

  if (props.class) {
    el.classList.add(props.class);
  }

  if (props.header) {
    el.textContent = props.header;
  }

  if (props.sortable) {
    el.classList.add('aether-table-column--sortable');
  }

  return el;
}

// Main Table component
export function Table(props: TableProps): HTMLTableElement {
  const el = __createElement('table');
  el.className = 'aether-table';

  // Internal state
  let sortState: SortState = { key: null, direction: 'asc' };
  let currentPage = 1;

  // Create table structure
  const thead = __createElement('thead');
  thead.className = 'aether-table-thead';
  const headerRow = __createElement('tr');
  headerRow.className = 'aether-table-header-row';
  thead.appendChild(headerRow);

  const tbody = __createElement('tbody');
  tbody.className = 'aether-table-tbody';

  const tfoot = __createElement('tfoot');
  tfoot.className = 'aether-table-tfoot';
  const footerRow = __createElement('tr');
  const footerCell = __createElement('td');
  footerCell.className = 'aether-table-footer-cell';
  tfoot.appendChild(footerRow);
  footerRow.appendChild(footerCell);

  el.appendChild(thead);
  el.appendChild(tbody);
  el.appendChild(tfoot);

  // Track column definitions
  const columns: TableColumnProps[] = [];

  // Parse children to get column definitions
  if (props.children) {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    for (const child of children) {
      if (child instanceof HTMLTableCellElement && child.classList.contains('aether-table-column')) {
        // Extract column props from element
        const columnProps: TableColumnProps = {
          key: (child as HTMLTableCellElement & { _columnKey?: string })._columnKey || '',
          header: child.textContent || undefined,
          sortable: child.classList.contains('aether-table-column--sortable')
        };
        columns.push(columnProps);
        headerRow.appendChild(child);
      }
    }
  }

  // Render function for table body
  const renderBody = () => {
    tbody.innerHTML = '';

    let displayData = props.data || [];

    // Sort data if needed
    if (sortState.key && props.sortable) {
      displayData = [...displayData].sort((a, b) => {
        const aVal = a[sortState.key!];
        const bVal = b[sortState.key!];
        const modifier = sortState.direction === 'asc' ? 1 : -1;

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return modifier;
        if (bVal === null || bVal === undefined) return -modifier;
        return aVal < bVal ? -modifier : modifier;
      });
    }

    // Paginate data if needed
    let paginatedData = displayData;
    if (props.paginate && props.paginate > 0) {
      const start = (currentPage - 1) * props.paginate;
      const end = start + props.paginate;
      paginatedData = displayData.slice(start, end);

      // Update pagination info
      const totalPages = Math.ceil(displayData.length / props.paginate);
      footerCell.setAttribute('colspan', String(columns.length || 1));
      footerCell.textContent = `Page ${currentPage} of ${totalPages} (${displayData.length} total)`;
    } else {
      footerCell.textContent = `${displayData.length} items`;
    }

    // Render rows
    for (const row of paginatedData) {
      const tr = __createElement('tr');
      tr.className = 'aether-table-row';

      for (const column of columns) {
        const td = __createElement('td');
        td.className = 'aether-table-cell';

        // Use render function if provided, otherwise use key value
        if (column.children && typeof column.children === 'function') {
          const content = column.children(row);
          if (content instanceof Node) {
            td.appendChild(content);
          } else if (typeof content === 'string' || typeof content === 'number') {
            td.textContent = String(content);
          }
        } else {
          const value = row[column.key];
          td.textContent = value !== null && value !== undefined ? String(value) : '';
        }

        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }
  };

  // Set up sort handler on header
  headerRow.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('aether-table-column--sortable')) {
      const columnKey = (target as HTMLTableCellElement & { _columnKey?: string })._columnKey;
      if (columnKey) {
        if (sortState.key === columnKey) {
          sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
          sortState.key = columnKey;
          sortState.direction = 'asc';
        }
        if (props.onSort) {
          props.onSort(columnKey, sortState.direction);
        }
        renderBody();
      }
    }
  });

  // Initial render
  renderBody();

  // Set up effect for reactive updates
  const dataEffect = __effect(() => {
    // Access data to create dependency
    const _ = props.data;
    renderBody();
  });

  // Store effect for cleanup
  (el as HTMLTableElement & { _aetherEffects?: Effect[] })._aetherEffects = (el as HTMLTableElement & { _aetherEffects?: Effect[] })._aetherEffects || [];
  (el as HTMLTableElement & { _aetherEffects?: Effect[] })._aetherEffects!.push(dataEffect);

  if (props.class) {
    el.classList.add(props.class);
  }

  return el;
}

// Attach Column to Table
(Table as typeof Table & { Column: typeof TableColumn }).Column = TableColumn;
