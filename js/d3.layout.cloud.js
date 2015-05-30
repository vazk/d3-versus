// Word cloud layout by Jason Davies, http://www.jasondavies.com/word-cloud/
// Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf
(function() {
    function cloud() {
        var size = null;
        var text = cloudText;
        var padding = cloudPadding;
        var block_halo = [15, 15];
        var spiral = archimedeanSpiral;
        //var vs_bins = [];
        //var timeInterval = Infinity;
        //var event = d3.dispatch("end");
        //var timer = null;
        var data = [];
        var placement_board = [];
        var placement_bounds = null;
        //var placement_tags = [];
        var cloud = {};

        cloud.start = function() {
            if (timer) {
                clearInterval(timer);
            }
            timer = setInterval(this.step, 0);
            this.step();

            return cloud;
        }

        cloud.reshape = function() {
            cloud.runCompaction();
            event.end();
            return cloud;
        }
        
        cloud.computeCenter = function() {
            var total_weight = 0;
            var x = 0;
            var y = 0;
            for(var i = 0; i < data.length; ++i) {
                var d = data[i];
                var weight = d.w*d.h;
                total_weight += weight;
                x += (d.x + d.w/2) * weight;
                y += (d.y + d.h/2) * weight;
            }
            x /= total_weight;
            y /= total_weight;
            console.log("center: ", x, ", ", y);
            return {'x': x, 'y': y};
        }

        cloud.setSize = function(s) {
            size = s;
        }

        cloud.getData = function() {
            return data;
        }

        cloud.setData = function(blocks) {
            blocks.sort(function(a, b) { 
                          return b.dim - a.dim; 
                        });
            data = blocks.map(function(d, i) {
                    d.text = text.call(this, d, i);
                    d.padding = padding.call(this, d, i);
                    d.w = d.dim;
                    d.h = d.dim*0.5;
                    return d;
                });
        };

        cloud.removeData = function(d) {
            for(var i = 0; i < data.length; ++i) {
                var dd = data[i];
                if(dd.classname === d.classname) {
                    console.log('removing id: ', i, ', ', dd.classname);
                    data.splice(i,1);
                    break;
                }
            }
        }

        cloud.getSize = function() {
            return size;
        }

        cloud.getBlockHalo = function() {
            return block_halo;
        }

        cloud.runCompaction = function() {
            function getx(d) { return d.x; }
            function getw(d) { return d.w; }
            function gety(d) { return d.y; }
            function geth(d) { return d.h; }
            function setx(d, x) { return d.x = x; }
            function sety(d, y) { return d.y = y; }
            cloud.randomBla(getx, getw, gety, geth, setx);
            cloud.randomBla(gety, geth, getx, getw, sety);
            cloud.randomBla(getx, getw, gety, geth, setx);
            cloud.randomBla(gety, geth, getx, getw, sety);
        }

        cloud.randomBla = function(fcoorda, fsizea, fcoordb, fsizeb, fsetcoorda) {
            var g = d3.select(".vs-main-g");

            function joinCenters(da, db) {
                g.append("line")
                          .attr("x1", da.x + da.w/2)
                          .attr("y1", da.y + da.h/2)
                          .attr("x2", db.x + db.w/2)
                          .attr("y2", db.y + db.h/2)
                          .attr("stroke-width", 4)
                          .attr("stroke", "red");              
            }

            var n = data.length;
            var i = -1;
            var S = [];
            //while (++i < n) {
            for(var i in data) {
                d = data[i];
                S.push({'e': 's', 'c': fcoorda(d), 'b': d, 'lo': fcoordb(d), 'hi': fcoordb(d)+fsizeb(d)});
                S.push({'e': 'e', 'c': fcoorda(d) + fsizea(d), 'b': d, 'lo': fcoordb(d), 'hi': fcoordb(d)+fsizeb(d)});
            }
            S.sort(function(a, b) { return a.c - b.c; });
            var O = [];
            var E = [];
            for(var i in S) {
                var s = S[i];
                if(s.e == 's') { 
                    for(var j = O.length-1; j >= 0; --j) {
                        var slo = O[j];
                        if(slo.lo > s.hi || slo.hi < s.lo) {
                            continue;
                        }
                        if(slo.lo <= s.lo) {
                            if(slo.hi >= s.hi) {
                                // slo completely covers s
                                O.push({'e': 'e', 'c': slo.c, 'b': slo.b, 'lo': slo.lo, 'hi': s.lo});
                                O.push({'e': 'e', 'c': slo.c, 'b': slo.b, 'lo': s.hi, 'hi': slo.hi});
                                O.splice(j, 1); 
                            } else 
                            if(slo.hi >= s.lo) {
                                // slo overlaps with higher part of s
                                O.push({'e': 'e', 'c': slo.c, 'b': slo.b, 'lo': slo.lo, 'hi': s.lo});
                                O.splice(j, 1); 
                            }
                        } else
                        if(slo.hi >= s.hi) {
                            // slo overlaps with upper part of s
                            O.push({'e': 'e', 'c': slo.c, 'b': slo.b, 'lo': s.hi, 'hi': slo.hi});
                            O.splice(j, 1); 
                        } else {
                            // slo is completely covered by x
                            O.splice(j, 1); 
                        }
                        E.push({'s': slo.b, 't': s.b});
                        //joinCenters(slo.b, s.b);
                        //console.log("edge: ", {'s': slo.b.x + slo.b.w/2, 't': s.b.x + s.b.w/2});
                    }
                } else 
                if(s.e == 'e') {
                    O.push(s);
                }
                //console.log('O: ', O);

            }

            var c = {'x':0, 'y':0};//cloud.computeCenter();
            var halo = 10;
            for(var i in data) {
                d = data[i];
                if(fcoorda(d) > fcoorda(c)) {
                    // shift left
                    var target = fcoorda(c);
                    for(var i in E) {
                        if(E[i].t != d) continue;
                        target = Math.max(target, fcoorda(E[i].s) + fsizea(E[i].s) + halo); 
                    }
                    if(target < fcoorda(d)) {
                        //console.log('successful L shift: ', d.x, ' to ', target);
                        fsetcoorda(d, target);
                    }
                } else
                if(fcoorda(d)+fsizea(d) < fcoorda(c)) {
                    // shift right
                    var target = fcoorda(c);
                    for(var i in E) {
                        if(E[i].s != d) continue;
                        target = Math.min(target, fcoorda(E[i].t) - halo); 
                    }
                    if(target > fcoorda(d) + fsizea(d)) {
                        console.log('successful R shift: ', fcoorda(d)+fsizea(d), ' to ', target);
                        fsetcoorda(d, target - fsizea(d));
                    }

                }
            }
        }

        cloud.addBlock = function(d, max_tries) {
            d.w = d.dim;
            d.h = d.dim*0.5;
            d.padding = 5;
            for(var tries = 0; tries < max_tries; ++tries) {
                d.x = (size[0]>>1) + (Math.random() *20);
                d.y = (size[1]>>1) + (Math.random() *20);
                if(place(placement_board, placement_bounds, d)) {
                    if (placement_bounds) {
                        cloudBounds(placement_bounds, d);
                    } else {
                        placement_bounds = [{x: d.x, y: d.y}, {x: d.x + d.w, y: d.y + d.h}];
                    }
                    // Temporary hack
                    d.x -= size[0] >> 1;
                    d.y -= size[1] >> 1;
                    data.push(d);
                    //cloud.runCompaction();
                    return true;
                }
            } 
            return false;
        }
        cloud.rePlace = function(max_tries) {
            placement_board = [];
            placement_bounds = null;
            for(var i = 0; i < data.length; ++i) {
                var d = data[i];
                console.log('replacing: ', d.classname);  
                d.w = d.dim;
                d.h = d.dim*0.5;
                for(var tries = 0; tries < max_tries; ++tries) {
                    d.x = (size[0]>>1) + (Math.random() *20);
                    d.y = (size[1]>>1) + (Math.random() *20);
                    if(place(placement_board, placement_bounds, d)) {
                        if (placement_bounds) {
                            cloudBounds(placement_bounds, d);
                        } else {
                            placement_bounds = [{x: d.x, y: d.y}, {x: d.x + d.w, y: d.y + d.h}];
                        }
                        // Temporary hack
                        d.x -= size[0] >> 1;
                        d.y -= size[1] >> 1;
                        //cloud.runCompaction();
                        break;
                    }
                }
            } 
            return false;
        }
        /*
        cloud.step = function() {
            var start = +new Date;
            var d;
            var board = [];
            var bounds = null;
            var tags = [];
            //var n = vs_bins.length;
            var n = data.length;
            var i = -1;
            while (+new Date - start < timeInterval && ++i < n && timer) {
                d = data[i];
                d.x = (size[0]>>1) + (Math.random() *20);
                d.y = (size[1]>>1) + (Math.random() *20);
                //console.log("STEP: ", d.text, ", ", d.x, ", ", d.y,", ",d.w,", ",d.h);
                if(place(board, bounds, d)) {
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
                cloud.runCompaction();
                event.end(tags, bounds);
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
        };*/

        function place(board,  bounds, d) {
            var perimeter = [{x: block_halo[0], y: block_halo[1]}, 
                             {x: size[0]-block_halo[0], y: size[1]-block_halo[1]}];
            var startX = d.x;
            var startY = d.y;
            var max_width = size[0] - 2*block_halo[0];
            var max_height = size[1] - 2*block_halo[1];
            var maxDelta = Math.sqrt(max_width*max_width + max_height*max_height);
            var s = spiral(size);
            var dt = Math.random() < .5 ? 1 : -1;
            var t = -dt;
            var dxdy;
            var dx;
            var dy;

            while (dxdy = s(t += dt)) {
              dx = ~~dxdy[0];
              dy = ~~dxdy[1];

              if (Math.min(dx, dy) > maxDelta) break;

              d.x = startX + dx;
              d.y = startY + dy;

              if (d.x < block_halo[0] || d.y < block_halo[1] ||
                  d.x + d.w > (size[0] - block_halo[0]) || d.y + d.h > (size[1] - block_halo[1])) continue;
              // TODO only check for collisions within current bounds.
              if (!bounds || !cloudCollide(d, board, max_width)) {
                  if (!bounds || !collideRects(d, bounds)) {
                      board.push({"x":d.x,"y":d.y,"w":d.w,"h":d.h});
                      console.log('okr: ',d.classname,', ',d.w,', ',d.h);
                      return true;
                  }
              }
            }
            console.log('flr: ',d.classname,', ',d.w,', ',d.h);
            return false;
        }


        /*cloud.vs_bins = function(x) {
            if (!arguments.length) return vs_bins;
            vs_bins = x;
            data = vs_bins.map(function(d, i) {
                    d.text = text.call(this, d, i);
                    d.padding = padding.call(this, d, i);
                    d.h = d.dim*0.5;
                    return d;
                }).sort(function(a, b) { return b.dim - a.dim; });
            return cloud;
        };*/

        cloud.size = function(x) {
            if (!arguments.length) return size;
            size = [+x[0], +x[1]];
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

    function intervalOverlap(l1, h1, l2, h2) {
        if(l1 < h2 && l2 < h1) return true;
        return false;
    }

    // Use mask-based collision detection.
    function cloudCollide(tag, board, sw) {
        var HALO = 8;
        for(var i = 0; i < board.length; ++i) {
            var llx = tag.x;
            var lly = tag.y;
            var urx = tag.x + tag.w; 
            var ury = tag.y + tag.h;
            var bi = board[i];
            if(intervalOverlap(llx-HALO, urx+HALO, bi.x, bi.x+bi.w) && 
               intervalOverlap(lly-HALO, ury+HALO, bi.y, bi.y+bi.h)) return true;
        }
        return false;
    }

    function cloudBounds(bounds, d) {
        var b0 = bounds[0];
        var b1 = bounds[1];
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
        var dy = 4;
        var dx = dy * size[0] / size[1];
        var x = 0;
        var y = 0;
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
        var a = [];
        var i = -1;
        while (++i < n) a[i] = 0;
        return a;
    }

    var spirals = {
            archimedean: archimedeanSpiral,
            rectangular: rectangularSpiral
        };

    if (typeof module === "object" && module.exports) module.exports = cloud;
    else (d3.layout || (d3.layout = {})).cloud = cloud;
})();


d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
