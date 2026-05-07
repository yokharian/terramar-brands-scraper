import { log } from 'apify';

import type { DepartmentInfo, DepartmentLookup, RawApiDepartment, RawApiProduct } from './types.js';

export async function fetchDepartments(apiBaseUrl: string): Promise<RawApiDepartment[]> {
    const url = `${apiBaseUrl}/getDeptos`;
    log.info('Fetching departments', { url });
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as RawApiDepartment[];
    log.info(`Fetched ${data.length} department entries`);
    return data;
}

export async function fetchProducts(apiBaseUrl: string, depto?: string | number, clave?: string): Promise<RawApiProduct[]> {
    const params = new URLSearchParams({ depto: String(depto ?? 0) });
    if (clave) {
        params.set('clave', clave);
    }
    const url = `${apiBaseUrl}/getDescripciones?${params.toString()}`;
    log.info('Fetching products', { url });
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as RawApiProduct[];
    log.info(`Fetched ${data.length} products`);
    return data;
}

export function buildDepartmentLookup(departments: RawApiDepartment[]): DepartmentLookup {
    const lookup: DepartmentLookup = {};
    for (const dept of departments) {
        if (dept.menu !== '3') continue;
        const subDepts: Record<string, string> = {};
        for (const sub of dept.secciones) {
            subDepts[sub.subdepto] = sub.nombre;
        }
        lookup[dept.depto] = {
            name: dept.nombre,
            subdepartments: subDepts,
        } satisfies DepartmentInfo;
    }
    return lookup;
}

export function resolveDepartmentName(lookup: DepartmentLookup, deptId: string): string {
    return lookup[deptId]?.name ?? '';
}

export function resolveSubDepartmentName(lookup: DepartmentLookup, deptId: string, subDeptId: string): string {
    return lookup[deptId]?.subdepartments?.[subDeptId] ?? '';
}