nv.models.packedBubble = function() {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = 500
        , height = 500
        , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
        , color = nv.utils.defaultColor()
        , valueFormat = function(d) { return d.value; }
        , title = false
        , padding = 1.5
        , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout', 'elementMousemove', 'renderEnd')
        ;


    //============================================================
    // chart function
    //------------------------------------------------------------

    var renderWatch = nv.utils.renderWatch(dispatch);

    function chart(selection) {
        renderWatch.reset();

        selection.each(function(data) {
            var availableWidth = width - margin.left - margin.right
                , availableHeight = height - margin.top - margin.bottom
                , container = d3.select(this)
                ;

            nv.utils.initSVG(container);

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('.nv-wrap.nv-packedBubble').data([data]);
            var wrapEnter = wrap.enter().append('g').attr('class','nvd3 nv-wrap nv-packedBubble nv-chart-' + id);
            var gEnter = wrapEnter.append('g');
            gEnter.append('g').attr('class', 'nv-packedBubbleNodes');
            var g_bubbles = wrap.selectAll('.nv-packedBubbleNodes');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            var root = d3.layout.pack()
                .sort(null)
                .size([availableWidth, availableHeight])
                .padding(padding);

            // pack nodes from data, hide children
            var nodes = g_bubbles.selectAll(".node")
                .data(root.nodes({ children: data }).filter(function(d) { return d.depth > 0; }))
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

            var g_nodes = nodes.enter().append("g")
                    .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
                    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

            // draw circles
            g_nodes.append("circle")
                .style("fill", function(d) { return color(d.index); })
                .filter(function(d) { return !d.children; }).style({ "visibility": "hidden", "opacity": 0 });

            // set/update radius getter to support updating data (responsive width)
            var circles = nodes.selectAll('circle')
                .attr("r", function(d) { return d.r; });

            // hook up bubble events
            g_nodes.on('mouseover', function(d, i) {
                d3.select(this).classed('hover', true);

                dispatch.elementMouseover({
                    data: d,
                    index: i,
                    color: d3.select(this).select('circle').style("fill")
                });
            })
            .on('mouseout', function(d, i) {
                d3.select(this).classed('hover', false);

                dispatch.elementMouseout({
                    data: d,
                    index: i,
                    color: d3.select(this).select('circle').style("fill")
                });
            })
            .on('mousemove', function(d, i) {
                dispatch.elementMousemove({
                    data: d,
                    index: i,
                    color: d3.select(this).select('circle').style("fill")
                });
            })
            .on('click', function(d, i) {
                var element = this;

                if (d.children) {
                    var node = d3.select(this);
                    var expanded = node.classed('expanded');

                    node.classed('expanded', !expanded)
                        .transition()
                        .duration(500)
                        .style("opacity", expanded ? 1 : 0.3);

                    d3.selectAll('.node circle')
                        .filter(function(d2) { return d2.parent.name == d.name; })
                        .style("visibility", "visible")
                        .transition()
                        .duration(500)
                        .style("opacity", expanded ? 0 : 1)
                        .each('end', function() { d3.select(this).style('visibility', !expanded ? 'visible' : 'hidden'); });
                }

                dispatch.elementClick({
                    data: d,
                    index: i,
                    color: d3.select(this).select('circle').style("fill"),
                    event: d3.event,
                    element: element
                });

                d3.event.stopPropagation();
            })
            .on('dblclick', function(d, i) {
                dispatch.elementDblClick({
                    data: d,
                    index: i,
                    color: d3.select(this).select('circle').style("fill")
                });

                d3.event.stopPropagation();
            });

            //
            container.on('click', function(d, i) {
                dispatch.chartClick({
                    data: d,
                    index: i,
                    pos: d3.event,
                    id: id
                });
            });
        });

        renderWatch.renderEnd('packedBubble immediate');
        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width:      {get: function(){return width;}, set: function(_){width=_;}},
        height:     {get: function(){return height;}, set: function(_){height=_;}},
        title:      {get: function(){return title;}, set: function(_){title=_;}},
        padding:      {get: function(){return padding;}, set: function(_){padding=_;}},
        valueFormat:    {get: function(){return valueFormat;}, set: function(_){valueFormat=_;}},
        id:         {get: function(){return id;}, set: function(_){id=_;}},


        // options that require extra logic in the setter
        margin: {get: function(){return margin;}, set: function(_){
            margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
            margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
            margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
            margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
        }},

        color: {get: function(){return color;}, set: function(_){
            color=nv.utils.getColor(_);
        }}
    });

    nv.utils.initOptions(chart);
    return chart;
};