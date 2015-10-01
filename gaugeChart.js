nv.models.gaugeChart = function() {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var gauge = nv.models.gauge();

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = null
        , height = null
        , color = nv.utils.defaultColor()
        , noData = null
        , dispatch = d3.dispatch('renderEnd')
        ;

    //============================================================
    // Chart function
    //------------------------------------------------------------

    var renderWatch = nv.utils.renderWatch(dispatch);

    function chart(selection) {
        renderWatch.reset();
        renderWatch.models(gauge);

        selection.each(function(data) {
            var container = d3.select(this);
            nv.utils.initSVG(container);

            var availableWidth = nv.utils.availableWidth(width, container, margin),
                availableHeight = nv.utils.availableHeight(height, container, margin);

            chart.update = function() { container.transition().call(chart); };
            chart.container = this;

            // Display No Data message if there's nothing to show.
            if (!data || !data.length) {
                nv.utils.noData(chart, container);
                return chart;
            } else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-gaugeChart').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-gaugeChart').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-gaugeWrap');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // Main Chart Component(s)
            gauge.width(availableWidth).height(availableHeight);
            var gaugeWrap = g.select('.nv-gaugeWrap').datum([data]);
            d3.transition(gaugeWrap).call(gauge);
        });

        renderWatch.renderEnd('gauge chart immediate');
        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.gauge = gauge;
    chart.options = nv.utils.optionsFunc.bind(chart);

    // use Object get/set functionality to map between vars and chart functions
    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width:      {get: function(){return width;}, set: function(_){width=_;}},
        height:     {get: function(){return height;}, set: function(_){height=_;}},
        noData:         {get: function(){return noData;}, set: function(_){noData=_;}},

        // options that require extra logic in the setter
        color: {get: function(){return color;}, set: function(_){
            color = _;
            gauge.color(color);
        }},
        margin: {get: function(){return margin;}, set: function(_){
            margin.top    = _.top    !== undefined ? _.top    : margin.top;
            margin.right  = _.right  !== undefined ? _.right  : margin.right;
            margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
            margin.left   = _.left   !== undefined ? _.left   : margin.left;
        }}
    });

    nv.utils.inheritOptions(chart, gauge);
    nv.utils.initOptions(chart);

    return chart;
};
