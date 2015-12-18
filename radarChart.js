nv.models.radarChart = function() {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var radar = nv.models.radar()
        , tooltip = nv.models.tooltip()
        , legend = nv.models.legend()
        ;

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = null
        , height = null
        , color = nv.utils.defaultColor()
        , noData = 'No Data Available.'
        , showLegend = true
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState', 'renderEnd')
        , state = nv.utils.state()
        , defaultState = null
        ;

    tooltip
        .headerEnabled(false)
        .duration(0);

    //============================================================
    // Chart function
    //------------------------------------------------------------

    var renderWatch = nv.utils.renderWatch(dispatch);

    var stateGetter = function(data) {
        return function(){
            return {
                active: data.map(function(d) { return !d.disabled })
            };
        }
    };

    var stateSetter = function(data) {
        return function(state) {
            if (state.active !== undefined)
                data.forEach(function(series,i) {
                    series.disabled = !state.active[i];
                });
        }
    };

    function chart(selection) {
        renderWatch.reset();
        renderWatch.models(radar);

        selection.each(function (data) {
            var container = d3.select(this);
            nv.utils.initSVG(container);

            var availableWidth = nv.utils.availableWidth(width, container, margin),
                availableHeight = nv.utils.availableHeight(height, container, margin);

            chart.update = function() { container.transition().call(chart); };
            chart.container = this;

            state
                .setter(stateSetter(data), chart.update)
                .getter(stateGetter(data))
                .update();

            // DEPRECATED set state.disableddisabled
            state.disabled = data.map(function (d) { return !!d.disabled; });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }

            // Display No Data message if there's nothing to show.
            if (!data || !data.length) {
                nv.utils.noData(chart, container);
                return chart;
            } else {
                container.selectAll('.nv-noData').remove();
            }

            data.forEach(function (d, i) {
                d.series = i;
                d.color = color(i);
            });

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-radarChart').data(data);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-radarChart').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-radarWrap');
            gEnter.append('g').attr('class', 'nv-radarLegendWrap');

            if (showLegend) {
                legend.width(availableWidth);

                g.select('.nv-radarLegendWrap')
                    .datum(data)
                    .call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight = (height || parseInt(container.style('height')) || 400)
                        - margin.top - margin.bottom;
                }

                wrap.select('.nv-legendWrap')
                    .attr('transform', 'translate(0,' + (-margin.top) +')')
            }

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // Main Chart Component(s)
            radar
                .width(availableWidth)
                .height(availableHeight);

            var radarWrap = g
                .select('.nv-radarWrap')
                .datum(data.filter(function (d, i) { return !data[i].disabled; }));

            d3.transition(radarWrap).call(radar);

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------
            dispatch.on('changeState', function (e) {
                if (typeof e.disabled !== 'undefined' && data.length === e.disabled.length) {
                    data.forEach(function(series, i) {
                        series.disabled = e.disabled[i];
                    });

                    state.disabled = e.disabled;
                }

                chart.update();
            });
        });

        renderWatch.renderEnd('radar chart immediate');
        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------
    legend.dispatch.on('stateChange', function (newState) {
        for (var key in newState)
            state[key] = newState[key];

        dispatch.stateChange(state);
        chart.update();
    });

    radar.dispatch.on('elementMouseover.tooltip', function(evt) {
        evt['series'] = {
            key: evt.data.name,
            value: evt.data,
            color: evt.color
        };

        tooltip.data(evt).hidden(false);
    });

    radar.dispatch.on('elementMouseout.tooltip', function(evt) {
        tooltip.hidden(true);
    });

    radar.dispatch.on('elementMousemove.tooltip', function(evt) {
        tooltip.position({ top: d3.event.pageY, left: d3.event.pageX })();
    });

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.radar = radar;
    chart.options = nv.utils.optionsFunc.bind(chart);
    chart.tooltip = tooltip;
    chart.tooltipText = null;
    chart.legend = legend;

    // use Object get/set functionality to map between vars and chart functions
    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width:          {get: function(){return width;}, set: function(_){width=_;}},
        height:         {get: function(){return height;}, set: function(_){height=_;}},
        noData: { get: function () { return noData; }, set: function (_) { noData = _; } },
        showLegend: { get: function () { return showLegend; }, set: function (_) { showLegend = _; } },
        defaultState:    {get: function(){return defaultState;}, set: function(_){defaultState=_;}},

        // options that require extra logic in the setter
        color: {get: function(){return color;}, set: function(_){
            color = nv.utils.getColor(_);
            radar.color(color);
            legend.color(color);
        }},

        margin: {get: function(){return margin;}, set: function(_){
            margin.top    = _.top    !== undefined ? _.top    : margin.top;
            margin.right  = _.right  !== undefined ? _.right  : margin.right;
            margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
            margin.left   = _.left   !== undefined ? _.left   : margin.left;
        }}
    });

    nv.utils.inheritOptions(chart, radar);
    nv.utils.initOptions(chart);

    return chart;
};
