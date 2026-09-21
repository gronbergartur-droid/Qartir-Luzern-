# IDM Mobile

Mobile-first Instrumentenmanagement-App für die AEMP (Aufbereitungseinheit für
Medizinprodukte). Erstes Modul: **LEIH-SIEB SCANNER**.

Leihsiebe werden per Smartphone-Kamera fotografiert. Die App erkennt Barcode,
QR-Code und Text (OCR) auf dem Etikett, gleicht den Sieb-Code (z. B. `LEIH 04`
oder `SSW-LEIH-04-02`) mit einer Referenzdatenbank ab und führt Anwender:innen
durch eine manuelle Instrumenten-Kontrolle (erwartete vs. erkannte Instrumente,
fehlende/zusätzliche Instrumente) — inklusive verpflichtender Bestätigung vor
dem Speichern.

## KI-Nutzung: nur unterstützend

Barcode-, QR- und Texterkennung sind **rein unterstützende** Funktionen:

- Jeder erkannte Sieb-Code muss von der/dem Anwender:in bestätigt oder
  korrigiert werden, bevor ein Abgleich mit der Referenzdatenbank erfolgt.
- Es gibt keine automatische Instrumentenerkennung per Bildverarbeitung. Die
  Instrumenten-Kontrolle (vorhanden/fehlend, zusätzliche Instrumente) ist
  immer eine explizite, manuelle Aktion pro Instrument.
- Ein Scan kann erst gespeichert werden, nachdem alle Positionen kontrolliert
  wurden und die Anwender:in die Ergebnisse ausdrücklich bestätigt hat
  (Schritt „Bestätigung“, siehe `SummaryStep`).

## Tech-Stack

- **React + TypeScript + Vite**, mobile-first mit Tailwind CSS v4
- **@zxing/browser** – Barcode-/QR-Code-Erkennung aus dem Kamerabild
- **tesseract.js** – OCR-Texterkennung
- **react-router-dom** – Navigation
- **@supabase/supabase-js** – vorbereitet, siehe unten

## Architektur

```
src/
  types/database.ts        Domain-Typen, 1:1 zum geplanten Supabase-Schema
  data/referenceData.ts    Seed-/Demo-Referenzdaten (Sieb-Codes, Lieferanten)
  services/
    dataProvider.ts        Backend-agnostisches Interface
    localProvider.ts        Lokale/Demo-Implementierung (localStorage)
    supabaseProvider.ts     Supabase-Implementierung (gleiche Schnittstelle)
    index.ts                 Schaltet automatisch zwischen den beiden um
  lib/supabase/client.ts   Supabase-Client (nur aktiv, wenn ENV gesetzt)
  features/
    scanner/                Modul 1: LEIH-SIEB SCANNER (Kamera, Erkennung,
                             Abgleich, Instrumenten-Kontrolle, Speichern)
    history/                 Sieb-Historie (Liste + Detailansicht)
    audit/                    Audit-Log
    suppliers/, comparison/  Platzhalter für kommende Module
supabase/
  migrations/0001_init.sql  Schema: suppliers, trays, tray_instruments,
                             scans, audit_log (inkl. RLS-Policies)
  seed.sql                  Demo-Daten, analog zu data/referenceData.ts
```

Jeder Screen greift ausschliesslich über `dataProvider` (aus
`src/services/index.ts`) auf Daten zu – nie direkt auf `LocalDataProvider`
oder `SupabaseDataProvider`. Das ist die einzige Stelle, die beim Wechsel auf
ein echtes Supabase-Projekt angepasst werden muss.

## Supabase aktivieren

1. Migration `supabase/migrations/0001_init.sql` auf einem Supabase-Projekt
   ausführen (optional: `supabase/seed.sql` für Demo-Daten).
2. `.env.local` aus `.env.example` erstellen und
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` eintragen.
3. Ohne diese beiden Variablen läuft die App automatisch mit dem lokalen
   Mock-Provider (`localStorage`) weiter – kein Codeänderung nötig.

Die RLS-Policies in der Migration sind bewusst grob gehalten (jede
authentifizierte Person darf lesen/schreiben) und sollten verfeinert werden,
sobald Benutzer-/Standort-/Rollenverwaltung eingeführt wird.

## Geplante Module (Roadmap)

Bereits in der Navigation und im Datenmodell vorgesehen, aktuell als
„Bald verfügbar“ markiert:

- **Lieferantenverwaltung** – Stammdaten, Kontakte, Sieb-Zuordnung
  (`suppliers`-Tabelle bereits vorhanden)
- **Sieb-Historie** – bereits aktiv, zeigt alle bestätigten Scans
- **Vorher/Nachher-Vergleich** – zweiter Scan nach der Operation, verknüpft
  mit dem Ausgangs-Scan, automatischer Abgleich von Abweichungen
- **Audit-Log** – bereits aktiv, protokolliert jede Sieb-Zuordnung und
  Bestätigung lückenlos und unveränderbar

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server
npm run build    # Typecheck + Produktions-Build
npm run lint
```

Die Kamera-/OCR-Funktionen benötigen HTTPS oder `localhost`, da Browser den
Zugriff auf `getUserMedia` sonst blockieren.

## OCR offline betreiben

Die OCR-Engine (Worker-Skript + Wasm-Core von tesseract.js) liegt lokal unter
`public/tesseract/` und wird ohne CDN-Abhängigkeit ausgeliefert – wichtig für
Spitalnetzwerke ohne (oder mit eingeschränktem) Internetzugang.

Das Sprachmodell („traineddata") wird von tesseract.js standardmässig von
einem CDN nachgeladen. Für einen vollständig lokalen Betrieb:

1. `eng.traineddata.gz` einmalig herunterladen und intern (z. B. im
   `public/`-Ordner oder auf einem internen Server) ablegen.
2. `VITE_TESSERACT_LANG_PATH` auf das Verzeichnis dieser Datei setzen.

Ohne diese Variable funktioniert die App weiterhin – die Texterkennung lädt
das Sprachmodell dann beim ersten Scan einmalig vom CDN nach.
