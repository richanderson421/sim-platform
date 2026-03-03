import { stringify } from 'csv-stringify/sync';
export function toCsv(rows: object[]) { return stringify(rows, { header: true }); }
