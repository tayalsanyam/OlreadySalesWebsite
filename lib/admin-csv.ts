import {csvCell} from './order-report';

export function rowsToCsv(rows:Record<string, unknown>[]) {
 if (!rows.length) return '\ufeff';
 const keys = Object.keys(rows[0]);
 const lines = [keys.map((k) => csvCell(k)).join(',')];
 for (const row of rows) lines.push(keys.map((k) => csvCell(row[k])).join(','));
 return `\ufeff${lines.join('\r\n')}`;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
 if (!rows.length) return;
 const url = URL.createObjectURL(new Blob([rowsToCsv(rows)], {type: 'text/csv;charset=utf-8'}));
 const a = document.createElement('a');
 a.href = url;
 a.download = filename;
 a.click();
 setTimeout(() => URL.revokeObjectURL(url), 1000);
}
