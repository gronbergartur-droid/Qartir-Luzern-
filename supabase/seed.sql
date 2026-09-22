-- Optional demo data mirroring src/data/referenceData.ts, so a freshly
-- provisioned Supabase project behaves the same as the local mock provider.
-- IDs are generated fresh (Postgres uuids), not the "sup-..." / "tray-..."
-- string ids used in the local mock - the two providers are independent by
-- design (see src/services/index.ts).

with new_suppliers as (
  insert into suppliers (
    name, short_code, location, specialties, loan_service_confirmed,
    loan_service_note, contact_phone, contact_email, contact_note, source
  )
  values
    ('Stryker Osteonics AG / Stryker', 'STRY', 'Biberist, SO',
     array['Endoprothetik', 'Traumatologie', 'Wirbelsäule', 'OMS', 'Hand/Fuss'], true,
     'Loaner System Service', '+41 32 641 69 50', 'order.ch@stryker.com', null,
     'Stryker CH: Loaner System Service'),
    ('Johnson & Johnson MedTech / DePuy Synthes', 'SYNT', 'Villmergen, AG',
     array['Gelenke', 'Schulter', 'Hüfte', 'Trauma', 'CMF', 'OrthoKits/Leihsets'], true,
     'Chirurgische Leihsets', null, null, 'Schweizer Logistik für Leihsets; lokale Vertreter',
     'J&J MedTech / Schweizer Logistik'),
    ('Arthrex Swiss AG', 'ARTH', 'Belp → Zollikofen, BE',
     array['Arthroskopie', 'Sportmedizin', 'Orthopädie', 'Instrumente & Implantate'], true,
     'Loan Service Center', null, null,
     'Loan Service Center; aktuell Belp, Umzug ab Nov. 2026 nach Zollikofen',
     'Arthrex Swiss / Loan Service'),
    ('B. Braun Medical AG / Aesculap', 'AESC', 'Sempach, LU',
     array['Hüfte', 'Knie', 'Sportmedizin', 'Traumatologie', 'Wirbelsäule', 'OP-Instrumente'], true,
     'ELSA European Loan Service', '0848 83 00 22', null, 'Aesculap Customer Service',
     'B. Braun / ELSA'),
    ('Medartis AG', 'MEDA', 'Basel, BS',
     array['Hand', 'Handgelenk', 'obere/untere Extremität', 'CMF'], true,
     'Leihinstrumentarien / Leihsets', '+41 61 633 34 34', 'order@medartis.com', null,
     'Medartis / Leihservice'),
    ('Mathys Ltd Bettlach / Mathys (Schweiz)', 'MATH', 'Bettlach, SO',
     array['Hüft-, Knie- und Schulterendoprothetik', 'Revision'], true,
     'Leihinstrumenten-Sets', '+41 32 644 16 44', 'info@mathysmedical.com', null,
     'Mathys / Leihinstrumente'),
    ('Innomed-Europe LLC', 'INNO', 'Cham, ZG',
     array['Hüfte', 'Knie', 'Revision', 'Schulter/Ellbogen', 'Trauma', 'Wirbelsäule'], true,
     'Rental / Loaner Instruments', '+41 41 740 67 74', 'loaners@innomed-europe.com', null,
     'Innomed-Europe / Rental Offers'),
    ('medkoh ag', 'MEDK', 'Opfikon, ZH',
     array['Instrumentensets / Operationsbestecke', 'Medizintechnik'], true,
     'Kostenpflichtige Leihsets', null, null, 'Schweizer Fachhändler; Leihsets gegen Gebühr',
     'medkoh AGB / Leihsets'),
    ('Stöckli Medical AG', 'STOE', 'Oberkirch, LU',
     array['Operationsinstrumente', 'OP-Support / Medizintechnik'], true,
     'Management von Leihsets', '+41 41 925 66 55', null, 'Länggasse 4, 6208 Oberkirch',
     'Stöckli Medical / Leihset-Management'),
    ('Spineart SA', 'SPIN', 'Plan-les-Ouates, GE',
     array['Wirbelsäulenchirurgie / Spine'], true,
     'Schweizer OP-/Instrumentenversorgung bestätigt; Leihset auf Foto dokumentiert',
     '+41 22 593 82 40', null, 'Chemin du Pré-Fleuri 3, 1228 Plan-les-Ouates',
     'Spineart Kontakt / Foto des Nutzers'),
    ('TapMed Swiss AG', 'TAPM', 'Schweiz',
     array['Mikrochirurgie / rekonstruktive Chirurgie', 'Gefässkoppler'], true,
     'Eigenes chirurgisches Leihset dokumentiert', null, null,
     'Leihset für chirurgische Instrumente öffentlich dokumentiert',
     'TapMed Swiss – Leihset'),
    ('Peter Brehm Schweiz GmbH', 'BREH', 'Zürich, ZH',
     array['Hüft-/Knieendoprothetik', 'Revision', 'Wirbelsäule'], true,
     'Leihsets für Implantatsysteme', null, null, 'Aargauerstrasse 180, 8048 Zürich',
     'Schweizer Unternehmensprofil / Leihsets'),
    ('Enovis Surgical Switzerland GmbH', 'ENOV', 'Bettlach, SO',
     array['Hüfte', 'Knie', 'Schulter', 'Fixation', 'sterile Instrument Sets'], true,
     'Schweizer Surgical-Standort bestätigt; Leihservice je System beim CH-Team abklären',
     '+41 32 644 16 66', null, 'Robert Mathys Strasse 5, 2544 Bettlach',
     'Enovis Surgical Switzerland')
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
