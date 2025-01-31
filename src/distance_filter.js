const csvUrl = '../data/combined_station_fares_21cities.csv';

(function createFilterUI() {
    const container = document.getElementById("distance-filter");
    // Add filter UI
    container.innerHTML = `
        <h2>Fare Unit filter <span id="fare-rate-toggle" class="toggle-button"><i class="fas fa-info-circle"></i></span></h2> 
        <h3>Filter the cities based on different fare units to show overview of Z-scores<span id="z-score_toggle" class="toggle-button"><i class="fas fa-info-circle"></i></span></h3>
        <p id="fare-rate-toggle" class="toggle-button"></p><p id="fare-rate-explanation" class="hidden-text">Fare unit represents the cost of a train journey, based on the distance traveled. It includes a base fare and an additional charge per kilometer. A higher fare rate usually means a longer travel distance. More detailed information about fare units can be found in <a href="https://www.ns.nl/en/customer-service/payment/consumer-rates.html"> NS Website</a>. The map shows glyphs of cities overall Z-scores.</p>
        <p id="z-score_toggle" class="toggle-button"></p><p id="z-score_explanation" class="hidden-text">Z-score measures how many standard deviations a data point is from the mean of the dataset. It is calculated by subtracting the mean from the data point and dividing by the standard deviation. The Z-score standarises values, allowing for easy comparisons between cities. Negative z-scores indicate the value lies below the mean. Positive z-scores indicate the value lies above the mean. </p>
        <label>Preferred City:</label>
        <input type="text" id="preferredCity" placeholder="e.g., Delft">
        <br><br>
        <label>Distance (Fare Unit):</label>
        <input type="range" id="timeSlider" min="0" max="300" value="150" step="10">
        <span id="timeValue">150</span>
        <br><br>
        <button id="applyFilter" style="padding: 5px; width: 100px; height: 30px; font-size: 14px;">Apply Filter</button>
        <div id="results" style="margin-top: 20px;">
            <div id="fromCity" style="font-weight: bold;"></div>
            <div style="max-height: 500px; overflow-y: auto; border: 1px solid #ccc;">
                <table id="results-table" style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                    <thead>
                        <tr>
                            <th style="width: 50%;">To City</th>
                            <th style="width: 50%;">Fare Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Placeholder rows for static layout -->
                        <tr>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const preferredCityInput = document.getElementById("preferredCity");
    const timeSlider = document.getElementById("timeSlider");
    const timeValue = document.getElementById("timeValue");
    const applyFilterButton = document.getElementById("applyFilter");
    const resultsTableBody = document.querySelector("#results-table tbody");
    const fromCityDiv = document.getElementById("fromCity");

    let data = [];

    // Load CSV data using D3
    d3.csv(csvUrl).then(csvData => {
        data = csvData.map(d => ({
            fromStation: d.From_Station,
            fromCity: d.From_City,
            toStation: d.To_Station,
            toCity: d.To_City,
            fareRate: +d.Fare_Rate,
            fromLat: +d.From_Lat,
            fromLon: +d.From_Lon,
            toLat: +d.To_Lat,
            toLon: +d.To_Lon
        }));
        console.log("CSV Data Loaded:", data);
    });

    // Update slider value display
    timeSlider.oninput = () => {
        timeValue.textContent = timeSlider.value;
    };

    // Apply filter logic
// Apply filter logic
    applyFilterButton.onclick = () => {
        const preferredCity = preferredCityInput.value.trim().toLowerCase();
        const maxFareRate = +timeSlider.value;

        // Check if the entered city exists in the dataset
        const cityExists = data.some(row => row.fromCity.toLowerCase() === preferredCity);

        if (!cityExists && preferredCity) {
            fromCityDiv.textContent = "Sorry, the city you searched is not in the potential list.";
            resultsTableBody.innerHTML = ""; // Clear table
            return;
        }

        // Filter data based on fromCity only
        const filteredData = data.filter(row => {
            const cityMatch = !preferredCity || row.fromCity.toLowerCase() === preferredCity;
            return cityMatch && row.fareRate <= maxFareRate;
        });

        updateTable(filteredData);
    };


    // Update table with filtered data
    function updateTable(filteredData) {
        resultsTableBody.innerHTML = ""; // Clear existing rows

        if (filteredData.length === 0) {
            // Add placeholder rows for no results
            for (let i = 0; i < 7; i++) {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>-</td>
                    <td>-</td>
                `;
                resultsTableBody.appendChild(tr);
            }
            fromCityDiv.textContent = "";
            return;
        }

        // Sort data by fareRate in ascending order
        const sortedData = filteredData.sort((a, b) => a.fareRate - b.fareRate);

        // Display the "From City" above the table
        fromCityDiv.textContent = `From City: ${sortedData[0].fromCity}`;

        // Populate rows
        sortedData.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.toCity}</td>
                <td>${row.fareRate}</td>
            `;
            resultsTableBody.appendChild(tr);
        });

        // Add placeholder rows to maintain static height
        const extraRows = Math.max(0, 7 - sortedData.length);
        for (let i = 0; i < extraRows; i++) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>-</td>
                <td>-</td>
            `;
            resultsTableBody.appendChild(tr);
        }
    }
})();