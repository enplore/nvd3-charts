# nvd3-charts
Custom charts for nvd3.

## Gauge chart
Simple gauge, wants a single value as data.

```
nv.addGraph(function() {
    var chart = nv.models.gaugeChart()
        .title('Gauge')
        .min(0)
        .max(1);

    d3.select('#gauge-chart-1 svg')
        .datum([Math.random()])
        .call(chart);

    nv.utils.windowResize(chart.update);
    return chart;
});
```

## Packed bubble chart
Based on http://bl.ocks.org/mbostock/4063269, wants an array of objects. Responsive.

```
nv.addGraph(function() {
    var chart = nv.models.packedBubbleChart()
        .title('Bubbles')
        .valueFormat(function(d) { return d.index.toFixed(2); })
        .color(d3.scale.linear()
              .domain([0, 0.25, 0.5])
              .range(['#88ac67', "#f78f20", "#db4e4e"]));

    d3.select('#bubble-chart svg')
        .datum(bubbleData())
        .call(chart);

    nv.utils.windowResize(chart.update);
    return chart;
});
```
