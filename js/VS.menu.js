(function() {
    function menu() {
        var mnuMain = null;
        var mnuDivMenuSVG = d3.select('#div_menu_svg');
        var SVGMenu;
 
        var items = [];
        var mnuSelectedItem = 0;
        var mnuHoverItem = -1;

        //var mnuOffset = {'x': 0, 'y': 0};
        var mnuOffset = {'x': VS.SVGWidth/2, 'y': VS.SVGMenuHeight/2};
        var mnuItemFontSize;
        var mnuSelItemFontSize;
        var mnuHovItemFontSize;
        var mnuSeparation;
        var mnuBorderPath;
        var mnuMouseInEnabled = true;

        var onMenuItemChanged = null;

        function onMenuMouseIn() {
            console.log('enabled ', mnuMouseInEnabled);
            if(mnuMouseInEnabled) {
                mnuHoverItem = this.attributes.item_index.value;
                menu.updateMenu();
            }
        }

        function onMenuMouseOut() {
            if(mnuMouseInEnabled) { 
                mnuHoverItem = -1;
                menu.updateMenu();
            }
        }

        menu.onMenuMouseClick = function() {
            mnuMouseInEnabled = false;
            var i = d3.select(this);
            var oldSelectedItem = mnuSelectedItem;
            mnuSelectedItem = this.attributes.item_index.value;
            var r = menu.updateMenu();
            onMenuItemChanged(oldSelectedItem, mnuSelectedItem);
        }

        menu.setMaxMode = function() {
            mnuItemFontSize = 20;
            mnuSelItemFontSize = 50;
            mnuHovItemFontSize = 23 ;
            mnuSeparation = 35;
        }


        menu.setNormalMode = function() {
            mnuItemFontSize = 18;
            mnuSelItemFontSize = 40;
            mnuHovItemFontSize = 21;
            mnuSeparation = 25;
        }

        menu.setMiniMode = function() {
            mnuItemFontSize = 15;
            mnuSelItemFontSize = 28;
            mnuHovItemFontSize = 17;
            mnuSeparation = 15;
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
                if(items[i].search) {
                    var itmSearch = itm.selectAll(function() { 
                            return this.getElementsByTagName("foreignObject"); 
                        });
                    var itmSearchWrapper = itm.selectAll('rect');
                    itmSearchWrapper.transition()
                        .duration(duration)
                        .attr('x', (mnuOffset.x + xCoords[i].x - offset));
                    itmSearch.transition()
                        .duration(duration)
                        //.style('font-size', xCoords[i].size+'px')
                        .attr('x', (mnuOffset.x + xCoords[i].x - offset) + 'px');
                } else {
                    var itmChildren = itm.selectAll('text');
                    itmChildren.transition()
                        .duration(duration)
                        .attr('x', (mnuOffset.x + xCoords[i].x - offset))
                        .attr('fill', xCoords[i].color)
                        .style('font-size', xCoords[i].size+'px')
                        .each('end', function() { mnuMouseInEnabled = true;});
                }
                /*
                var itmText = itm.selectAll('text');
                itmText.transition()
                    .duration(duration)
                    .attr('x', (mnuOffset.x + xCoords[i].x - offset))
                    .attr('fill', xCoords[i].color)
                    .style('font-size', xCoords[i].size+'px');

                var itmSearch = itm.selectAll(function() { 
                            return this.getElementsByTagName("foreignObject"); 
                        });
                itmSearch.transition()
                    .duration(duration)
                    .attr('x', (mnuOffset.x + xCoords[i].x - offset));
                itmSearch = itm.selectAll('rect');
                itmSearch.transition()
                    .duration(duration)
                    .attr('x', (mnuOffset.x + xCoords[i].x - offset));
                    */
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
                menuG.append('rect')
                        .attr('x', mnuOffset.x)
                        .attr('y', mnuOffset.y-40)
                        .attr('width', 200)
                        .attr('height', 60)
                        .attr('class', 'search-child')
                        .style('fill', 'red');
                menuG.append('foreignObject')
                        .attr('width', 60)
                        .attr('height', 25)
                        .attr('x', mnuOffset.x + 'px')
                        .attr('y', (mnuOffset.y - 15) + 'px')
                        .attr('class', 'search-child')
                        //.style('opacity',  1)
                            .append('xhtml:div')
                                //.attr('class', 'input-group')
                                //.style('display', 'none')
                                .html('<div class="input-group search-group"><input type="text"' +
                                       'title="Search versus." placeholder="search versus...">' + 
                                       '<span class="input-group-btn"><button' +
                                       'type="button">go</button></span></div>');
                                /*.html('<div class="input-group search-group"><input type="text" class="center-block form-control input-sm"' +
                                       'title="Search versus." placeholder="search versus...">' + 
                                       '<span class="input-group-btn"><button class="btn btn-sm btn-primary"' +
                                       'type="button">go</button></span></div>');*/
            } else {
                menuG.append('text')
                        .attr('x', mnuOffset.x)
                        .attr('y', mnuOffset.y + 10)
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


        menu.setupMenuRendering = function(menuItemChangeCB) {

            onMenuItemChanged = menuItemChangeCB

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
                            //.attr('transform', 'translate('+VS.SVGWidth/2+','
                            //                               +(VS.SVGMenuHeight/2+mnuItemFontSize/2)+')')
                            .attr('class', 'vs-menu-g');
            var menuItems = [{'text':'search', 'pos':0, 'search':true}];
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
