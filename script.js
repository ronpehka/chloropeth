const width = 960;
const height = 600;
const svg = d3.select('#map');

const tooltip = d3.select('#tooltip');

// Load data
const educationDataUrl = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json';
const countyDataUrl = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

Promise.all([d3.json(countyDataUrl), d3.json(educationDataUrl)])
  .then(([countyData, educationData]) => {
    const education = new Map(educationData.map(d => [d.fips, d]));

    const path = d3.geoPath();

    // Color scale
    const colorScale = d3.scaleQuantize()
      .domain([d3.min(educationData, d => d.bachelorsOrHigher), d3.max(educationData, d => d.bachelorsOrHigher)])
      .range(d3.schemeBlues[9]);

    // Draw counties
    svg.append("g")
      .selectAll("path")
      .data(topojson.feature(countyData, countyData.objects.counties).features)
      .enter().append("path")
      .attr("class", "county")
      .attr("data-fips", d => d.id)
      .attr("data-education", d => education.get(d.id) ? education.get(d.id).bachelorsOrHigher : 0)
      .attr("fill", d => education.get(d.id) ? colorScale(education.get(d.id).bachelorsOrHigher) : '#ccc')
      .attr("d", path)
      .on("mouseover", (event, d) => {
        const edu = education.get(d.id);
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(`${edu.area_name}, ${edu.state}: ${edu.bachelorsOrHigher}%`)
          .attr('data-education', edu.bachelorsOrHigher)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(200).style('opacity', 0);
      });

    // Create Legend
    const legendWidth = 300;
    const legendHeight = 10;

    const legendX = d3.scaleLinear()
      .domain([colorScale.domain()[0], colorScale.domain()[1]])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendX)
      .tickSize(13)
      .tickValues(colorScale.range().map(d => colorScale.invertExtent(d)[0]))
      .tickFormat(d => Math.round(d) + "%");

    const legend = svg.append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${width - legendWidth - 50}, ${height - 40})`);

    legend.selectAll("rect")
      .data(colorScale.range().map(d => colorScale.invertExtent(d)))
      .enter().append("rect")
      .attr("x", d => legendX(d[0]))
      .attr("width", d => legendX(d[1]) - legendX(d[0]))
      .attr("height", legendHeight)
      .attr("fill", d => colorScale(d[0]));

    legend.append("g")
      .call(legendAxis);
  })
  .catch(error => console.error('Error loading or processing data:', error));