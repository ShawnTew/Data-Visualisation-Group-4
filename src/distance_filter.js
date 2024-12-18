const csvUrl = '../data/combined_station_fares_13cities.csv';

(function createFilterUI() {
    const container = document.getElementById("distance-filter");

    // Add filter UI
    container.innerHTML = `
        <h2>Train Station Distance Filter</h2>
        <label>Preferred University:</label>
        <input type="text" id="preferredCity" placeholder="e.g., Delft">
        <br><br>
        <label>Time by Train (Fare Rate):</label>
        <input type="range" id="timeSlider" min="0" max="300" value="150" step="10">
        <span id="timeValue">150</span>
        <br><br>
        <button id="applyFilter">Apply Filter</button>
        <div id="results" style="margin-top: 20px;">
            <h3>Filtered Results</h3>
            <table id="results-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>From Station</th>
                        <th>From City</th>
                        <th>To Station</th>
                        <th>To City</th>
                        <th>Fare Rate</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;

    const preferredCityInput = document.getElementById("preferredCity");
    const timeSlider = document.getElementById("timeSlider");
    const timeValue = document.getElementById("timeValue");
    const applyFilterButton = document.getElementById("applyFilter");
    const resultsTableBody = document.querySelector("#results-table tbody");

    let data = [];

    // Load CSV data using D3
    d3.csv(csvUrl).then(csvData => {
        data = csvData.map(d => ({
            fromStation: d.From_Station,
            fromCity: d.From_City,
            toStation: d.To_Station,
            toCity: d.To_City,
            fareRate: +d.Fare_Rate
        }));
        console.log("CSV Data Loaded:", data);
    });

    // Update slider value display
    timeSlider.oninput = () => {
        timeValue.textContent = timeSlider.value;
    };

    // Apply filter logic
    applyFilterButton.onclick = () => {
        const preferredCity = preferredCityInput.value.trim().toLowerCase();
        const maxFareRate = +timeSlider.value;

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
            resultsTableBody.innerHTML = "<tr><td colspan='5'>No results found</td></tr>";
            return;
        }

        filteredData.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.fromStation}</td>
                <td>${row.fromCity}</td>
                <td>${row.toStation}</td>
                <td>${row.toCity}</td>
                <td>${row.fareRate}</td>
            `;
            resultsTableBody.appendChild(tr);
        });
    }
})();
