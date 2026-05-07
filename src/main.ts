import { CheerioCrawler } from '@crawlee/cheerio';
import { Actor, log } from 'apify';

import { buildDepartmentLookup,fetchDepartments, fetchProducts } from './api.js';
import { transformProduct } from './transform.js';
import type { Input } from './types.js';

await Actor.init();

const input = await Actor.getInput<Input>();

const {
    startUrls = [{ url: 'https://www.terramarbrands.com.mx/products', userData: {} } as const],
    maxRequestsPerCrawl = 50,
} = input ?? ({} as Input);

const departments = await fetchDepartments();
const deptLookup = buildDepartmentLookup(departments);

const productDeptIds = Object.keys(deptLookup);
log.info(`Found ${productDeptIds.length} product departments: ${productDeptIds.join(', ')}`);

const crawler = new CheerioCrawler({
    maxRequestsPerCrawl,
    async requestHandler({ request }) {
        const label = request.userData?.label as string;

        if (label === 'CATALOG') {
            log.info('Processing catalog request', { url: request.url });
            const allProducts = await fetchProducts(0);
            log.info(`Processing ${allProducts.length} products from full catalog`);

            for (const raw of allProducts) {
                const item = transformProduct(raw, deptLookup);
                await Actor.pushData(item);
            }
            log.info(`Pushed ${allProducts.length} products to dataset`);
            return;
        }

        if (label === 'DEPT') {
            const deptId = request.userData?.deptId as string;
            log.info('Processing department request', { url: request.url, deptId });
            const products = await fetchProducts(deptId);
            log.info(`Processing ${products.length} products from department ${deptId}`);

            for (const raw of products) {
                const item = transformProduct(raw, deptLookup);
                await Actor.pushData(item);
            }
            log.info(`Pushed ${products.length} products from department ${deptId}`);
            return;
        }

        log.warning('Unknown request label, treating as catalog', { label, url: request.url });
        const allProducts = await fetchProducts(0);
        for (const raw of allProducts) {
            const item = transformProduct(raw, deptLookup);
            await Actor.pushData(item);
        }
        log.info(`Pushed ${allProducts.length} products from default handler`);
    },
});

const requests = startUrls.map((s) => ({
    url: s.url,
    userData: { label: 'CATALOG', ...s.userData },
}));

await crawler.run(requests);

await Actor.exit();