import test from 'node:test';
import assert from 'node:assert/strict';
import {rowsToCsv} from '../lib/admin-csv';

test('admin CSV escapes formula injection', () => {
 const csv = rowsToCsv([{name: '=1+1', note: 'A, "B"'}]);
 assert.ok(csv.includes('"\'=1+1"'));
 assert.ok(csv.includes('"A, ""B"""'));
});
