/**
 * WCF API raw product response.
 * Each variant/shade is a separate entry (same `producto`, different `clave`/`clase`).
 * ~225 total entries across 10 departments.
 */
export interface RawApiProduct {
    /** Always "0" */
    id: string;
    /** Product SKU / code (unique per variant) — maps to output `sku` */
    clave: string;
    /** Product name (Spanish) — maps to output `name` */
    producto: string;
    /** Price in MXN as integer string (range 170–1670) — parsed to output `price` */
    precio: string;
    /** HTML product description — stripped to output `description` */
    descripcion: string;
    /** HTML application/usage instructions — stripped to output `application` */
    aplicacion: string;
    /** HTML ingredients info — stripped to output `ingredients` */
    ingredientes: string;
    /** Olfactory family (fragrances only, 4/225 products) — maps to output `olfactiveFamily` */
    familiaOlfativa: string;
    /** Perfumer name (1/225 products) — not in output */
    perfumista: string;
    /** URL slug (1/225 products) — not in output */
    link: string;
    /** Department code 1–10 — maps to output `departmentId`, resolved to `department` via /getDeptos */
    departamento: string;
    /** Subdepartment code — maps to output `subdepartmentId`, resolved to `subdepartment` via /getDeptos secciones */
    subdepartamento: string;
    /** Brand name (3/225 products, mostly empty) — not in output */
    marca: string;
    /** Variant/shade class (30/225 products) — maps to output `variantClass` */
    clase: string;
    /** Image URL (30/225, mostly category placeholders) — used as fallback in output `imageUrls` */
    imagen: string;
    /** "S" = has image carousel (95/225), "" = no carousel — maps to output `hasCarousel` */
    carrusel: string;
}

/** WCF API department response (menu=3 entries are product departments) */
export interface RawApiDepartment {
    depto: string;
    nombre: string;
    /** "3" = product department, others are site navigation */
    menu: string;
    secciones: RawApiSubDepartment[];
}

export interface RawApiSubDepartment {
    subdepto: string;
    nombre: string;
}

/** Department info resolved from /getDeptos (menu=3 only) */
export interface DepartmentInfo {
    name: string;
    subdepartments: Record<string, string>;
}

export type DepartmentLookup = Record<string, DepartmentInfo>;

/**
 * Normalized product item pushed to Apify dataset.
 *
 * Transformation rules:
 * - `sku` ← `clave` (direct)
 * - `name` ← `producto` (direct)
 * - `price` ← `precio` (parseInt)
 * - `currency` ← fixed "MXN"
 * - `departmentId` ← `departamento` (direct)
 * - `department` ← lookup `/getDeptos` menu=3 by `departamento`
 * - `subdepartmentId` ← `subdepartamento` (direct)
 * - `subdepartment` ← lookup `/getDeptos` secciones by `departamento` + `subdepartamento`
 * - `description` ← `descripcion` (HTML stripped)
 * - `application` ← `aplicacion` (HTML stripped)
 * - `ingredients` ← `ingredientes` (HTML stripped)
 * - `olfactiveFamily` ← `familiaOlfativa` (direct)
 * - `imageUrls` ← constructed: `{webImagesBaseUrl}/shopping-cart/color/{clave}.jpg` + `imagen` fallback
 * - `fichaTecnica` ← constructed: `{webImagesBaseUrl}/webpage/productos/fichasTecnicas/{clave}.pdf`
 * - `hasCarousel` ← `carrusel === "S"`
 * - `variantClass` ← `clase` (direct)
 * - `url` ← constructed: `{SITE}/products/product/{clave}`
 */
export interface ProductItem {
    sku: string;
    name: string;
    price: number;
    currency: string;
    departmentId: string;
    department: string;
    subdepartmentId: string;
    subdepartment: string;
    description: string;
    application: string;
    ingredients: string;
    olfactiveFamily: string;
    imageUrls: string[];
    fichaTecnica: string;
    hasCarousel: boolean;
    variantClass: string;
    url: string;
}

/** Actor input schema (matches .actor/input_schema.json) */
export interface Input {
    baseUrl?: string;
    webImagesBaseUrl?: string;
    apiBaseUrl?: string;
    maxRequestsPerCrawl: number;
}