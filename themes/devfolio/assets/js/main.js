(function () {
  var root = document.documentElement;
  var $ = function (s) { return document.querySelector(s); };
  var motion = root.classList.contains("motion") &&
    window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  var themeBtn = $(".theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.dataset.theme === "light" ? "dark" : "light";
      var apply = function () {
        root.dataset.theme = next;
        try { localStorage.setItem("theme", next); } catch (e) {}
      };
      if (!motion || !document.startViewTransition || root.classList.contains("lite")) return apply();
      // the new theme grows out of the button in a circle
      root.classList.add("theme-switching");
      var done = function () { root.classList.remove("theme-switching"); };
      var box = themeBtn.getBoundingClientRect();
      var x = box.left + box.width / 2;
      var y = box.top + box.height / 2;
      var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var transition = document.startViewTransition(apply);
      transition.finished.then(done, done);
      transition.ready.then(function () {
        root.animate(
          { clipPath: ["circle(0 at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
          { duration: 600, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(function () {}); // the theme still changes if the effect is skipped
    });
  }

  // Mobile menu
  var menuBtn = $(".menu-btn");
  var nav = $("#site-nav");
  if (menuBtn && nav) {
    var setMenu = function (open) {
      nav.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    };
    menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  }

  // Typing effect: types each phrase, pauses, deletes it, moves to the next
  var typed = $("[data-typed]");
  if (typed && motion) {
    var words = JSON.parse(typed.dataset.typed);
    var word = 0;
    var length = words[0].length; // starts fully typed, as the HTML already shows it
    var deleting = true;
    var tick = function () {
      var text = words[word];
      length += deleting ? -1 : 1;
      typed.textContent = text.slice(0, length);
      var wait = deleting ? 40 : 80;
      if (!deleting && length === text.length) {
        deleting = true;
        wait = 2200;
      } else if (deleting && length === 0) {
        deleting = false;
        word = (word + 1) % words.length;
        wait = 350;
      }
      setTimeout(tick, wait);
    };
    if (words.length > 1) setTimeout(tick, 2500);
  }

  // Reveal elements as they scroll into view
  var items = document.querySelectorAll("[data-reveal]");
  if (motion && items.length && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px 8% 0px" }); // starts just before the item comes into view
    root.classList.add("reveal-ready");
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- menu: instant highlight and a short, smooth scroll ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a"));

  var markLink = function (match) {
    navLinks.forEach(function (a) {
      if (match(a)) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };
  var markSection = function (id) {
    markLink(function (a) { return a.hash === "#" + id && a.pathname === location.pathname; });
  };

  // cards in the chosen section slide in together, without ever being blank
  var arrive = function (section) {
    section.classList.remove("arriving");
    var parts = section.querySelectorAll("[data-reveal]");
    Array.prototype.forEach.call(parts, function (el, i) {
      el.style.setProperty("--order", Math.min(i, 6));
      el.classList.add("is-visible", "arrived");
      if (observer) observer.unobserve(el);
    });
    void section.offsetWidth; // restart the animation on a second click
    section.classList.add("arriving");
  };

  var scrollFrame = 0, scrolling = false;
  var stopScroll = function () {
    cancelAnimationFrame(scrollFrame);
    scrolling = false;
    root.classList.remove("is-scrolling"); // the background starts moving again
    root.style.scrollBehavior = "";
  };

  var glideTo = function (section) {
    stopScroll();
    var margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
    var from = window.scrollY;
    var limit = root.scrollHeight - window.innerHeight;
    var to = Math.max(0, Math.min(section.getBoundingClientRect().top + from - margin, limit));
    if (!motion) return window.scrollTo(0, to);

    var duration = Math.min(520, 280 + Math.abs(to - from) * 0.08);
    var began = 0;
    scrolling = true;
    root.style.scrollBehavior = "auto"; // this animation replaces the browser's own
    root.classList.add("is-scrolling");
    var step = function (time) {
      if (!began) began = time - 16; // move on the very first frame
      var t = Math.min(1, (time - began) / duration);
      var eased = 1 - Math.pow(1 - t, 3); // quick start, soft landing
      window.scrollTo(0, from + (to - from) * eased);
      if (t < 1) scrollFrame = requestAnimationFrame(step);
      else stopScroll();
    };
    scrollFrame = requestAnimationFrame(step);
  };

  // the visitor can always take over
  ["wheel", "touchstart", "keydown"].forEach(function (type) {
    window.addEventListener(type, function () { if (scrolling) stopScroll(); }, { passive: true });
  });

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest("a[href*='#']");
    if (!link || link.origin !== location.origin || link.pathname !== location.pathname) return;
    var id = decodeURIComponent(link.hash.slice(1));
    var section = id && id !== "main" && document.getElementById(id);
    if (!section) return;
    e.preventDefault();
    markSection(id);
    if (motion) arrive(section);
    glideTo(section);
    if (location.hash !== link.hash) history.pushState(null, "", link.hash);
    // keyboard and screen reader users continue from the new section
    section.setAttribute("tabindex", "-1");
    section.focus({ preventScroll: true });
  });

  // arriving from another page, for example Contact -> Projects
  var landed = location.hash && document.getElementById(location.hash.slice(1));
  if (landed && motion) arrive(landed);

  // highlight the menu item for whatever is on screen
  var sections = navLinks
    .filter(function (a) { return a.hash && a.pathname === location.pathname; })
    .map(function (a) { return document.getElementById(a.hash.slice(1)); })
    .filter(Boolean);
  if (!sections.length) {
    markLink(function (a) { return !a.hash && a.pathname === location.pathname; });
  } else if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!scrolling && entry.isIntersecting) markSection(entry.target.id);
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
    var top = document.querySelector(".hero");
    if (top) new IntersectionObserver(function (entries) {
      if (!scrolling && entries[0].isIntersecting) markLink(function () { return false; });
    }, { rootMargin: "-45% 0px -50% 0px" }).observe(top);
  }

  // Project filter buttons
  var buttons = document.querySelectorAll("[data-filter]");
  var cards = document.querySelectorAll("[data-tags]");
  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var tag = button.dataset.filter;
      var shown = 0;
      cards.forEach(function (card) {
        var match = tag === "*" || card.dataset.tags.split("|").indexOf(tag) !== -1;
        card.hidden = !match;
        card.classList.remove("filtered-in");
        if (match) {
          shown++;
          card.classList.add("is-visible");
          void card.offsetWidth; // restart the entrance animation
          card.classList.add("filtered-in");
        }
      });
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === button)); });
      var empty = $(".empty");
      if (empty) empty.hidden = shown > 0;
    });
  });

  // Search
  var dialog = $(".search");
  var searchBtn = $(".search-btn");
  if (!dialog || !searchBtn) return;
  var input = dialog.querySelector("input");
  var list = dialog.querySelector("ul");
  var status = dialog.querySelector(".search__status");
  var index = null;

  var render = function () {
    var q = input.value.trim().toLowerCase();
    list.textContent = "";
    if (!index) return;
    if (!q) { status.textContent = "Type to search projects and posts."; return; }
    var found = index.filter(function (p) {
      return (p.title + " " + p.summary + " " + p.text).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 8);
    status.textContent = found.length ? found.length + " result(s)" : "Nothing found.";
    found.forEach(function (p) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      var small = document.createElement("span");
      a.href = p.url;
      a.textContent = p.title;
      small.textContent = p.summary;
      a.appendChild(small);
      li.appendChild(a);
      list.appendChild(li);
    });
  };

  searchBtn.addEventListener("click", function () {
    dialog.showModal();
    input.focus();
    if (index) return render();
    status.textContent = "Loading…";
    fetch(dialog.dataset.index)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { index = data; render(); })
      .catch(function () { status.textContent = "Search could not load. Please try again."; });
  });
  input.addEventListener("input", render);
  dialog.querySelector(".search__close").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
})();
