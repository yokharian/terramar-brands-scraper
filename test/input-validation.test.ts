import { describe, expect, it } from 'vitest';

describe('Input defaults validation', () => {
    it('should have defaults for all fields in input_schema.json', async () => {
        const schema = (await import('../.actor/input_schema.json', { with: { type: 'json' } })).default;
        const required = schema.required ?? [];
        const properties = schema.properties ?? {};

        for (const field of required) {
            const prop = properties[field];
            expect(prop, `Required field "${field}" must have a default or prefill`).toBeDefined();
            expect(
                prop.default !== undefined || prop.prefill !== undefined,
                `Required field "${field}" must have a "default" or "prefill" value`,
            ).toBe(true);
        }
    });

    it('should have matching types between input schema defaults and field types', async () => {
        const schema = (await import('../.actor/input_schema.json', { with: { type: 'json' } })).default;
        const properties = schema.properties ?? {};

        for (const [key, prop] of Object.entries(properties)) {
            const p = prop as { type?: string; default?: unknown; prefill?: unknown };
            if (p.default === undefined) continue;

            if (p.type === 'integer') {
                expect(typeof p.default).toBe('number');
                expect(Number.isInteger(p.default)).toBe(true);
            }
            if (p.type === 'string') {
                expect(typeof p.default).toBe('string');
            }
        }
    });

    it('should have integer type for maxRequestsPerCrawl default', async () => {
        const schema = (await import('../.actor/input_schema.json', { with: { type: 'json' } })).default;
        const prop = schema.properties.maxRequestsPerCrawl;
        expect(prop.type).toBe('integer');
        expect(prop.default).toBe(50);
        expect(Number.isInteger(prop.default)).toBe(true);
    });

    it('should have string type for baseUrl default', async () => {
        const schema = (await import('../.actor/input_schema.json', { with: { type: 'json' } })).default;
        const prop = schema.properties.baseUrl;
        expect(prop.type).toBe('string');
        expect(typeof prop.default).toBe('string');
        expect(prop.default).toMatch(/^https:\/\//);
    });

    it('should have string type for apiBaseUrl default', async () => {
        const schema = (await import('../.actor/input_schema.json', { with: { type: 'json' } })).default;
        const prop = schema.properties.apiBaseUrl;
        expect(prop.type).toBe('string');
        expect(typeof prop.default).toBe('string');
        expect(prop.default).toMatch(/^https:\/\//);
    });
});

describe('Edge case input handling', () => {
    it('should handle empty baseUrl gracefully by using fallback', () => {
        const input = { baseUrl: '', apiBaseUrl: '', maxRequestsPerCrawl: 50 };
        const baseUrl = input.baseUrl?.replace(/\/+$/, '') || 'https://terramarbrands.com.mx';
        const apiBaseUrl = input.apiBaseUrl?.replace(/\/+$/, '') || 'https://terramarbrands.mx/wsTerramarV2/Service1.svc';
        expect(baseUrl).toBe('https://terramarbrands.com.mx');
        expect(apiBaseUrl).toBe('https://terramarbrands.mx/wsTerramarV2/Service1.svc');
    });

    it('should strip trailing slashes from URLs', () => {
        const input = { baseUrl: 'https://terramarbrands.com.mx/', apiBaseUrl: 'https://terramarbrands.mx/wsTerramarV2/Service1.svc///' };
        const baseUrl = input.baseUrl.replace(/\/+$/, '');
        const apiBaseUrl = input.apiBaseUrl.replace(/\/+$/, '');
        expect(baseUrl).toBe('https://terramarbrands.com.mx');
        expect(apiBaseUrl).toBe('https://terramarbrands.mx/wsTerramarV2/Service1.svc');
    });
});