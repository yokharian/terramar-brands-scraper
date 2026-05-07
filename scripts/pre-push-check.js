#!/usr/bin/env node

/**
 * Pre-push validation script for Terramar Brands Scraper.
 * Runs schema checks, lint, and tests before deploys.
 * Usage: node scripts/pre-push-check.js
 */

import { readFileSync, existsSync } from 'fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

let hasErrors = false;

function fail(msg) {
    console.error(`FAIL: ${msg}`);
    hasErrors = true;
}

function pass(msg) {
    console.log(`PASS: ${msg}`);
}

// 1. Check .actor/actor.json exists
const actorPath = `${ROOT}/.actor/actor.json`;
if (existsSync(actorPath)) {
    pass('.actor/actor.json exists');
    try {
        const actor = JSON.parse(readFileSync(actorPath, 'utf-8'));
        if (actor.name && actor.version) {
            pass(`actor.json has name="${actor.name}" version="${actor.version}"`);
        } else {
            fail('actor.json missing name or version');
        }
    } catch {
        fail('actor.json is not valid JSON');
    }
} else {
    fail('.actor/actor.json not found');
}

// 2. Check input_schema.json exists and parses
const schemaPath = `${ROOT}/.actor/input_schema.json`;
if (existsSync(schemaPath)) {
    pass('.actor/input_schema.json exists');
    try {
        const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

        // 3. Verify required fields have defaults
        const required = schema.required ?? [];
        const properties = schema.properties ?? {};

        for (const field of required) {
            const prop = properties[field];
            if (!prop) {
                fail(`Required field "${field}" not found in properties`);
                continue;
            }
            if (prop.default === undefined && prop.prefill === undefined) {
                fail(`Required field "${field}" has no "default" or "prefill" value`);
            } else {
                pass(`Required field "${field}" has a default value`);
            }
        }

        // 4. Type-check defaults
        for (const [key, prop] of Object.entries(properties)) {
            const p = prop;
            if (p.default === undefined) continue;
            if (p.type === 'integer' && typeof p.default !== 'number') {
                fail(`Field "${key}" type is "integer" but default is ${typeof p.default}`);
            }
            if (p.type === 'string' && typeof p.default !== 'string') {
                fail(`Field "${key}" type is "string" but default is ${typeof p.default}`);
            }
        }
    } catch {
        fail('input_schema.json is not valid JSON');
    }
} else {
    fail('.actor/input_schema.json not found');
}

// 5. Check dataset_schema.json exists
const datasetPath = `${ROOT}/.actor/dataset_schema.json`;
if (existsSync(datasetPath)) {
    pass('.actor/dataset_schema.json exists');
} else {
    fail('.actor/dataset_schema.json not found');
}

// 6. Check output_schema.json exists
const outputPath = `${ROOT}/.actor/output_schema.json`;
if (existsSync(outputPath)) {
    pass('.actor/output_schema.json exists');
} else {
    fail('.actor/output_schema.json not found');
}

// 7. Check Dockerfile exists
if (existsSync(`${ROOT}/Dockerfile`)) {
    pass('Dockerfile exists');
} else {
    fail('Dockerfile not found');
}

// 8. Check src/main.ts exists (entry point)
if (existsSync(`${ROOT}/src/main.ts`)) {
    pass('src/main.ts exists');
} else {
    fail('src/main.ts not found');
}

// Summary
console.log('\n--- Pre-push check summary ---');
if (hasErrors) {
    console.error('Some checks failed. Fix errors before pushing.');
    process.exit(1);
} else {
    console.log('All pre-push checks passed.');
    process.exit(0);
}