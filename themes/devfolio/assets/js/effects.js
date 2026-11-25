(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var moving = function () { return root.classList.contains("motion") && !reduced.matches && !root.classList.contains("lite"); };
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

    // Lines of similar brightness are collected and drawn in one go.
    var LEVELS = 4;
    var batches = [];
    var line = function (a, b, alpha) {
      var level = Math.max(0, Math.min(LEVELS - 1, Math.floor((alpha / strength) * LEVELS)));
      (batches[level] || (batches[level] = [])).push(a, b);
    };
    var paintLines = function () {
      batches.forEach(function (points, level) {
        if (!points.length) return;
        ctx.strokeStyle = "rgba(" + colour + "," + ((level + 0.5) / LEVELS) * strength + ")";
        ctx.beginPath();
        for (var i = 0; i < points.length; i += 2) {
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[i + 1].x, points[i + 1].y);
        }
        ctx.stroke();
        points.length = 0;
      });
    };

    var drawStars = function () {
      stars.forEach(function (s) {
        var glow = 0.2 + 0.65 * Math.abs(Math.sin(s.phase + clock * s.speed));
        ctx.fillStyle = "rgba(220, 232, 255," + glow + ")";
        var size = s.r * 1.8 * scale;
        ctx.fillRect(s.x, s.y, size, size);
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
      }
      paintLines();
      // all the dots in a single fill
      ctx.fillStyle = "rgba(" + colour + "," + strength + ")";
      ctx.beginPath();
      nodes.forEach(function (n) {
        ctx.moveTo(n.x + 1.7 * scale, n.y);
        ctx.arc(n.x, n.y, 1.7 * scale, 0, Math.PI * 2);
      });
      ctx.fill();

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

    var FRAME = 1000 / 30;
    var previous = 0, watched = 0, ticks = 0, slowSpells = 0, settle = 0;

    var goLite = function () {
      root.classList.add("lite");
      try { sessionStorage.setItem("lite", "1"); } catch (e) {}
      mouse = null;
      packets = [];
      draw(0);
    };

    // If the screen cannot keep up for two spells of 1.5 seconds in a row, switch to lite.
    var tooSlow = function (time) {
      var gap = previous ? time - previous : 0;
      previous = time;
      if (time < settle || gap <= 0 || gap > 500) return false; // still loading, or the tab was hidden
      watched += gap;
      ticks++;
      if (watched < 1500) return false;
      slowSpells = watched / ticks > 29 ? slowSpells + 1 : 0;
      watched = 0;
      ticks = 0;
      return slowSpells >= 2;
    };

    var loop = function (time) {
      if (root.classList.contains("is-scrolling")) { // rest while a menu scroll runs
        previous = 0;
        frame = requestAnimationFrame(loop);
        return;
      }
      if (tooSlow(time)) return goLite();
      frame = requestAnimationFrame(loop);
      if (last && time - last < FRAME - 2) return; // the background needs no more than 30fps
      // step is 1 at 60fps, so speed is the same at any frame rate
      var elapsed = last ? Math.min(time - last, 100) : FRAME;
      last = time;
      clock += elapsed;
      draw(elapsed / 16.7);
    };

    var start = function () {
      cancelAnimationFrame(frame);
      last = previous = watched = ticks = slowSpells = 0;
      settle = performance.now() + 1500;
      if (moving()) frame = requestAnimationFrame(loop);
      else draw(0); // a still picture when motion is off
    };

    var resize = function () {
      var ratio = 1; // soft background shapes do not need a high-resolution canvas
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
      fill(nodes, count(23000, 64), makeNode);
      fill(stars, count(15000, 100), makeStar);
      fill(floaters, Math.max(6, count(80000, 18)), makeFloater);
      packets = [];
      start();
    };

    readColours();
    resize();
    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });
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
  if (root.classList.contains("custom-cursor")) {
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

})();
