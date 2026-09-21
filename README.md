# IDM Mobile

Mobile-first Instrumentenmanagement-App für die AEMP (Aufbereitungseinheit für
Medizinprodukte). Kernmodul: **LEIH-SIEB SCANNER** mit vollständigem
Lieferanten-, Fall- und Vorher/Nachher-Lebenszyklus.

Leihsiebe werden per Smartphone-Kamera fotografiert. Die App erkennt Barcode,
QR-Code und Text (OCR) auf dem Etikett, gleicht den Sieb-Code (z. B. `LEIH 04`
oder `SSW-LEIH-04-02`) mit einer Referenzdatenbank ab und führt Anwender:innen
durch eine manuelle Instrumenten-Kontrolle (erwartete vs. erkannte Instrumente,
fehlende/zusätzliche Instrumente) — inklusive verpflichtender Bestätigung vor
dem Speichern. Beim Eingang eines Leihsiebs wird daraus ein **Sieb-Fall**
eröffnet; nach der Operation wird ein zweiter (Ausgangs-)Scan erfasst und
automatisch mit dem Eingang verglichen (Modul „Vorher/Nachher-Vergleich“).

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

### KI-Vergleich (Vorher/Nachher)

Der Vorher/Nachher-Vergleich vergleicht **nicht** die beiden Fotos pixelweise
per Bildverarbeitung. Eine zuverlässige automatische Erkennung einzelner
Chirurgie-Instrumente auf einem Foto würde ein eigens trainiertes
Bildverarbeitungsmodell voraussetzen, das hier nicht zur Verfügung steht –
ein unbestätigtes „KI hat X erkannt“ wäre im medizinischen Kontext riskant.

Stattdessen berechnet `src/features/cases/comparison.ts` einen
deterministischen Diff zwischen der **von Anwender:innen bestätigten**
Eingangs-Checkliste und der bestätigten Ausgangs-Checkliste desselben Falls:
fehlende Instrumente, Mengenabweichungen und neue/entfernte Zusatz-
Instrumente werden so zuverlässig und nachvollziehbar erkannt. Für „falsche
Instrumente“ (Verwechslungen) schlägt eine einfache Namensähnlichkeits-
Heuristik mögliche Paare vor („Schere“ fehlt, „Klemme“ ist neu aufgetaucht) –
klar als KI-Vorschlag gekennzeichnet und nie automatisch übernommen.

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
  lib/
    currentUser.ts          Leichtgewichtige "wer ist angemeldet"-Kennung
                             (kein echtes Login, siehe unten)
    supabase/client.ts      Supabase-Client (nur aktiv, wenn ENV gesetzt)
  services/
    dataProvider.ts        Backend-agnostisches Interface
    localProvider.ts        Lokale/Demo-Implementierung (localStorage)
    supabaseProvider.ts     Supabase-Implementierung (gleiche Schnittstelle)
    index.ts                 Schaltet automatisch zwischen den beiden um
  features/
    scanner/                LEIH-SIEB SCANNER (Kamera, Erkennung, Abgleich,
                             Instrumenten-Kontrolle); unterstützt drei Modi:
                             eigenständige Kontrolle, Fall-Eingang, Fall-Ausgang
    cases/                    Sieb-Fälle: Eingang ↔ Ausgang, Vergleichs-Engine
                             (comparison.ts), Fälle-Liste & -Detail
    suppliers/                Lieferantenverwaltung: CRUD, Detailseite mit
                             Sieb-Referenzen und vollständiger Fall-Historie
    trays/                    Sieb-Referenzen anlegen/bearbeiten (Instrumente,
                             Lieferanten-Zuordnung)
    history/                 Sieb-Historie (Liste + Detailansicht je Scan)
    audit/                    Audit-Log (jede Aktion mit Datum/Zeit/Benutzer)
supabase/
  migrations/0001_init.sql  Schema: suppliers, trays, tray_instruments,
                             scans, loan_cases, audit_log (inkl. RLS-Policies)
  seed.sql                  Demo-Daten, analog zu data/referenceData.ts
```

Jeder Screen greift ausschliesslich über `dataProvider` (aus
`src/services/index.ts`) auf Daten zu – nie direkt auf `LocalDataProvider`
oder `SupabaseDataProvider`. Das ist die einzige Stelle, die beim Wechsel auf
ein echtes Supabase-Projekt angepasst werden muss.

## Supabase aktivieren

1. Migration `supabase/migrations/0001_init.sql` auf einem Supabase-Projekt
   ausführen (optional: `supabase/seed.sql` für Demo-Daten).
2. **Anonymous Sign-Ins aktivieren**: Supabase-Dashboard → Authentication →
   Sign In / Providers → *Anonymous* einschalten. Die RLS-Policies greifen
   auf `to authenticated` (nicht `anon`), damit ein öffentlicher
   Publishable Key allein keinen Zugriff auf Spitaldaten gibt. Da die App
   noch kein echtes Login hat (siehe „Benutzer-Kennzeichen" unten), meldet
   sie sich beim Start selbst anonym an, um eine `authenticated`-Session zu
   bekommen (`src/lib/supabase/client.ts` → `ensureSupabaseSession()`).
   Ohne diesen Schritt schlagen alle Datenbankzugriffe mit einem
   RLS-Fehler fehl.
3. `.env.local` aus `.env.example` erstellen und
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (Publishable Key)
   eintragen.
4. Ohne diese beiden Variablen läuft die App automatisch mit dem lokalen
   Mock-Provider (`localStorage`) weiter – kein Codeänderung nötig.

Die RLS-Policies in der Migration sind bewusst grob gehalten (jede
authentifizierte Person darf lesen/schreiben) und sollten verfeinert werden,
sobald echte Benutzer-/Standort-/Rollenverwaltung eingeführt wird – die
anonyme Session ist ein Übergangszustand, kein Ersatz für richtiges Login.

## Module

- **LEIH-SIEB SCANNER** – Foto, Barcode/QR/OCR-Erkennung, Abgleich,
  Instrumenten-Kontrolle. Läuft als eigenständige Kontrolle (`/scanner`)
  oder als Eingangs-/Ausgangs-Scan eines Sieb-Falls.
- **Lieferantenverwaltung** (`/lieferanten`) – vollständiges CRUD: anlegen,
  bearbeiten, aktivieren/deaktivieren, löschen (blockiert, solange noch
  Siebe zugeordnet sind – stattdessen deaktivieren). Detailseite zeigt alle
  zugeordneten Sieb-Referenzen und die komplette Fall-Historie
  (Sieb-Code, Datum, Eingang, Ausgang, Operation, Abweichungen).
- **Sieb-Referenzen** (`/sieb/neu`, von der Lieferantenseite aus) – neues
  Leihsieb erfassen: Code, Alias-Bezeichnungen, Instrumentenliste, Zuordnung
  zu einem *aktiven* Lieferanten (Pflichtfeld).
- **Sieb-Fälle / Vorher-Nachher-Vergleich** (`/faelle`) – Eingang eröffnet
  einen Fall; nach der Operation wird der Ausgang erfasst und automatisch mit
  dem Eingang verglichen (fehlende/zusätzliche Instrumente, Mengenabweichungen,
  Verwechslungs-Vorschläge – siehe „KI-Vergleich“ oben). Jeder erkannte Code
  wird beim Ausgang gegen das erwartete Sieb geprüft; bei Abweichung erscheint
  ein Warnhinweis, ohne den Ablauf zu blockieren.
- **Sieb-Historie** (`/historie`) – jeder einzelne Scan (auch Eingangs-/
  Ausgangs-Scans eines Falls) bleibt hier zusätzlich einsehbar.
- **Audit-Log** (`/audit`) – jede Lieferanten-, Sieb- und Fall-Aktion sowie
  jede Kontroll-Bestätigung wird lückenlos mit Datum, Uhrzeit und Benutzer
  protokolliert (append-only).

### Benutzer-Kennzeichen

Oben rechts in der App lässt sich ein Name/Kürzel eintragen (siehe
`src/lib/currentUser.ts`, in `TopBar` eingebunden). Das ist **keine
Authentifizierung** – es gibt kein Login und keine Zugriffskontrolle,
sondern das digitale Äquivalent einer Handzeichen-Spalte auf Papier: der
eingetragene Name wird als `performedBy` an jedem Scan, jeder
Lieferanten-/Sieb-Änderung und jedem Fall gespeichert. Echte
Benutzer-/Rollenverwaltung über Supabase Auth ist ein separater, künftiger
Schritt.

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
