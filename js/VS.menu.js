(function() {
    function menu() {
        var mnuMain = null;
        var mnuDivMenuSVG = d3.select('#div_menu_svg');
        var SVGMenu;
 
        var items = [];
        var mnuSelectedItem = 0;
        var mnuHoverItem = -1;

        var mnuItemFontSize = 20;
        var mnuSelItemFontSize = 50;
        var mnuHovItemFontSize = 23 ;
        var mnuSeparation = 45;
        var mnuBorderPath;


        function onMenuMouseIn() {
            mnuHoverItem = this.attributes.item_index.value;
            menu.updateMenu();
        }

        function onMenuMouseOut() {
            mnuHoverItem = -1;
            menu.updateMenu();
        }

        menu.onMenuMouseClick = function() {
            var i = d3.select(this);
            mnuSelectedItem = this.attributes.item_index.value;
            if(mnuSelectedItem == 0) {
                xOffset = VS.SVGWidth/2;
            } else {
                xOffset = -VS.SVGWidth;
            }
            VS.layout.layMain.transition()
                    .duration(550)
                    .attr('transform', 'translate('+xOffset+','+VS.SVGHeight/2+')');
            var r = menu.updateMenu();
        }

        menu.updateMenu = function() {
            var x = 0;
            var offset = 0;
            var xCoords = [];
            var duration = 450;
            for(var i = 0; i < items.length; ++i) {
                var item = items[i];
                var itemFontSize;
                var itemOffset = 0;
                var itemColor = 'black';
                if(i == mnuSelectedItem) {
                    itemFontSize = mnuSelItemFontSize;
                    tw = VS.computeTextWidth(item.text, itemFontSize + 'px Nobile');
                    offset = x + tw/2;
                } else 
                if(i == mnuHoverItem) {
                    tw = VS.computeTextWidth(item.text, mnuItemFontSize + 'px Nobile');
                    itemFontSize = mnuHovItemFontSize;
                    itemOffset = (tw - VS.computeTextWidth(item.text, itemFontSize + 'px Nobile'))/2;
                    itemColor = '#CE173E';
                    duration = 150;
                } else {
                    itemFontSize = mnuItemFontSize;
                    tw = VS.computeTextWidth(item.text, itemFontSize + 'px Nobile');
                }
                xCoords.push({'x':x + itemOffset, 'color': itemColor, 'size': itemFontSize});
                x += (tw + mnuSeparation);
            }

            for(var i = 0; i < items.length; ++i) {
                var itm = mnuMain.selectAll('.item-'+i);
                var itmText = itm.selectAll('text');
                itmText.transition()
                    .duration(duration)
                    .attr('x', (xCoords[i].x - offset))
                    .attr('fill', xCoords[i].color)
                    .style('font-size', xCoords[i].size+'px');

                var itmSearch = itm.selectAll(function() { 
                            return this.getElementsByTagName("foreignObject"); 
                        });
                itmSearch.transition()
                    .duration(duration)
                    .attr('x', (xCoords[i].x - offset));
            }
            return {'offset': offset};
        }

        menu.addMenuItem = function(item) {
            var menuG = mnuMain
                            .append('g')
                              .attr('class', 'vs-menu-item item-'+items.length)
                              .attr('item_index', items.length)
                              .on("click", menu.onMenuMouseClick)
                              .on("mouseenter", onMenuMouseIn)
                              .on("mouseleave", onMenuMouseOut);

            if(item.search) {
                menuG.append('foreignObject')
                        //.attr('width', 250)
                        //.attr('height', 25)
                        .attr('x', 0)
                        .attr('y', 0)
                        //.style('opacity',  1)
                            .append('xhtml:div')
                                //.attr('class', 'input-group')
                                //.style('display', 'none')
                                .html('<div class="input-group search-group"><input type="text" class="center-block form-control input-sm"' +
                                       'title="Search versus." placeholder="search versus...">' + 
                                       '<span class="input-group-btn"><button class="btn btn-sm btn-primary"' +
                                       'type="button">go</button></span></div>');
            } else {
                menuG.append('text')
                        .attr('y', 0)
                        .style('font-family','Nobile')
                        .style('font-weight', 'bold')
                        .style("filter", "url(#drop-shadow-text)")
                        .text(item.text)
                        .attr('cursor', 'pointer')
                        .attr('class', 'vs-menup-item-text');
            }
            items.push(item);
        }

        function setupFilters() {
            // filters go in defs element
            var defs = SVGMenu.append("defs");

            // create filter with id #drop-shadow
            // height=110% so that the shadow is not clipped
            var mnuFilter = defs.append("filter")
                .attr("id", "drop-shadow-text")
                .attr("height", "110%");
             
            // SourceAlpha refers to opacity of graphic that this filter will be applied to
            // convolve that with a Gaussian with standard deviation 3 and store result
            // in blur
            mnuFilter.append("feGaussianBlur")
               .attr("in", "SourceAlpha")
               .attr("stdDeviation", 3)
               .attr("result", "blur");
            
            // translate output of Gaussian blur to the right and downwards with 2px
            // store result in offsetBlur
            mnuFilter.append("feOffset")
                .attr("in", "blur")
                .attr("dx", 0)
                .attr("dy", 0)
                .attr("result", "offsetBlur");

            mnuFilter.append("feFlood")
                .attr("in", "offsetBlur")
                .attr("flood-color", "#3d3d3d")
                .attr("flood-opacity", "0.5")
                .attr("result", "offsetColor");
            mnuFilter.append("feComposite")
                .attr("in", "offsetColor")
                .attr("in2", "offsetBlur")
                .attr("operator", "in")
                .attr("result", "offsetBlur");

            // overlay original SourceGraphic over translated blurred opacity by using
            // feMerge filter. Order of specifying inputs is important!
            var feMerge = mnuFilter.append("feMerge");
             
            feMerge.append("feMergeNode")
                .attr("in", "offsetBlur")
            feMerge.append("feMergeNode")
                .attr("in", "SourceGraphic");
        }


        menu.setupMenuRendering = function() {

            SVGMenu = mnuDivMenuSVG.append('svg')
                       .style('background','white');

            setupFilters();

            mnuBorderPath = SVGMenu.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', VS.SVGMenuHeight)
                .attr('width', VS.SVGWidth)
                .style('fill', 'transparent')
                .on('click', function() {console.log('menu_bla');});

            mnuMain = SVGMenu.attr('width',  VS.SVGWidth)
                         .attr('height', VS.SVGMenuHeight)
                         .append('g')
                            .attr('transform', 'translate('+VS.SVGWidth/2+','
                                                           +(VS.SVGMenuHeight/2+mnuItemFontSize/2)+')')
                            .attr('class', 'vs-menu-g');
            var menuItems = [
                        {'text':'world', 'pos':0},
                        {'text':'local', 'pos':1},
                        {'text':'random', 'pos':2},
                        {'text':'favourites', 'pos':3},
                        {'text':'search', 'pos':4}];//, 'search':true}];
            for(it in menuItems) {
                menu.addMenuItem(menuItems[it]);
                var r = menu.updateMenu();

                //mnuMain.transition()
                //    .duration(350)
                //    .attr('transform', 'translate('+(VS.SVGWidth/2-r.offset)+','
                //                                   +(VS.SVGMenuHeight/2+mnuItemFontSize/2)+')');
            }
/*                  
            var menuData = mnuMain.selectAll('.vs-menu-item')
                            .data(menu, function(d) { return d.pos; });
            var menuG = menuData
                          .enter()
                            .append('g')
                              .attr('class', 'vs-menu-item')
                              .on("mouseenter", onMenuMouseIn)
                              .on("mouseleave", onMenuMouseOut);

            menuG.append("text")
                    .attr("x", function(m) { return m.pos*140 - 60; })
                    .attr("y", 5)
                    .style("font-family","Nobile")
                    .style("font-size", '20px')
                    .text(function(m) { return m.text; })
                    .attr('class', 'vs-menup-item-text');
            menuG.append("foreignObject")
                    .attr("width", 200)
                    .attr("height", 50)
                    .attr("x", 500)
                    .attr("y", 5)
                      .append("xhtml:input")
                          .style('font', '14px \'Nobile\'')
                          //.html('<h1>An HTML Foreign Object in SVG</h1>')
                          .attr('type', 'text')
                          .attr('class', 'center-block form-control input-lg')
                          .attr('title', 'Search versus.')
                          .attr('placeholder', 'search versus...')
                          .attr("height", 50);
*/
        }

        menu.updateMenuRendering = function() {

        }
        return d3.rebind(menu, event, "on");
    }
    (VS || (VS = {})).menu = menu;
})();
