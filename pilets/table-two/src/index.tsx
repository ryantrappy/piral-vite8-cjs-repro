import type { PiletApi } from 'piral';
import { TableTwo } from './TableTwo';

console.log('[table-two] module evaluated');

export function setup(api: PiletApi) {
  console.log('[table-two] setup called');
  api.registerExtension('table-two', () => <TableTwo />);
}
