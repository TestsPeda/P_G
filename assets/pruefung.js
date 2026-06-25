/* Probe-SA — Prüfungssimulation mit Countdown.
   Eigene Logik (NICHT quiz.js): Antworten werden erst beim Abgeben bewertet.
   Single-Choice-Fragen tragen data-answer="<Index der richtigen Option>".
   Speichert Ergebnisse lokal (localStorage). Vanilla JS. */
(function () {
  "use strict";

  var DURATION = 20 * 60;        // PARAMETER (Schritt 6): Sekunden, an den Umfang angepasst (16 Fragen ≈ 20 min)
  var remaining = DURATION;
  var timerId = null;
  var submitted = false;
  var RESULT_KEY = "pug:probe-sa:results";
  /* PARAMETER (Modul code-ki-bewertung): offene Aufgaben des Prüfungsteils.
     []  ⇒ reiner Auswahlteil (kein offener Teil, kein Open-Panel). */
  var OPEN_TASKS = [];
  var OPEN_MAX = OPEN_TASKS.reduce(function (s, t) { return s + t.max; }, 0);

  function readNumber(value) {
    if (typeof value === "string") value = value.replace(",", ".");
    var n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }

  function clampScore(value, max) {
    var n = readNumber(value);
    var cap = readNumber(max);
    if (cap < 0) cap = 0;
    return Math.min(Math.max(n, 0), cap);
  }

  function roundPoints(value) {
    return Math.round(value * 100) / 100;
  }

  function formatPoints(value) {
    var n = roundPoints(readNumber(value));
    if (Math.abs(n - Math.round(n)) < 0.001) return String(Math.round(n));
    return String(n).replace(".", ",");
  }

  function formatPercent(value) {
    var n = roundPoints(readNumber(value));
    if (Math.abs(n - Math.round(n)) < 0.001) return String(Math.round(n));
    return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");
  }

  /* PARAMETER: Notenschlüssel (Standard IHK-Regensburg) */
  function getIhkGrade(percent) {
    var pct = clampScore(percent, 100);
    if (pct >= 92) return { grade: 1, label: "sehr gut", range: "92 bis 100 %" };
    if (pct >= 81) return { grade: 2, label: "gut", range: "81 bis unter 92 %" };
    if (pct >= 67) return { grade: 3, label: "befriedigend", range: "67 bis unter 81 %" };
    if (pct >= 50) return { grade: 4, label: "ausreichend", range: "50 bis unter 67 %" };
    if (pct >= 30) return { grade: 5, label: "mangelhaft", range: "30 bis unter 50 %" };
    return { grade: 6, label: "ungenügend", range: "0 bis unter 30 %" };
  }

  function calculateExamResult(choiceScore, choiceMax, openScore, openMax) {
    var cMax = readNumber(choiceMax);
    var oMax = readNumber(openMax);
    var choice = roundPoints(clampScore(choiceScore, cMax));
    var open = roundPoints(clampScore(openScore, oMax));
    var totalMax = roundPoints(cMax + oMax);
    var totalScore = roundPoints(choice + open);
    var pct = totalMax ? roundPoints(totalScore / totalMax * 100) : 0;
    var grade = getIhkGrade(pct);
    return {
      choiceScore: choice,
      choiceMax: cMax,
      openScore: open,
      openMax: oMax,
      totalScore: totalScore,
      totalMax: totalMax,
      percentage: pct,
      grade: grade.grade,
      gradeLabel: grade.label
    };
  }

  function buildScaleHtml(activeGrade) {
    var rows = [
      { grade: 1, range: "92-100 %" },
      { grade: 2, range: "81-&lt;92 %" },
      { grade: 3, range: "67-&lt;81 %" },
      { grade: 4, range: "50-&lt;67 %" },
      { grade: 5, range: "30-&lt;50 %" },
      { grade: 6, range: "0-&lt;30 %" }
    ];
    return "<div class='ihk-scale' aria-label='Notenschluessel'>" +
      rows.map(function (r) {
        return "<span" + (r.grade === activeGrade ? " class='active'" : "") + ">Note " +
          r.grade + " · " + r.range + "</span>";
      }).join("") +
      "</div>";
  }

  if (typeof window !== "undefined") {
    window.ProbeSaScoring = {
      getIhkGrade: getIhkGrade,
      calculateExamResult: calculateExamResult
    };
  }

  function saveResult(res) {
    var arr;
    try { arr = JSON.parse(localStorage.getItem(RESULT_KEY)) || []; } catch (e) { arr = []; }
    arr.push(res);
    try { localStorage.setItem(RESULT_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function getResults() {
    try { return JSON.parse(localStorage.getItem(RESULT_KEY)) || []; } catch (e) { return []; }
  }
  function clearResults() { localStorage.removeItem(RESULT_KEY); }

  function fmt(s) {
    var m = Math.floor(s / 60), x = s % 60;
    return m + ":" + (x < 10 ? "0" : "") + x;
  }

  function tick() {
    remaining--;
    var el = document.getElementById("timer");
    if (el) {
      el.textContent = fmt(Math.max(0, remaining));
      if (remaining <= 60) el.classList.add("low");
    }
    if (remaining <= 0) { clearInterval(timerId); doSubmit(true); }
  }

  function initSelect() {
    document.querySelectorAll(".exam-q").forEach(function (q) {
      var opts = Array.prototype.slice.call(q.querySelectorAll(".opt"));
      opts.forEach(function (o) {
        o.setAttribute("tabindex", "0");
        function pick() {
          if (submitted) return;
          opts.forEach(function (x) { x.classList.remove("picked"); });
          o.classList.add("picked");
        }
        o.addEventListener("click", pick);
        o.addEventListener("keydown", function (e) {
          if (e.key === " " || e.key === "Enter") { e.preventDefault(); pick(); }
        });
      });
    });
  }

  function doSubmit(auto) {
    if (submitted) return;
    submitted = true;
    clearInterval(timerId);

    var total = 0, ok = 0;
    document.querySelectorAll(".exam-q").forEach(function (q) {
      var ans = parseInt(q.getAttribute("data-answer"), 10);
      var opts = Array.prototype.slice.call(q.querySelectorAll(".opt"));
      var list = q.querySelector(".q-options");
      if (list) list.classList.add("locked");
      total++;
      var picked = -1;
      opts.forEach(function (o, i) { if (o.classList.contains("picked")) picked = i; });
      opts.forEach(function (o, i) {
        var mark = o.querySelector(".tick");
        if (i === ans) { o.classList.add("correct"); if (mark) mark.textContent = "✓"; }
        else if (i === picked) { o.classList.add("wrong"); if (mark) mark.textContent = "✕"; }
      });
      if (picked === ans) { ok++; q.classList.add("answered-ok"); }
      else q.classList.add("answered-bad");
      var sol = q.querySelector(".q-solution");
      if (sol) sol.hidden = false;
    });

    var used = DURATION - Math.max(0, remaining);
    showResult(ok, total, used, auto);
    saveResult({ score: ok, total: total, seconds: used, ts: Date.now() });
    renderBest();
    var sb = document.getElementById("submit-btn");
    if (sb) { sb.disabled = true; sb.textContent = "Abgegeben"; }
  }

  function renderOpenScorePanel() {
    var fields = OPEN_TASKS.map(function (task) {
      return "<label class='open-score-field' for='" + task.id + "'>" +
        "<span>" + task.label + "</span>" +
        "<input id='" + task.id + "' class='open-score-input' type='number' inputmode='decimal' " +
        "min='0' max='" + task.max + "' step='0.5' value='0' data-max='" + task.max + "'>" +
        "<small>/ " + task.max + " P</small>" +
      "</label>";
    }).join("");
    return "<div class='open-score-panel'>" +
      "<span class='rubric-label'>Offenen Teil addieren</span>" +
      "<p class='score-help'>Trage nach der KI-Bewertung die Punkte der offenen Aufgaben ein. Gesamtpunktzahl, Prozentzahl und Note werden direkt berechnet.</p>" +
      "<div class='open-score-grid'>" + fields + "</div>" +
      "<div id='final-score-summary' class='final-score-summary' aria-live='polite'></div>" +
    "</div>";
  }

  function readOpenScoreTotal() {
    var open = 0;
    document.querySelectorAll(".open-score-input").forEach(function (input) {
      open += clampScore(input.value, input.getAttribute("data-max"));
    });
    return roundPoints(open);
  }

  function updateFinalScore(choiceScore, choiceTotal) {
    var summary = document.getElementById("final-score-summary");
    if (!summary) return;
    var result = calculateExamResult(choiceScore, choiceTotal, readOpenScoreTotal(), OPEN_MAX);
    var gradeInfo = getIhkGrade(result.percentage);
    summary.innerHTML =
      "<div class='final-score-main'>" +
        "<span><b>Gesamt:</b> " + formatPoints(result.totalScore) + " / " + formatPoints(result.totalMax) + " P</span>" +
        "<span><b>Prozent:</b> " + formatPercent(result.percentage) + " %</span>" +
        "<span><b>Note:</b> " + result.grade + " (" + result.gradeLabel + ")</span>" +
      "</div>" +
      "<p class='score-help'>Abgleich: " + formatPercent(result.percentage) + " % liegt im Bereich <strong>" + gradeInfo.range + "</strong>.</p>" +
      buildScaleHtml(result.grade);
  }

  function initOpenScorePanel(choiceScore, choiceTotal) {
    document.querySelectorAll(".open-score-input").forEach(function (input) {
      input.addEventListener("input", function () { updateFinalScore(choiceScore, choiceTotal); });
      input.addEventListener("blur", function () {
        input.value = formatPoints(clampScore(input.value, input.getAttribute("data-max")));
        updateFinalScore(choiceScore, choiceTotal);
      });
    });
    updateFinalScore(choiceScore, choiceTotal);
  }

  function showResult(ok, total, used, auto) {
    var box = document.getElementById("result");
    if (!box) return;
    var pct = total ? Math.round(ok / total * 100) : 0;
    var hasOpen = OPEN_TASKS.length > 0;
    box.hidden = false;
    box.innerHTML =
      "<strong>Auswahlteil:</strong> " + ok + " / " + total + " richtig (" + pct + " %) · " +
      "Zeit: " + fmt(used) + (auto ? " · <em>Zeit abgelaufen</em>" : "") +
      "<br>Die Musterlösungen sind jetzt unter den Fragen sichtbar." +
      (hasOpen
        ? "<br><strong>Offener Teil (" + formatPoints(OPEN_MAX) + " P):</strong> per KI-Bewertungs-Prompt bewerten lassen und die Punkte unten eintragen." + renderOpenScorePanel()
        : "");
    if (hasOpen) initOpenScorePanel(ok, total);
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderBest() {
    var box = document.getElementById("history");
    if (!box) return;
    var res = getResults();
    if (!res.length) { box.hidden = true; return; }
    box.hidden = false;
    var rows = res.slice(-5).reverse().map(function (r) {
      var d = new Date(r.ts);
      var datum = d.toLocaleDateString() + " " + d.toLocaleTimeString().slice(0, 5);
      var pct = r.total ? Math.round(r.score / r.total * 100) : 0;
      return "<tr><td>" + datum + "</td><td>" + r.score + "/" + r.total +
             "</td><td>" + pct + " %</td><td>" + fmt(r.seconds) + "</td></tr>";
    }).join("");
    box.innerHTML =
      "<span class='rubric-label'>Deine letzten Versuche</span>" +
      "<div class='tbl-wrap'><table class='ref'><tr><th>Datum</th><th>Punkte</th><th>Quote</th><th>Zeit</th></tr>" +
      rows + "</table></div>" +
      "<button class='btn' id='clear-history' type='button'>Verlauf löschen</button>";
    var cl = document.getElementById("clear-history");
    if (cl) cl.addEventListener("click", function () {
      clearResults(); renderBest(); box.hidden = true;
    });
  }

  /* ---- Offener Teil: Reveal-Toggle + Sammel-Prompt für die KI-Bewertung ---- */
  function copyText(text, btn) {
    function flash(msg) {
      var orig = btn.getAttribute("data-label") || btn.textContent;
      btn.setAttribute("data-label", orig);
      btn.textContent = msg; btn.classList.add("copied");
      setTimeout(function () { btn.textContent = btn.getAttribute("data-label"); btn.classList.remove("copied"); }, 1800);
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "absolute"; ta.style.left = "-9999px";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash("✓ kopiert"); },
        function () { flash(fallback() ? "✓ kopiert" : "Kopieren fehlgeschlagen"); });
    } else { flash(fallback() ? "✓ kopiert" : "Kopieren fehlgeschlagen"); }
  }

  function buildOpenPrompt() {
    var blocks = [];
    document.querySelectorAll(".open-q").forEach(function (q, i) {
      var tpl = q.querySelector("template.prompt-tpl");
      var input = q.querySelector(".code-input");
      var t = tpl ? tpl.innerHTML : "";
      var code = input ? input.value : "";
      if (!code.trim()) code = "(keine Eingabe)";
      blocks.push("=== Aufgabe " + (i + 1) + " ===\n" + t.replace(/\{\{CODE\}\}/g, code).trim());
    });
    return "Du bist Informatik-Lehrkraft. Bewerte den offenen Teil meiner Probe-SA (Fach PuG) " +
      "und vergib pro Aufgabe Punkte streng nach den jeweils genannten Kriterien. Nenne je Aufgabe " +
      "die erreichten Punkte mit kurzer Begründung und am Ende die Gesamtpunktzahl des offenen Teils.\n\n" +
      blocks.join("\n\n");
  }

  function initOpen() {
    document.querySelectorAll(".open-q .q-reveal").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var q = btn.closest(".q");
        var sol = q ? q.querySelector(".q-solution") : null;
        if (!sol) return;
        sol.hidden = !sol.hidden;
        btn.setAttribute("aria-expanded", sol.hidden ? "false" : "true");
        btn.textContent = sol.hidden ? "Musterlösung anzeigen" : "Musterlösung ausblenden";
      });
    });
    var co = document.getElementById("copy-open");
    if (co) co.addEventListener("click", function () { copyText(buildOpenPrompt(), co); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSelect();
    initOpen();
    var el = document.getElementById("timer");
    if (el) el.textContent = fmt(remaining);
    timerId = setInterval(tick, 1000);

    var sb = document.getElementById("submit-btn");
    if (sb) sb.addEventListener("click", function () { doSubmit(false); });

    renderBest();
  });
})();
