import { describe, expect, it } from 'vitest';

import { stripHtml, transformProduct } from '../src/transform.js';
import { DEFAULT_BASE_URL, MOCK_DEPT_LOOKUP, MOCK_PRODUCT, SITE_CONFIG } from './conftest.js';

describe('stripHtml', () => {
    it('should strip HTML tags and decode entities', () => {
        expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
    });

    it('should convert </p> to newlines', () => {
        const result = stripHtml('<p>Line 1</p><p>Line 2</p>');
        expect(result).toBe('Line 1\nLine 2');
    });

    it('should convert </li> to newlines', () => {
        const result = stripHtml('<ul><li>Item 1</li><li>Item 2</li></ul>');
        expect(result).toBe('Item 1\nItem 2');
    });

    it('should convert <br> to newlines', () => {
        expect(stripHtml('Line 1<br/>Line 2')).toBe('Line 1\nLine 2');
        expect(stripHtml('Line 1<br>Line 2')).toBe('Line 1\nLine 2');
    });

    it('should decode HTML entities', () => {
        expect(stripHtml('Tom &amp; Jerry')).toBe('Tom & Jerry');
        expect(stripHtml('5 &lt; 10')).toBe('5 < 10');
        expect(stripHtml('a &quot;b&quot; c')).toBe('a "b" c');
        expect(stripHtml("it&#39;s")).toBe("it's");
        expect(stripHtml('no&nbsp;break')).toBe('no break');
    });

    it('should collapse excessive newlines to max two', () => {
        const result = stripHtml('<p>A</p><br/><br/><br/><p>B</p>');
        expect(result).toBe('A\n\nB');
    });

    it('should trim whitespace', () => {
        expect(stripHtml('  <p>Hello</p>  ')).toBe('Hello');
    });

    it('should return empty string for empty input', () => {
        expect(stripHtml('')).toBe('');
    });
});

describe('transformProduct', () => {
    it('should transform a raw API product into normalized output', () => {
        const result = transformProduct(MOCK_PRODUCT, MOCK_DEPT_LOOKUP, SITE_CONFIG);

        expect(result.sku).toBe('A');
        expect(result.name).toBe('Maquillaje Compacto 11.5g');
        expect(result.price).toBe(630);
        expect(result.currency).toBe('MXN');
        expect(result.departmentId).toBe('1');
        expect(result.department).toBe('Color');
        expect(result.subdepartmentId).toBe('1');
        expect(result.subdepartment).toBe('Rostro');
        expect(result.description).toContain('Brinda al cutis una apariencia perfecta.');
        expect(result.description).toContain('Ideal para todo tipo de piel.');
        expect(result.application).toBe('Pasar la esponja en el compacto.');
        expect(result.ingredients).toContain('Vitamina E');
        expect(result.ingredients).toContain('Actividad antioxidante.');
        expect(result.olfactiveFamily).toBe('');
        expect(result.hasCarousel).toBe(true);
        expect(result.variantClass).toBe('');
        expect(result.url).toBe(`${DEFAULT_BASE_URL}/products/product/A`);
    });

    it('should construct primary image URL from clave', () => {
        const result = transformProduct(MOCK_PRODUCT, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(result.imageUrls[0]).toBe(`${DEFAULT_BASE_URL}/pics/productos/grandes/A.png`);
    });

    it('should include imagen URL when present as relative path', () => {
        const productWithImage = { ...MOCK_PRODUCT, imagen: '/pics/productos/grandes/1.png' };
        const result = transformProduct(productWithImage, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(result.imageUrls).toHaveLength(2);
        expect(result.imageUrls[1]).toBe(`${DEFAULT_BASE_URL}/pics/productos/grandes/1.png`);
    });

    it('should include imagen URL when present as full URL', () => {
        const productWithImageUrl = { ...MOCK_PRODUCT, imagen: 'https://example.com/image.png' };
        const result = transformProduct(productWithImageUrl, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(result.imageUrls).toHaveLength(2);
        expect(result.imageUrls[1]).toBe('https://example.com/image.png');
    });

    it('should not duplicate image URLs', () => {
        const dupe = { ...MOCK_PRODUCT, imagen: `${DEFAULT_BASE_URL}/pics/productos/grandes/A.png` };
        const result = transformProduct(dupe, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(result.imageUrls).toHaveLength(1);
    });

    it('should handle empty imagen field', () => {
        const result = transformProduct(MOCK_PRODUCT, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(result.imageUrls).toHaveLength(1);
    });

    it('should set hasCarousel to false when carrusel is empty', () => {
        const noCarousel = { ...MOCK_PRODUCT, carrusel: '' };
        expect(transformProduct(noCarousel, MOCK_DEPT_LOOKUP, SITE_CONFIG).hasCarousel).toBe(false);
    });

    it('should default price to 0 for unparseable values', () => {
        const noPrice = { ...MOCK_PRODUCT, precio: 'invalid' };
        expect(transformProduct(noPrice, MOCK_DEPT_LOOKUP, SITE_CONFIG).price).toBe(0);
    });

    it('should preserve variantClass from clase', () => {
        const withClass = { ...MOCK_PRODUCT, clase: '5' };
        expect(transformProduct(withClass, MOCK_DEPT_LOOKUP, SITE_CONFIG).variantClass).toBe('5');
    });

    it('should return empty strings for unknown department', () => {
        const unknownDept = { ...MOCK_PRODUCT, departamento: '99', subdepartamento: '99' };
        const result = transformProduct(unknownDept, MOCK_DEPT_LOOKUP, SITE_CONFIG);
        expect(result.department).toBe('');
        expect(result.subdepartment).toBe('');
    });

    it('should use custom baseUrl for product URLs', () => {
        const customConfig = { baseUrl: 'https://custom.example.com' };
        const result = transformProduct(MOCK_PRODUCT, MOCK_DEPT_LOOKUP, customConfig);
        expect(result.url).toBe('https://custom.example.com/products/product/A');
        expect(result.imageUrls[0]).toBe('https://custom.example.com/pics/productos/grandes/A.png');
    });
});