import * as React from 'react';
import { useMemo } from 'react';
import { useTable } from 'react-table';

type Product = { product: string; price: number };

export function TableTwo() {
  const columns = useMemo(() => [
    { Header: 'Product', accessor: 'product' as const },
    { Header: 'Price', accessor: 'price' as const },
  ], []);
  const data = useMemo<Product[]>(() => [
    { product: 'Keyboard', price: 99 },
    { product: 'Mouse', price: 49 },
    { product: 'Monitor', price: 399 },
  ], []);
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

  return <div><h3>Table Two — Products</h3><table {...getTableProps()} border={1} cellPadding={6}>
    <thead>{headerGroups.map(group => <tr {...group.getHeaderGroupProps()}>{group.headers.map(column =>
      <th {...column.getHeaderProps()}>{column.render('Header')}</th>)}</tr>)}</thead>
    <tbody {...getTableBodyProps()}>{rows.map(row => { prepareRow(row); return <tr {...row.getRowProps()}>
      {row.cells.map(cell => <td {...cell.getCellProps()}>{cell.render('Cell')}</td>)}
    </tr>; })}</tbody>
  </table></div>;
}
