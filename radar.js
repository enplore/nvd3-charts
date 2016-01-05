nv.models.radar = function() {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = 500
        , height = 500
        , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
        , color = nv.utils.getColor(['#88ac67', '#f78f20', '#db4e4e'])
        , valueFormat = d3.format(',.2f')
        , margin = { top: 15, bottom: 30, left: 100, right: 120 }
        , title = false
        , min = 0
        , max = 100
        , radius = 5
        , factor = 1
        , factorLegend = 1
        , levels = 10
        , opacityArea = 0.5
        , nodeRadius = 4
        , dispatch = d3.dispatch('chartClick', 'renderEnd', 'elementMouseover', 'elementMouseout', 'elementMousemove')
        ;


    //============================================================
    // chart function
    //------------------------------------------------------------

    var renderWatch = nv.utils.renderWatch(dispatch);

    function chart(selection) {
        renderWatch.reset();

        selection.each(function (data) {
            var availableWidth = width - margin.left - margin.right
                , availableHeight = height - margin.top - margin.bottom
                , container = d3.select(this)
                ;

            if (max == null) {
                data.forEach(function (d) {
                    var m = d3.max(d.values, function (v) { return v.value; });

                    if (m > max)
                        max = m;
                });
            }

            if (min == null) {
                min = -max;
            }

            radius = factor * (Math.min(availableWidth, availableHeight) / 2);

            data.forEach(function (d, i) {
                d.color = color(d.series);
            });

            nv.utils.initSVG(container);

            var step = (max - min) / levels;
            var adjustedMax = max + step;
            var range = d3.range(min, adjustedMax, step);
            var allAxis = data[0].values.map(function (d) { return d.axis; });
            var radians = 2 * Math.PI;

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('.nv-wrap.nv-radar').data([data]);
            var wrapEnter = wrap.enter().append('g').attr('class','nvd3 nv-wrap nv-radar nv-chart-' + id);
            var gEnter = wrapEnter.append('g');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // level lines (circle segments)
            gEnter.append('g').attr('class', 'nv-radarLevels');
            var g_levels = wrap.select('.nv-radarLevels');

            var levelFactors = range.map(function (i, j) {
                return factor * radius * (j / (range.length - 1));
            });

            var levelGroups = g_levels
                .selectAll('.level-group')
                .data(levelFactors);

            levelGroups
                .enter()
                .append('g')
                .attr('class', 'level-group');

            levelGroups.exit().remove();

            var levelLines = levelGroups
                .selectAll('.level')
                .data(function (levelFactor) {
                    return allAxis.map(function (i) { return levelFactor; });
                });

            levelLines
                .enter()
                .append('line')
                .attr('class', 'level')
                .style("stroke", "grey")
                .style("stroke-opacity", "0.75")
                .style("stroke-width", "0.3px");

            levelLines.exit().remove();

            levelGroups.selectAll('.level')
                .attr('x1', function (levelFactor, i) { return levelFactor * (1 - factor * Math.sin(i * radians / allAxis.length)); })
                .attr("y1", function (levelFactor, i) { return levelFactor * (1 - factor * Math.cos(i * radians / allAxis.length)); })
                .attr("x2", function (levelFactor, i) { return levelFactor * (1 - factor * Math.sin((i + 1) * radians / allAxis.length)); })
                .attr("y2", function (levelFactor, i) { return levelFactor * (1 - factor * Math.cos((i + 1) * radians / allAxis.length)); })
                .attr("transform", function (levelFactor) { return "translate(" + (availableWidth / 2 - levelFactor) + ", " + (availableHeight / 2 - levelFactor) + ")"; });

            // level values
            gEnter.append('g').attr('class', 'nv-radarLevelValues');
            var g_labelValues = wrap.select('.nv-radarLevelValues');

            var labelValues = g_labelValues
                .selectAll('.level-value')
                .data(levelFactors);

            labelValues
                .enter()
                .append('text')
                .attr('class', 'level-value')
                .style('fill', '#000000')
                .text(function (d, i) { return range[i]; });

            labelValues.exit().remove();

            g_labelValues
                .selectAll('.level-value')
                .attr('transform', function (levelFactor, i) { return 'translate(' + (5 + availableWidth / 2) + ',' + (availableHeight / 2 - levelFactor) + ')'; });

            // axis lines
            gEnter.append('g').attr('class', 'nv-radarAxisLines');
            var g_axisLines = wrap.select('.nv-radarAxisLines');

            var axisLines = g_axisLines
                .selectAll('.axis-line')
                .data(allAxis);

            axisLines
                .enter()
                .append('line')
                .attr('class', 'axis-line')
                .style("stroke", "grey")
                .style("stroke-width", "1px");

            axisLines.exit().remove();

            g_axisLines.selectAll('.axis-line')
                .attr("x1", availableWidth / 2)
                .attr("y1", availableHeight / 2)
                .attr("x2", function (d, i) { return availableWidth / 2 + radius * factor * Math.sin(i * radians / allAxis.length); })
                .attr("y2", function (d, i) { return availableHeight / 2 - radius * factor * Math.cos(i * radians / allAxis.length); });

            // axis labels
            gEnter.append('g').attr('class', 'nv-radarAxisLabels');
            var g_axisLabels = wrap.select('.nv-radarAxisLabels');

            var axisLabels = g_axisLabels
                .selectAll('.axis-label')
                .data(allAxis);

            axisLabels
                .enter()
                .append('text')
                .attr('class', 'axis-label')
                .text(function (d) { return d; })
                .attr("dy", "1.5em")
                .attr("transform", function(d, i){return "translate(0, -10)"})
                .attr("text-anchor", "middle");

            axisLabels.exit().remove();

            g_axisLabels.selectAll('.axis-label')
                .attr("x", function (d, i) { return availableWidth / 2 + radius * Math.sin(i * radians / allAxis.length) + (this.getBBox().width / 1.5) * Math.sin(i * radians / allAxis.length); })
                .attr("y", function (d, i) { return availableHeight / 2 - radius * Math.cos(i * radians / allAxis.length) - 20 * Math.cos(i * radians / allAxis.length); });

            // series
            gEnter.append('g').attr('class', 'nv-radarSeries');
            var g_series = wrap.select('.nv-radarSeries');

            var series = g_series
                .selectAll('.series')
                .data(data);

            series
                .enter()
                .append('g')
                .attr('class', 'series');

            series.exit().remove();

            function getSeriesNodeData(d) {
                return d.values.map(function (v, i) {
                    var delta = (v.value - min) / (adjustedMax - min);

                    return {
                        x: availableWidth / 2 + radius * delta * factor * Math.sin(i * radians / allAxis.length),
                        y: availableHeight / 2 - radius * delta * factor * Math.cos(i * radians / allAxis.length),
                        series: d.series,
                        color: d.color,
                        value: v.value,
                        key: v.axis,
                        seriesName: d.key,
                        link: v.link || null
                    };
                });
            };

            // series areas
            var seriesAreas = series.selectAll('.series-area')
                .data(function (d) { return [getSeriesNodeData(d)]; });

            seriesAreas
                .enter()
                .append('polygon')
                .attr('class', function (d) { return 'series-area series-area-' + d[0].series; })
                .style('fill-opacity', opacityArea)
                .style('stroke-width', '2px')
                .on('mouseover', function (d){
                    var active = this;

                    series.selectAll(".series-area")
                        .filter(function () { return this != active; })
                        .transition(200)
                        .style("fill-opacity", 0.1);

                    d3.select(active)
                        .transition(200)
                        .style("fill-opacity", .7);
                })
                .on('mouseout', function(){
                    series.selectAll(".series-area")
                        .transition(200)
                        .style("fill-opacity", opacityArea);
                });

            seriesAreas.exit().remove();

            series.selectAll('.series-area')
                .attr('points', function (d) {
                    return d.map(function (o) { return o.x + ',' + o.y; }).join(' ');
                })
                .style('stroke', function (d) { return d[0].color; })
                .style('fill', function (d) { return d[0].color; });

            // series points
            var seriesPoints = series.selectAll('.series-point')
                .data(getSeriesNodeData);

            seriesPoints
                .enter()
                .append('circle')
                .attr('class', 'series-point')
                .attr('cursor', function (d) { return d.link ? 'pointer' : 'default'; })
                .attr('r', nodeRadius)
                .on('mouseover', function (d) {
                    d3.select(this).classed('hover', true);

                    dispatch.elementMouseover({
                        data: d
                    });
                })
                .on('mouseout', function(d) {
                    d3.select(this).classed('hover', false);

                    dispatch.elementMouseout({
                        data: d
                    });
                })
                .on('mousemove', function(d) {
                    dispatch.elementMousemove({
                        data: d
                    });
                })
                .on('click', function(d, i) {
                    dispatch.chartClick({
                        data: d,
                        index: i,
                        pos: d3.event,
                        id: id
                    });
                });

            seriesPoints.exit().remove();

            series.selectAll('.series-point')
                .attr('cx', function (d) { return d.x; })
                .attr('cy', function (d) { return d.y; })
                .style('fill', function (d) { return d.color; });
        });

        renderWatch.renderEnd('radar immediate');
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
        valueFormat:    {get: function(){return valueFormat;}, set: function(_){valueFormat=_;}},
        id:         {get: function(){return id;}, set: function(_){id=_;}},
        min:         {get: function(){return min;}, set: function(_){min=_;}},
        max: { get: function () { return max; }, set: function (_) { max = _; } },
        radius: { get: function () { return radius; }, set: function (_) { radius = _; } },
        factor: { get: function () { return factor; }, set: function (_) { factor = _; } },
        factorLegend: { get: function () { return factorLegend; }, set: function (_) { factorLegend = _; } },
        levels: { get: function () { return levels; }, set: function (_) { levels = _; } },
        opacityArea: { get: function () { return opacityArea; }, set: function (_) { opacityArea = _; } },

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