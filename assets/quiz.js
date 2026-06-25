/* Selbsttest-Website — generic quiz interaction.
   Works on any page that uses the .q / .opt / .q-reveal markup.
   No build step, no dependencies. */
(function () {
  "use strict";

  /* ----- Multiple-choice handling ----- */
  function initOptions(q) {
    var list = q.querySelector(".q-options");
    if (!list) return;
    var multi = list.getAttribute("data-multi") === "true";
    var opts = Array.prototype.slice.call(list.querySelectorAll(".opt"));

    opts.forEach(function (opt) {
      opt.setAttribute("role", multi ? "checkbox" : "radio");
      opt.setAttribute("tabindex", "0");
      opt.setAttribute("aria-checked", "false");
      opt.setAttribute("data-multi", multi ? "true" : "false");

      function choose() {
        if (list.classList.contains("locked")) return;
        if (multi) {
          opt.classList.toggle("picked");
          opt.setAttribute("aria-checked", opt.classList.contains("picked"));
          return;
        }
        lockSingle();
      }
      function lockSingle() {
        list.classList.add("locked");
        opts.forEach(function (o) {
          var ok = o.getAttribute("data-correct") === "true";
          if (o === opt) {
            o.classList.add(ok ? "correct" : "wrong");
            o.setAttribute("aria-checked", "true");
          }
          if (ok) o.classList.add("reveal-correct");
          o.querySelector(".tick").textContent = ok ? "✓" : (o === opt ? "✕" : "");
        });
        markCard(q, opt.getAttribute("data-correct") === "true");
        revealSolution(q, true);
      }

      opt.addEventListener("click", choose);
      opt.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); choose(); }
      });
    });

    /* multi-select: a check button grades the set */
    if (multi) {
      var chk = q.querySelector(".q-check");
      if (chk) chk.addEventListener("click", function () {
        list.classList.add("locked");
        var allRight = true;
        opts.forEach(function (o) {
          var ok = o.getAttribute("data-correct") === "true";
          var picked = o.classList.contains("picked");
          o.querySelector(".tick").textContent = ok ? "✓" : (picked ? "✕" : "");
          if (ok) o.classList.add("correct");
          else if (picked) o.classList.add("wrong");
          if (ok !== picked) allRight = false;
        });
        markCard(q, allRight);
        revealSolution(q, true);
      });
    }
  }

  function markCard(q, ok) {
    q.classList.remove("answered-ok", "answered-bad");
    q.classList.add(ok ? "answered-ok" : "answered-bad");
    updateScore();
  }

  /* ----- Reveal solution ----- */
  function revealSolution(q, force) {
    var btn = q.querySelector(".q-reveal");
    var sol = q.querySelector(".q-solution");
    if (!sol) return;
    var show = force === true ? true : sol.hidden;
    sol.hidden = !show;
    if (btn) {
      btn.setAttribute("aria-expanded", show ? "true" : "false");
      btn.textContent = show ? "Lösung ausblenden" : "Lösung anzeigen";
    }
  }

  function initReveal(q) {
    var btn = q.querySelector(".q-reveal");
    if (btn) btn.addEventListener("click", function () { revealSolution(q, false); });
  }

  /* ----- Score chip ----- */
  function updateScore() {
    var chip = document.getElementById("scorechip");
    if (!chip) return;
    var qs = document.querySelectorAll(".q");
    var total = qs.length;
    var ok = document.querySelectorAll(".q.answered-ok").length;
    var done = document.querySelectorAll(".q.answered-ok, .q.answered-bad").length;
    chip.innerHTML = "Auto-Fragen: <b>" + ok + "</b>/" + done + " richtig · " + total + " gesamt";
  }

  /* ----- Global controls ----- */
  function initControls() {
    var showAll = document.getElementById("show-all");
    var hideAll = document.getElementById("hide-all");
    if (showAll) showAll.addEventListener("click", function () {
      document.querySelectorAll(".q").forEach(function (q) { revealSolution(q, true); });
    });
    if (hideAll) hideAll.addEventListener("click", function () {
      document.querySelectorAll(".q .q-solution").forEach(function (s) {
        s.hidden = true;
        var q = s.closest(".q"); var b = q.querySelector(".q-reveal");
        if (b) { b.setAttribute("aria-expanded", "false"); b.textContent = "Lösung anzeigen"; }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".q").forEach(function (q) {
      initOptions(q);
      initReveal(q);
    });
    initControls();
    updateScore();
  });
})();
