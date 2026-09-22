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
  migrations/0002_auth_roles.sql  Echtes Supabase Auth: profiles-Tabelle,
                             Rollen (admin/op_leitung/mitarbeiter/lieferant),
                             verschärfte RLS (aktives Profil + manipulations-
                             sichere performed_by-Zuordnung)
  seed.sql                  Demo-Daten, analog zu data/referenceData.ts
```

Jeder Screen greift ausschliesslich über `dataProvider` (aus
`src/services/index.ts`) auf Daten zu – nie direkt auf `LocalDataProvider`
oder `SupabaseDataProvider`. Das ist die einzige Stelle, die beim Wechsel auf
ein echtes Supabase-Projekt angepasst werden muss.

## Supabase aktivieren

1. Migrationen `supabase/migrations/0001_init.sql` und
   `supabase/migrations/0002_auth_roles.sql` (in dieser Reihenfolge) auf
   einem Supabase-Projekt ausführen (optional: `supabase/seed.sql` für
   Demo-Daten).
2. `.env.local` aus `.env.example` erstellen und
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (Publishable Key)
   eintragen.
3. Ohne diese beiden Variablen läuft die App automatisch mit dem lokalen
   Mock-Provider (`localStorage`) weiter – keine Codeänderung nötig.
4. **Keine Anonymous Sign-Ins aktivieren.** Diese App ist eine klinische
   Anwendung ohne öffentliche Schreibrechte; es gibt bewusst keinen
   anonymen Zugriff mehr (siehe „Authentifizierung & Rollen" unten). Falls
   „Anonymous Sign-Ins" im Projekt aus einem früheren Schritt aktiviert
   wurde, im Supabase-Dashboard unter Authentication → Sign In / Providers
   deaktivieren – die App verwendet sie ohnehin nicht mehr, und selbst ein
   anonym angemeldetes Konto bliebe dank `profiles.active = false`
   ohne Lese-/Schreibzugriff.
5. Das erste jemals registrierte Konto wird automatisch als aktiver
   **Admin** angelegt (siehe `handle_new_auth_user()` in
   `0002_auth_roles.sql`) – damit ist nach der Migration immer sofort ein
   Admin-Zugang vorhanden. Jedes weitere Konto startet inaktiv
   (`mitarbeiter`, `active = false`) und muss über die
   Benutzerverwaltung (`/benutzer`, nur für Admins) freigeschaltet werden.

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
- **Benutzerverwaltung** (`/benutzer`, nur Admins) – Konten freischalten,
  Rollen zuweisen, Lieferanten-Konten verknüpfen. Siehe
  „Authentifizierung & Rollen" unten.

### Authentifizierung & Rollen

Gegen ein echtes Supabase-Projekt verlangt die App ein echtes Login
(E-Mail/Passwort, `src/features/auth/LoginPage.tsx` +
`src/lib/auth/AuthContext.tsx`) – kein anonymer oder öffentlicher
Schreibzugriff. Vier Rollen: **Admin**, **OP-Leitung**, **Mitarbeiter:in**,
**Lieferant** (`src/types/database.ts` → `UserRole`).

- Neue Konten (Registrierung in der App oder direkt im Supabase-Dashboard)
  landen inaktiv in der `profiles`-Tabelle und sehen nach der Anmeldung nur
  einen „Wartet auf Freigabe"-Bildschirm – RLS blockiert für inaktive
  Konten jeden Lese- und Schreibzugriff auf Spitaldaten
  (`is_active_user()` in `0002_auth_roles.sql`).
- Admins schalten Konten frei und weisen Rollen zu unter **Benutzerverwaltung**
  (`/benutzer`, nur in der Navigation sichtbar für Admins;
  `src/features/users/UserManagementPage.tsx`). Ein Lieferanten-Konto kann
  zusätzlich einem Lieferanten-Datensatz zugeordnet werden.
- Ein Nicht-Admin kann sich nicht selbst freischalten oder befördern – ein
  Datenbank-Trigger (`prevent_self_role_escalation()`) blockiert das
  serverseitig, unabhängig vom Client.
- **Revisionssichere Zuordnung**: `performed_by` (Scans, Fälle) und
  `audit_log.performed_by` müssen laut RLS exakt dem angemeldeten Konto
  entsprechen (`current_display_name()`); ein Client kann keine fremde
  Identität vortäuschen. Jede Aktion trägt damit automatisch Benutzer,
  Datum und Uhrzeit.
- Im lokalen Mock-Modus (ohne `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`)
  bleibt die bisherige, nicht-authentifizierte Geräte-Kennzeichnung
  (`src/lib/currentUser.ts`, Namensfeld oben rechts) unverändert aktiv –
  dort gibt es weiterhin kein Login, da es sich um eine reine
  Offline-Demo ohne Mehrbenutzerbetrieb handelt.

**Wichtig für die Registrierungs-E-Mail**: Im Supabase-Dashboard unter
**Authentication → URL Configuration** müssen *Site URL* und *Redirect URLs*
auf die tatsächliche App-URL zeigen (z. B.
`https://<owner>.github.io/<repo>/` bei GitHub Pages, plus
`http://localhost:5173` für lokale Entwicklung gegen das echte Projekt).
Ohne einen passenden Eintrag in *Redirect URLs* lehnt Supabase den
Bestätigungslink-Redirect ab. Der Client nutzt zusätzlich `flowType: 'pkce'`
(`src/lib/supabase/client.ts`), weil die App `HashRouter` verwendet
(GitHub Pages hat kein Server-Rewrite) und der klassische „implicit"-Flow
sein Token als `#access_token=...`-Fragment anhängt - das kollidiert mit
dem eigenen Routing-Fragment des Routers. PKCE hängt stattdessen ein
`?code=...`-Query-Argument an, das den Router nicht stört.

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server
npm run build    # Typecheck + Produktions-Build
npm run lint
```

Die Kamera-/OCR-Funktionen benötigen HTTPS oder `localhost`, da Browser den
Zugriff auf `getUserMedia` sonst blockieren.

## Deployment (GitHub Pages)

Die App lässt sich als reine statische SPA auf GitHub Pages veröffentlichen
(`.github/workflows/deploy-pages.yml`, baut bei jedem Push auf `main`).
Einmalig einzurichten:

1. **Settings → Pages → Source: „GitHub Actions"** im Repository aktivieren
   (dieser eine Schritt lässt sich nicht per API/Workflow erledigen).
2. **Settings → Secrets and variables → Actions → Variables** – zwei
   Repository-Variablen anlegen: `VITE_SUPABASE_URL` und
   `VITE_SUPABASE_ANON_KEY` (Werte aus `.env.local`/Supabase-Dashboard).
   Das ist der öffentliche Publishable Key, keine geheime Server-Rolle –
   der Zugriffsschutz kommt ausschliesslich über RLS
   (`supabase/migrations/0002_auth_roles.sql`), nicht über die
   Geheimhaltung dieses Keys. Ohne diese beiden Variablen baut die
   Seite im lokalen Mock-Modus.
3. Danach läuft jeder Push auf `main` automatisch durch Build + Deploy;
   die URL lautet `https://<owner>.github.io/<repo>/`.

**Wichtig vor dem produktiven Einsatz**: Der komplette Login-/Registrierungs-
/Freischaltungs-Ablauf wurde bisher nur auf Datenbankebene verifiziert (RLS-
Rollensimulation direkt gegen Postgres, siehe PR #3) – ein echter Klick-Test
im Browser (Login-Formular → Supabase-Session → Benutzeroberfläche) war aus
dieser Entwicklungsumgebung heraus nicht möglich (Netzwerk-Policy blockiert
direkten Zugriff auf `*.supabase.co`). Nach dem ersten Deploy daher unbedingt
manuell in einem normalen Browser durchklicken: Registrierung, Warten-auf-
Freigabe-Bildschirm, Freischaltung durch den Admin unter `/benutzer`, Login,
Abmelden.

Für Deployments ausserhalb von GitHub Pages: `vite.config.ts` liest den
Basis-Pfad aus `VITE_BASE_PATH` (Default `/`) – für einen Server, der die
App an der Domain-Wurzel ausliefert, muss diese Variable beim Build nicht
gesetzt werden.

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
