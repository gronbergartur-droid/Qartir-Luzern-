import type { Supplier, Tray, TrayInstrument } from '@/types/database';

/**
 * Seed reference data for local/demo mode. In production this is replaced by
 * rows in the `suppliers`, `trays` and `tray_instruments` tables (see
 * supabase/migrations). Shapes match 1:1 so no mapping layer is needed later.
 */

export const suppliers: Supplier[] = [
  {
    id: 'sup-aesculap',
    name: 'Aesculap AG',
    shortCode: 'AESC',
    contactName: 'Leihsieb-Service',
    contactEmail: 'leihsieb@aesculap.example',
    contactPhone: '+41 41 555 12 34',
    logoUrl: null,
    active: true,
    createdAt: '2024-01-10T08:00:00.000Z',
  },
  {
    id: 'sup-medartis',
    name: 'Medartis AG',
    shortCode: 'MEDA',
    contactName: 'Konsignationslager',
    contactEmail: 'consignment@medartis.example',
    contactPhone: '+41 61 555 98 76',
    logoUrl: null,
    active: true,
    createdAt: '2024-01-10T08:00:00.000Z',
  },
  {
    id: 'sup-synthes',
    name: 'DePuy Synthes',
    shortCode: 'SYNT',
    contactName: 'Loaner Kit Verwaltung',
    contactEmail: 'loaner.ch@synthes.example',
    contactPhone: '+41 32 555 44 21',
    logoUrl: null,
    active: true,
    createdAt: '2024-01-10T08:00:00.000Z',
  },
];

// Note: expectedInstrumentCount must equal the sum of this tray's
// tray_instruments quantities below (total physical pieces, not distinct
// positions) - the scanner compares against it directly.
export const trays: Tray[] = [
  {
    id: 'tray-ssw-leih-04-02',
    code: 'SSW-LEIH-04-02',
    aliases: ['LEIH 04', 'LEIH04', 'LEIH-04'],
    name: 'Schulter-Sieb, Winkelstabile Platten 04',
    supplierId: 'sup-synthes',
    referencePhotoUrl: null,
    expectedInstrumentCount: 10,
    active: true,
    createdAt: '2024-02-01T08:00:00.000Z',
    updatedAt: '2024-11-01T08:00:00.000Z',
  },
  {
    id: 'tray-ssw-leih-07-01',
    code: 'SSW-LEIH-07-01',
    aliases: ['LEIH 07', 'LEIH07', 'LEIH-07'],
    name: 'Hüft-Revisionssieb, Standard',
    supplierId: 'sup-aesculap',
    referencePhotoUrl: null,
    expectedInstrumentCount: 12,
    active: true,
    createdAt: '2024-02-01T08:00:00.000Z',
    updatedAt: '2024-11-01T08:00:00.000Z',
  },
  {
    id: 'tray-ssw-leih-11-03',
    code: 'SSW-LEIH-11-03',
    aliases: ['LEIH 11', 'LEIH11', 'LEIH-11'],
    name: 'Hand-/Unterarm Osteosynthese-Sieb',
    supplierId: 'sup-medartis',
    referencePhotoUrl: null,
    expectedInstrumentCount: 8,
    active: true,
    createdAt: '2024-02-01T08:00:00.000Z',
    updatedAt: '2024-11-01T08:00:00.000Z',
  },
];

export const trayInstruments: TrayInstrument[] = [
  // SSW-LEIH-04-02
  { id: 'ti-01', trayId: 'tray-ssw-leih-04-02', name: 'Winkelstabile Platte, 3-Loch', quantity: 2, position: 1, critical: true, referenceImageUrl: null },
  { id: 'ti-02', trayId: 'tray-ssw-leih-04-02', name: 'Winkelstabile Platte, 5-Loch', quantity: 2, position: 2, critical: true, referenceImageUrl: null },
  { id: 'ti-03', trayId: 'tray-ssw-leih-04-02', name: 'Schraubenzieher, selbsthaltend', quantity: 1, position: 3, critical: true, referenceImageUrl: null },
  { id: 'ti-04', trayId: 'tray-ssw-leih-04-02', name: 'Bohrhülse 2.8 mm', quantity: 1, position: 4, critical: false, referenceImageUrl: null },
  { id: 'ti-05', trayId: 'tray-ssw-leih-04-02', name: 'Tiefenmessgerät', quantity: 1, position: 5, critical: false, referenceImageUrl: null },
  { id: 'ti-06', trayId: 'tray-ssw-leih-04-02', name: 'Repositionszange, klein', quantity: 1, position: 6, critical: false, referenceImageUrl: null },
  { id: 'ti-07', trayId: 'tray-ssw-leih-04-02', name: 'Plattenbiegezange', quantity: 1, position: 7, critical: false, referenceImageUrl: null },
  { id: 'ti-08', trayId: 'tray-ssw-leih-04-02', name: 'Drehmomentschlüssel 1.5 Nm', quantity: 1, position: 8, critical: true, referenceImageUrl: null },

  // SSW-LEIH-07-01
  { id: 'ti-11', trayId: 'tray-ssw-leih-07-01', name: 'Hüftpfannen-Fräser, Set', quantity: 1, position: 1, critical: true, referenceImageUrl: null },
  { id: 'ti-12', trayId: 'tray-ssw-leih-07-01', name: 'Raspel, gerade', quantity: 3, position: 2, critical: true, referenceImageUrl: null },
  { id: 'ti-13', trayId: 'tray-ssw-leih-07-01', name: 'Schenkelhalsraspel', quantity: 2, position: 3, critical: false, referenceImageUrl: null },
  { id: 'ti-14', trayId: 'tray-ssw-leih-07-01', name: 'Extraktionsinstrument', quantity: 1, position: 4, critical: true, referenceImageUrl: null },
  { id: 'ti-15', trayId: 'tray-ssw-leih-07-01', name: 'Impaktor, gross', quantity: 1, position: 5, critical: false, referenceImageUrl: null },
  { id: 'ti-16', trayId: 'tray-ssw-leih-07-01', name: 'Impaktor, klein', quantity: 1, position: 6, critical: false, referenceImageUrl: null },
  { id: 'ti-17', trayId: 'tray-ssw-leih-07-01', name: 'Hohmann-Hebel, gebogen', quantity: 2, position: 7, critical: false, referenceImageUrl: null },
  { id: 'ti-18', trayId: 'tray-ssw-leih-07-01', name: 'Knochenstössel', quantity: 1, position: 8, critical: false, referenceImageUrl: null },

  // SSW-LEIH-11-03
  { id: 'ti-21', trayId: 'tray-ssw-leih-11-03', name: 'Mini-Platte, gerade', quantity: 3, position: 1, critical: true, referenceImageUrl: null },
  { id: 'ti-22', trayId: 'tray-ssw-leih-11-03', name: 'Mini-Schraubenzieher', quantity: 1, position: 2, critical: true, referenceImageUrl: null },
  { id: 'ti-23', trayId: 'tray-ssw-leih-11-03', name: 'Bohrer 1.5 mm', quantity: 2, position: 3, critical: false, referenceImageUrl: null },
  { id: 'ti-24', trayId: 'tray-ssw-leih-11-03', name: 'Bohrer 2.0 mm', quantity: 2, position: 4, critical: false, referenceImageUrl: null },
];
