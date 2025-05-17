document.addEventListener("DOMContentLoaded", () => {
  const stationInput = document.getElementById("station-input");
  const fetchEtaButton = document.getElementById("fetch-eta-button");
  const etaResultsArea = document.getElementById("eta-results-area");
  const statusMessages = document.getElementById("status-messages");
  const themeCheckbox = document.getElementById("theme-checkbox");
  const themeLabelText = document.getElementById("theme-label-text");
  const dataTimestampElem = document.getElementById("data-timestamp");

  document.getElementById("current-year").textContent =
    new Date().getFullYear();
// In app.js
async function fetchEtaForLine(line, sta) {
  const apiUrl = `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${line}&sta=${sta}&lang=EN`;
  console.log("Attempting to fetch:", apiUrl); // For debugging
  try {
    const response = await fetch(apiUrl);
    console.log(`Response for ${line}-${sta}:`, response); // Log the raw response

    if (!response.ok) {
      // Log more details if the response is not OK
      const errorText = await response.text(); // Try to get error text from API
      console.error(
        `API request failed for ${apiUrl} with status: ${response.status}. Response text: ${errorText}`
      );
      throw new Error(
        `API request failed: ${response.status}. Message: ${errorText}`
      );
    }
    const jsonData = await response.json();
    console.log(`Successfully fetched and parsed JSON for ${line}-${sta}`);
    return jsonData;
  } catch (error) {
    console.error(`Error in fetchEtaForLine for ${line}-${sta} (${apiUrl}):`, error);
    // Optionally, update the UI to show an error for this specific line/station
    // For now, just returning null is handled by the calling function.
    // You could also call showStatusMessage here for individual line failures if desired.
    return null;
  }
}

// Modify the main fetch handler to better report issues
fetchEtaButton.addEventListener("click", async () => {
  const stationQuery = stationInput.value.trim();
  if (!stationQuery) {
    showStatusMessage("Please enter a station name or code.", "error");
    return;
  }

  showStatusMessage("Fetching ETAs...", "loading");
  etaResultsArea.innerHTML = '<div class="loading-spinner"></div>';
  dataTimestampElem.textContent = "";

  const stationCode = getStationCodeByName(stationQuery);
  const linesToQuery = stationCode ? STATION_LINE_MAP[stationCode] : null;

  if (!linesToQuery || linesToQuery.length === 0) {
    showStatusMessage(
      `Station "${stationQuery}" not found or no lines associated. Please check the MTR map. Input: "${stationInput.value}", Resolved Code: "${stationCode}"`,
      "error",
      7000
    );
    etaResultsArea.innerHTML = "";
    return;
  }

  console.log(`Querying for station code: ${stationCode}, lines:`, linesToQuery);

  const allPromises = linesToQuery.map((lineInfo) =>
    fetchEtaForLine(lineInfo.line, lineInfo.sta)
  );

  try {
    const results = await Promise.all(allPromises);
    const successfulResults = [];
    let apiFetchErrorCount = 0;

    results.forEach((result, index) => {
      if (result && result.status !== "0") { // Check for API's own status flag too
        successfulResults.push({
          lineCode: linesToQuery[index].line,
          staCode: linesToQuery[index].sta,
          data: result,
        });
      } else {
        apiFetchErrorCount++;
        console.warn(`No valid data or API error for ${linesToQuery[index].line}-${linesToQuery[index].sta}. API Response:`, result);
      }
    });

    if (successfulResults.length > 0) {
      displayResults(successfulResults, STATION_CODES[stationCode] || stationQuery);
      if (apiFetchErrorCount > 0) {
        showStatusMessage(
          `Displayed available data. ${apiFetchErrorCount} line(s) failed to load or had no service.`,
          "info",
          7000
        );
      } else {
        if (statusMessages.classList.contains("status-loading")) {
          statusMessages.classList.remove("status-visible");
        }
      }
    } else {
      showStatusMessage(
        `Could not fetch any valid ETA data for "${STATION_CODES[stationCode] || stationQuery}". The MTR API might be unavailable, the station has no current services, or the input was invalid.`,
        "error",
        10000
      );
      etaResultsArea.innerHTML = "";
    }
  } catch (error) {
    // This catch is for errors in Promise.all itself or unhandled promise rejections
    console.error("Critical error processing ETA requests:", error);
    showStatusMessage(
      "An unexpected critical error occurred while fetching data. Check console.",
      "error"
    );
    etaResultsArea.innerHTML = "";
  }
});

  // --- THEME SWITCHER ---
  function applyTheme(isDark) {
    if (isDark) {
      document.body.classList.add("dark-mode");
      themeLabelText.textContent = "Dark Mode";
      themeCheckbox.checked = true;
    } else {
      document.body.classList.remove("dark-mode");
      themeLabelText.textContent = "Light Mode";
      themeCheckbox.checked = false;
    }
  }

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    applyTheme(savedTheme === "dark");
  } else {
    // Prefer dark if user system prefers dark
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    applyTheme(prefersDark);
  }

  themeCheckbox.addEventListener("change", () => {
    const isDark = themeCheckbox.checked;
    applyTheme(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  // --- MTR DATA ---
  // (Partial list for brevity, expand as needed from the PDF)
  const MTR_LINES = {
    AEL: "Airport Express",
    TCL: "Tung Chung Line",
    TML: "Tuen Ma Line",
    TKL: "Tseung Kwan O Line",
    EAL: "East Rail Line",
    SIL: "South Island Line",
    TWL: "Tsuen Wan Line",
    ISL: "Island Line",
    KTL: "Kwun Tong Line",
    DRL: "Disneyland Resort Line",
  };

  const STATION_CODES = {
    // AEL
    HOK: "Hong Kong", KOW: "Kowloon", TSY: "Tsing Yi", AIR: "Airport", AWE: "AsiaWorld Expo",
    // TCL
    OLY: "Olympic", NAC: "Nam Cheong", LAK: "Lai King", SUN: "Sunny Bay", TUC: "Tung Chung",
    // TML (Partial)
    WKS: "Wu Kai Sha", TUM: "Tuen Mun", MEF: "Mei Foo", HUH: "Hung Hom", TAW: "Tai Wai", ETS: "East Tsim Sha Tsui", AUS: "Austin", KSR: "Kam Sheung Road",
    // TKL (Partial)
    NOP: "North Point", QUB: "Quarry Bay", YAT: "Yau Tong", TIK: "Tiu Keng Leng", TKO: "Tseung Kwan O", LHP: "LOHAS Park", POA: "Po Lam", HAH: "Hang Hau",
    // EAL (Partial)
    ADM: "Admiralty", EXC: "Exhibition Centre", MKK: "Mong Kok East", KOT: "Kowloon Tong", SHT: "Sha Tin", FOT: "Fo Tan", RAC: "Racecourse", UNI: "University", TAP: "Tai Po Market", TWO: "Tai Wo", FAN: "Fanling", SHS: "Sheung Shui", LOW: "Lo Wu", LMC: "Lok Ma Chau",
    // SIL
    OCP: "Ocean Park", WCH: "Wong Chuk Hang", LET: "Lei Tung", SOH: "South Horizons",
    // TWL (Partial)
    CEN: "Central", TST: "Tsim Sha Tsui", JOR: "Jordan", YMT: "Yau Ma Tei", MOK: "Mong Kok", PRE: "Prince Edward", SSP: "Sham Shui Po", CSW: "Cheung Sha Wan", LCK: "Lai Chi Kok", KWF: "Kwai Fong", KWH: "Kwai Hing", TWH: "Tai Wo Hau", TSW: "Tsuen Wan",
    // ISL (Partial)
    KET: "Kennedy Town", HKU: "HKU", SYP: "Sai Ying Pun", SHW: "Sheung Wan", WAC: "Wan Chai", CAB: "Causeway Bay", TIH: "Tin Hau", FOH: "Fortress Hill", TAK: "Tai Koo", SWH: "Sai Wan Ho", SKW: "Shau Kei Wan", HFC: "Heng Fa Chuen", CHW: "Chai Wan",
    // KTL (Partial)
    WHA: "Whampoa", HOM: "Ho Man Tin", SKM: "Shek Kip Mei", LOF: "Lok Fu", WTS: "Wong Tai Sin", DIH: "Diamond Hill", CHH: "Choi Hung", KOB: "Kowloon Bay", NTK: "Ngau Tau Kok", KWT: "Kwun Tong", LAT: "Lam Tin",
    // DRL
    DIS: "Disneyland Resort",
    // Common stations not listed as primary for a line but are interchanges
    ADM: "Admiralty", CEN: "Central", HOK: "Hong Kong", KOW: "Kowloon", MOK: "Mong Kok", PRE: "Prince Edward", NAC: "Nam Cheong", MEF: "Mei Foo", TSY: "Tsing Yi", LAK: "Lai King", TAW: "Tai Wai", HUH: "Hung Hom", HOM: "Ho Man Tin", YMT: "Yau Ma Tei", NOP: "North Point", QUB: "Quarry Bay", YAT: "Yau Tong", TIK: "Tiu Keng Leng", DIH: "Diamond Hill", SUN: "Sunny Bay",
  };


  // Station to Lines mapping (critical for knowing which API calls to make)
  // Format: STATION_CODE: [{ line: "LINE_CODE", sta: "STATION_CODE_FOR_LINE_API" }]
  // Note: sta code is usually the same, but good to be explicit.
  const STATION_LINE_MAP = {
    HOK: [{ line: "AEL", sta: "HOK" }, { line: "TCL", sta: "HOK" }],
    KOW: [{ line: "AEL", sta: "KOW" }, { line: "TCL", sta: "KOW" }],
    TSY: [{ line: "AEL", sta: "TSY" }, { line: "TCL", sta: "TSY" }],
    AIR: [{ line: "AEL", sta: "AIR" }],
    AWE: [{ line: "AEL", sta: "AWE" }],
    OLY: [{ line: "TCL", sta: "OLY" }],
    NAC: [{ line: "TCL", sta: "NAC" }, { line: "TML", sta: "NAC" }],
    LAK: [{ line: "TCL", sta: "LAK" }, { line: "TWL", sta: "LAK" }],
    SUN: [{ line: "TCL", sta: "SUN" }, { line: "DRL", sta: "SUN" }],
    TUC: [{ line: "TCL", sta: "TUC" }],
    // TML Stations
    TUM: [{ line: "TML", sta: "TUM"}], SIH: [{ line: "TML", sta: "SIH"}], TIS: [{ line: "TML", sta: "TIS"}], LOP: [{ line: "TML", sta: "LOP"}], YUL: [{ line: "TML", sta: "YUL"}], KSR: [{ line: "TML", sta: "KSR"}], TWW: [{ line: "TML", sta: "TWW"}], MEF: [{ line: "TML", sta: "MEF"}, { line: "TWL", sta: "MEF"}], AUS: [{ line: "TML", sta: "AUS"}], ETS: [{ line: "TML", sta: "ETS"}], HUH: [{ line: "TML", sta: "HUH"}, { line: "EAL", sta: "HUH"}], HOM: [{ line: "TML", sta: "HOM"}, { line: "KTL", sta: "HOM"}], TKW: [{ line: "TML", sta: "TKW"}], SUW: [{ line: "TML", sta: "SUW"}], KAT: [{ line: "TML", sta: "KAT"}], DIH: [{ line: "TML", sta: "DIH"}, { line: "KTL", sta: "DIH"}], HIK: [{ line: "TML", sta: "HIK"}], TAW: [{ line: "TML", sta: "TAW"}, { line: "EAL", sta: "TAW"}], CKT: [{ line: "TML", sta: "CKT"}], STW: [{ line: "TML", sta: "STW"}], CIO: [{ line: "TML", sta: "CIO"}], SHM: [{ line: "TML", sta: "SHM"}], TSH: [{ line: "TML", sta: "TSH"}], HEO: [{ line: "TML", sta: "HEO"}], MOS: [{ line: "TML", sta: "MOS"}], WKS: [{ line: "TML", sta: "WKS"}],
    // TKL Stations
    NOP: [{ line: "TKL", sta: "NOP" }, { line: "ISL", sta: "NOP" }],
    QUB: [{ line: "TKL", sta: "QUB" }, { line: "ISL", sta: "QUB" }],
    YAT: [{ line: "TKL", sta: "YAT" }, { line: "KTL", sta: "YAT" }],
    TIK: [{ line: "TKL", sta: "TIK" }, { line: "KTL", sta: "TIK" }],
    TKO: [{ line: "TKL", sta: "TKO" }], LHP: [{ line: "TKL", sta: "LHP" }], HAH: [{ line: "TKL", sta: "HAH" }], POA: [{ line: "TKL", sta: "POA" }],
    // EAL Stations
    ADM: [{ line: "EAL", sta: "ADM" }, { line: "SIL", sta: "ADM" }, { line: "TWL", sta: "ADM" }, { line: "ISL", sta: "ADM" }],
    EXC: [{ line: "EAL", sta: "EXC" }],
    MKK: [{ line: "EAL", sta: "MKK" }], // Mong Kok East
    KOT: [{ line: "EAL", sta: "KOT" }, { line: "KTL", sta: "KOT" }],
    SHT: [{ line: "EAL", sta: "SHT" }], FOT: [{ line: "EAL", sta: "FOT" }], RAC: [{ line: "EAL", sta: "RAC" }], UNI: [{ line: "EAL", sta: "UNI" }], TAP: [{ line: "EAL", sta: "TAP" }], TWO: [{ line: "EAL", sta: "TWO" }], FAN: [{ line: "EAL", sta: "FAN" }], SHS: [{ line: "EAL", sta: "SHS" }], LOW: [{ line: "EAL", sta: "LOW" }], LMC: [{ line: "EAL", sta: "LMC" }],
    // SIL Stations
    OCP: [{ line: "SIL", sta: "OCP" }], WCH: [{ line: "SIL", sta: "WCH" }], LET: [{ line: "SIL", sta: "LET" }], SOH: [{ line: "SIL", sta: "SOH" }],
    // TWL Stations
    CEN: [{ line: "TWL", sta: "CEN" }, { line: "ISL", sta: "CEN" }], // Note: AEL/TCL Hong Kong is HOK
    TST: [{ line: "TWL", sta: "TST" }], JOR: [{ line: "TWL", sta: "JOR" }], YMT: [{ line: "TWL", sta: "YMT" }, { line: "KTL", sta: "YMT" }], MOK: [{ line: "TWL", sta: "MOK" }, { line: "KTL", sta: "MOK" }], PRE: [{ line: "TWL", sta: "PRE" }, { line: "KTL", sta: "PRE" }], SSP: [{ line: "TWL", sta: "SSP" }], CSW: [{ line: "TWL", sta: "CSW" }], LCK: [{ line: "TWL", sta: "LCK" }], KWF: [{ line: "TWL", sta: "KWF" }], KWH: [{ line: "TWL", sta: "KWH" }], TWH: [{ line: "TWL", sta: "TWH" }], TSW: [{ line: "TWL", sta: "TSW" }],
    // ISL Stations
    KET: [{ line: "ISL", sta: "KET" }], HKU: [{ line: "ISL", sta: "HKU" }], SYP: [{ line: "ISL", sta: "SYP" }], SHW: [{ line: "ISL", sta: "SHW" }], WAC: [{ line: "ISL", sta: "WAC" }], CAB: [{ line: "ISL", sta: "CAB" }], TIH: [{ line: "ISL", sta: "TIH" }], FOH: [{ line: "ISL", sta: "FOH" }], TAK: [{ line: "ISL", sta: "TAK" }], SWH: [{ line: "ISL", sta: "SWH" }], SKW: [{ line: "ISL", sta: "SKW" }], HFC: [{ line: "ISL", sta: "HFC" }], CHW: [{ line: "ISL", sta: "CHW" }],
    // KTL Stations
    WHA: [{ line: "KTL", sta: "WHA" }], SKM: [{ line: "KTL", sta: "SKM" }], LOF: [{ line: "KTL", sta: "LOF" }], WTS: [{ line: "KTL", sta: "WTS" }], CHH: [{ line: "KTL", sta: "CHH" }], KOB: [{ line: "KTL", sta: "KOB" }], NTK: [{ line: "KTL", sta: "NTK" }], KWT: [{ line: "KTL", sta: "KWT" }], LAT: [{ line: "KTL", sta: "LAT" }],
    // DRL Stations
    DIS: [{ line: "DRL", sta: "DIS" }],
  };


  function showStatusMessage(message, type = "info", duration = 5000) {
    statusMessages.textContent = message;
    statusMessages.className = `status-${type} status-visible`; // Add status-visible
    if (type !== "loading") {
      setTimeout(() => {
        statusMessages.classList.remove("status-visible");
      }, duration);
    }
  }

  function getStationCodeByName(name) {
    const normalizedName = name.trim().toLowerCase();
    for (const code in STATION_CODES) {
      if (STATION_CODES[code].toLowerCase() === normalizedName) {
        return code;
      }
    }
    // If not found by name, assume it might be a code itself
    if (STATION_CODES[name.trim().toUpperCase()]) {
        return name.trim().toUpperCase();
    }
    return null;
  }


  async function fetchEtaForLine(line, sta) {
    const apiUrl = `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${line}&sta=${sta}&lang=EN`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ETA for ${line}-${sta}:`, error);
      return null; // Return null to indicate failure for this specific line
    }
  }

  function formatTime(dateTimeStr) {
    if (!dateTimeStr) return "N/A";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (e) {
      return "N/A";
    }
  }

  function getRouteTagClass(lineCode) {
    return `route-tag-${lineCode}` || "route-tag-DEFAULT";
  }

  function displayResults(allLinesData, requestedStationName) {
    etaResultsArea.innerHTML = ""; // Clear previous results
    let hasResults = false;
    let earliestSysTime = null;

    allLinesData.sort((a,b) => MTR_LINES[a.lineCode].localeCompare(MTR_LINES[b.lineCode])); // Sort by line name

    allLinesData.forEach(({ lineCode, staCode, data }) => {
      if (!data || data.status === "0" || !data.data) {
        // showStatusMessage(`No data or error for ${MTR_LINES[lineCode]} at ${STATION_CODES[staCode] || staCode}.`, "error");
        console.warn(`No data or error for ${MTR_LINES[lineCode]} at ${STATION_CODES[staCode] || staCode}. Message: ${data?.message}`);
        return;
      }

      if (data.sys_time) {
        const currentSysDate = new Date(data.sys_time.replace(/-/g, "/")); // Ensure correct parsing
        if (!earliestSysTime || currentSysDate < earliestSysTime) {
            earliestSysTime = currentSysDate;
        }
      }


      const lineData = data.data;
      const directions = []; // To store UP, DOWN, or line-specific data

      if (lineData[`${lineCode}-${staCode}`]) {
        // For lines like AEL, DRL where data is keyed like "AEL-HOK"
        directions.push({
          name: MTR_LINES[lineCode] || lineCode, // Use full line name if available
          trains: lineData[`${lineCode}-${staCode}`],
        });
      } else {
        // For lines with UP/DOWN directions
        if (lineData.UP) {
          directions.push({ name: "UP", trains: lineData.UP });
        }
        if (lineData.DOWN) {
          directions.push({ name: "DOWN", trains: lineData.DOWN });
        }
      }

      if (directions.length === 0 || directions.every(d => d.trains.length === 0)) {
        console.warn(`No train services found for ${MTR_LINES[lineCode]} at ${STATION_CODES[staCode] || staCode} in response.`);
        return; // Skip if no trains for this line/station combo
      }
      hasResults = true;


      const tableContainer = document.createElement("div");
      tableContainer.className = "eta-table-container";

      const tableTitle = document.createElement("h3");
      tableTitle.textContent = `${MTR_LINES[lineCode] || lineCode} @ ${STATION_CODES[staCode] || staCode}`;
      tableContainer.appendChild(tableTitle);

      const table = document.createElement("table");
      table.className = "eta-results";
      table.innerHTML = `
                <thead>
                    <tr>
                        <th>Line</th>
                        <th>Direction / Dest.</th>
                        <th>Plat.</th>
                        <th>ETA (mins)</th>
                        <th>Sched. Time</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
      const tbody = table.querySelector("tbody");

      directions.forEach((dir) => {
        if (dir.trains && dir.trains.length > 0) {
          dir.trains.slice(0, 4).forEach((train, index) => { // Max 4 trains
            const row = tbody.insertRow();
            // Cell 1: Line Tag
            const cellLine = row.insertCell();
            const lineTag = document.createElement("span");
            lineTag.className = `route-tag ${getRouteTagClass(lineCode)}`;
            lineTag.textContent = lineCode;
            cellLine.appendChild(lineTag);

            // Cell 2: Destination
            const cellDest = row.insertCell();
            const destName = STATION_CODES[train.dest] || train.dest;
            cellDest.textContent = `${dir.name === "UP" || dir.name === "DOWN" ? dir.name + " to " : ""}${destName}`;

            // Cell 3: Platform
            const cellPlat = row.insertCell();
            cellPlat.textContent = train.plat || "N/A";

            // Cell 4: TTNT (Time To Next Train)
            const cellTtnt = row.insertCell();
            cellTtnt.textContent = train.ttnt !== undefined ? `${train.ttnt}` : "N/A";
            if (train.ttnt !== undefined && train.ttnt !== "" && parseInt(train.ttnt) <=1) {
                 cellTtnt.innerHTML = `<strong style="color: var(--primary-color);">Arr</strong>`;
            } else if (train.ttnt === "0") {
                 cellTtnt.innerHTML = `<strong style="color: var(--primary-color);">Dep</strong>`;
            }


            // Cell 5: Scheduled Time
            const cellTime = row.insertCell();
            cellTime.textContent = formatTime(train.time);
            if (train.isdelay === "Y" && train.ttnt === undefined) { // Only mark as scheduled if no live ttnt
                cellTime.classList.add("scheduled-eta");
                cellTime.innerHTML += ' <span class="remark-symbol">*</span>';
            }


            // Cell 6: Remarks (Delay, EAL Route/Timetype)
            const cellRemarks = row.insertCell();
            let remarksText = [];
            if (train.isdelay === "Y") remarksText.push("Delayed");
            if (train.route === "RAC" && lineCode === "EAL") remarksText.push("Via Racecourse");
            if (train.timetype === "A" && lineCode === "EAL") remarksText.push("Arrival");
            if (train.timetype === "D" && lineCode === "EAL") remarksText.push("Departure");
            cellRemarks.textContent = remarksText.join(", ") || "–";

            if (index < dir.trains.length -1 && index < 3 && dir.trains.length > 1) {
                // Add separator row if not the last train in this direction's list
                // and not the absolute last train to be shown (max 4)
            }
          });
        } else if (dir.name) { // No trains for this direction, but direction exists
            const row = tbody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 6;
            cell.textContent = `No upcoming trains for ${dir.name} direction.`;
            cell.classList.add("remark-only-row");
        }
      });
      tableContainer.appendChild(table);
      etaResultsArea.appendChild(tableContainer);
    });

    if (earliestSysTime) {
        dataTimestampElem.textContent = `Data as of: ${earliestSysTime.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium' })}`;
    } else {
        dataTimestampElem.textContent = "";
    }


    if (!hasResults) {
        showStatusMessage(`No train services found for "${requestedStationName}" or station not recognized. Please check spelling or try a station code.`, "error");
    } else {
        // Clear loading/success message if results are shown
        if (statusMessages.classList.contains("status-loading") || statusMessages.classList.contains("status-info")) {
             statusMessages.classList.remove("status-visible");
        }
    }
  }


  fetchEtaButton.addEventListener("click", async () => {
    const stationQuery = stationInput.value.trim();
    if (!stationQuery) {
      showStatusMessage("Please enter a station name or code.", "error");
      return;
    }

    showStatusMessage("Fetching ETAs...", "loading");
    etaResultsArea.innerHTML = '<div class="loading-spinner"></div>'; // Show spinner
    dataTimestampElem.textContent = "";


    const stationCode = getStationCodeByName(stationQuery);
    const linesToQuery = stationCode ? STATION_LINE_MAP[stationCode] : null;

    if (!linesToQuery || linesToQuery.length === 0) {
      showStatusMessage(
        `Station "${stationQuery}" not found or no lines associated. Please check the MTR map for valid station names/codes.`,
        "error"
      );
      etaResultsArea.innerHTML = ""; // Clear spinner
      return;
    }

    const allPromises = linesToQuery.map((lineInfo) =>
      fetchEtaForLine(lineInfo.line, lineInfo.sta)
    );

    try {
      const results = await Promise.all(allPromises);
      const successfulResults = [];
      let apiFetchError = false;

      results.forEach((result, index) => {
        if (result) {
          successfulResults.push({
            lineCode: linesToQuery[index].line,
            staCode: linesToQuery[index].sta,
            data: result,
          });
        } else {
            apiFetchError = true; // Mark if any individual fetch failed
        }
      });

      if (successfulResults.length > 0) {
        displayResults(successfulResults, STATION_CODES[stationCode] || stationQuery);
        if (apiFetchError) {
            showStatusMessage("Displayed available data. Some lines might have failed to load.", "info", 7000);
        } else {
            // Clear loading message if all successful
            if (statusMessages.classList.contains("status-loading")) {
                statusMessages.classList.remove("status-visible");
            }
        }
      } else {
        showStatusMessage(
          `Could not fetch any ETA data for "${STATION_CODES[stationCode] || stationQuery}". The MTR API might be temporarily unavailable or there are no services.`,
          "error",
          7000
        );
        etaResultsArea.innerHTML = ""; // Clear spinner
      }
    } catch (error) {
      // This catch is more for Promise.all failing, which it shouldn't if individual fetches handle errors.
      console.error("Error processing ETA requests:", error);
      showStatusMessage("An unexpected error occurred while fetching data.", "error");
      etaResultsArea.innerHTML = ""; // Clear spinner
    }
  });

  // Allow Enter key to trigger fetch
  stationInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission if it were in a form
      fetchEtaButton.click();
    }
  });
});
