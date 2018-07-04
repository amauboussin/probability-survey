
var animation_time = 500;
var width = 1000;
var height = 1200;
var barWidth = 30;

var margin = {top: 30, right: 100, bottom: 20, left: 50,
  left_x_axis: 50, left_y_axis: 100, x_axis: 35,
  hist: 20};

width = width - margin.left - margin.right;
height = height - margin.top - margin.bottom;

var totalWidth = width + margin.left + margin.right;
var totalheight = height + margin.top + margin.bottom;

var data;
var vis;

var layouts = {
  'box_plots': {
    'update': update_box_plots,
    'remove': remove_box_plots
  },
  'histograms': {
    'update': update_histograms,
    'remove': remove_hists
  }
};

var cur_layout = 'box_plots';
var data;
d3.request('/responses_json')
    .mimeType("application/json")
    .response(function(xhr) { return JSON.parse(xhr.responseText); })
    .get(function(d) {
      data = expand_data(d["responses"]);
      data.sort(function (a, b){
        return b.median - a.median;
      });
      vis = create_vis(data);
      layouts[cur_layout].update(vis, data, false);
    });

// go from a dictionary of count to an array of values
function expand_data(counts){
  var expanded = {};
  for (var i in Object.keys(counts)){
    var key = Object.keys(counts)[i];
    expanded[key] = [];
    Object.keys(counts[key]).forEach(function (p){
      var value = parseInt(p);
      for (var n = 0; n < counts[key][p]; n++ ){
        expanded[key].push(value)
      }
    });
  }
  return add_summary_stats(expanded);
}

 function switch_layout(layout){
  layouts[cur_layout].remove(vis);
  cur_layout = layout;
  layouts[cur_layout].update(vis, data, true)
}

function add_summary_stats(data){
  var summary_stats = [];
  for (var [key, sample] of Object.entries(data)) {
    sample = sample.sort(function(a,b){return a-b;});
    if (sample.length > 0) {
      var record = {
        "key": prob_word_lookup[key],
        "data": sample,
        "min": d3.quantile(sample, .1), //d3.min(sample),
        "25th": d3.quantile(sample, .25),
        "median": d3.quantile(sample, .5),
        "75th": d3.quantile(sample, .75),
        "max": d3.quantile(sample, .9), //d3.max(sample),
        "mean": d3.mean(sample),
        "var": d3.variance(sample)
      };
      summary_stats.push(record);
    }
  }
  return summary_stats;
}

function create_vis(data){

  var keys = data.map(d=>prob_word_lookup[d.key]);
  var x_scale = d3.scaleLinear()
    .domain([0, 100])
    .range([margin.left + margin.left_x_axis, width]);

  // Compute an ordinal y scale for the keys
  var y_scale = d3.scalePoint()
    .domain(keys)
    .rangeRound([margin.x_axis, height])
    .padding([0.5]);

  var svg = d3.select("#vis").append("svg")
    .attr("width", totalWidth)
    .attr("height", totalheight)
    .append("g")
    .attr("transform", "translate(" + margin.left_y_axis + "," + margin.top + ")")
    .append("g");

  var x_axis = svg.append("g");
  var y_axis = svg.append("g").attr("transform", "translate(" + margin.left_y_axis + ",0)").append("g");

  var color_scale = d3.scaleOrdinal(d3.schemeCategory20)
    .domain(data.map(d=>d.key));

  var response_lines_dummy = svg.selectAll('.response-line')
    .data([])
    .enter()
    .append("line");

  return {
    'color_scale': color_scale,
    'x_scale': x_scale, 'x_axis': x_axis,
    'y_scale': y_scale, 'y_axis': y_axis,
    'hists': {}, 'kde_plots': {},
    'series_height': height / data.length,
    'response_lines': response_lines_dummy,
    'svg': svg, 'keys': keys
  };

}

function update_histograms(vis_properties, hist_data, animate, n_bins){

  n_bins = n_bins === undefined ? 100 : n_bins;
  var y_span = vis_properties.y_scale.range()[1] - vis_properties.y_scale.range()[0];
  var hist_height = (y_span - hist_data.length * margin.hist) / hist_data.length;

  vis_properties.y_scale.domain(hist_data.map(d=>d.key));


  // todo: delete hist_data not in keys

  var bin_gen = d3.histogram()
    .domain(vis_properties.x_scale.domain())
    .thresholds(vis_properties.x_scale.ticks(n_bins));
  hist_data.forEach(function(row){
    if (!(row.key in vis_properties.hists)){
      vis_properties.hists[row.key] = {
        "y_scale": d3.scaleLinear(),
        "svg": vis_properties.svg.append("g")
      }
    }

    var hist = vis_properties.hists[row.key];

    hist["bins"] = bin_gen(row.data);

    hist["y_scale"]
      .domain([0, d3.max(hist["bins"], d=>d.length)])
      .range([hist_height, 0]);
    var chart_bottom = vis_properties.y_scale(row.key);
    hist.svg
      .attr("transform", "translate(" + 0 + "," + chart_bottom + ")");

    var bar = hist.svg.selectAll(".bar")
      .data(hist["bins"]);
    bar.exit().remove();
    var bar_enter = bar
      .enter().append("g")
      .attr("class", "bar");
    bar_enter.append("rect");
    var bar_update = bar_enter.merge(bar);
    bar_update
      .transition().duration(animate ? animation_time : 0)
      .attr("transform", function(d){
        return "translate(" + vis_properties.x_scale(d.x0) + "," + hist["y_scale"](d.length) + ")";
      });
    bar_update.select("rect")
      .transition().duration(animate ? animation_time : 0)
      .attr("x", 1)
      .attr("y", function(d) {return  - .5 * hist_height ; })
      .attr("width", function(d){
        var width = vis_properties.x_scale(d.x1) - vis_properties.x_scale(d.x0) - 1
        return width > 0 ? width : 0;
      })
      .attr("fill", vis_properties.color_scale(row.key))
      .style("stroke-opacity", 1)
      .style("fill-opacity", 1)
      .attr("height", function(d) {return hist_height - hist.y_scale(d.length); });

  });

  vis_properties.y_axis.transition().duration(animate ? animation_time : 0).call(d3.axisLeft(vis_properties.y_scale));
  vis_properties.x_axis.transition().duration(animate ? animation_time : 0).call(d3.axisBottom(vis_properties.x_scale).tickFormat(d => d + "%"));
  vis_properties = create_response_line(vis_properties)


}

//  https://blog.datasyndrome.com/a-simple-box-plot-in-d3-dot-js-44e7083c9a9e
function update_box_plots(vis_properties, box_data, animate){
  var g = vis_properties.svg;

  vis_properties.y_scale.domain(box_data.map(d=>d.key));

  var spines = g.selectAll(".spine")
    .data(box_data, d=>d.key);
  spines.exit().remove();

  var spine_enter = spines.enter()
    .append("line")
    .attr("class", "spine");

  var spine_update = spines.merge(spine_enter);
  spine_update
    .transition().duration(animate ? animation_time : 0)
    .attr("y1", d=>vis_properties.y_scale(d.key))
    .attr("y2", d=>vis_properties.y_scale(d.key))
    .attr("x1", d=>vis_properties.x_scale(d.min))
    .attr("x2", d=>vis_properties.x_scale(d.max))
    .attr("stroke", "#000")
    .style("stroke-opacity", 1)
    .attr("stroke-width", 1)
    .attr("fill", "none");

  var rects = g.selectAll(".rectangle")
    .data(box_data, d=>d["key"]);
  rects.exit().remove();
  var rects_enter = rects.enter()
    .append("rect")
    .attr("class", "rectangle");
  var rect_update = rects_enter.merge(rects);

  rect_update
    .transition().duration(animate ? animation_time : 0)
    .attr("height", barWidth)
    .attr("width", function(d){return vis_properties.x_scale(d["75th"]) - vis_properties.x_scale(d["25th"]);})
    .attr("x", d=>vis_properties.x_scale(d["25th"]))
    .attr("y", d=>vis_properties.y_scale(d.key) - barWidth/ 2)
    .attr("fill", d=>vis_properties.color_scale(d.key))
    .style("fill-opacity", 1)
    .attr("stroke", "#000")
    .style("stroke-opacity", 1)
    .attr("stroke-width", 1);

  var sidelines = g.selectAll(".sidelines")
    .data(box_data, d=>d.key);

  var sideline_enter = sidelines.enter()
    .append("g")
    .attr("class", "sidelines");

  sideline_enter.append("line")
    .attr("class", "left-line");
  sideline_enter.append("line")
    .attr("class", "right-line");
  sideline_enter.append("line")
    .attr("class", "middle-line");

  var sideline_update = sidelines.merge(sideline_enter);
  sideline_update.select(".left-line")
    .transition().duration(animate ? animation_time : 0)
    .attr("x1", d=>vis_properties.x_scale(d.min))
    .attr("x2", d=>vis_properties.x_scale(d.min))
    .attr("y1", d=>vis_properties.y_scale(d.key) - barWidth/  2)
    .attr("y2", d=>vis_properties.y_scale(d.key) + .5 * barWidth)
    .attr("stroke", "#000")
    .style("stroke-opacity", 1)
    .attr("stroke-width", 1);

  sideline_update.select(".middle-line")
    .transition().duration(animate ? animation_time : 0)
    .attr("x1", d=>vis_properties.x_scale(d.median))
    .attr("x2", d=>vis_properties.x_scale(d.median))
    .attr("y1", d=>vis_properties.y_scale(d.key) - barWidth/  2)
    .attr("y2", d=>vis_properties.y_scale(d.key) + .5 * barWidth)
    .attr("stroke", "#000")
    .style("stroke-opacity", 1)
    .attr("stroke-width", 1);

  sideline_update.select(".right-line")
    .transition().duration(animate ? animation_time : 0)
    .attr("x1", d=>vis_properties.x_scale(d.max))
    .attr("x2", d=>vis_properties.x_scale(d.max))
    .attr("y1", d=>vis_properties.y_scale(d.key) - barWidth/  2)
    .attr("y2", d=>vis_properties.y_scale(d.key) + .5 * barWidth)
    .attr("stroke", "#000")
    .style("stroke-opacity", 1)
    .attr("stroke-width", 1);

  vis_properties.y_axis.transition().duration(animate ? animation_time : 0).call(d3.axisLeft(vis_properties.y_scale));
  vis_properties.x_axis.transition().duration(animate ? animation_time : 0).call(d3.axisBottom(vis_properties.x_scale).tickFormat(d => d + "%"));

  vis_properties = create_response_line(vis_properties);

  return vis_properties;
}

function create_response_line(vis_properties){
    //create lines showing your response
  vis_properties.response_lines.remove()
    vis_properties['response_lines'] = vis_properties.svg
      .selectAll('.response-line')
      .data(response)
      .enter()
      .append('line')
      .style("stroke", "black")
      .style("stroke-width", 3)
      .style("border", "red")
      .style("border-width", 2)
      .attr("x1", d=>vis_properties.x_scale(d[1]))
      .attr("y1", d=>vis_properties.y_scale(d[0]) - barWidth/  2)
      .attr("x2", d=>vis_properties.x_scale(d[1]))
      .attr("y2", d=>vis_properties.y_scale(d[0]) + .5 * barWidth)
}

function hide_line(line){
  line.transition().duration(animation_time)
    .attr("y1", 0)
    .attr("y2", 0)
    .style("stroke-opacity", 0);
}

function hide_rect(rect){
  rect.transition().duration(animation_time)
    .attr("y", 0)
    .style("fill-opacity", 0)
    .style("stroke-opacity", 0);
}


function remove_hists(vis_properties) {
  var g = vis_properties.svg;
  hide_rect(g.selectAll(".bar rect"))
}

function remove_box_plots(vis_properties){
  var g = vis_properties.svg;
  hide_line(g.selectAll(".sidelines line"));
  hide_line(g.selectAll(".spine"));
  hide_rect(g.selectAll(".rectangle"));
}

function create_button_group(div){
  div.selectAll('a').on('click', function(){
    div.selectAll('a').classed('active', false);
    d3.select(this).classed('active', true);
  })
}
create_button_group(d3.select('#format-toggle'));
