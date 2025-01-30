// Global variable to store rankings
let globalRankings = [];

// Load CSV file
d3.csv("../data/combine new cities  - Output.csv").then(data => {
    const zScoreColumns = Object.keys(data[0]).filter(col => /z-score/i.test(col));

    // Extract the city names
    const cities = data.map(d => d["NAME"]);

    // Manually map z-score columns to user-friendly names
    const attributeData = {
        "No. of Amenities": [],
        "No. of Registered Crime": [],
        "Percentage of Green Areas": [],
        "No. of Households": [],
        "Additional Housing Cost": [],
        "Net Housing Cost": [],
        "Total Housing Cost": [],
        "Housing Ratio": [],
        "No. of Students": []
    };

    // PreparING data for each z-score column with new attribute names (TO MATCH THE LEGEND)
    zScoreColumns.forEach((col, index) => {
        const newLabel = Object.keys(attributeData)[index];
        attributeData[newLabel] = data.map((d, i) => ({
            value: +d[col],   // Z-score value
            city: cities[i]   // City name
        })).filter(d => !isNaN(d.value)); // Remove rows with NaN values
    });

    // Store slider values globally
    const sliderValues = {};
    Object.keys(attributeData).forEach(col => sliderValues[col] = 0);

    // Container for widgets
    const container = d3.select("#widgets");

    // Create a section to display the ranked cities
    const outputSection = d3.select("body")
        .append("div")
        .attr("id", "filtered-output")
        .style("display", "none"); // Hide the local ranking list

    // Section for global rankings
    const globalRankSection = d3.select("body")
        .append("div")
        .attr("id", "global-output")
        .style("display", "none");
    
    // Function to calculate and display global rankings
    function calculateGlobalRankings() {
        const cityScores = cities.map(city => ({
            city: city,
            totalDistance: Object.entries(attributeData).reduce((sum, [label, values]) => {
                const sliderValue = sliderValues[label];
                const cityValue = values.find(d => d.city === city)?.value;
                return sum + (cityValue !== undefined ? Math.abs(cityValue - sliderValue) : 0);
            }, 0)
        }));

        // Sort cities by totalDistance
        cityScores.sort((a, b) => a.totalDistance - b.totalDistance);

        // Update global rankings
        globalRankings = cityScores; // Save rankings globally

        // Display the global rankings
        globalRankSection.html(`<h3>Global Ranked Cities</h3>` +
            cityScores.map(d => `City: ${d.city}, Total Distance: ${d.totalDistance.toFixed(2)}`).join("<br>")
        );
    }

    // Expose global rankings via a function
    window.getGlobalRankings = function() {
        return globalRankings;
    };

    // Create widgets for each z-score column
    Object.entries(attributeData).forEach(([label, values]) => {
        const widget = container.append("div").attr("class", "widget");

        // Add label using the manually set names
        widget.append("div").attr("class", "label").text(label);

        // Create SVG for histogram
        const svg = widget.append("svg")
            .attr("class", "histogram")
            .attr("width", 300)
            .attr("height", 50);

        // X Scale: one bin per row (city)
        const xScale = d3.scaleBand()
            .domain(values.map(d => d.city)) // One bin per city
            .range([0, 300])
            .padding(0.1);

        // Y Scale: Include both positive and negative values
        const yScale = d3.scaleLinear()
            .domain([d3.min(values, d => d.value), d3.max(values, d => d.value)]) // Accounting for negatives
            .range([50, 0]);

        // Draw bars: one bar per city
        const bars = svg.selectAll("rect")
            .data(values)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.city))
            .attr("y", d => d.value >= 0 ? yScale(d.value) : yScale(0)) // Align to zero baseline
            .attr("width", xScale.bandwidth())
            .attr("height", d => Math.abs(yScale(0) - yScale(d.value))) // Height from zero baseline
            .attr("fill", "grey");

        // Tooltip for details on hover
        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("background", "white")
            .style("color", "black")
            .style("padding", "5px")
            .style("border", "1px solid black")
            .style("border-radius", "5px")
            .style("display", "none");

        bars.on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`City: ${d.city}<br>Z-Score: ${d.value.toFixed(2)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
            d3.select(event.currentTarget).attr("fill", "orange");
        })
        .on("mouseout", (event) => {
            tooltip.style("display", "none");
            d3.select(event.currentTarget).attr("fill", "grey");
        });

        // Add slider for filtering
        const slider = widget.append("input")
            .attr("type", "range")
            .attr("class", "slider")
            .attr("min", d3.min(values, d => d.value))
            .attr("max", d3.max(values, d => d.value))
            .attr("step", 0.01)
            .on("input", function () {
                const threshold = +this.value;

                // Update slider value
                sliderValues[label] = threshold;

                // Recalculate rankings
                calculateGlobalRankings();

                // Highlight only the closest bar
                const rankedData = values
                    .map(d => ({
                        ...d,
                        distance: Math.abs(d.value - threshold)
                    }))
                    .sort((a, b) => a.distance - b.distance);

                const closestCity = rankedData[0].city;
                bars.attr("fill", d => (d.city === closestCity) ? "orange" : "grey");
            });

        // Slider value display
        const valueDisplay = widget.append("span")
            .style("margin-left", "10px")
            .style("font-size", "14px")
            .text(slider.node().value);

        // Initialize the slider output
        slider.dispatch("input");
    });

});
