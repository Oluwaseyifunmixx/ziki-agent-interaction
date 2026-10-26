/* Static prototype logic. All data is invented. Nothing is sent anywhere. */
(function () {
  "use strict";

  var ICON = {
    work: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    ask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4"/><circle cx="12" cy="18" r=".6" fill="currentColor"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
    done: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>'
  };
  // Source tags: where each statement comes from.
  var CODE = '<span class="src code" title="Confirmed by reading Ziki’s source code">from Ziki code</span>';
  var ILL = '<span class="src ill" title="Invented for this prototype">illustrative</span>';
  var PROP = '<span class="src prop" title="A design proposal, not something Ziki does today">proposed</span>';

  // Suggested answers for Kite's question (a proposed extension: today an answer is free text).
  var OPTIONS = {
    a: { label: "Ignore trailing spaces everywhere", why: "Search elsewhere in the app already ignores them, so this avoids surprises.", understood: "I will ignore trailing spaces in every search." },
    b: { label: "Only in the channel directory", why: "The smallest change: other searches stay exactly as they are.", understood: "I will ignore trailing spaces only in the channel directory." }
  };

  var el = function (id) { return document.getElementById(id); };
  var state;

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  function fresh() {
    return {
      needs: { q: true, a: true, p: true },
      kite: "input",        // input | answered
      answer: null,         // { choice, text, remember }
      harbor: "approval",   // approval | approved | rejected
      pNote: "",
      lastFocus: null
    };
  }

  /* ---------- counts ---------- */
  function blocking() { return (state.needs.q ? 1 : 0) + (state.needs.a ? 1 : 0); }
  function nonBlocking() { return state.needs.p ? 1 : 0; }
  function count() { return blocking() + nonBlocking(); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  function renderPill() {
    var n = count(), b = blocking();
    var btn = el("needsBtn");
    el("needsLabel").innerHTML = "Waiting on you · " + n + (b > 0 ? ' <span class="blk">' + b + " blocking</span>" : "");
    btn.classList.toggle("calm", n === 0);
    btn.setAttribute("aria-label", n === 0 ? "Waiting on you: nothing" :
      "Waiting on you: " + n + ". " + plural(b, "item is", "items are") + " blocking an agent and " + nonBlocking() + " is not.");
  }

  function renderSummary() {
    var n = count(), b = blocking(), nb = nonBlocking();
    var box = el("summary");
    box.classList.toggle("clear", n === 0);
    if (n === 0) {
      box.innerHTML = "<strong>All clear. Nothing is waiting on you.</strong>";
      return;
    }
    var blockTags = [];
    if (state.needs.q) blockTags.push("1 question");
    if (state.needs.a) blockTags.push("1 approval");
    var html = "<strong>" + plural(n, "thing is", "things are") + " waiting on you.</strong>" +
      "<span>" + plural(b, "is", "are") + " blocking an agent; " + nb + (nb === 1 ? " is" : " are") + " not.</span>" +
      '<span class="tags">';
    if (b > 0) html += '<span class="grp"><span>Blocking an agent</span><span class="chip att">' + blockTags.join(" + ") + "</span></span>";
    if (nb > 0) html += '<span class="grp soft"><span>Not blocking</span><span class="chip">1 redesign proposal</span></span>';
    box.innerHTML = html + "</span>";
  }

  function renderPop() {
    var n = count(), b = blocking(), nb = nonBlocking();
    var h = "<h3>Waiting on you · " + n + "</h3>" +
      '<div class="sub">Counts agent questions, redesign proposals and project-rule approvals in one place. (Today the badge counts questions only.)</div>';
    if (n === 0) {
      el("needsPop").innerHTML = h + '<div class="pop-empty">Nothing is waiting on you.</div>';
      return;
    }
    h += '<div class="split"><span class="chip att">' + b + ' blocking an agent</span><span class="chip">' + nb + " not blocking</span></div>";
    if (b > 0) {
      h += '<div class="group-title"><b>Blocking an agent (' + b + ')</b> <span class="gt-note">· the agent waits until you respond</span></div>';
      if (state.needs.q) h += popItem("Question from Kite", "“Should the search ignore trailing spaces everywhere, or only in the channel directory?”", "Answer", "q");
      if (state.needs.a) h += popItem("Approval for Harbor", "Human approval required before its pull request is merged (severity: high).", "Review", "a");
    }
    if (nb > 0) {
      h += '<div class="group-title"><b>Not blocking (' + nb + ')</b> <span class="gt-note">· the agent keeps working</span></div>';
      h += popItem("Redesign proposal from Ada’s Claude", "Make the main buttons green to match the new logo.", "Review", "p");
    }
    el("needsPop").innerHTML = h;
  }

  function popItem(title, desc, label, kind) {
    return '<div class="pop-item"><span class="t">' + title + '</span><span class="d">' + desc + "</span>" +
      '<button class="btn primary small" type="button" data-open="' + kind + '">' + label + "</button></div>";
  }

  /* ---------- cards ---------- */
  function issueLine(num, title) {
    return '<div class="issue"><span class="num">#' + num + '</span><a href="#" onclick="return false">' + title + "</a></div>";
  }
  var OPEN_ISSUE = '<a class="btn" href="#" onclick="return false">Open issue</a>';

  function cardAda() {
    var also = "";
    if (state.needs.p) {
      also = '<div class="also"><span><b>Also waiting on you (not blocking):</b> redesign proposal “Make the main buttons green”. This agent keeps working.</span>' +
        '<button class="btn small" type="button" data-open="p">Review proposal</button></div>';
    } else if (state.pNote) {
      also = '<div class="also"><span>' + state.pNote + "</span></div>";
    }
    return card("working", "Ada’s Claude", '<span class="chip info">' + ICON.work + "Working</span>",
      issueLine(412, "Search results show sample data instead of real messages") +
      "<p>Working for 38 min. Last heartbeat 4 min ago. " + ILL + "</p>" + also, OPEN_ISSUE);
  }

  function cardKite() {
    var iss = issueLine(377, "Channel directory loses matches when the query has trailing spaces");
    if (state.kite === "answered") {
      var a = state.answer || {};
      var yours = a.choice ? esc(OPTIONS[a.choice].label) : "";
      if (a.text) yours += (yours ? ". Note: " : "") + esc(a.text);
      var understood = a.choice ? OPTIONS[a.choice].understood : "Understood: “" + esc((a.text || "").slice(0, 120)) + "”.";
      return card("working", "Kite", '<span class="chip info">' + ICON.work + "Working</span>", iss +
        '<dl class="facts">' +
        "<dt>Your answer</dt><dd>" + yours + "</dd>" +
        "<dt>What Kite understood</dt><dd>“" + understood + "” " + ILL + " " + PROP + "</dd>" +
        (a.remember ? "<dt>Remembered</dt><dd>Saved as your preference for similar questions. " + ILL + " " + PROP + "</dd>" : "") +
        "<dt>How Kite gets it</dt><dd>Ziki delivers an answer to the agent’s inbox. " + CODE + "</dd>" +
        "</dl>",
        '<button class="btn" type="button" data-act="reopen">Not what I meant</button>' + OPEN_ISSUE);
    }
    return card("input", "Kite", '<span class="chip att">' + ICON.ask + "Needs input</span>", iss +
      '<div class="quote">“Should the search ignore trailing spaces everywhere, or only in the channel directory?”</div>' +
      '<div class="meta"><span>Asked 41 min ago.</span><span class="countdown">3 h 19 min left</span>' +
      '<span class="chip ill" title="Illustrative: a fixed example, not a live timer. The 4-hour wait is the default found in Ziki’s code.">illustrative · not a live timer</span></div>' +
      "<p>If this goes unanswered for 4 hours (the default wait), the agent releases the issue. " + CODE + "</p>",
      '<button class="btn primary" type="button" data-open="q">Answer</button>' + OPEN_ISSUE);
  }

  function cardHarbor() {
    var iss = issueLine(421, "Password reset email links to the wrong page");
    if (state.harbor === "approved") {
      return card("working", "Harbor", '<span class="chip info">' + ICON.work + "Working</span>", iss +
        '<dl class="facts">' +
        "<dt>What happened</dt><dd>You approved it (mock).</dd>" +
        "<dt>What happens next</dt><dd>Ziki resumes the merge automatically, with no action from the agent. " + CODE + "</dd>" +
        "</dl>", OPEN_ISSUE);
    }
    if (state.harbor === "rejected") {
      return card("stopped", "Harbor", '<span class="chip">' + ICON.stop + "Rejected by you</span>", iss +
        '<dl class="facts">' +
        "<dt>What happened</dt><dd>You rejected the approval (mock). Ziki records the decision. " + CODE + "</dd>" +
        "<dt>Effect</dt><dd>The pull request will not be merged on this approval. If the agent tries, Ziki answers “Human approval was rejected”. " + CODE + "</dd>" +
        "<dt>Does the agent know?</dt><dd>Ziki sends it no message about a rejection. It finds out the next time it tries to merge. " + CODE + "</dd>" +
        "<dt>Is it Finished?</dt><dd>No. Nothing was delivered, so it is not shown as Finished.</dd>" +
        "</dl>", OPEN_ISSUE);
    }
    return card("approval", "Harbor", '<span class="chip att">' + ICON.lock + "Approval needed</span>", iss +
      "<p>Its fix passed testing. Your project’s rules need a person to approve before the pull request is merged.</p>" +
      '<div class="meta"><span class="chip">type: Bug</span><span class="chip">severity: High</span><span class="chip">files matching: src/auth/**</span></div>' +
      '<div class="meta"><span>Waiting 12 min. ' + ILL + '</span><span class="chip ill">No time limit: approvals do not expire in Ziki</span>' + CODE + "</div>",
      '<button class="btn primary" type="button" data-open="a">Review approval</button>' + OPEN_ISSUE);
  }

  function cardLark() {
    return card("stopped", "Lark", '<span class="chip">' + ICON.stop + "Stopped</span>",
      issueLine(356, "Files tab shows nothing when a folder is empty") +
      '<dl class="facts">' +
      "<dt>What happened</dt><dd>It released the issue after waiting 4 h 02 min for an answer from you. " + ILL + "</dd>" +
      "<dt>Why it stopped</dt><dd>Reason recorded: waiting on the owner too long. Ziki records one of three reasons: silence, a missed deadline, or waiting on the owner too long. " + CODE + "</dd>" +
      "<dt>What it means</dt><dd>It no longer holds the issue, which is reopened and offered to another agent. This is <b>not a failure</b>. " + CODE + "</dd>" +
      "<dt>What you can do</dt><dd>See what it asked, or message the agent from its existing Messages page.</dd>" +
      "</dl>",
      '<button class="btn" type="button" data-open="sq">See what it asked</button><a class="btn" href="#" onclick="return false" title="Opens the existing Messages page for this agent">Message this agent</a>');
  }

  function cardOrca() {
    return card("finished", "Orca", '<span class="chip ok">' + ICON.done + "Finished</span>",
      issueLine(398, "Marketing pages have no “Skip to main content” link") +
      '<dl class="facts">' +
      "<dt>What it did</dt><dd>Delivered a fix and linked the pull request to the issue.</dd>" +
      "<dt>When</dt><dd>2 h ago. " + ILL + "</dd>" +
      "<dt>What happens next</dt><dd>Testers check the fix, then it can be accepted and merged. " + CODE + "</dd>" +
      "<dt>Why “Finished”</dt><dd>An agent counts as Finished once its fix is linked to the issue. An agent that is only idle is not Finished. " + PROP + "</dd>" +
      "</dl>",
      '<a class="btn" href="#" onclick="return false">View pull request</a>' + OPEN_ISSUE);
  }

  function initials(name) {
    var w = name.replace(/[’'`]/g, "").replace(/[^A-Za-z\s]/g, " ").trim().split(/\s+/);
    return (w.length > 1 ? w[0].charAt(0) + w[1].charAt(0) : w[0].slice(0, 2)).toUpperCase();
  }
  var TONE = { "Kite": "t1", "Harbor": "t2", "Ada’s Claude": "t3", "Lark": "t4", "Orca": "t5" };

  function card(kind, name, chip, body, actions) {
    var cls = { working: "s-working", input: "s-input", approval: "s-approval", stopped: "s-stopped", finished: "s-finished" }[kind];
    return '<article class="card ' + cls + '"><div class="who"><div class="who-top"><span class="av ' + (TONE[name] || "t1") + '" aria-hidden="true">' + initials(name) +
      '</span><div class="who-name"><span class="nm">' + name + '</span><span class="role">Contributor agent</span></div></div>' + chip +
      '</div><div class="body">' + body + '</div><div class="actions">' + actions + "</div></article>";
  }

  function renderCards() {
    el("cards").innerHTML = [cardKite(), cardHarbor(), cardAda(), cardLark(), cardOrca()].join("");
  }
  function renderAll() { renderPill(); renderSummary(); renderPop(); renderCards(); }

  /* ---------- drawer ---------- */
  function head(title, sub) {
    return '<header><div><h2 id="drawerTitle">' + title + '</h2><div style="color:var(--zk-muted);font-size:12.5px">' + sub + '</div></div><button class="x" type="button" data-close aria-label="Close panel">×</button></header>';
  }

  function optionHtml(key, recommended) {
    var o = OPTIONS[key];
    return '<label class="opt"><input type="radio" name="opt" value="' + key + '"><span class="opt-body">' +
      '<span class="opt-title">' + o.label + (recommended ? ' <span class="rec">Recommended</span>' : "") + "</span>" +
      '<span class="opt-why">Why: ' + o.why + "</span></span></label>";
  }

  function openDrawer(kind) {
    closePop();
    state.lastFocus = document.activeElement;
    var d = el("drawer");
    var html = "";
    if (kind === "q") {
      html = head("Kite is asking you a question", "Issue #377 · Channel directory search") +
        '<div class="dbody">' +
        '<div><div class="field-label">The question</div><div class="box">Should the search ignore trailing spaces everywhere, or only in the channel directory?</div></div>' +
        '<div><div class="field-label">Time left</div><div class="box"><span class="countdown">3 h 19 min</span> <span class="chip ill">illustrative · not a live timer</span><br>After the default 4-hour wait the agent releases the issue. ' + CODE + "</div></div>" +
        '<div><div class="field-label">Kite’s suggested answers ' + PROP + '</div>' +
        '<div class="opts" role="radiogroup" aria-label="Suggested answers">' + optionHtml("a", true) + optionHtml("b", false) + "</div>" +
        '<div class="note-small">Today an agent’s question and your answer are both free text, so suggested answers would be an optional extension. ' + CODE + "</div></div>" +
        '<div><label class="field-label" for="answer">Or write your own answer, or add a note</label><textarea id="answer" placeholder="Type your answer to Kite"></textarea></div>' +
        '<label class="check"><input type="checkbox" id="remember"><span><b>Remember this choice</b> for similar questions, so Kite doesn’t ask again. ' + ILL + " " + PROP + "</span></label>" +
        '<div id="answerErr" class="err" hidden>Choose an option or write an answer first.</div>' +
        "</div>" +
        '<footer><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="button" data-act="send-answer">Send answer</button></footer>';
    } else if (kind === "sq") {
      html = head("What Lark asked", "Issue #356 · Files tab empty state") +
        '<div class="dbody">' +
        '<div><div class="field-label">The question</div><div class="box">Which of the two empty-state layouts do you prefer, the icon or the illustration? ' + ILL + "</div></div>" +
        '<div><div class="field-label">What happened</div><div class="box">It waited 4 h 02 min for an answer, then released the issue. ' + ILL + '</div></div>' +
        '<div><div class="field-label">What you can do</div><div class="box">Reply on the issue, or message the agent from its Messages page.</div></div>' +
        "</div>" +
        '<footer><button class="btn primary" type="button" data-close>Close</button></footer>';
    } else if (kind === "a") {
      html = head("Approval needed for Harbor", "Issue #421 · Password reset email links to the wrong page") +
        '<div class="dbody">' +
        '<div><div class="field-label">Why approval is required</div><div class="box">Your project’s rules require a person to approve before this fix’s pull request is merged. ' + CODE + "</div></div>" +
        '<div><div class="field-label">The rule that matched</div><div class="meta"><span class="chip">type: Bug</span><span class="chip">severity: High</span><span class="chip">files matching: src/auth/**</span></div></div>' +
        '<div><div class="field-label">Who can decide</div><div class="box">Only workspace owners and admins can approve or reject. ' + CODE + "</div></div>" +
        '<div><div class="field-label">What your choice does</div><div class="box"><b>Approve:</b> Ziki resumes the merge automatically.<br><b>Reject:</b> the pull request will not merge on this approval, and the agent is not sent a message. ' + CODE + "</div></div>" +
        '<div><div class="field-label">Time limit</div><div class="box">None. Approvals do not expire. ' + CODE + "</div></div>" +
        "</div>" +
        '<footer><button class="btn danger" type="button" data-act="reject">Reject</button><button class="btn primary" type="button" data-act="approve">Approve</button></footer>';
    } else if (kind === "p") {
      html = head("Redesign proposal from Ada’s Claude", "Not blocking: the agent keeps working") +
        '<div class="dbody">' +
        '<div><div class="field-label">Proposal</div><div class="box">Make the main buttons green to match the new logo. ' + ILL + "</div></div>" +
        '<div><div class="field-label">Where it would show</div><div class="box">Every screen with a main button. ' + ILL + "</div></div>" +
        '<div><div class="field-label">Does it block the agent?</div><div class="box">No. Ada’s Claude stays Working while the proposal waits for you. Proposals do not expire. ' + CODE + "</div></div>" +
        '<div><div class="field-label">What happens when you decide</div><div class="box">The decision is delivered to the proposing agent’s inbox. ' + CODE + "</div></div>" +
        "</div>" +
        '<footer><button class="btn danger" type="button" data-act="decline-p">Decline</button><button class="btn primary" type="button" data-act="approve-p">Approve</button></footer>';
    }
    d.innerHTML = html;
    d.hidden = false;
    el("scrim").hidden = false;
    var first = d.querySelector("input[type=radio], textarea, .btn.primary, .btn");
    if (first) first.focus();
  }

  function closeDrawer() {
    el("drawer").hidden = true;
    el("scrim").hidden = true;
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  function togglePop(force) {
    var pop = el("needsPop");
    var open = typeof force === "boolean" ? force : pop.hidden;
    pop.hidden = !open;
    el("needsBtn").setAttribute("aria-expanded", String(open));
  }
  function closePop() { togglePop(false); }

  var toastTimer;
  function toast(msg) {
    var t = el("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3600);
  }

  /* ---------- actions (all fake) ---------- */
  function act(name) {
    if (name === "send-answer") {
      var picked = document.querySelector('input[name="opt"]:checked');
      var choice = picked ? picked.value : "";
      var text = (el("answer").value || "").trim();
      if (!choice && !text) { el("answerErr").hidden = false; return; }
      state.answer = { choice: choice, text: text, remember: !!el("remember").checked };
      state.needs.q = false; state.kite = "answered";
      closeDrawer(); renderAll(); toast("Answer recorded (mock). Waiting on you is now " + count() + ".");
    } else if (name === "reopen") {
      state.needs.q = true; state.kite = "input"; state.answer = null;
      renderAll(); toast("Reopened (mock). Kite is waiting for a corrected answer.");
    } else if (name === "approve") {
      state.needs.a = false; state.harbor = "approved";
      closeDrawer(); renderAll(); toast("Approval recorded (mock). Waiting on you is now " + count() + ".");
    } else if (name === "reject") {
      state.needs.a = false; state.harbor = "rejected";
      closeDrawer(); renderAll(); toast("Rejection recorded (mock). Harbor is not marked Finished.");
    } else if (name === "approve-p" || name === "decline-p") {
      state.needs.p = false;
      state.pNote = name === "approve-p" ? "Redesign proposal approved (mock)." : "Redesign proposal declined (mock).";
      closeDrawer(); renderAll(); toast(state.pNote + " Waiting on you is now " + count() + ".");
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    var open = t.closest && t.closest("[data-open]");
    if (open) { openDrawer(open.getAttribute("data-open")); return; }
    if (t.closest && t.closest("[data-close]")) { closeDrawer(); return; }
    var a = t.closest && t.closest("[data-act]");
    if (a) { act(a.getAttribute("data-act")); return; }
    if (t.id === "scrim") { closeDrawer(); return; }
    if (t.closest && t.closest("#needsBtn")) { togglePop(); return; }
    if (!el("needsPop").hidden && !(t.closest && t.closest("#needsPop"))) closePop();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!el("drawer").hidden) closeDrawer();
      else if (!el("needsPop").hidden) { closePop(); el("needsBtn").focus(); }
    }
  });

  el("replay").addEventListener("click", function () {
    state = fresh(); closeDrawer(); closePop(); renderAll(); toast("Demo reset.");
  });

  state = fresh();
  renderAll();
})();
