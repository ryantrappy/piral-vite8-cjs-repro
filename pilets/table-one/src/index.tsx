import type { PiletApi } from 'piral';
import { TableOne } from './TableOne';

console.log('[table-one] module evaluated');

export function setup(api: PiletApi) {
  console.log('[table-one] setup called');
  api.registerExtension('table-one', () => <TableOne />);
}
