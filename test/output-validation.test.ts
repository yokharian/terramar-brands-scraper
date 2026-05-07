import { describe, expect, it } from 'vitest';

import { buildDepartmentLookup } from '../src/api.js';
import { transformProduct } from '../src/transform.js';
import type { ProductItem } from '../src/types.js';
import { MOCK_DEPT_LOOKUP, MOCK_PRODUCT, SITE_CONFIG } from './conftest.js';

const REQUIRED_FIELDS: (keyof ProductItem)[] = [
    'sku',
    'name',
    'price',
    'currency',
    'departmentId',
    'department',
    'subdepartmentId',
    'subdepartment',
    'description',
    'application',
    'ingredients',
    'olfactiveFamily',
    'imageUrls',
    'hasCarousel',
    'variantClass',
    'url',
];

const TYPE_CHECKS: { field: keyof ProductItem; expected: string }[] = [
    { field: 'sku', expected: 'string' },
    { field: 'name', expected: 'string' },
    { field: 'price', expected: 'number' },
    { field: 'currency', expected: 'string' },
    { field: 'departmentId', expected: 'string' },
    { field: 'department', expected: 'string' },
    { field: 'subdepartmentId', expected: 'string' },
    { field: 'subdepartment', expected: 'string' },
    { field: 'description', expected: 'string' },
    { field: 'application', expected: 'string' },
    { field: 'ingredients', expected: 'string' },
    { field: 'olfactiveFamily', expected: 'string' },
    { field: 'imageUrls', expected: 'object' },
    { field: 'hasCarousel', expected: 'boolean' },
    { field: 'variantClass', expected: 'string' },
    { field: 'url', expected: 'string' },
];

describe('Output shape validation', () => {
    it('should include all required fields in transformed output', () => {
        const result = transformProduct(MOCK_PRODUCT, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        for (const field of REQUIRED_FIELDS) {
            expect(result).toHaveProperty(field);
            expect(result[field]).not.toBeUndefined();
        }
    });

    it('should produce correct types for all fields', () => {
        const result = transformProduct(MOCK_PRODUCT, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        for (const { field, expected } of TYPE_CHECKS) {
            expect(typeof result[field]).toBe(expected);
        }
    });

    it('should produce imageUrls as an array of strings', () => {
        const result = transformProduct(MOCK_PRODUCT, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(Array.isArray(result.imageUrls)).toBe(true);
        for (const url of result.imageUrls) {
            expect(typeof url).toBe('string');
        }
    });

    it('should produce valid URL for product page', () => {
        const result = transformProduct(MOCK_PRODUCT, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(result.url).toMatch(/^https:\/\//);
        expect(result.url).toContain('/products/product/');
    });

    it('should produce valid image URLs', () => {
        const result = transformProduct(MOCK_PRODUCT, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        for (const url of result.imageUrls) {
            expect(url).toMatch(/^https:\/\//);
        }
    });

    it('should produce non-empty string fields for a typical product', () => {
        const result = transformProduct(MOCK_PRODUCT, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(result.sku.length).toBeGreaterThan(0);
        expect(result.name.length).toBeGreaterThan(0);
        expect(result.description.length).toBeGreaterThan(0);
        expect(result.department.length).toBeGreaterThan(0);
        expect(result.subdepartment.length).toBeGreaterThan(0);
    });

    it('should handle product with all empty optional fields', () => {
        const sparseProduct = {
            ...MOCK_PRODUCT,
            familiaOlfativa: '',
            clase: '',
            imagen: '',
            carrusel: '',
        };
        const result = transformProduct(sparseProduct, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        for (const field of REQUIRED_FIELDS) {
            expect(result).toHaveProperty(field);
        }
        expect(result.olfactiveFamily).toBe('');
        expect(result.variantClass).toBe('');
        expect(result.hasCarousel).toBe(false);
        expect(result.imageUrls).toHaveLength(1);
    });

    it('should handle product with unicode in name and description', () => {
        const unicodeProduct = {
            ...MOCK_PRODUCT,
            producto: 'Colonia Niña — Él & Ella',
            descripcion: '<p>Fragancia con notas de café y ñ.</p>',
        };
        const result = transformProduct(unicodeProduct, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(result.name).toContain('ñ');
        expect(result.name).toContain('—');
        expect(result.description).toContain('caf');
    });

    it('should handle product with malformed HTML in description', () => {
        const malformedProduct = {
            ...MOCK_PRODUCT,
            descripcion: '<p>Unclosed paragraph<b>Bold text</p>',
        };
        const result = transformProduct(malformedProduct, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(result.description).toContain('Unclosed paragraph');
        expect(result.description).toContain('Bold text');
    });

    it('should handle product with HTML entities in description', () => {
        const entityProduct = {
            ...MOCK_PRODUCT,
            descripcion: '<p>5 &lt; 10 &amp; 20 &gt; 15</p>',
        };
        const result = transformProduct(entityProduct, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(result.description).toContain('5 < 10 & 20 > 15');
    });
});

describe('Department lookup output validation', () => {
    it('should resolve all department names for products in known departments', () => {
        const lookup = buildDepartmentLookup([
            { depto: '1', nombre: 'Color', menu: '3', secciones: [
                { subdepto: '1', nombre: 'Rostro' },
            ] },
            { depto: '5', nombre: 'Cuidado de la Piel', menu: '3', secciones: [
                { subdepto: '1', nombre: 'Limpieza' },
            ] },
        ]);
        const product1 = { ...MOCK_PRODUCT, departamento: '1', subdepartamento: '1' };
        const product5 = { ...MOCK_PRODUCT, departamento: '5', subdepartamento: '1' };

        const result1 = transformProduct(product1, lookup, SITE_CONFIG);
        const result5 = transformProduct(product5, lookup, SITE_CONFIG);

        expect(result1.department).toBe('Color');
        expect(result1.subdepartment).toBe('Rostro');
        expect(result5.department).toBe('Cuidado de la Piel');
        expect(result5.subdepartment).toBe('Limpieza');
    });

    it('should produce empty department names for unknown departments without crashing', () => {
        const unknownProduct = { ...MOCK_PRODUCT, departamento: '99', subdepartamento: '99' };
        const result = transformProduct(unknownProduct, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(result.department).toBe('');
        expect(result.subdepartment).toBe('');
        for (const field of REQUIRED_FIELDS) {
            expect(result).toHaveProperty(field);
        }
    });
});