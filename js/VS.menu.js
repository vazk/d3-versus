(function() {
    function menu() {
        var mnuMenuMain;
        var mnuDivMenuSVG = d3.select('#div_menu_svg');
        var SVGMenu;
 
        var items = [];
        var currentItem = 0;

        var mnuItemFontSize = 20;
        var mnuSelItemFontSize = 40;
        var mnuSeparation = 45;

        function onMenuMouseIn() {/*
            var i = d3.select(this);
            i.select('text')
                .transition()
                .duration(150)
                .attr('x', 0)
                .attr('y', 0)
                .style('font-family','Nobile')
                .style('font-size', '30px');*/
        }

        function onMenuMouseOut() {/*
            var i = d3.select(this);
            i.select('text')
                .transition()
                .duration(150)
                .attr('x', 0)
                .attr('y', 0)
                .style('font-family', 'Nobile')
                .style('font-size', '20px');*/
        }

        menu.onMenuMouseClick = function() {
            var i = d3.select(this);
            currentItem = this.attributes.item_index.value;
            var r = menu.updateMenu();
            console.log('offset: ', r);
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
                var fontSize;
                if(i == currentItem) {
                    fontSize = mnuSelItemFontSize;
                    tw = VS.computeTextWidth(item.text, fontSize + 'px Nobile');
                    offset = x + tw/2;
                } else {
                    fontSize = mnuItemFontSize;
                    tw = VS.computeTextWidth(item.text, fontSize + 'px Nobile');
                }
                //var inst = d3.select(this);
                var itm = mnuMenuMain.select('.item-'+i).selectAll('text');
                itm.transition()
                    .duration(350)
                    .attr('x', x)
                    .style('font-size', fontSize+'px');
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
                    .style("filter", "url(#drop-shadow)")
                    .text(item.text)
                    .attr('class', 'vs-menup-item-text');
            items.push(item);
            menu.updateMenu();
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

        menu.setupMenuRendering = function() {
            SVGMenu = mnuDivMenuSVG.append('svg')
                        .style('background','white');

            layBorderPath = SVGMenu.append('rect')
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
