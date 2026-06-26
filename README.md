# PuG · Ausbildung & Arbeitsrecht — Selbsttest-Website

🌐 Live über GitHub Pages: https://testspeda.github.io/P_G/

Eine eigenständige, statische Lern- und Test-Website zum Fach **Politik und Gesellschaft (PuG)**.
Kein Build-Schritt, keine externen Abhängigkeiten — einfach
`index.html` im Browser öffnen. Funktioniert offline und auf GitHub Pages.

## Themen (6)

1. **Duales System** — zwei Lernorte, Vergleich USA, Schulpflicht, BVJ/BGJ/EQ
2. **Berufsausbildungsvertrag** — Form, Pflichtinhalte, nichtige Klauseln, Rechte/Pflichten, Kündigung
3. **Jugendarbeitsschutzgesetz (JArbSchG)** — Arbeitszeit, Pausen, Urlaub, Nachtruhe, Verbote
4. **Arbeitszeitgesetz (ArbZG)** — Höchstarbeitszeit, Pausen, Ruhezeit, Nachtzeit, Sonntagsruhe
5. **Sozialversicherungen** — fünf Säulen, Träger, Beiträge, Prinzipien
6. **Urlaub & Entgeltfortzahlung** — BUrlG und EntgFG

## Aufbau

- `index.html` — Startseite mit Sternnavigation (SVG) über alle Themen
- `01…06-*.html` — je eine Themenseite mit auto-bewerteten Fragen, Fallbeispielen und Diagrammen
- `lernseite.html` — Kernbegriffe kompakt + alle Diagramme (ohne Quiz)
- `pruefung.html` — **Probe-SA, nur Sozialversicherungen** (16 Fragen, ca. 20 min, mit Timer)
- `assets/` — `style.css`, `quiz.js`, `store.js`, `print.css`, `pruefung.js` (+ Self-Tests)

## Bedienung

- **Speichern:** Antworten, Punkte und Eingaben werden lokal im Browser (`localStorage`) gespeichert.
  Auf jeder Themenseite gibt es einen Knopf **„Fortschritt zurücksetzen“**.
- **Drucken/PDF:** Mit `Strg/Cmd + P` lässt sich jede Seite als Lernzettel drucken — dabei werden alle
  Lösungen sichtbar.
- **Probe-SA:** Countdown läuft beim Laden; „Abgeben & auswerten“ bewertet den Auswahlteil, zeigt die
  Note nach IHK-Schlüssel und speichert den Versuch.
