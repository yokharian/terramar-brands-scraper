import * as cheerio from 'cheerio';
import { resolveDepartmentName, resolveSubDepartmentName } from './api.js';
import type { DepartmentLookup, ProductItem, RawApiProduct } from './types.js';

export interface SiteConfig {
    baseUrl: string;
    webImagesBaseUrl: string;
}

function stripHtml(html: string): string {
    if (!html) return '';
    const $ = cheerio.load(html);
    $('br').replaceWith('\n');
    $('p, li').each(function () { $(this).append('\n'); });
    return $.text()
        .replace(/\u00A0/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function buildImageUrls(product: RawApiProduct, webImagesBaseUrl: string, baseUrl: string): string[] {
    const urls: string[] = [];
    urls.push(`${webImagesBaseUrl}/shopping-cart/cart-products/${product.clave}.jpg`);
    if (product.imagen) {
        const fullUrl = product.imagen.startsWith('/') ? `${baseUrl}${product.imagen}` : product.imagen;
        if (!urls.includes(fullUrl)) {
            urls.push(fullUrl);
        }
    }
    return urls;
}

function buildFichaTecnica(product: RawApiProduct, webImagesBaseUrl: string): string {
    return `${webImagesBaseUrl}/webpage/productos/fichasTecnicas/${product.clave}.pdf`;
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
        imageUrls: buildImageUrls(raw, siteConfig.webImagesBaseUrl, siteConfig.baseUrl),
        fichaTecnica: buildFichaTecnica(raw, siteConfig.webImagesBaseUrl),
        hasCarousel: raw.carrusel === 'S',
        variantClass: raw.clase,
        url: `${siteConfig.baseUrl}/products/product/${raw.clave}`,
    };
}

export { stripHtml };