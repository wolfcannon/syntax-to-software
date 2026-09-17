/* From Syntax to Software — exercise runner.
 *
 * Every exercise on this site is: your code, then a handful of assertions you
 * don't see. The assertions are plain Python. In step 20 we stop hiding them
 * and you start writing them yourself — this file is the scaffolding for that
 * reveal, so keep the checks honest and readable.
 */
const COURSE = (function () {
  const PYODIDE_VERSION = "0.26.4";
  const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
  const LS_DONE = "sts:done";
  const LS_CODE = "sts:code:";

  /* ---------- storage (never let a blocked localStorage break the page) --- */
  function readDone() {
    try { return JSON.parse(localStorage.getItem(LS_DONE) || "{}") || {}; }
    catch { return {}; }
  }
  function writeDone(d) {
    try { localStorage.setItem(LS_DONE, JSON.stringify(d)); } catch {}
  }
  function markDone(id, ok) {
    const d = readDone();
    if (ok) d[id] = true; else delete d[id];
    writeDone(d); paintProgress();
  }
  const saveCode = (id, src) => { try { localStorage.setItem(LS_CODE + id, src); } catch {} };
  const loadCode = (id) => { try { return localStorage.getItem(LS_CODE + id); } catch { return null; } };

  /* ---------- pyodide, loaded once, on first Run ------------------------- */
  let pyodidePromise = null;
  function bootPyodide(status) {
    if (pyodidePromise) return pyodidePromise;
    status("loading Python (~10 MB, first time only)…");
    pyodidePromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = CDN + "pyodide.js";
      s.onload = () => loadPyodide({ indexURL: CDN }).then(resolve, reject);
      s.onerror = () => reject(new Error(
        "Could not load Pyodide from the CDN. This page needs an internet " +
        "connection the first time you run code."));
      document.head.appendChild(s);
    }).then(async (py) => {
      await py.runPythonAsync(HARNESS);
      return py;
    });
    return pyodidePromise;
  }

  /* ---------- the Python side of the harness ----------------------------- */
  const HARNESS = `
import io, sys, traceback, json

class CheckFailed(AssertionError):
    pass

def _show(v):
    r = repr(v)
    return r if len(r) <= 160 else r[:157] + "..."

def expect(actual, wanted, label=None):
    """Assert equality, and say what came back when it isn't."""
    if actual != wanted or type(actual) is not type(wanted):
        raise CheckFailed(
            "got %s (%s), expected %s (%s)"
            % (_show(actual), type(actual).__name__,
               _show(wanted), type(wanted).__name__))
    return True

def expect_close(actual, wanted, tol=1e-9):
    if not isinstance(actual, (int, float)) or abs(actual - wanted) > tol:
        raise CheckFailed("got %s, expected %s (within %g)"
                          % (_show(actual), _show(wanted), tol))
    return True

def expect_type(value, wanted):
    if type(value) is not wanted:
        raise CheckFailed("got a %s (%s), expected a %s"
                          % (type(value).__name__, _show(value), wanted.__name__))
    return True

def expect_defined(ns, name):
    if name not in ns:
        raise CheckFailed("nothing named '%s' was defined" % name)
    return ns[name]

def expect_raises(exc, fn, *a, **kw):
    try:
        fn(*a, **kw)
    except exc:
        return True
    except Exception as e:
        raise CheckFailed("raised %s, expected %s"
                          % (type(e).__name__, exc.__name__))
    raise CheckFailed("nothing was raised, expected %s" % exc.__name__)

def _run_exercise(setup_src, user_src, checks_json):
    ns = {"expect": expect, "expect_close": expect_close,
          "expect_type": expect_type, "expect_raises": expect_raises,
          "expect_defined": expect_defined, "CheckFailed": CheckFailed}
    buf = io.StringIO()
    real, sys.stdout = sys.stdout, buf
    try:
        if setup_src:
            exec(setup_src, ns)
        try:
            exec(user_src, ns)
        except Exception:
            tb = traceback.format_exc()
            # hide the harness frames — show only the learner's own traceback
            lines = tb.splitlines(True)
            keep = [l for i, l in enumerate(lines)
                    if not ('File "<exec>"' in l and i == 1)]
            return json.dumps({"stdout": buf.getvalue(),
                               "error": "".join(keep).replace('File "<string>"', "your code"),
                               "checks": []})
    finally:
        sys.stdout = real

    results = []
    for chk in json.loads(checks_json):
        out = {"label": chk["label"]}
        try:
            exec(chk["code"], ns)
            out["ok"] = True
        except CheckFailed as e:
            out["ok"] = False; out["detail"] = str(e)
        except Exception as e:
            out["ok"] = False
            out["detail"] = "%s: %s" % (type(e).__name__, e)
        results.append(out)
    return json.dumps({"stdout": buf.getvalue(), "error": None, "checks": results})
`;

  /* ---------- DOM ---------------------------------------------------------- */
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  function exercise(mountId, spec) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const id = spec.id || mountId;

    const card = el("section", "ex");
    const head = el("div", "ex-head");
    head.append(el("span", "tag", spec.tag || "Exercise"),
                el("span", "ttl", spec.title || ""),
                el("span", "state", ""));
    const state = head.querySelector(".state");

    const body = el("div", "ex-body");
    if (spec.prompt) body.append(el("div", "prompt", spec.prompt));

    const ta = el("textarea");
    ta.spellcheck = false;
    ta.value = loadCode(id) ?? (spec.starter || "");
    ta.rows = Math.max(4, ta.value.split("\n").length + 1);
    body.append(ta);

    const bar = el("div", "ex-bar");
    const run = el("button", "primary", "Run &amp; check");
    const reset = el("button", null, "Reset");
    const hint = el("span", "hint", "⌘/Ctrl + Enter");
    bar.append(run, reset, hint);
    body.append(bar);

    const out = el("div", "out");
    body.append(out);

    if (spec.solution) {
      const d = el("details", "checkq");
      d.innerHTML =
        '<summary><span class="q">Show one way to do it</span></summary>' +
        '<div class="ans"><pre>' + escapeHtml(spec.solution) + "</pre></div>";
      body.append(d);
    }

    card.append(head, body);
    mount.replaceWith(card);

    if (readDone()[id]) { card.classList.add("passed"); state.textContent = "passed"; }

    ta.addEventListener("input", () => saveCode(id, ta.value));
    ta.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); go(); }
      if (e.key === "Tab") {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.value = ta.value.slice(0, s) + "    " + ta.value.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + 4;
      }
    });
    reset.addEventListener("click", () => {
      ta.value = spec.starter || ""; saveCode(id, ta.value);
      out.className = "out"; out.innerHTML = "";
    });
    run.addEventListener("click", go);

    async function go() {
      run.disabled = true;
      const say = (m) => { out.className = "out show"; out.innerHTML =
        '<p class="small">' + escapeHtml(m) + "</p>"; };
      say("running…");
      let py;
      try { py = await bootPyodide(say); }
      catch (e) { say(e.message); run.disabled = false; return; }

      let res;
      try {
        const raw = py.globals.get("_run_exercise")(
          spec.setup || "", ta.value, JSON.stringify(spec.checks || []));
        res = JSON.parse(raw);
      } catch (e) {
        say("The runner itself fell over: " + e.message);
        run.disabled = false; return;
      }
      render(res);
      run.disabled = false;
    }

    function render(res) {
      out.className = "out show";
      out.innerHTML = "";
      if (res.stdout) {
        const p = el("pre"); p.textContent = res.stdout.replace(/\n$/, "");
        out.append(p);
      }
      if (res.error) {
        const p = el("pre", "err"); p.textContent = res.error.trim();
        out.append(p);
        card.classList.remove("passed"); state.textContent = "";
        markDone(id, false);
        return;
      }
      const ul = el("ul", "checks");
      let allOk = true;
      for (const c of res.checks) {
        if (!c.ok) allOk = false;
        const li = el("li", c.ok ? "ok" : "no");
        li.append(el("span", "mark", c.ok ? "✓" : "✗"));
        const t = el("span", null, escapeHtml(c.label));
        if (!c.ok && c.detail) t.append(el("span", "detail", escapeHtml(c.detail)));
        li.append(t);
        ul.append(li);
      }
      out.append(ul);
      card.classList.toggle("passed", allOk);
      state.textContent = allOk ? "passed" : res.checks.filter(c => c.ok).length +
        " of " + res.checks.length;
      markDone(id, allOk);
    }
  }

  /* ---------- inline quiz ------------------------------------------------
     A question answered by clicking, with no Python behind it — instant, and
     it does not pull down the runtime. Two shapes:

       options: [...]   one question, graded on click
       parts:   [...]   several questions, graded together on one submit

     Feedback comes in three stages, so a reader who is close gets to stay in
     the problem: right answer -> Correct! and the explanation; first wrong
     answer -> a nudge and nothing else; second wrong answer -> the answer,
     with the lines that decide it highlighted in the code. */
  const RETRY = "Read the code carefully and try again. " +
                "Pay attention to the indentation.";

  function quiz(mountId, spec) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const id = spec.id || mountId;
    const parts = spec.parts || [{ options: spec.options, single: true }];

    const card = el("section", "quiz");
    const head = el("div", "quiz-head");
    head.append(el("span", "tag", spec.tag || "Your turn"),
                el("span", "ttl", spec.title || ""));
    const body = el("div", "quiz-body", spec.question || spec.intro || "");
    const why = el("div", "quiz-why");
    why.hidden = true;

    const chosen = new Array(parts.length).fill(null);
    const wrongCount = new Array(parts.length).fill(0);
    const revealed = new Array(parts.length).fill(false);

    const rendered = parts.map((part, pi) => {
      const wrap = el("div", "quiz-part");
      if (part.label) wrap.append(el("p", "lab", part.label));
      if (part.code) wrap.insertAdjacentHTML("beforeend", part.code);
      if (part.question) wrap.append(el("p", "ask", part.question));
      const opts = el("div", "quiz-opts");
      const note = el("div", "part-note");
      note.hidden = true;
      const buttons = (part.options || []).map((opt, i) => {
        const b = el("button", "quiz-opt");
        b.type = "button";
        b.setAttribute("aria-pressed", "false");
        b.innerHTML = '<span class="mark">' + String.fromCharCode(65 + i) +
                      "</span>" + opt.html;
        b.addEventListener("click", () => pick(pi, i));
        opts.append(b);
        return b;
      });
      wrap.append(opts, note);
      return { wrap, buttons, note };
    });

    if (parts.length > 1) {
      const cols = el("div", "quiz-cols");
      rendered.forEach((r) => cols.append(r.wrap));
      body.append(cols);
    } else {
      rendered.forEach((r) => body.append(r.wrap));
    }

    let submit = null, hint = null;
    if (!parts[0].single) {
      const bar = el("div", "quiz-bar");
      submit = el("button", "primary", parts.length > 1 ? "Check both" : "Check");
      submit.type = "button";
      submit.disabled = true;
      hint = el("span", "hint", "answer both, then check");
      bar.append(submit, hint);
      submit.addEventListener("click", grade);
      body.append(bar);
    }
    body.append(why);
    card.append(head, body);
    mount.replaceWith(card);

    if (readDone()[id]) settle(readDone()[id] === "correct");

    function pick(pi, oi) {
      if (card.classList.contains("done") || revealed[pi]) return;
      chosen[pi] = oi;
      rendered[pi].buttons.forEach((b, i) => {
        b.setAttribute("aria-pressed", String(i === oi));
        b.classList.remove("wrong", "right", "faded");
      });
      rendered[pi].note.hidden = true;
      if (submit) submit.disabled = chosen.some((c) => c === null);
      else grade();
    }

    function reveal(pi) {
      const part = parts[pi];
      const r = rendered[pi];
      const ci = part.options.findIndex((o) => o.correct);
      revealed[pi] = true;
      if (part.highlighted) {
        const pre = r.wrap.querySelector("pre");
        if (pre) { pre.insertAdjacentHTML("afterend", part.highlighted); pre.remove(); }
      }
      r.buttons.forEach((b, i) => {
        b.disabled = true;
        if (i === ci) b.classList.add("right");
        else if (!b.classList.contains("wrong")) b.classList.add("faded");
      });
      r.note.className = "part-note answer";
      // Name the answer by its text, not its letter: in a two-part quiz the
      // option letters collide with the part labels.
      r.note.innerHTML =
        "<p><b>The answer:</b> " + part.options[ci].html + ".</p>" +
        (part.options[ci].why ? "<p>" + part.options[ci].why + "</p>" : "");
      r.note.hidden = false;
    }

    function grade() {
      let allRight = true, anyRevealed = false;
      parts.forEach((part, pi) => {
        if (revealed[pi]) { anyRevealed = true; return; }
        const opt = part.options[chosen[pi]];
        const r = rendered[pi];
        if (opt && opt.correct) {
          r.buttons[chosen[pi]].classList.add("right");
          r.note.hidden = true;
          return;
        }
        allRight = false;
        r.buttons[chosen[pi]].classList.add("wrong");
        wrongCount[pi] += 1;
        if (wrongCount[pi] >= 2) {
          reveal(pi);
          anyRevealed = true;
        } else {
          r.note.className = "part-note nudge";
          r.note.innerHTML = "<p>" + RETRY + "</p>";
          r.note.hidden = false;
        }
      });

      const settled = parts.every((p, pi) =>
        revealed[pi] || (p.options[chosen[pi]] || {}).correct);
      if (!settled) {
        if (hint) hint.textContent = "";
        return;
      }
      if (hint) hint.textContent = "";
      settle(allRight && !anyRevealed);
      markDone(id, allRight && !anyRevealed ? "correct" : "revealed");
    }

    function settle(correct) {
      rendered.forEach((r, pi) => {
        r.buttons.forEach((b, i) => {
          b.disabled = true;
          if (parts[pi].options[i].correct) b.classList.add("right");
          else if (!b.classList.contains("wrong")) b.classList.add("faded");
        });
      });
      if (submit) submit.disabled = true;
      card.classList.add("done");
      card.classList.toggle("correct", !!correct);
      why.hidden = false;
      why.innerHTML = (correct ? '<p class="verdict">Correct!</p>' : "") +
                      (spec.why || "");
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  /* ---------- progress ---------------------------------------------------- */
  function paintProgress() {
    const done = readDone();
    document.querySelectorAll("[data-step-exercises]").forEach((a) => {
      const ids = a.dataset.stepExercises.split(",").filter(Boolean);
      const dot = a.querySelector(".dot");
      if (!dot || !ids.length) return;
      const n = ids.filter((i) => done[i]).length;
      dot.classList.toggle("done", n === ids.length);
      dot.classList.toggle("part", n > 0 && n < ids.length);
    });
    const all = document.querySelectorAll("[data-step-exercises]");
    let tot = 0, got = 0;
    all.forEach((a) => a.dataset.stepExercises.split(",").filter(Boolean)
      .forEach((i) => { tot++; if (done[i]) got++; }));
    const bar = document.querySelector(".bar i");
    const lbl = document.querySelector(".prog .lbl");
    if (bar && tot) bar.style.width = (got / tot * 100) + "%";
    if (lbl && tot) lbl.textContent = got + " / " + tot + " exercises";
  }

  /* ---------- nav --------------------------------------------------------- */
  function initChrome() {
    const here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".toc a").forEach((a) => {
      if (a.getAttribute("href").split("/").pop() === here) a.setAttribute("aria-current", "page");
    });
    const btn = document.querySelector(".menu-btn");
    if (btn) btn.addEventListener("click", () =>
      document.querySelector(".sidebar").classList.toggle("open"));
    paintProgress();
  }
  document.addEventListener("DOMContentLoaded", initChrome);

  return { exercise, quiz, paintProgress, readDone };
})();
