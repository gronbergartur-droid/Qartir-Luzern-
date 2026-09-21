-- Optional demo data mirroring src/data/referenceData.ts, so a freshly
-- provisioned Supabase project behaves the same as the local mock provider.
-- IDs are generated fresh (Postgres uuids), not the "sup-..." / "tray-..."
-- string ids used in the local mock - the two providers are independent by
-- design (see src/services/index.ts).

with new_suppliers as (
  insert into suppliers (name, short_code, contact_name, contact_email, contact_phone)
  values
    ('Aesculap AG', 'AESC', 'Leihsieb-Service', 'leihsieb@aesculap.example', '+41 41 555 12 34'),
    ('Medartis AG', 'MEDA', 'Konsignationslager', 'consignment@medartis.example', '+41 61 555 98 76'),
    ('DePuy Synthes', 'SYNT', 'Loaner Kit Verwaltung', 'loaner.ch@synthes.example', '+41 32 555 44 21')
  returning id, short_code
),
new_trays as (
  insert into trays (code, aliases, name, supplier_id, expected_instrument_count)
  select v.code, v.aliases, v.name, s.id, v.expected_instrument_count
  from (
    values
      ('SSW-LEIH-04-02', array['LEIH 04', 'LEIH04', 'LEIH-04'], 'Schulter-Sieb, Winkelstabile Platten 04', 'SYNT', 10),
      ('SSW-LEIH-07-01', array['LEIH 07', 'LEIH07', 'LEIH-07'], 'Hüft-Revisionssieb, Standard', 'AESC', 12),
      ('SSW-LEIH-11-03', array['LEIH 11', 'LEIH11', 'LEIH-11'], 'Hand-/Unterarm Osteosynthese-Sieb', 'MEDA', 8)
  ) as v(code, aliases, name, supplier_short_code, expected_instrument_count)
  join new_suppliers s on s.short_code = v.supplier_short_code
  returning id, code
)
insert into tray_instruments (tray_id, name, quantity, position, critical)
select t.id, v.name, v.quantity, v.position, v.critical
from (
  values
    ('SSW-LEIH-04-02', 'Winkelstabile Platte, 3-Loch', 2, 1, true),
    ('SSW-LEIH-04-02', 'Winkelstabile Platte, 5-Loch', 2, 2, true),
    ('SSW-LEIH-04-02', 'Schraubenzieher, selbsthaltend', 1, 3, true),
    ('SSW-LEIH-04-02', 'Bohrhülse 2.8 mm', 1, 4, false),
    ('SSW-LEIH-04-02', 'Tiefenmessgerät', 1, 5, false),
    ('SSW-LEIH-04-02', 'Repositionszange, klein', 1, 6, false),
    ('SSW-LEIH-04-02', 'Plattenbiegezange', 1, 7, false),
    ('SSW-LEIH-04-02', 'Drehmomentschlüssel 1.5 Nm', 1, 8, true),

    ('SSW-LEIH-07-01', 'Hüftpfannen-Fräser, Set', 1, 1, true),
    ('SSW-LEIH-07-01', 'Raspel, gerade', 3, 2, true),
    ('SSW-LEIH-07-01', 'Schenkelhalsraspel', 2, 3, false),
    ('SSW-LEIH-07-01', 'Extraktionsinstrument', 1, 4, true),
    ('SSW-LEIH-07-01', 'Impaktor, gross', 1, 5, false),
    ('SSW-LEIH-07-01', 'Impaktor, klein', 1, 6, false),
    ('SSW-LEIH-07-01', 'Hohmann-Hebel, gebogen', 2, 7, false),
    ('SSW-LEIH-07-01', 'Knochenstössel', 1, 8, false),

    ('SSW-LEIH-11-03', 'Mini-Platte, gerade', 3, 1, true),
    ('SSW-LEIH-11-03', 'Mini-Schraubenzieher', 1, 2, true),
    ('SSW-LEIH-11-03', 'Bohrer 1.5 mm', 2, 3, false),
    ('SSW-LEIH-11-03', 'Bohrer 2.0 mm', 2, 4, false)
) as v(tray_code, name, quantity, position, critical)
join new_trays t on t.code = v.tray_code;
