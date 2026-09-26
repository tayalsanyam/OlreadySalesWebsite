import test from 'node:test';import assert from 'node:assert/strict';import {navIdsForRole,ROLE_ACCESS,STAFF_ROLES} from '../lib/staff-roles';

test('staff roles cover admin-only team tab',()=>{assert.ok(!navIdsForRole('sales').includes('team'));assert.ok(!navIdsForRole('editor').includes('team'));assert.ok(navIdsForRole('admin').includes('team'));});
test('sales role has narrow workspace',()=>{const ids=navIdsForRole('sales');assert.deepEqual(ids.sort(),['carts','contacts','journeys','orders','overview'].sort());});
test('role access metadata exists for every role',()=>{for(const r of STAFF_ROLES){assert.ok(ROLE_ACCESS[r].sections.length>0);assert.ok(ROLE_ACCESS[r].summary);}});
