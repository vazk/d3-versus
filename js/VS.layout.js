// Word cloud layout by Jason Davies, http://www.jasondavies.com/word-cloud/
// Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf
(VS || (VS = {})).Layout = ( function(window, undefined) {
    var mainGroups = [];
    var currentGroup = -1;

    var svgLayout;
    var transitionDuration = 250;
    var size = null;
    var block_halo = [25, 25];
    var spiral = archimedeanSpiral;
    var layBorderPath;
    var layGradientLeft;
    var layGradiendRight;
    var layFilter;
    var worldG;
    
    function computeCenter() {
        var mainG = mainGroups[currentGroup];
        var total_weight = 0;
        var x = 0;
        var y = 0;
        for(var i = 0; i < mainG.data.length; ++i) {
            var d = mainG.data[i];
            var weight = d.w*d.h;
            total_weight += weight;
            x += (d.x + d.w/2) * weight;
            y += (d.y + d.h/2) * weight;
        }
        x /= total_weight;
        y /= total_weight;
        return {'x': x, 'y': y};
    }

    function setSize(s) {
        size = s;
    }

    function getData() {
        var mainG = mainGroups[currentGroup];
        return mainG.data;
    }

    function setData(blocks) {
        blocks.sort(function(a, b) { 
                      return b.dim - a.dim; 
                    });
        mainG.data = blocks.map(function(d, i) {
                d.text = text.call(this, d, i);
                d.padding = padding.call(this, d, i);
                d.w = d.dim;
                d.h = d.dim*0.5;
                return d;
            });
    };

    function removeData(d) {
        var mainG = mainGroups[currentGroup];
        for(var i = 0; i < mainG.data.length; ++i) {
            var dd = mainG.data[i];
            if(dd.classname === d.classname) {
                console.log('removing id: ', i, ', ', dd.classname);
                mainG.data.splice(i,1);
                break;
            }
        }
    }

    function getSize() {
        return size;
    }

    function getBlockHalo() {
        return block_halo;
    }

    function runCompaction() {
        function getx(d) { return d.x; }
        function getw(d) { return d.w; }
        function gety(d) { return d.y; }
        function geth(d) { return d.h; }
        function setx(d, x) { return d.x = x; }
        function sety(d, y) { return d.y = y; }

        var mainG = mainGroups[currentGroup];
        randomBla(mainG.data, getx, getw, gety, geth, setx);
        randomBla(mainG.data, gety, geth, getx, getw, sety);
        randomBla(mainG.data, getx, getw, gety, geth, setx);
        randomBla(mainG.data, gety, geth, getx, getw, sety);
        var c = computeCenter();
        var sc = {'x': size[0] >> 1, 'y': size[0] >> 1};
        for(var i = 0; i < mainG.data.length; ++i) {
            var dd = mainG.data[i];
            dd.x -= c.x;
            dd.y -= c.y;
        }
    }

    function randomBla(data, fcoorda, fsizea, fcoordb, fsizeb, fsetcoorda) {
        var mainG = mainGroups[currentGroup];// d3.select(".vs-main-g");

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
                    //console.log('successful R shift: ', fcoorda(d)+fsizea(d), ' to ', target);
                    fsetcoorda(d, target - fsizea(d));
                }

            }
        }
    }

    function addData(d, max_tries) {
        var mainG = mainGroups[currentGroup]; 
        d.w = d.dim;
        d.h = d.dim*0.5;
        d.padding = 5;
        for(var tries = 0; tries < max_tries; ++tries) {
            d.x = (size[0]>>1) + (Math.random() *20);
            d.y = (size[1]>>1) + (Math.random() *20);
            if(place(mainG.placement_board, mainG.placement_bounds, d)) {
                if (mainG.placement_bounds) {
                    cloudBounds(mainG.placement_bounds, d);
                } else {
                    mainG.placement_bounds = [{x: d.x, y: d.y}, {x: d.x + d.w, y: d.y + d.h}];
                }
                // Temporary hack
                d.x -= size[0] >> 1;
                d.y -= size[1] >> 1;
                mainG.data.push(d);
                //cloud.runCompaction();
                return true;
            }
        } 
        return false;
    }

    function setCurrentGroupId(grId) {
        currentGroup = grId;
    }

    function rePlace(max_tries) {
        var mainG = mainGroups[currentGroup]; 
        mainG.placement_board = [];
        mainG.placement_bounds = null;
        var success = false;
        for(var i = 0; i < mainG.data.length; ++i) {
            var d = mainG.data[i];
            console.log('replacing: ', d.classname);  
            d.w = d.dim;
            d.h = d.dim*0.5;
            success = false;
            for(var tries = 0; tries < max_tries; ++tries) {
                d.x = (size[0]>>1);
                d.y = (size[1]>>1);
                if(place(mainG.placement_board, mainG.placement_bounds, d)) {
                    if(mainG.placement_bounds) {
                        cloudBounds(mainG.placement_bounds, d);
                    } else {
                        mainG.placement_bounds = [{x: d.x, y: d.y}, {x: d.x + d.w, y: d.y + d.h}];
                    }
                    // Temporary hack
                    d.x -= size[0] >> 1;
                    d.y -= size[1] >> 1;
                    //cloud.runCompaction();
                    success = true;
                    break;
                }
            }
            if(!success) {
                var remaining = mainG.data.splice(i,mainG.data.length-i);
                mainG.unplacedData = remaining.concat(mainG.unplacedData);
                break;
            }
        } 

        if(success) {
            for(var i = 0; i < mainG.unplacedData.length; ) {
                var d = mainG.unplacedData[i];
                if(addData(d, 3) == false) break;
                mainG.unplacedData.splice(i,1);
            }
        }
        return false;
    }

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
                  return true;
              }
          }
        }
        return false;
    }

    function size(x) {
        if (!arguments.length) return size;
        size = [+x[0], +x[1]];
        return cloud;
    };

    function text(x) {
        if (!arguments.length) return text;
        text = d3.functor(x);
        return cloud;
    };

    function spiral(x) {
        if (!arguments.length) return spiral;
        spiral = spirals[x + ""] || x;
        return cloud;
    };

    function padding(x) {
        if (!arguments.length) return padding;
        padding = d3.functor(x);
        return cloud;
    };

    function resizeRendering(svgLayout, s) {
        size = s;

        layBorderPath
            .attr('width', size[0])
            .attr('height', size[1]);
        svgLayout
            .attr('width',  size[0])
            .attr('height', size[1])
        worldG
            .attr('transform', 'translate('+ size[0]/2+','+size[1]/2+')')
    }

    function setupRendering(svgLayout, s, allData) {
        size = s;

        layBorderPath = svgLayout.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('height', size[1])
            .attr('width', size[0])
            //.style("stroke", "green")
            .style('fill', 'none')
            //.style("stroke-width", 2)
            //.on('click', function() {console.log('bla');})
            ;
  
        layGradientLeft = svgLayout.append("svg:defs")
            .append("svg:linearGradient")
            .attr("id", "gradient_left")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%")
            .attr("spreadMethod", "pad");
  
        layGradientLeft.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#25BADF")
            .attr("stop-opacity", 1);
  
  
        layGradientLeft.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#1BCB9D")//27 203 157
            .attr("stop-opacity", 1);
  
        layGradientLeft.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#25BADF")
            .attr("stop-opacity", 1);
  
  
        layGradientRight = svgLayout.append("svg:defs")
            .append("svg:linearGradient")
            .attr("id", "gradient_right")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%")
            .attr("spreadMethod", "pad");
  
  
        layGradientRight.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#F98829")
            .attr("stop-opacity", 1);
  
        layGradientRight.append("svg:stop")
            .attr("offset", "50%")
            .attr("stop-color", "#F8750B")//248 117 11
            .attr("stop-opacity", 1);
  
        layGradientRight.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#CE173E")
            .attr("stop-opacity", 1);
  
        // filters go in defs element
        var defs = svgLayout.append("defs");
         
        // create filter with id #drop-shadow-block
        // height=130% so that the shadow is not clipped
        layFilter = defs.append("filter")
            .attr("id", "drop-shadow-block")
            .attr("height", "130%");
         
        // SourceAlpha refers to opacity of graphic that this filter will be applied to
        // convolve that with a Gaussian with standard deviation 3 and store result
        // in blur
        layFilter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 5)
            .attr("result", "blur");
         
        // translate output of Gaussian blur to the right and downwards with 2px
        // store result in offsetBlur
        layFilter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 0)
            .attr("dy", 0)
            .attr("result", "offsetBlur");
         
        // overlay original SourceGraphic over translated blurred opacity by using
        // feMerge filter. Order of specifying inputs is important!
        var feMerge = layFilter.append("feMerge");
         
        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur")
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");
  
  
        worldG = svgLayout
                    .attr('width',  size[0])
                    .attr('height', size[1])
                    .append('g')
                        .attr('transform', 'translate('+ size[0]/2+','+size[1]/2+')')
                        .attr('class', 'vs-main-g-world');
        worldG.data = [];
        worldG.unplacedData = allData;
        worldG.placement_board = [];
        worldG.placement_bounds = null;
        mainGroups.push(worldG);
        currentGroup = 0;
    }

    function updateRendering(data) {
        var xoff = 1;
        var yoff = 1;
        var wgain = 0;
        var hgain = 0
        var halo = 1;
  
        var char_dim = 12; 
        var rat_h_halo = -3;
        var rat_w_halo = 13;
        var h_dim = 24;
        
        var vs_rectdata = mainGroups[currentGroup].selectAll('.vs-block')
                        .data(data, function(d) { return d.classname; });
  
  
        var blockG = vs_rectdata
                      .enter()
                        .append('g')
                          .attr('class', function(d) { return d.classname + ' vs-block'; })
                          .on("mouseenter", onMouseIn)
                          .on("mouseleave", onMouseOut);
  
        blockG.append("svg:rect")
                .attr('class', 'vs-bounding-rect')
                .attr("x", function(d) { return d.x - xoff; })
                .attr("y", function(d) { return d.y - yoff; })
                .attr("rx", function(d) { return d.h*0.04; })
                .attr("ry", function(d) { return d.h*0.04; })
                .attr("width", function(d) { return d.w + wgain; })
                .attr("height", function(d) { return d.h + hgain; })
                .style("stroke", "black")
                .style("stroke-width", 3)
                //.style("filter", "url(#drop-shadow-block)")
                .attr("fill", "white");
        blockG.append("svg:image")
                .attr("x", function(d) { return d.x - xoff + halo + 1; })
                .attr("y", function(d) { return d.y - yoff + halo + 1; })
                .attr("width", function(d) { return (d.w + wgain -3*halo)/2 - 2; })
                .attr("height", function(d) { return d.h + hgain - 2*halo - 2; })
                .attr("xlink:href",function(d) { return d.img_left; })
                .attr('class', 'vs-img-left')
        blockG.append("svg:rect")
                .attr("x", function(d) { return d.x - xoff + halo; })
                .attr("y", function(d) { return d.y - yoff + halo; })
                .attr("width", function(d) { return (d.w + wgain -3*halo)/2; })
                .attr("height", function(d) { return d.h + hgain - 2*halo; })
                .attr("xlink:href",function(d) { return d.img_left; })
                .attr("rx", function(d) { return d.h*0.04; })
                .attr("ry", function(d) { return d.h*0.04; })
                .style("fill", "none")
                .style("stroke", "#25BADF")
                .style("stroke-width", 2)
                .attr('class', 'vs-img-border-left');
  
        blockG.append("svg:image")
                .attr("x", function(d) { return d.x - xoff + (d.w + wgain + halo)/2 + 1; })
                .attr("y", function(d) { return d.y - yoff + halo + 1; })
                .attr("width", function(d) { return (d.w + wgain -3*halo)/2 - 2; })
                .attr("height", function(d) { return d.h + hgain - 2*halo - 2; })
                .attr("xlink:href",function(d) { return d.img_right; })
                .attr('class', 'vs-img-right');
        blockG.append("svg:rect")
                .attr("x", function(d) { return d.x - xoff + (d.w + wgain + halo)/2; })
                .attr("y", function(d) { return d.y - yoff + halo; })
                .attr("width", function(d) { return (d.w + wgain -3*halo)/2; })
                .attr("height", function(d) { return d.h + hgain - 2*halo; })
                .attr("rx", function(d) { return d.h*0.04; })
                .attr("ry", function(d) { return d.h*0.04; })
                .style("fill", "none")
                .style("stroke", "#CE173E")
                .style("stroke-width", 2)
                .attr('class', 'vs-img-border-right');
  
  
  
        blockG.append("svg:rect")
                .attr("x", function(d) { return d.x + d.w*0.1 ; })
                .attr("y", function(d) { return d.y + d.h*0.7; })
                .attr("width", function(d) { 
                        d.counter_rect_left_width = Math.min(d.w*0.8-15, Math.max(15,(d.rat_left/(d.rat_right +                                                         d.rat_left))*d.w*0.8 - 1));
                        return d.counter_rect_left_width
                      })
                .attr("height", function(d) { return d.h*0.25; })
                //.attr("rx", function(d) { return d.h*0.04; })
                //.attr("ry", function(d) { return d.h*0.04; })
                //.style("stroke", "white")
                //.style("stroke-width", 1)
                .style("fill", "url(#gradient_left)")
                //.style("filter", "url(#drop-shadow-block)")
                .style("stroke", "white")
                .style("stroke-width", 2)
                .attr('class', 'vs-counter-rect-left');
  
        blockG.append("svg:rect")
                //.attr("x", function(d) { return d.x + rat_w_halo; })
                .attr("x", function(d) { 
                        return d.x + d.w*0.1 + d.counter_rect_left_width; 
                      })
                //.attr("y", function(d) { return d.y + d.h - rat_h_halo - h_dim; })
                .attr("y", function(d) { return d.y + d.h*0.70; })
                //.attr("width", function(d) { return Math.max(15,(d.rat_right/(d.rat_right + d.rat_left))*d.w*0.8); })
                .attr("width", function(d) { return d.w*0.8 - d.counter_rect_left_width; })
                .attr("height", function(d) { return d.h*0.25; })
                //.attr("rx", function(d) { return d.h*0.04; })
                //.attr("ry", function(d) { return d.h*0.04; })
                //.style("stroke", "white")
                //.style("stroke-width", 1)
                .style("fill", "url(#gradient_right)")
                //.style("filter", "url(#drop-shadow-block)")
                .style("stroke", "white")
                .style("stroke-width", 2)
                .attr('class', 'vs-counter-rect-right');
  
        blockG.append("text")
                .attr("x", function(d) { return d.x + d.w*0.12; })
                .attr("y", function(d) { return d.y + d.h*0.87; })
                .style("font-family","Nobile")
                .style("font-size", function(d) { return d.h*0.16 + 'px';})
                .text(function(d) { return d.rat_left.toString(); })
                .attr('class', 'vs-counter-text-left');
  
        blockG.append("text")
                .attr("x", function(d) { return d.x + d.w*0.9 - VS.computeTextWidth(d.rat_right.toString(), d.h*0.17+"px Nobile") - 2})
                .attr("y", function(d) { return d.y + d.h*0.87; })
                .style("font-family","Nobile")
                .style("font-size", function(d) { return d.h*0.16 + 'px';})
                .text(function(d) { return d.rat_right.toString(); })
                .attr('class', 'vs-counter-text-right');
  
        blockG.append('circle')
                .attr("cx", function(d) { return d.x + d.w; })
                .attr("cy", function(d) { return d.y; })
                .attr("r", 14)
                .style("fill", "white")
                .style("stroke", "black")
                .style("stroke-width", 3)
                .style("opacity", 0)
                .attr('class', 'vs-close-circle')
                .on("click", onCloseBlock);
        blockG.append("line")
                .attr("x1", function(d) { return d.x + d.w - 5; })
                .attr("y1", function(d) { return d.y - 5; })
                .attr("x2", function(d) { return d.x + d.w + 5; })
                .attr("y2", function(d) { return d.y + 5; })
                .attr("stroke-width", 3)
                .attr("stroke", "black")
                .style("opacity", 0)
                .attr('class', 'vs-close-x1')
                .on("click", onCloseBlock);
        blockG.append("line")
                .attr("x1", function(d) { return d.x + d.w + 5; })
                .attr("y1", function(d) { return d.y - 5; })
                .attr("x2", function(d) { return d.x + d.w - 5; })
                .attr("y2", function(d) { return d.y + 5; })
                .attr("stroke-width", 3)
                .attr("stroke", "black")
                .style("opacity", 0)
                .attr('class', 'vs-close-x2')
                .on("click", onCloseBlock);
  
        vs_rectdata.exit().remove();
  
    }

    function cloudText(d) {
        return d.text;
    }

    function cloudPadding() {
        return 1;
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

    var spirals = {
            archimedean: archimedeanSpiral,
            rectangular: rectangularSpiral
    };


    function computeFontSize(w, textLength) { 
        return Math.min(2 * w, (2 * w - 8) / textLength * 24) + "px";
    }

    function onMouseIn(d) {
        var wgain = 220-d.w;
        var hgain = 110-d.h;
        var xoff = wgain/2;
        var yoff = hgain/2;
        var halo = 0;

        var size = getSize();
        var pad = getBlockHalo();
        size = [(size[0]-30)>>1, (size[1]-30)>>1];

        var x_rect = d.x - xoff;
        var y_rect = d.y - yoff;
        var w_rect = d.w + wgain;
        var h_rect = d.h + hgain;
        
        if(x_rect < -size[0]) { x_rect = -size[0]; }
        else
        if(x_rect+w_rect > size[0]) { x_rect = size[0] - w_rect; }
        if(y_rect < -size[1]) { y_rect = -size[1]; }
        else
        if(y_rect+h_rect > size[1]) { y_rect = size[1] - h_rect; }

        var i = d3.select(this);
        i.select(".vs-bounding-rect")
              .transition()
              .duration(transitionDuration)
              .attr('x', x_rect-3)
              .attr('y', y_rect-3)
              .attr('width', w_rect+6)
              .attr('height', h_rect+6)
              .style("stroke", "white")
              .style("stroke-width", 8)
              .style("filter", "url(#drop-shadow-block)")
              .each("end", function(){
                    i.select(".vs-close-circle")
                        .attr("cx", x_rect + w_rect - 5)
                        .attr("cy", y_rect + 5)
                        .style("opacity", 1);
                    i.select(".vs-close-x1")
                        .attr("x1", x_rect + w_rect )
                        .attr("y1", y_rect)
                        .attr("x2", x_rect + w_rect - 10)
                        .attr("y2", y_rect + 10)
                        .style("opacity", 1);
                    i.select(".vs-close-x2")
                        .attr("x1", x_rect + w_rect - 10)
                        .attr("y1", y_rect)
                        .attr("x2", x_rect + w_rect)
                        .attr("y2", y_rect + 10)
                        .style("opacity", 1);
              });

        var w_img = (w_rect -3*halo)/2 - 2;
        var h_img = h_rect - 2*halo - 2;
        var y_img = y_rect + halo;
        var x_img_l = x_rect + halo;
        var x_img_r = x_rect + (w_rect + halo)/2;

        i.select(".vs-img-left")
              .transition()
              .duration(transitionDuration)
              .attr('x', x_img_l + 1)
              .attr('y', y_img + 1)
              .attr('width', w_img - 2)
              .attr('height', h_img - 2);
        i.select(".vs-img-border-left")
              .transition()
              .duration(transitionDuration)
              .attr('x', x_img_l)
              .attr('y', y_img)
              .attr('width', w_img)
              .attr('height', h_img);

        i.select(".vs-img-right")
              .transition()
              .duration(transitionDuration)
              .attr('x', x_img_r + 2)
              .attr('y', y_img + 2)
              .attr('width', w_img - 2)
              .attr('height', h_img - 2);
        i.select(".vs-img-border-right")
              .transition()
              .duration(transitionDuration)
              .attr('x', x_img_r)
              .attr('y', y_img)
              .attr('width', w_img)
              .attr('height', h_img);

        i.select(".vs-counter-rect-left")
              .transition()
              .duration(transitionDuration)
              .attr("x", function(d) { return x_rect + w_rect*0.1 ; })
              .attr("y", function(d) { return y_rect + h_rect*0.7; })
              .attr("width", function(d) { return Math.max(15,(d.rat_left/(d.rat_right + d.rat_left))*w_rect*0.8 - 1); })
              .attr("height", function(d) { return h_rect*0.25; });

        i.select(".vs-counter-rect-right")
              .transition()
              .duration(transitionDuration)
              .attr("x", function(d) { return x_rect + w_rect*0.1 + Math.max(15,(d.rat_left/(d.rat_right+d.rat_left))*w_rect*0.8) + 1; })
              .attr("y", function(d) { return y_rect + h_rect*0.70; })
              .attr("width", function(d) { return Math.max(15,(d.rat_right/(d.rat_right + d.rat_left))*w_rect*0.8); })
              .attr("height", function(d) { return h_rect*0.25; });
     
        i.select(".vs-counter-text-left")
              .transition().duration(transitionDuration)
              .attr("x", function(d) { return x_rect + w_rect*0.12; })
              .attr("y", function(d) { return y_rect + h_rect*0.87; })
              .style("font-size", function(d) { return 16+"px";});

        i.select(".vs-counter-text-right")
              .transition().duration(transitionDuration)
              //.attr("x", function(d) { return x_rect + w_rect*0.86 - d.rat_right.toString().length * (7*h_rect/100); })
              .attr("x", function(d) { return x_rect + w_rect*0.9 - VS.computeTextWidth(d.rat_right.toString(), '16px Nobile') - 1; })
              .attr("y", function(d) { return y_rect + h_rect*0.87; })
              .style("font-size", function(d) { return 16+"px";});
        /*var grow_transform = d3.svg.transform()
                .translate(function(d) { 
                    var factor = 220/d.w;
                    return [d.x * (1-factor), d.y*(1-factor)];
                })
                .scale(function(d) { 
                    var factor = 220/d.w;
                    return factor;
                });
        i.transition().duration(transitionDuration).attr('transform', grow_transform);*/
        i.moveToFront();
    }

    function onMouseOut(d) {
        var i = d3.select(this);
        //i.transition().duration(transitionDuration).attr("transform","scale(1)");
        updateBlock(d, i);
    }

    function onCloseBlock(d) {
        //var svgdoc = d.ownerDocument;
        //var obj = svgdoc.getElementById(node);
        //obj.setAttribute("display" , "none");
        //mainG.style('display', 'none');
        if(d) {
            removeData(d);
        }

        rePlace(1);
        runCompaction();

        console.log('after place #2: ', inputData.length, 'placed: ', getData().length);

        //rePlace(1);
        //runCompaction();
        var data = getData();
        updateRendering(data);

        for(var i in data) {
            var d = data[i];
            var block = d3.select("."+d.classname)
            updateBlock(d, block);
        }
                   
    }

    function updateBlock(d, i) {
        var xoff = 1;
        var yoff = 1;
        var wgain = 0;
        var hgain = 0
        var halo = 1;
  
        var x_rect = d.x - xoff;
        var y_rect = d.y - yoff;
        var w_rect = d.w + wgain;
        var h_rect = d.h + hgain;
        
        i.select(".vs-bounding-rect")
              .transition()
              .duration(transitionDuration)
              .attr('x', x_rect)
              .attr('y', y_rect)
              .attr('width', w_rect)
              .attr('height', h_rect)
              .style("stroke", "black")
              .style("stroke-width", 3)
              .style("filter", "none");
  
        var w_img = (w_rect -3*halo)/2;
        var h_img = h_rect - 2*halo ;
        var y_img = y_rect + halo;
        var x_img_l = x_rect + halo;
        var x_img_r = x_rect + (w_rect + halo)/2;
  
        i.select(".vs-img-left")
              .transition()
              .duration(transitionDuration)
              .attr('x', x_img_l + 1)
              .attr('y', y_img + 1)
              .attr('width', w_img - 2)
              .attr('height', h_img - 2);
        i.select(".vs-img-border-left")
              .transition()
              .duration(transitionDuration)
              .attr('x', x_img_l)
              .attr('y', y_img)
              .attr('width', w_img)
              .attr('height', h_img);
        i.select(".vs-img-right")
              .transition()
              .duration(transitionDuration)
              .attr('x', x_img_r + 1)
              .attr('y', y_img + 1)
              .attr('width', w_img - 2)
              .attr('height', h_img - 2);
        i.select(".vs-img-border-right")
              .transition()
              .duration(transitionDuration)
              .attr('x', x_img_r)
              .attr('y', y_img)
              .attr('width', w_img)
              .attr('height', h_img);
  
        i.select(".vs-counter-rect-left")
              .transition()
              .duration(transitionDuration)
              .attr("x", function(d) { return d.x + d.w*0.1 ; })
              .attr("y", function(d) { return d.y + d.h*0.7; })
              .attr("width", function(d) { return d.counter_rect_left_width; })
              .attr("height", function(d) { return d.h*0.25; })
  
        i.select(".vs-counter-rect-right")
              .transition()
              .duration(transitionDuration)
              .attr("x", function(d) { return d.x + d.w*0.1 + d.counter_rect_left_width; })
              .attr("y", function(d) { return d.y + d.h*0.70; })
              .attr("width", function(d) { return d.w*0.8 - d.counter_rect_left_width; })
              .attr("height", function(d) { return d.h*0.25; })
  
        i.select(".vs-counter-text-left")
              .transition().duration(transitionDuration)
              .attr("x", function(d) { return d.x + d.w*0.12; })
              .attr("y", function(d) { return d.y + d.h*0.87; })
              .style("font-size", function(d) { return d.h*0.16 + 'px';});
              //.style("font-size", function(d) { return (d.h/100)+"em";});
  
        i.select(".vs-counter-text-right")
              .transition().duration(transitionDuration)
              //.attr("x", function(d) { return d.x + d.w*0.86 - d.rat_right.toString().length * (7*d.h/100); }
              .attr("x", function(d) { return d.x + d.w*0.9 - VS.computeTextWidth(d.rat_right.toString(), d.h*0.17+'px Nobile') - 2})
              .attr("y", function(d) { return d.y + d.h*0.87; })
              .style("font-size", function(d) { return d.h*0.16 + 'px';});
  
        i.select(".vs-close-circle")
              .attr("cx", function(d) { return d.x + d.w; })
              .attr("cy", function(d) { return d.y; })
              .style("opacity", 0);
        i.select(".vs-close-x1")
              .attr("x1", function(d) { return d.x + d.w - 5; })
              .attr("y1", function(d) { return d.y - 5; })
              .attr("x2", function(d) { return d.x + d.w + 5; })
              .attr("y2", function(d) { return d.y + 5; })
              .style("opacity", 0);
        i.select(".vs-close-x2")
              .attr("x1", function(d) { return d.x + d.w + 5; })
              .attr("y1", function(d) { return d.y - 5; })
              .attr("x2", function(d) { return d.x + d.w - 5; })
              .attr("y2", function(d) { return d.y + 5; })
              .style("opacity", 0);
    }
  



    return {
        resize:  resizeRendering,
        setup:   setupRendering,
        compact: runCompaction,
        update:  updateRendering,
        replace: onCloseBlock,
        getData: getData,
        addData: addData,
        setCurrentGroupId: setCurrentGroupId,
        mainGroups: function() { return mainGroups; },
    };
    
})(window);


d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
