import { describe, expect, it } from 'vitest';

import { buildDepartmentLookup, resolveDepartmentName, resolveSubDepartmentName } from '../src/api.js';
import { DEFAULT_API_BASE_URL, MOCK_DEPARTMENTS } from './conftest.js';

describe('DEFAULT_API_BASE_URL', () => {
    it('should point to the Terramar Brands WCF API', () => {
        expect(DEFAULT_API_BASE_URL).toBe('https://terramarbrands.mx/wsTerramarV2/Service1.svc');
    });
});

describe('buildDepartmentLookup', () => {
    it('should only include departments with menu=3', () => {
        const result = buildDepartmentLookup(MOCK_DEPARTMENTS);
        expect(Object.keys(result)).toHaveLength(2);
        expect(result).toHaveProperty('1');
        expect(result).toHaveProperty('2');
    });

    it('should exclude menu=2 and menu=4 entries', () => {
        const result = buildDepartmentLookup(MOCK_DEPARTMENTS);
        const names = Object.values(result).map((v) => v.name);
        expect(names).not.toContain('Historya');
        expect(names).not.toContain('Reuniones de oportunidad');
    });

    it('should build subdepartment maps correctly', () => {
        const result = buildDepartmentLookup(MOCK_DEPARTMENTS);
        expect(result['1'].subdepartments).toEqual({ '1': 'Rostro', '2': 'Ojos' });
        expect(result['2'].subdepartments).toEqual({ '1': 'Él', '2': 'Ella' });
    });

    it('should return empty lookup for empty input', () => {
        const result = buildDepartmentLookup([]);
        expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle departments with no subdepartments', () => {
        const result = buildDepartmentLookup([
            { depto: '3', nombre: 'Cuidado Capilar', menu: '3', secciones: [] },
        ]);
        expect(result['3'].name).toBe('Cuidado Capilar');
        expect(result['3'].subdepartments).toEqual({});
    });
});

describe('resolveDepartmentName', () => {
    const lookup = buildDepartmentLookup([
        { depto: '1', nombre: 'Color', menu: '3', secciones: [] },
        { depto: '2', nombre: 'Fragancias', menu: '3', secciones: [] },
    ]);

    it('should resolve department name by ID', () => {
        expect(resolveDepartmentName(lookup, '1')).toBe('Color');
        expect(resolveDepartmentName(lookup, '2')).toBe('Fragancias');
    });

    it('should return empty string for unknown department', () => {
        expect(resolveDepartmentName(lookup, '99')).toBe('');
    });
});

describe('resolveSubDepartmentName', () => {
    const lookup = buildDepartmentLookup([
        { depto: '1', nombre: 'Color', menu: '3', secciones: [
            { subdepto: '1', nombre: 'Rostro' },
            { subdepto: '2', nombre: 'Ojos' },
        ] },
    ]);

    it('should resolve subdepartment name', () => {
        expect(resolveSubDepartmentName(lookup, '1', '1')).toBe('Rostro');
        expect(resolveSubDepartmentName(lookup, '1', '2')).toBe('Ojos');
    });

    it('should return empty string for unknown subdepartment', () => {
        expect(resolveSubDepartmentName(lookup, '1', '99')).toBe('');
        expect(resolveSubDepartmentName(lookup, '99', '1')).toBe('');
    });
});