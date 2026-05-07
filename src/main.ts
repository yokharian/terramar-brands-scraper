import { CheerioCrawler } from '@crawlee/cheerio';
import { Actor, log } from 'apify';

import { buildDepartmentLookup, fetchDepartments, fetchProducts } from './api.js';
import { transformProduct } from './transform.js';
import type { Input } from './types.js';

function logMemory(label: string) {
    const usage = process.memoryUsage();
    log.info(`Memory [${label}]: RSS=${Math.round(usage.rss / 1048576)}MB, Heap=${Math.round(usage.heapUsed / 1048576)}MB/${Math.round(usage.heapTotal / 1048576)}MB`);
}

await Actor.init();

const input = await Actor.getInput<Input>();

// Defaults match .actor/input_schema.json
const baseUrl = input?.baseUrl?.replace(/\/+$/, '') ?? 'https://terramarbrands.com.mx';
const apiBaseUrl = input?.apiBaseUrl?.replace(/\/+$/, '') ?? 'https://terramarbrands.mx/wsTerramarV2/Service1.svc';

const { maxRequestsPerCrawl = 50 } = input ?? ({} as Input);

const siteConfig = { baseUrl };

log.info('Configuration', { baseUrl, apiBaseUrl, maxRequestsPerCrawl });
logMemory('startup');

const departments = await fetchDepartments(apiBaseUrl);
const deptLookup = buildDepartmentLookup(departments);

const productDeptIds = Object.keys(deptLookup);
log.info(`Found ${productDeptIds.length} product departments: ${productDeptIds.join(', ')}`);

const crawler = new CheerioCrawler({
    maxRequestsPerCrawl,
    async requestHandler({ request }) {
        const label = request.userData?.label as string;

        if (label === 'CATALOG') {
            log.info('Processing catalog request', { url: request.url });
            const allProducts = await fetchProducts(apiBaseUrl, 0);
            log.info(`Processing ${allProducts.length} products from full catalog`);

            for (const raw of allProducts) {
                const item = transformProduct(raw, deptLookup, siteConfig);
                await Actor.pushData(item);
            }
            log.info(`Pushed ${allProducts.length} products to dataset`);
            return;
        }

        if (label === 'DEPT') {
            const deptId = request.userData?.deptId as string;
            log.info('Processing department request', { url: request.url, deptId });
            const products = await fetchProducts(apiBaseUrl, deptId);
            log.info(`Processing ${products.length} products from department ${deptId}`);

            for (const raw of products) {
                const item = transformProduct(raw, deptLookup, siteConfig);
                await Actor.pushData(item);
            }
            log.info(`Pushed ${products.length} products from department ${deptId}`);
            return;
        }

        log.warning('Unknown request label, treating as catalog', { label, url: request.url });
        const allProducts = await fetchProducts(apiBaseUrl, 0);
        for (const raw of allProducts) {
            const item = transformProduct(raw, deptLookup, siteConfig);
            await Actor.pushData(item);
        }
        log.info(`Pushed ${allProducts.length} products from default handler`);
    },
});

await crawler.run([{ url: `${baseUrl}/products`, userData: { label: 'CATALOG' } }]);

logMemory('after-crawl');
await Actor.exit();