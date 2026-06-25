/* Logik-Self-Test für pruefung.js (Node + node:vm, ohne Abhängigkeiten).
   Lädt pruefung.js in einer Sandbox und prüft Notenschlüssel + Auswertung.
   Ausführen:  node assets/pruefung.test.js  (im Zielordner) */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const code = fs.readFileSync(path.join(__dirname, "pruefung.js"), "utf8");

const sandbox = {
  window: {},
  document: { readyState: "loading", addEventListener: function () {} },
  setInterval: function () { return 0; },
  clearInterval: function () {},
  navigator: {},
  localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
  console: console,
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const S = sandbox.window.ProbeSaScoring;
assert.ok(S && typeof S.getIhkGrade === "function", "ProbeSaScoring.getIhkGrade fehlt");
assert.ok(typeof S.calculateExamResult === "function", "ProbeSaScoring.calculateExamResult fehlt");

/* ---- Notenschlüssel (IHK) ---- */
assert.equal(S.getIhkGrade(100).grade, 1);
assert.equal(S.getIhkGrade(92).grade, 1);
assert.equal(S.getIhkGrade(91.9).grade, 2);
assert.equal(S.getIhkGrade(81).grade, 2);
assert.equal(S.getIhkGrade(80.5).grade, 3);
assert.equal(S.getIhkGrade(67).grade, 3);
assert.equal(S.getIhkGrade(50).grade, 4);
assert.equal(S.getIhkGrade(49.9).grade, 5);
assert.equal(S.getIhkGrade(30).grade, 5);
assert.equal(S.getIhkGrade(0).grade, 6);

/* ---- calculateExamResult (reiner Auswahlteil, openMax = 0) ---- */
let r = S.calculateExamResult(16, 16, 0, 0);
assert.equal(r.totalMax, 16);
assert.equal(r.percentage, 100);
assert.equal(r.grade, 1);

r = S.calculateExamResult(8, 16, 0, 0);
assert.equal(r.percentage, 50);
assert.equal(r.grade, 4);

r = S.calculateExamResult(12, 16, 0, 0);
assert.equal(r.percentage, 75);
assert.equal(r.grade, 3);

/* ---- Clamping ---- */
r = S.calculateExamResult(20, 16, 0, 0);   // mehr als max
assert.equal(r.choiceScore, 16);
assert.equal(r.percentage, 100);

r = S.calculateExamResult(-5, 16, 0, 0);   // negativ
assert.equal(r.choiceScore, 0);
assert.equal(r.percentage, 0);

console.log("pruefung.test.js: alle Tests bestanden ✓");
