import * as React from 'react';
import { useMemo } from 'react';
import { useTable } from 'react-table';

type Employee = { name: string; role: string };

export function TableOne() {
  const columns = useMemo(() => [
    { Header: 'Name', accessor: 'name' as const },
    { Header: 'Role', accessor: 'role' as const },
  ], []);
  const data = useMemo<Employee[]>(() => [
    { name: 'Alice', role: 'Developer' },
    { name: 'Bob', role: 'Designer' },
    { name: 'Charlie', role: 'Manager' },
  ], []);
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

  return <div><h3>Table One — Employees</h3><table {...getTableProps()} border={1} cellPadding={6}>
    <thead>{headerGroups.map(group => <tr {...group.getHeaderGroupProps()}>{group.headers.map(column =>
      <th {...column.getHeaderProps()}>{column.render('Header')}</th>)}</tr>)}</thead>
    <tbody {...getTableBodyProps()}>{rows.map(row => { prepareRow(row); return <tr {...row.getRowProps()}>
      {row.cells.map(cell => <td {...cell.getCellProps()}>{cell.render('Cell')}</td>)}
    </tr>; })}</tbody>
  </table></div>;
}
