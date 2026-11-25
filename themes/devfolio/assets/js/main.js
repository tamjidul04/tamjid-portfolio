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
      if (!motion || !document.startViewTransition) return apply();
      // the new theme grows out of the button in a circle
      var box = themeBtn.getBoundingClientRect();
      var x = box.left + box.width / 2;
      var y = box.top + box.height / 2;
      var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.startViewTransition(apply).ready.then(function () {
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
    }, { rootMargin: "0px 0px -8% 0px" });
    root.classList.add("reveal-ready");
    items.forEach(function (el) { observer.observe(el); });
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
