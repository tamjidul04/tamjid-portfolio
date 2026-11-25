(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var moving = function () { return root.classList.contains("motion") && !reduced.matches; };
  var rand = function (min, max) { return min + Math.random() * (max - min); };

  /* ==========================================================
     BACKGROUND
     Both themes: a network of dots with pulses travelling along it.
     Dark adds twinkling stars and shooting stars.
     Light adds floating bubbles and code symbols.
     ========================================================== */
  var canvas = document.querySelector(".network");
  var ctx = canvas && canvas.getContext("2d");
  if (ctx) {
    var nodes = [], stars = [], floaters = [], packets = [];
    var comet = null, nextComet = 2500;
    var width = 0, height = 0, scale = 1, link = 140, frame = 0, last = 0, clock = 0;
    var mouse = null;
    var colour, strength, light;
    var SYMBOLS = ["{ }", "</>", "( )", "[ ]", "01", "#", "=>", "&&"];
    var PASTELS = ["70, 120, 240", "140, 95, 235", "20, 165, 140", "235, 110, 150"];

    var readColours = function () {
      var style = getComputedStyle(root);
      colour = style.getPropertyValue("--node").trim();
      strength = parseFloat(style.getPropertyValue("--node-strength")) || 0.6;
      light = root.dataset.theme === "light";
    };

    var makeNode = function () {
      return { x: rand(0, width), y: rand(0, height), vx: rand(-0.25, 0.25), vy: rand(-0.25, 0.25) };
    };
    var makeStar = function () {
      return { x: rand(0, width), y: rand(0, height), r: rand(0.4, 1.4), phase: rand(0, 6.28), speed: rand(0.001, 0.003) };
    };
    var makeFloater = function (i) {
      var bubble = i % 2 === 0;
      return {
        x: rand(0, width), y: rand(0, height), bubble: bubble,
        size: bubble ? rand(8, 34) : rand(13, 22),
        speed: rand(0.15, 0.5), phase: rand(0, 6.28),
        text: SYMBOLS[Math.floor(rand(0, SYMBOLS.length))],
        tint: PASTELS[i % PASTELS.length]
      };
    };

    var fill = function (list, wanted, make) {
      while (list.length < wanted) list.push(make(list.length));
      list.length = wanted;
      list.forEach(function (p) { p.x = Math.min(p.x, width); p.y = Math.min(p.y, height); });
    };

    var circle = function (x, y, r) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
    };

    var line = function (a, b, alpha) {
      ctx.strokeStyle = "rgba(" + colour + "," + alpha + ")";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    var drawStars = function () {
      stars.forEach(function (s) {
        var glow = 0.2 + 0.65 * Math.abs(Math.sin(s.phase + clock * s.speed));
        ctx.fillStyle = "rgba(220, 232, 255," + glow + ")";
        circle(s.x, s.y, s.r * scale);
        ctx.fill();
      });
    };

    var drawComet = function (step) {
      if (!comet && step && clock > nextComet) {
        comet = { x: rand(width * 0.25, width), y: rand(0, height * 0.45), life: 0 };
      }
      if (!comet) return;
      comet.life += step / 60;
      comet.x -= 9 * step * scale;
      comet.y += 4 * step * scale;
      var tail = { x: comet.x + 130 * scale, y: comet.y - 58 * scale };
      var fade = Math.max(0, Math.sin(Math.min(comet.life, 1) * Math.PI));
      var gradient = ctx.createLinearGradient(comet.x, comet.y, tail.x, tail.y);
      gradient.addColorStop(0, "rgba(200, 222, 255," + fade + ")");
      gradient.addColorStop(1, "rgba(200, 222, 255, 0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(comet.x, comet.y);
      ctx.lineTo(tail.x, tail.y);
      ctx.stroke();
      if (comet.life >= 1) {
        comet = null;
        nextComet = clock + rand(2500, 6000);
      }
    };

    var drawFloaters = function (step) {
      ctx.textAlign = "center";
      floaters.forEach(function (f) {
        f.y -= f.speed * step;
        if (f.y < -50) { f.y = height + 50; f.x = rand(0, width); }
        var x = f.x + Math.sin(f.phase + clock * 0.0006) * 22 * scale;
        if (f.bubble) {
          ctx.fillStyle = "rgba(" + f.tint + ", 0.11)";
          ctx.strokeStyle = "rgba(" + f.tint + ", 0.3)";
          ctx.lineWidth = 1;
          circle(x, f.y, f.size * scale);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(" + f.tint + ", 0.38)";
          ctx.font = "600 " + f.size * scale + "px ui-monospace, Consolas, monospace";
          ctx.fillText(f.text, x, f.y);
        }
      });
    };

    var drawNetwork = function (step) {
      var links = [];
      ctx.lineWidth = scale;
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        a.x += a.vx * step;
        a.y += a.vy * step;
        if (a.x < 0 || a.x > width) { a.vx *= -1; a.x = Math.max(0, Math.min(width, a.x)); }
        if (a.y < 0 || a.y > height) { a.vy *= -1; a.y = Math.max(0, Math.min(height, a.y)); }

        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link) {
            line(a, b, (1 - d / link) * strength * 0.55);
            links.push([a, b]);
          }
        }
        if (mouse) {
          var reach = link * 1.4;
          var m = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          if (m < reach) line(a, mouse, (1 - m / reach) * strength);
        }
        ctx.fillStyle = "rgba(" + colour + "," + strength + ")";
        circle(a.x, a.y, 1.7 * scale);
        ctx.fill();
      }

      // pulses of light travelling from one dot to another
      if (step && links.length && packets.length < Math.ceil(nodes.length / 12) && Math.random() < 0.06) {
        var pair = links[Math.floor(rand(0, links.length))];
        packets.push({ from: pair[0], to: pair[1], at: 0 });
      }
      packets = packets.filter(function (p) {
        p.at += 0.018 * step;
        if (p.at >= 1) return false;
        var x = p.from.x + (p.to.x - p.from.x) * p.at;
        var y = p.from.y + (p.to.y - p.from.y) * p.at;
        ctx.fillStyle = "rgba(" + colour + ", 0.22)";
        circle(x, y, 6 * scale);
        ctx.fill();
        ctx.fillStyle = "rgba(" + colour + ", 1)";
        circle(x, y, 2.2 * scale);
        ctx.fill();
        return true;
      });
    };

    var draw = function (step) {
      ctx.clearRect(0, 0, width, height);
      if (light) drawFloaters(step);
      else {
        drawStars();
        drawComet(step);
      }
      drawNetwork(step);
    };

    var loop = function (time) {
      // step is 1 at 60fps, so speed is the same on fast and slow screens
      var elapsed = last ? Math.min(time - last, 50) : 16.7;
      last = time;
      clock += elapsed;
      draw(elapsed / 16.7);
      frame = requestAnimationFrame(loop);
    };

    var start = function () {
      cancelAnimationFrame(frame);
      last = 0;
      if (moving()) frame = requestAnimationFrame(loop);
      else draw(0); // a still picture when motion is off
    };

    var resize = function () {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      // larger screens get larger shapes; small screens get fewer of them
      scale = Math.max(1, Math.min(width / 1920, 2));
      link = Math.max(100, Math.min(width * 0.16, 140)) * scale;
      var area = (width * height) / (scale * scale);
      var count = function (per, max) { return Math.min(Math.round(area / per), max); };
      fill(nodes, count(15000, 120), makeNode);
      fill(stars, count(9000, 220), makeStar);
      fill(floaters, Math.max(8, count(55000, 36)), makeFloater);
      packets = [];
      start();
    };

    readColours();
    resize();
    window.addEventListener("resize", resize);
    reduced.addEventListener("change", start);
    new MutationObserver(function () {
      readColours();
      if (!moving()) draw(0);
    }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "mouse" && moving()) mouse = { x: e.clientX, y: e.clientY };
    });
    root.addEventListener("pointerleave", function () { mouse = null; });
  }

  /* ---------- click and tap ripple (mouse and touch) ---------- */
  if (document.querySelector(".pointer")) {
    var ripple = function (x, y) {
      if (!moving() || document.querySelector(".search[open]")) return;
      var el = document.createElement("span");
      el.className = "ripple";
      el.setAttribute("aria-hidden", "true");
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.addEventListener("animationend", function () { el.remove(); });
      document.body.appendChild(el);
    };
    // "click" does not fire when a finger is only scrolling
    window.addEventListener("click", function (e) {
      if (e.detail) ripple(e.clientX, e.clientY); // detail is 0 for keyboard clicks
    });
  }

  /* ---------- animated arrow cursor (mouse only) ---------- */
  var arrow = document.querySelector(".pointer");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!arrow || !finePointer.matches) return;

  var dialog = document.querySelector(".search");

  var hide = function () {
    root.classList.remove("has-pointer");
    arrow.classList.remove("is-visible", "is-down");
  };

  window.addEventListener("pointermove", function (e) {
    // The search popup draws above everything, so it uses the normal cursor
    if (e.pointerType !== "mouse" || (dialog && dialog.open)) return hide();
    arrow.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)";
    root.classList.add("has-pointer");
    arrow.classList.add("is-visible");
    var el = e.target instanceof Element ? e.target : null;
    arrow.classList.toggle("is-active", !!(el && el.closest("a, button, summary, label")));
    arrow.classList.toggle("is-typing", !!(el && el.closest("input, textarea")));
  });
  window.addEventListener("pointerdown", function () { arrow.classList.add("is-down"); });
  window.addEventListener("pointerup", function () { arrow.classList.remove("is-down"); });
  root.addEventListener("pointerleave", hide);
  window.addEventListener("blur", hide);
  var searchBtn = document.querySelector(".search-btn");
  if (searchBtn) searchBtn.addEventListener("click", hide);
})();
