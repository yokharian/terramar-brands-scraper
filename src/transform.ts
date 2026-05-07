import { resolveDepartmentName, resolveSubDepartmentName } from './api.js';
import type { DepartmentLookup, ProductItem, RawApiProduct } from './types.js';

export interface SiteConfig {
    baseUrl: string;
}

function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function buildImageUrls(product: RawApiProduct, siteConfig: SiteConfig): string[] {
    const urls: string[] = [];
    urls.push(`${siteConfig.baseUrl}/pics/productos/grandes/${product.clave}.png`);
    if (product.imagen) {
        const fullUrl = product.imagen.startsWith('http')
            ? product.imagen
            : `${siteConfig.baseUrl}${product.imagen}`;
        if (!urls.includes(fullUrl)) {
            urls.push(fullUrl);
        }
    }
    return urls;
}

export function transformProduct(
    raw: RawApiProduct,
    deptLookup: DepartmentLookup,
    siteConfig: SiteConfig,
): ProductItem {
    return {
        sku: raw.clave,
        name: raw.producto,
        price: parseInt(raw.precio, 10) || 0,
        currency: 'MXN',
        departmentId: raw.departamento,
        department: resolveDepartmentName(deptLookup, raw.departamento),
        subdepartmentId: raw.subdepartamento,
        subdepartment: resolveSubDepartmentName(deptLookup, raw.departamento, raw.subdepartamento),
        description: stripHtml(raw.descripcion),
        application: stripHtml(raw.aplicacion),
        ingredients: stripHtml(raw.ingredientes),
        olfactiveFamily: raw.familiaOlfativa,
        imageUrls: buildImageUrls(raw, siteConfig),
        hasCarousel: raw.carrusel === 'S',
        variantClass: raw.clase,
        url: `${siteConfig.baseUrl}/products/product/${raw.clave}`,
    };
}

export { stripHtml };