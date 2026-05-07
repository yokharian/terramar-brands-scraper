/** Test-only defaults matching .actor/input_schema.json — not imported by src/ */
export const DEFAULT_BASE_URL = 'https://terramarbrands.com.mx';
export const DEFAULT_API_BASE_URL = 'https://terramarbrands.mx/wsTerramarV2/Service1.svc';
export const CURRENCY = 'MXN';

import type { DepartmentLookup, RawApiProduct } from '../src/types.js';

export const MOCK_DEPT_LOOKUP: DepartmentLookup = {
    '1': {
        name: 'Color',
        subdepartments: { '1': 'Rostro', '2': 'Ojos', '3': 'Labios' },
    },
    '2': {
        name: 'Fragancias',
        subdepartments: { '1': 'Él', '2': 'Ella' },
    },
};

export const SITE_CONFIG = { baseUrl: DEFAULT_BASE_URL };

export const MOCK_PRODUCT: RawApiProduct = {
    id: '0',
    clave: 'A',
    producto: 'Maquillaje Compacto 11.5g',
    precio: '630',
    descripcion: '<p>Brinda al cutis una apariencia perfecta.</p><p>Ideal para todo tipo de piel.</p>',
    aplicacion: '<p>Pasar la esponja en el compacto.</p>',
    ingredientes: '<p><strong>Vitamina E</strong></p><p>Actividad antioxidante.</p>',
    familiaOlfativa: '',
    perfumista: '',
    link: '',
    departamento: '1',
    subdepartamento: '1',
    marca: '',
    clase: '',
    imagen: '',
    carrusel: 'S',
};

export const MOCK_DEPARTMENTS = [
    { depto: '1', nombre: 'Historya', menu: '2', secciones: [] },
    { depto: '2', nombre: 'Mision', menu: '2', secciones: [] },
    { depto: '1', nombre: 'Color', menu: '3', secciones: [
        { subdepto: '1', nombre: 'Rostro' },
        { subdepto: '2', nombre: 'Ojos' },
    ] },
    { depto: '2', nombre: 'Fragancias', menu: '3', secciones: [
        { subdepto: '1', nombre: 'Él' },
        { subdepto: '2', nombre: 'Ella' },
    ] },
    { depto: '1', nombre: 'Reuniones de oportunidad', menu: '4', secciones: [] },
];