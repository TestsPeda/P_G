/* Persistenz für die Selbsttest-Website (statisch, localStorage).
   Speichert: beantwortete MC/Multi-Select-Fragen (inkl. Score), Code-Eingaben
   und Probe-SA-Ergebnisse. Stellt den Zustand beim Neuladen wieder her.
   Läuft NACH quiz.js (muss in der Seite danach eingebunden werden), damit die
   Wiederherstellung die vorhandenen Klick-Handler von quiz.js nutzen kann.
   Vanilla JS, keine Abhängigkeiten. */
(function () {
  "use strict";

  var PAGE = (location.pathname.split("/").pop() || "index").replace(/\.html$/, "");
  var KEY = "pug:" + PAGE;
  var RESULT_KEY = "pug:probe-sa:results";
  var restoring = false;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function qidOf(q, fallbackIdx) {
    var num = q.querySelector(".q-num");
    return num ? "q" + num.textContent.trim() : "i" + fallbackIdx;
  }

  function record(state) {
    save(state);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var state = load();
    var qs = Array.prototype.slice.call(document.querySelectorAll(".q"));

    qs.forEach(function (q, idx) {
      var id = qidOf(q, idx);
      var list = q.querySelector(".q-options");
      var input = q.querySelector(".code-input");

      /* ---- Code-Eingaben ---- */
      if (input) {
        if (state[id] && typeof state[id].code === "string") input.value = state[id].code;
        input.addEventListener("input", function () {
          state[id] = state[id] || {};
          state[id].code = input.value;
          record(state);
        });
      }

      /* ---- Multiple Choice / Multi-Select ---- */
      if (list) {
        var multi = list.getAttribute("data-multi") === "true";
        var opts = Array.prototype.slice.call(list.querySelectorAll(".opt"));

        if (!multi) {
          opts.forEach(function (opt, oi) {
            opt.addEventListener("click", function () {
              if (restoring) return;
              state[id] = { picked: oi };
              record(state);
            });
          });
        } else {
          var chk = q.querySelector(".q-check");
          if (chk) chk.addEventListener("click", function () {
            if (restoring) return;
            var picked = [];
            opts.forEach(function (o, oi) { if (o.classList.contains("picked")) picked.push(oi); });
            state[id] = { multiPicked: picked, checked: true };
            record(state);
          });
        }
      }
    });

    /* ---- Wiederherstellung (synthetische Klicks → quiz.js bewertet normal) ---- */
    restoring = true;
    qs.forEach(function (q, idx) {
      var id = qidOf(q, idx);
      var saved = state[id];
      if (!saved) return;
      var list = q.querySelector(".q-options");
      if (!list) return;
      var opts = Array.prototype.slice.call(list.querySelectorAll(".opt"));
      if (typeof saved.picked === "number" && opts[saved.picked]) {
        opts[saved.picked].click();
      } else if (saved.multiPicked) {
        saved.multiPicked.forEach(function (oi) { if (opts[oi]) opts[oi].click(); });
        if (saved.checked) { var c = q.querySelector(".q-check"); if (c) c.click(); }
      }
    });
    restoring = false;

    /* ---- Zurücksetzen-Button in die .controls einhängen ---- */
    var controls = document.querySelector(".controls");
    if (controls) {
      var btn = document.createElement("button");
      btn.className = "btn";
      btn.type = "button";
      btn.textContent = "Fortschritt zurücksetzen";
      btn.addEventListener("click", function () {
        localStorage.removeItem(KEY);
        location.reload();
      });
      controls.appendChild(btn);
    }
  });

  /* ---- Öffentliche Helfer für Probe-SA-Ergebnisse ---- */
  window.TestStore = {
    saveProbeResult: function (res) {
      var arr;
      try { arr = JSON.parse(localStorage.getItem(RESULT_KEY)) || []; } catch (e) { arr = []; }
      arr.push(res);
      try { localStorage.setItem(RESULT_KEY, JSON.stringify(arr)); } catch (e) {}
    },
    getProbeResults: function () {
      try { return JSON.parse(localStorage.getItem(RESULT_KEY)) || []; } catch (e) { return []; }
    },
    clearProbeResults: function () { localStorage.removeItem(RESULT_KEY); }
  };
})();
