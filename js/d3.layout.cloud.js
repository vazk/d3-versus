// Word cloud layout by Jason Davies, http://www.jasondavies.com/word-cloud/
// Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf
(function() {
  function cloud() {
    var size = [256, 256],
        text = cloudText,
        padding = cloudPadding,
        spiral = archimedeanSpiral,
        vs_bins = [],
        timeInterval = Infinity,
        event = d3.dispatch("end"),
        timer = null,
        cloud = {};

    cloud.start = function() {
      var board = [],
          bounds = null,
          n = vs_bins.length,
          i = -1,
          tags = [],
          data = vs_bins.map(function(d, i) {
            d.text = text.call(this, d, i);
            d.padding = padding.call(this, d, i);
            d.w = d.dim;
            d.h = d.dim*0.5;
            return d;
          }).sort(function(a, b) { return b.dim - a.dim; });

      if (timer) clearInterval(timer);
      timer = setInterval(step, 0);
      step();

      return cloud;

      function step() {
          var start = +new Date;
          var d;
          while (+new Date - start < timeInterval && ++i < n && timer) {
              d = data[i];
              d.x = (size[0]>>1) + (Math.random() *30);
              d.y = (size[1]>>1) + (Math.random() *30);
              //console.log("STEP: ", d.text, ", ", d.x, ", ", d.y,", ",d.w,", ",d.h);
              if(place(board, d, bounds)) {
                  tags.push(d);
                  if (bounds) cloudBounds(bounds, d);
                  else bounds = [{x: d.x, y: d.y}, {x: d.x + d.w, y: d.y + d.h}];
                  // Temporary hack
                  d.x -= size[0] >> 1;
                  d.y -= size[1] >> 1;
              }
          }
          if (i >= n) {
              cloud.stop();
              event.end(tags, bounds);
          }
      }
    }

    cloud.stop = function() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      return cloud;
    };

    cloud.timeInterval = function(x) {
      if (!arguments.length) return timeInterval;
      timeInterval = x == null ? Infinity : x;
      return cloud;
    };

    function place(board, tag, bounds) {
      var perimeter = [{x: 0, y: 0}, {x: size[0], y: size[1]}],
          startX = tag.x,
          startY = tag.y,
          maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]),
          s = spiral(size),
          dt = Math.random() < .5 ? 1 : -1,
          t = -dt,
          dxdy,
          dx,
          dy;

      while (dxdy = s(t += dt)) {
        dx = ~~dxdy[0];
        dy = ~~dxdy[1];

        if (Math.min(dx, dy) > maxDelta) break;

        tag.x = startX + dx;
        tag.y = startY + dy;

        if (tag.x < 0 || tag.y < 0 ||
            tag.x + tag.w > size[0] || tag.y + tag.h > size[1]) continue;
        // TODO only check for collisions within current bounds.
        if (!bounds || !cloudCollide(tag, board, size[0])) {
          if (!bounds || !collideRects(tag, bounds)) {
            board.push({"x":tag.x,"y":tag.y,"w":tag.w,"h":tag.h});
            //console.log("   board: ", board);
            return true;
          }
        }
      }
      return false;
    }


    cloud.vs_bins = function(x) {
      if (!arguments.length) return vs_bins;
      vs_bins = x;
      return cloud;
    };

    cloud.size = function(x) {
      if (!arguments.length) return size;
      size = [+x[0], +x[1]];
      return cloud;
      return cloud;
    };

    cloud.text = function(x) {
      if (!arguments.length) return text;
      text = d3.functor(x);
      return cloud;
    };

    cloud.spiral = function(x) {
      if (!arguments.length) return spiral;
      spiral = spirals[x + ""] || x;
      return cloud;
    };

    cloud.padding = function(x) {
      if (!arguments.length) return padding;
      padding = d3.functor(x);
      return cloud;
    };

    return d3.rebind(cloud, event, "on");
  }

  function cloudText(d) {
    return d.text;
  }

  function cloudPadding() {
    return 1;
  }

  function cloudSprite(d, data, di) {
      d.w = w >> 1;
      d.h = h >> 1;
  }

  function interval_overlap(l1, h1, l2, h2) {
      if(l1 < h2 && l2 < h1) return true;
      return false;
  }

  // Use mask-based collision detection.
  function cloudCollide(tag, board, sw) {
      for(var i = 0; i < board.length; ++i) {
          var llx = tag.x;
          var lly = tag.y;
          var urx = tag.x + tag.w; 
          var ury = tag.y + tag.h;
          var bi = board[i];
          if(interval_overlap(llx, urx, bi.x, bi.x+bi.w) && 
             interval_overlap(lly, ury, bi.y, bi.y+bi.h)) return true;
      }
      return false;
  }

  function cloudBounds(bounds, d) {
      var b0 = bounds[0],
          b1 = bounds[1];
      if (d.x < b0.x) b0.x = d.x;
      if (d.y < b0.y) b0.y = d.y;
      if (d.x + d.w > b1.x) b1.x = d.x + d.w;
      if (d.y + d.h > b1.y) b1.y = d.y + d.h;
      //console.log("BOUNDS: ",b0.x,", ",b0.y,", ",b1.x,", ",b1.y);
  }

  function collideRects(a, b) {
      return a.x > b[0].x && a.x + a.w < b[1].x && 
             a.y > b[0].y && a.y + a.h < b[1].y;
  }

  function archimedeanSpiral(size) {
    var e = size[0] / size[1];
    return function(t) {
      return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
    };
  }

  function rectangularSpiral(size) {
    var dy = 4,
        dx = dy * size[0] / size[1],
        x = 0,
        y = 0;
    return function(t) {
      var sign = t < 0 ? -1 : 1;
      // See triangular numbers: T_n = n * (n + 1) / 2.
      switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
        case 0:  x += dx; break;
        case 1:  y += dy; break;
        case 2:  x -= dx; break;
        default: y -= dy; break;
      }
      return [x, y];
    };
  }

  // TODO reuse arrays?
  function zeroArray(n) {
    var a = [],
        i = -1;
    while (++i < n) a[i] = 0;
    return a;
  }

  var cw = 1 << 11 >> 5,
      ch = 1 << 11,
      canvas,
      ratio = 1;

  if (typeof document !== "undefined") {
    canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
    canvas.width = (cw << 5) / ratio;
    canvas.height = ch / ratio;
  } else {
    // Attempt to use node-canvas.
    canvas = new Canvas(cw << 5, ch);
  }

  var c = canvas.getContext("2d"),
      spirals = {
        archimedean: archimedeanSpiral,
        rectangular: rectangularSpiral
      };
  c.fillStyle = c.strokeStyle = "red";
  c.textAlign = "center";

  if (typeof module === "object" && module.exports) module.exports = cloud;
  else (d3.layout || (d3.layout = {})).cloud = cloud;
})();
