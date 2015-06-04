(function() {
    function menu() {
        var mnuMenuMain;
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
            var r = menu.updateMenu();
            mnuMenuMain.transition()
                .duration(350)
                .attr('transform', 'translate('+(VS.SVGWidth/2-r.offset)+','
                                               +(VS.SVGMenuHeight/2+mnuItemFontSize/2)+')');
        }

        menu.updateMenu = function() {
            var x = 0;
            var offset = 0;
            for(var i = 0; i < items.length; ++i) {
                var item = items[i];
                var duration = 250;
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
                var itm = mnuMenuMain.select('.item-'+i).selectAll('text');
                itm.transition()
                    .duration(duration)
                    .attr('x', (x + itemOffset))
                    .attr('fill', itemColor)
                    .style('font-size', itemFontSize+'px');
                x += (tw + mnuSeparation);
            }
            return {'offset': offset};
        }

        menu.addMenuItem = function(item) {
            var menuG = mnuMenuMain
                            .append('g')
                              .attr('class', 'vs-menu-item item-'+items.length)
                              .attr('item_index', items.length)
                              .on("click", menu.onMenuMouseClick)
                              .on("mouseenter", onMenuMouseIn)
                              .on("mouseleave", onMenuMouseOut);

            menuG.append('text')
                    .attr('y', 0)
                    .style('font-family','Nobile')
                    .style('font-weight', 'bold')
                    .style("filter", "url(#drop-shadow-text)")
                    .text(item.text)
                    .attr('cursor', 'pointer')
                    .attr('class', 'vs-menup-item-text');
            items.push(item);
            /*menuG.append("foreignObject")
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
                          .attr("height", 50);*/
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

            mnuMenuMain = SVGMenu.attr('width',  VS.SVGWidth)
                         .attr('height', VS.SVGMenuHeight)
                         .append('g')
                            .attr('transform', 'translate('+VS.SVGWidth/2+','
                                                           +(VS.SVGMenuHeight/2+mnuItemFontSize/2)+')')
                            .attr('class', 'vs-menu-g');
            var menuItems = [
                        {'text':'local', 'pos':1, 'form':null},
                        {'text':'favourites', 'pos':2, 'form':null},
                        {'text':'world', 'pos':0, 'form':null},
                        {'text':'search', 'pos':3, 'form':null}];
            for(it in menuItems) {
                menu.addMenuItem(menuItems[it]);
                var r = menu.updateMenu();

                mnuMenuMain.transition()
                    .duration(350)
                    .attr('transform', 'translate('+(VS.SVGWidth/2-r.offset)+','
                                                   +(VS.SVGMenuHeight/2+mnuItemFontSize/2)+')');
            }
/*                  
            var menuData = mnuMenuMain.selectAll('.vs-menu-item')
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

    if (typeof module === "object" && module.exports) module.exports = menu;
    else (VS || (VS = {})).menu = menu;
})();
