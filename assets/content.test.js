/* Inhalts-Self-Test (Node, ohne Abhängigkeiten).
   Prüft, dass zentrale Inhalte, Diagramme, Themen-Tags und die Verdrahtung
   tatsächlich in den generierten HTML-Dateien vorkommen.
   Ausführen:  node assets/content.test.js  (im Zielordner) */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const cache = {};
function doc(f) { return cache[f] || (cache[f] = fs.readFileSync(path.join(ROOT, f), "utf8")); }
function count(s, re) { return (s.match(re) || []).length; }

let checks = 0;
/* f = Dateiname (wird gelesen), needle = gesuchte Zeichenkette */
function has(f, needle, label) {
  const s = doc(f);
  assert.ok(s.includes(needle), (label || f) + " enthält nicht: " + needle);
  checks++;
}

const TOPICS = [
  "01-duales-system.html",
  "02-ausbildungsvertrag.html",
  "03-jugendarbeitsschutz.html",
  "04-arbeitszeitgesetz.html",
  "05-sozialversicherungen.html",
  "06-urlaub-entgelt.html",
];

/* ---- Verdrahtung aller Themenseiten ---- */
TOPICS.forEach(function (f) {
  const s = doc(f);
  has(f, 'href="assets/style.css"');
  has(f, 'href="assets/print.css"');
  has(f, 'src="assets/quiz.js"');
  has(f, 'src="assets/store.js"');
  // store.js MUSS nach quiz.js eingebunden sein
  assert.ok(s.indexOf("quiz.js") < s.indexOf("store.js"), f + ": store.js muss nach quiz.js stehen");
  // jede Seite hat mind. eine korrekte MC-Antwort
  assert.ok(count(s, /data-correct="true"/g) > 0, f + ": keine data-correct-Markierung");
  // keine externen URLs
  assert.ok(!/https?:\/\//.test(s), f + ": enthält externe URL");
  checks++;
});

/* ---- Thema 01 Duales System ---- */
has("01-duales-system.html", "Duales System");
has("01-duales-system.html", "Berufsbildungsgesetz");
has("01-duales-system.html", "Berufsvorbereitungsjahr");
has("01-duales-system.html", "Berufsgrundbildungsjahr");
has("01-duales-system.html", "Einstiegsqualifizierung");
has("01-duales-system.html", "Duales System — zwei Lernorte"); // Diagramm
has("01-duales-system.html", 'class="q-src">Duales System');  // Themen-Tag

/* ---- Thema 02 Berufsausbildungsvertrag ---- */
has("02-ausbildungsvertrag.html", "Berufsausbildungsvertrag");
has("02-ausbildungsvertrag.html", "Probezeit");
has("02-ausbildungsvertrag.html", "Konkurrenzverbot");
has("02-ausbildungsvertrag.html", "qualifizierte");
has("02-ausbildungsvertrag.html", "Parteien &amp; Eintragung");        // Diagramm 1
has("02-ausbildungsvertrag.html", "Zeitstrahl des Ausbildungsverhältnisses"); // Diagramm 2

/* ---- Thema 03 JArbSchG ---- */
has("03-jugendarbeitsschutz.html", "Jugendarbeitsschutzgesetz");
has("03-jugendarbeitsschutz.html", "40 Stunden");
has("03-jugendarbeitsschutz.html", "30 Werktage");
has("03-jugendarbeitsschutz.html", "20 und 6 Uhr");
has("03-jugendarbeitsschutz.html", "Pflichtpausen für Jugendliche");   // Diagramm 1
has("03-jugendarbeitsschutz.html", "Nachtruhe Jugendlicher: 20–6 Uhr");// Diagramm 2

/* ---- Thema 04 ArbZG ---- */
has("04-arbeitszeitgesetz.html", "Arbeitszeitgesetz");
has("04-arbeitszeitgesetz.html", "11 Stunden");
has("04-arbeitszeitgesetz.html", "45 Minuten");
has("04-arbeitszeitgesetz.html", "23 bis 6 Uhr");
has("04-arbeitszeitgesetz.html", "Pflichtpausen für Erwachsene (ArbZG)"); // Diagramm 1
has("04-arbeitszeitgesetz.html", "Nachtzeit (ArbZG): 23–6 Uhr");          // Diagramm 2

/* ---- Thema 05 Sozialversicherungen ---- */
has("05-sozialversicherungen.html", "System der sozialen Sicherung in Deutschland"); // Tempel
has("05-sozialversicherungen.html", "Berufsgenossenschaft");
has("05-sozialversicherungen.html", "18,6");
has("05-sozialversicherungen.html", "Solidaritätsprinzip");
has("05-sozialversicherungen.html", "Äquivalenzprinzip");
has("05-sozialversicherungen.html", "Generationenvertrag");
has("05-sozialversicherungen.html", "Subsidiaritätsprinzip");
has("05-sozialversicherungen.html", "Versicherungspflichtgrenze");
has("05-sozialversicherungen.html", "Beitragssätze 2026"); // Diagramm 2
// AN/AG-Aufteilung (paritätisch 50/50 + Ausnahmen)
has("05-sozialversicherungen.html", "Aufteilung Arbeitgeber / Arbeitnehmer");
has("05-sozialversicherungen.html", "paritätisch");

/* ---- Thema 06 Urlaub & Entgeltfortzahlung ---- */
has("06-urlaub-entgelt.html", "24 Werktage");
has("06-urlaub-entgelt.html", "6 Wochen");
has("06-urlaub-entgelt.html", "Krankengeld");
has("06-urlaub-entgelt.html", "Verletztengeld");
has("06-urlaub-entgelt.html", "Gesetzlicher Mindesturlaub");          // Diagramm 1
has("06-urlaub-entgelt.html", "Lohn bei Krankheit — wer zahlt wann?"); // Diagramm 2

/* ---- Lernseite: KEINE Quizkarten, aber Lernkarten + Diagramme ---- */
const lern = doc("lernseite.html");
assert.ok(!/<article class="q"/.test(lern), "lernseite.html darf keine .q-Karten enthalten");
assert.ok(!lern.includes("quiz.js"), "lernseite.html darf quiz.js nicht laden");
has("lernseite.html", 'class="learn-card"');
has("lernseite.html", 'class="gal-grid"');
['id="t01"', 'id="t02"', 'id="t03"', 'id="t04"', 'id="t05"', 'id="t06"'].forEach(function (id) {
  has("lernseite.html", id, "lernseite Sprungmarke");
});
// Diagramme der Themenseiten sind auf der Lernseite gespiegelt
has("lernseite.html", "System der sozialen Sicherung in Deutschland", "lernseite Tempel");
has("lernseite.html", "Pflichtpausen für Jugendliche", "lernseite");
has("lernseite.html", "Aufteilung AN/AG", "lernseite Beitragsaufteilung");

/* ---- Probe-SA: nur Sozialversicherungen, 16 Auswahlfragen ---- */
const pr = doc("pruefung.html");
has("pruefung.html", 'src="assets/pruefung.js"');
assert.ok(!pr.includes("quiz.js"), "pruefung.html darf quiz.js NICHT laden");
assert.ok(!pr.includes("store.js"), "pruefung.html darf store.js NICHT laden");
has("pruefung.html", "Sozialversicherungen", "pruefung Thema");
const examQ = count(pr, /class="q exam-q"/g);
assert.equal(examQ, 16, "pruefung.html muss 16 exam-q enthalten, hat " + examQ);
const answers = count(pr, /data-answer="\d+"/g);
assert.equal(answers, 16, "jede exam-q braucht ein data-answer (16 erwartet, " + answers + ")");
checks += 3;

/* ---- Index: Gesamtzahlen + Links auf alle Themen ---- */
has("index.html", "92", "index Aufgabenzahl");
has("index.html", "6 Themen", "index Hero");
TOPICS.forEach(function (f) { has("index.html", 'href="' + f + '"', "index Themen-Link"); });
has("index.html", 'href="lernseite.html"', "index Lernseiten-Link");
has("index.html", 'href="pruefung.html"', "index Probe-SA-Link");

console.log("content.test.js: " + checks + " Prüfungen bestanden ✓");
