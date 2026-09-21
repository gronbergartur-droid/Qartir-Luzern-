# IDM Mobile LEIH-SIEB — Schweizer B2B-Tarifmodell

Software- & KI-Lösung für die digitale Verwaltung und Kontrolle von
Leih-Sieben und Leihinstrumenten.

## 1. Geschäftsmodell

IDM Mobile LEIH-SIEB wird als SaaS-Lösung für Schweizer Kliniken, Spitäler,
OP-Bereiche und AEMP angeboten. Das Produkt digitalisiert die Verwaltung von
Leih-Sieben und Leihinstrumenten und unterstützt die Kontrolle durch
Fotovergleich und KI-gestützte Erkennung von Abweichungen.

## 2. Tarifübersicht

| Tarif | Preis / Monat | Zielgruppe | Leistungsumfang |
|---|---|---|---|
| **IDM START** | CHF 149 | Kleine Klinik / einzelner Bereich | LEIH-Sieb-Verwaltung, Lieferanten, QR-/Barcode, Foto-Dokumentation, Basis-KI, Historie, Dashboard |
| **IDM PROFESSIONAL** ⭐ | CHF 299 | AEMP / OP / mehrere Benutzer | START + erweiterte KI-Fotoanalyse, automatische Lieferantenzuordnung, Audit Trail, Reports, Benutzerverwaltung |
| **IDM HOSPITAL** | CHF 599 | Spital / mehrere Abteilungen | PROFESSIONAL + mehrere OP/AEMP-Bereiche, zentrale Administration, erweiterte Reports, API, SLA-Support |
| **IDM ENTERPRISE** | ab CHF 1'200 | Grosses Spital / Spitalgruppe | Individuelle Lösung, Integrationen, API, zentrale Administration, individuelle Prozesse und Support |

## 3. Leistungen der IDM-Plattform

- LEIH-Sieb-Verwaltung
- Lieferantenverwaltung
- QR-/Barcode-Scanning
- Foto beim Eingang
- Foto nach der Operation
- KI-Vorher-/Nachher-Vergleich
- Erkennung fehlender, zusätzlicher oder falscher Instrumente
- Automatische Lieferantenzuordnung
- Sieb-Historie und Lieferanten-Historie
- Audit Trail mit Datum, Uhrzeit und Benutzer
- Dashboard und Statusübersicht
- Benutzer- und Rollenverwaltung
- Cloud-Speicherung
- Reports und Dokumentation
- Support

## 4. Einmalige Einrichtung

| Tarif | Einrichtung |
|---|---|
| IDM START | CHF 490 |
| IDM PROFESSIONAL | CHF 990 |
| IDM HOSPITAL | ab CHF 2'500 |
| IDM ENTERPRISE | individuell |

## Abgleich mit dem aktuellen Funktionsstand

Der Grossteil von Abschnitt 3 ist im Code bereits umgesetzt (LEIH-SIEB
SCANNER, Lieferantenverwaltung, QR-/Barcode-Scanning, Foto-Dokumentation
Eingang/Ausgang, KI-Vergleich, Sieb-/Lieferanten-Historie, Audit Trail,
Dashboard). Noch offen für ein produktives SaaS-Angebot: echte
Benutzer-/Rollenverwaltung mit Login (aktuell nur eine leichtgewichtige,
nicht authentifizierte Namens-Kennung, siehe README „Benutzer-Kennzeichen“),
Mandantentrennung pro Kunde, Reports/Export, sowie eine öffentliche API für
die höheren Tarifstufen.
