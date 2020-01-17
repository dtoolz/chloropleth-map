const container = d3.select("div.container");

container
  .append("h1")
  .attr("id", "title")
  .text("US Educational Attainment");

container
  .append("h3")
  .attr("id", "description")
  .text("Bachelor's degree or higher 2010-2014");

const tooltip = container.append("div").attr("id", "tooltip");

tooltip.append("p").attr("class", "area");

tooltip.append("p").attr("class", "education");

const margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20
};
// define and append an SVG element
const width = 800 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

const svgContainer = container
  .append("svg")
  .attr(
    "viewBox",
    `0 0 ${width + margin.left + margin.right} ${height +
      margin.top +
      margin.bottom}`
  );

// group element nested inside the SVG, to make the plot
const svgCanvas = svgContainer
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// object for the values of the legend
// showing the percentages and the matching color for the fill of the rectangle elements
const legendValues = {
  percentage: [3, 12, 21, 30, 39, 48, 57, 66],
  color: [
    "rgb(224, 225, 245)",
    "rgb(193, 192, 233)",
    "rgb(155, 156, 217)",
    "rgb(117, 116, 196)",
    "rgb(81, 65, 171)",
    "rgb(35, 42, 139)",
    "rgb(20, 0, 109)",
    "rgb(1, 0, 68)"
  ],
  height: 15,
  width: 30
};

// creating and appendding a legend at the top of the SVG
const legend = svgCanvas
  .append("g")
  .attr("id", "legend")
  .attr(
    "transform",
    `translate(${width -
      legendValues.percentage.length * legendValues.width}, 0)`
  );

legend
  .selectAll("rect")
  .data(legendValues.percentage)
  .enter()
  .append("rect")
  .attr("width", legendValues.width)
  .attr("height", legendValues.height)
  .attr("x", (d, i) => i * legendValues.width)
  .attr("y", 0)
  .attr("fill", (d, i) => legendValues.color[i]);

legend
  .selectAll("text")
  .data(legendValues.percentage)
  .enter()
  .append("text")
  .attr("x", (d, i) => i * legendValues.width)
  .attr("y", legendValues.height * 2)
  .style("font-size", "0.6rem")
  .text(d => `${d}%`);

const colorScale = d3.scaleQuantize().range(legendValues.color);

const URL_DATA =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";
const URL_SVG =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";

fetch(URL_DATA)
  .then(response => response.json())
  .then(json => joinData(json));

function joinData(data) {
  fetch(URL_SVG)
    .then(response => response.json())
    .then(json => {
      for (let i = 0; i < data.length; i++) {
        let fips = data[i].fips;

        let geometries = json.objects.counties.geometries;
        for (let j = 0; j < geometries.length; j++) {
          let id = geometries[j].id;

          if (fips === id) {
            geometries[j] = Object.assign({}, geometries[j], data[i]);

            break;
          }
        }
      }

      return json;
    })

    .then(json => drawMap(json));
}

function drawMap(data) {
  colorScale.domain([
    0,
    d3.max(data.objects.counties.geometries, d => d.bachelorsOrHigher)
  ]);

  let feature = topojson.feature(data, data.objects.counties);

  const path = d3.geoPath();

  svgCanvas
    .selectAll("path")
    .data(feature.features)
    .enter()
    .append("path")

    .on("mouseenter", (d, i) => {
      tooltip
        .style("opacity", 1)
        .attr("data-fips", data.objects.counties.geometries[i].fips)
        .attr(
          "data-education",
          data.objects.counties.geometries[i].bachelorsOrHigher
        )

        .style("left", `${d3.event.layerX + 5}px`)

        .style("top", `${d3.event.layerY + 5}px`);

      tooltip
        .select("p.area")
        .text(
          () =>
            `${data.objects.counties.geometries[i].area_name}, ${data.objects.counties.geometries[i].state}`
        );
      tooltip
        .select("p.education")
        .text(
          () => `${data.objects.counties.geometries[i].bachelorsOrHigher}%`
        );
    })

    .on("mouseout", () => tooltip.style("opacity", 0))
    .attr("d", path)
    .attr("transform", `scale(0.82, 0.62)`)
    .attr("class", "county")

    .attr("data-fips", (d, i) => data.objects.counties.geometries[i].fips)
    .attr("data-state", (d, i) => data.objects.counties.geometries[i].state)
    .attr("data-area", (d, i) => data.objects.counties.geometries[i].area_name)
    .attr(
      "data-education",
      (d, i) => data.objects.counties.geometries[i].bachelorsOrHigher
    )

    .attr("fill", (d, i) =>
      colorScale(data.objects.counties.geometries[i].bachelorsOrHigher)
    );
}
