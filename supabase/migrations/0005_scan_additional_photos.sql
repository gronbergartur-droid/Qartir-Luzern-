-- IDM Mobile - mehrere Fotos pro Sieb-Scan (Sieb-SET-Erfassung)
--
-- Ein SET-Lieferschein bringt mehrere Siebe in einer Sendung, und pro Sieb
-- braucht es oft mehr als ein Foto (Uebersicht + Detail/Barcode-Nahaufnahme)
-- fuer eine zuverlaessige Barcode/QR/OCR-Erkennung. captured_image_url bleibt
-- das primaere/erste Foto (unveraendert); additional_image_urls haelt die
-- weiteren Fotos desselben Scans als JSON-Array, gleiche Storage-Semantik
-- (Pfad/URL, aktuell als Platzhalter mit Base64-Daten befuellt).

alter table scans add column if not exists additional_image_urls jsonb not null default '[]';
