// app.js - Full code with refactored displayResults

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
  const MTR_LINES = {
    AEL: "Airport Express", TCL: "Tung Chung Line", TML: "Tuen Ma Line",
    TKL: "Tseung Kwan O Line", EAL: "East Rail Line", SIL: "South Island Line",
    TWL: "Tsuen Wan Line", ISL: "Island Line", KTL: "Kwun Tong Line",
    DRL: "Disneyland Resort Line",
  };
  const STATION_CODES = { /* ... (same as before, ensure it's complete) ... */
    HOK: "Hong Kong", KOW: "Kowloon", TSY: "Tsing Yi", AIR: "Airport", AWE: "AsiaWorld Expo",
    OLY: "Olympic", NAC: "Nam Cheong", LAK: "Lai King", SUN: "Sunny Bay", TUC: "Tung Chung",
    WKS: "Wu Kai Sha", TUM: "Tuen Mun", MEF: "Mei Foo", HUH: "Hung Hom", TAW: "Tai Wai", ETS: "East Tsim Sha Tsui", AUS: "Austin", KSR: "Kam Sheung Road", SIH: "Siu Hong", TIS: "Tin Shui Wai", LOP: "Long Ping", YUL: "Yuen Long", TWW: "Tsuen Wan West", TKW: "To Kwa Wan", SUW: "Sung Wong Toi", KAT: "Kai Tak", DIH: "Diamond Hill", HIK: "Hin Keng", CKT: "Che Kung Temple", STW: "Sha Tin Wai", CIO: "City One", SHM: "Shek Mun", TSH: "Tai Shui Hang", HEO: "Heng On", MOS: "Ma On Shan",
    NOP: "North Point", QUB: "Quarry Bay", YAT: "Yau Tong", TIK: "Tiu Keng Leng", TKO: "Tseung Kwan O", LHP: "LOHAS Park", POA: "Po Lam", HAH: "Hang Hau",
    ADM: "Admiralty", EXC: "Exhibition Centre", MKK: "Mong Kok East", KOT: "Kowloon Tong", SHT: "Sha Tin", FOT: "Fo Tan", RAC: "Racecourse", UNI: "University", TAP: "Tai Po Market", TWO: "Tai Wo", FAN: "Fanling", SHS: "Sheung Shui", LOW: "Lo Wu", LMC: "Lok Ma Chau",
    OCP: "Ocean Park", WCH: "Wong Chuk Hang", LET: "Lei Tung", SOH: "South Horizons",
    CEN: "Central", TST: "Tsim Sha Tsui", JOR: "Jordan", YMT: "Yau Ma Tei", MOK: "Mong Kok", PRE: "Prince Edward", SSP: "Sham Shui Po", CSW: "Cheung Sha Wan", LCK: "Lai Chi Kok", KWF: "Kwai Fong", KWH: "Kwai Hing", TWH: "Tai Wo Hau", TSW: "Tsuen Wan",
    KET: "Kennedy Town", HKU: "HKU", SYP: "Sai Ying Pun", SHW: "Sheung Wan", WAC: "Wan Chai", CAB: "Causeway Bay", TIH: "Tin Hau", FOH: "Fortress Hill", TAK: "Tai Koo", SWH: "Sai Wan Ho", SKW: "Shau Kei Wan", HFC: "Heng Fa Chuen", CHW: "Chai Wan",
    WHA: "Whampoa", HOM: "Ho Man Tin", SKM: "Shek Kip Mei", LOF: "Lok Fu", WTS: "Wong Tai Sin", CHH: "Choi Hung", KOB: "Kowloon Bay", NTK: "Ngau Tau Kok", KWT: "Kwun Tong", LAT: "Lam Tin",
    DIS: "Disneyland Resort",
  };
  const STATION_LINE_MAP = { /* ... (same as before, ensure it's complete) ... */
    HOK: [{ line: "AEL", sta: "HOK" }, { line: "TCL", sta: "HOK" }], KOW: [{ line: "AEL", sta: "KOW" }, { line: "TCL", sta: "KOW" }], TSY: [{ line: "AEL", sta: "TSY" }, { line: "TCL", sta: "TSY" }], AIR: [{ line: "AEL", sta: "AIR" }], AWE: [{ line: "AEL", sta: "AWE" }],
    OLY: [{ line: "TCL", sta: "OLY" }], NAC: [{ line: "TCL", sta: "NAC" }, { line: "TML", sta: "NAC" }], LAK: [{ line: "TCL", sta: "LAK" }, { line: "TWL", sta: "LAK" }], SUN: [{ line: "TCL", sta: "SUN" }, { line: "DRL", sta: "SUN" }], TUC: [{ line: "TCL", sta: "TUC" }],
    TUM: [{ line: "TML", sta: "TUM"}], SIH: [{ line: "TML", sta: "SIH"}], TIS: [{ line: "TML", sta: "TIS"}], LOP: [{ line: "TML", sta: "LOP"}], YUL: [{ line: "TML", sta: "YUL"}], KSR: [{ line: "TML", sta: "KSR"}], TWW: [{ line: "TML", sta: "TWW"}], MEF: [{ line: "TML", sta: "MEF"}, { line: "TWL", sta: "MEF"}], AUS: [{ line: "TML", sta: "AUS"}], ETS: [{ line: "TML", sta: "ETS"}], HUH: [{ line: "TML", sta: "HUH"}, { line: "EAL", sta: "HUH"}], HOM: [{ line: "TML", sta: "HOM"}, { line: "KTL", sta: "HOM"}], TKW: [{ line: "TML", sta: "TKW"}], SUW: [{ line: "TML", sta: "SUW"}], KAT: [{ line: "TML", sta: "KAT"}], DIH: [{ line: "TML", sta: "DIH"}, { line: "KTL", sta: "DIH"}], HIK: [{ line: "TML", sta: "HIK"}], TAW: [{ line: "TML", sta: "TAW"}, { line: "EAL", sta: "TAW"}], CKT: [{ line: "TML", sta: "CKT"}], STW: [{ line: "TML", sta: "STW"}], CIO: [{ line: "TML", sta: "CIO"}], SHM: [{ line: "TML", sta: "SHM"}], TSH: [{ line: "TML", sta: "TSH"}], HEO: [{ line: "TML", sta: "HEO"}], MOS: [{ line: "TML", sta: "MOS"}], WKS: [{ line: "TML", sta: "WKS"}],
    NOP: [{ line: "TKL", sta: "NOP" }, { line: "ISL", sta: "NOP" }], QUB: [{ line: "TKL", sta: "QUB" }, { line: "ISL", sta: "QUB" }], YAT: [{ line: "TKL", sta: "YAT" }, { line: "KTL", sta: "YAT" }], TIK: [{ line: "TKL", sta: "TIK" }, { line: "KTL", sta: "TIK" }], TKO: [{ line: "TKL", sta: "TKO" }], LHP: [{ line: "TKL", sta: "LHP" }], HAH: [{ line: "TKL", sta: "HAH" }], POA: [{ line: "TKL", sta: "POA" }],
    ADM: [{ line: "EAL", sta: "ADM" }, { line: "SIL", sta: "ADM" }, { line: "TWL", sta: "ADM" }, { line: "ISL", sta: "ADM" }], EXC: [{ line: "EAL", sta: "EXC" }], MKK: [{ line: "EAL", sta: "MKK" }], KOT: [{ line: "EAL", sta: "KOT" }, { line: "KTL", sta: "KOT" }], SHT: [{ line: "EAL", sta: "SHT" }], FOT: [{ line: "EAL", sta: "FOT" }], RAC: [{ line: "EAL", sta: "RAC" }], UNI: [{ line: "EAL", sta: "UNI" }], TAP: [{ line: "EAL", sta: "TAP" }], TWO: [{ line: "EAL", sta: "TWO" }], FAN: [{ line: "EAL", sta: "FAN" }], SHS: [{ line: "EAL", sta: "SHS" }], LOW: [{ line: "EAL", sta: "LOW" }], LMC: [{ line: "EAL", sta: "LMC" }],
    OCP: [{ line: "SIL", sta: "OCP" }], WCH: [{ line: "SIL", sta: "WCH" }], LET: [{ line: "SIL", sta: "LET" }], SOH: [{ line: "SIL", sta: "SOH" }],
    CEN: [{ line: "TWL", sta: "CEN" }, { line: "ISL", sta: "CEN" }], TST: [{ line: "TWL", sta: "TST" }], JOR: [{ line: "TWL", sta: "JOR" }], YMT: [{ line: "TWL", sta: "YMT" }, { line: "KTL", sta: "YMT" }], MOK: [{ line: "TWL", sta: "MOK" }, { line: "KTL", sta: "MOK" }], PRE: [{ line: "TWL", sta: "PRE" }, { line: "KTL", sta: "PRE" }], SSP: [{ line: "TWL", sta: "SSP" }], CSW: [{ line: "TWL", sta: "CSW" }], LCK: [{ line: "TWL", sta: "LCK" }], KWF: [{ line: "TWL", sta: "KWF" }], KWH: [{ line: "TWL", sta: "KWH" }], TWH: [{ line: "TWL", sta: "TWH" }], TSW: [{ line: "TWL", sta: "TSW" }],
    KET: [{ line: "ISL", sta: "KET" }], HKU: [{ line: "ISL", sta: "HKU" }], SYP: [{ line: "ISL", sta: "SYP" }], SHW: [{ line: "ISL", sta: "SHW" }], WAC: [{ line: "ISL", sta: "WAC" }], CAB: [{ line: "ISL", sta: "CAB" }], TIH: [{ line: "ISL", sta: "TIH" }], FOH: [{ line: "ISL", sta: "FOH" }], TAK: [{ line: "ISL", sta: "TAK" }], SWH: [{ line: "ISL", sta: "SWH" }], SKW: [{ line: "ISL", sta: "SKW" }], HFC: [{ line: "ISL", sta: "HFC" }], CHW: [{ line: "ISL", sta: "CHW" }],
    WHA: [{ line: "KTL", sta: "WHA" }], SKM: [{ line: "KTL", sta: "SKM" }], LOF: [{ line: "KTL", sta: "LOF" }], WTS: [{ line: "KTL", sta: "WTS" }], CHH: [{ line: "KTL", sta: "CHH" }], KOB: [{ line: "KTL", sta: "KOB" }], NTK: [{ line: "KTL", sta: "NTK" }], KWT: [{ line: "KTL", sta: "KWT" }], LAT: [{ line: "KTL", sta: "LAT" }],
    DIS: [{ line: "DRL", sta: "DIS" }],
  };

  function showStatusMessage(message, type = "info", duration = 5000) { /* ... (same as before) ... */
    statusMessages.textContent = message;
    statusMessages.className = `status-${type} status-visible`;
    if (type !== "loading") {
      setTimeout(() => {
        statusMessages.classList.remove("status-visible");
      }, duration);
    }
  }
  function getStationCodeByName(name) { /* ... (same as before) ... */
    const normalizedName = name.trim().toLowerCase();
    for (const code in STATION_CODES) {
      if (STATION_CODES[code].toLowerCase() === normalizedName) {
        return code;
      }
    }
    if (STATION_CODES[name.trim().toUpperCase()]) {
        return name.trim().toUpperCase();
    }
    return null;
  }
  async function fetchEtaForLine(line, sta) { /* ... (same as before, with verbose logging) ... */
    const apiUrl = `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${line}&sta=${sta}&lang=EN`;
    console.log(`[${line}-${sta}] Initiating fetch to: ${apiUrl}`);
    try {
      const response = await fetch(apiUrl, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      console.log(`[${line}-${sta}] Fetch call completed. Status: ${response.status}, OK: ${response.ok}`);
      let responseText = "";
      try {
        responseText = await response.text();
        // console.log(`[${line}-${sta}] Response text received:`, responseText.substring(0, 500) + (responseText.length > 500 ? "..." : ""));
      } catch (textError) {
        console.error(`[${line}-${sta}] Error reading response text:`, textError);
        throw new Error(`Failed to read response text: ${textError.message}`);
      }
      if (!response.ok) {
        console.error(`[${line}-${sta}] API request was not OK. Status: ${response.status}. Response text: ${responseText}`);
        throw new Error(`API request failed: ${response.status}. Body: ${responseText}`);
      }
      try {
        const jsonData = JSON.parse(responseText);
        console.log(`[${line}-${sta}] Successfully parsed JSON.`);
        return jsonData;
      } catch (jsonError) {
        console.error(`[${line}-${sta}] Failed to parse JSON. Error:`, jsonError);
        console.error(`[${line}-${sta}] Raw text that failed JSON parsing:`, responseText);
        throw new Error(`Invalid JSON response from API: ${jsonError.message}. Raw: ${responseText.substring(0,100)}`);
      }
    } catch (networkOrThrownError) {
      console.error(`[${line}-${sta}] Critical error in fetchEtaForLine for ${apiUrl}:`, networkOrThrownError);
      if (networkOrThrownError.cause) {
          console.error(`[${line}-${sta}] Cause of error:`, networkOrThrownError.cause);
      }
      return null;
    }
  }
  function formatTime(dateTimeStr) { /* ... (same as before) ... */
    if (!dateTimeStr) return "N/A";
    try {
      const date = new Date(dateTimeStr.replace(/-/g, "/"));
      return date.toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit", hour12: false,
      });
    } catch (e) { return "N/A"; }
  }
  function getRouteTagClass(lineCode) { /* ... (same as before) ... */
    return `route-tag-${lineCode}` || "route-tag-DEFAULT";
  }
  function buildTrainRemarks(train, lineCode) {
    let remarksText = [];
    if (train.isdelay === "Y") remarksText.push("Delayed");
    if (train.route === "RAC" && lineCode === "EAL") remarksText.push("Via Racecourse");
    if (train.timetype === "A" && lineCode === "EAL") remarksText.push("Arrival");
    if (train.timetype === "D" && lineCode === "EAL") remarksText.push("Departure");
    return remarksText.join(", ") || "–";
  }

  fetchEtaButton.addEventListener("click", async () => { /* ... (same as before, up to Promise.all) ... */
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
      showStatusMessage( `Station "${stationQuery}" not found or no lines associated. Input: "${stationInput.value}", Resolved Code: "${stationCode}"`, "error", 7000 );
      etaResultsArea.innerHTML = "";
      return;
    }
    console.log(`[Main] Querying for station code: ${stationCode}, lines:`, linesToQuery);
    const allPromises = linesToQuery.map((lineInfo) => {
      console.log(`[Main] Creating promise for ${lineInfo.line}-${lineInfo.sta}`);
      return fetchEtaForLine(lineInfo.line, lineInfo.sta)
        .then(result => {
          console.log(`[Main] Promise for ${lineInfo.line}-${lineInfo.sta} resolved.`);
          return { lineCode: lineInfo.line, staCode: lineInfo.sta, data: result, success: !!result };
        })
        .catch(error => {
          console.error(`[Main] Promise for ${lineInfo.line}-${lineInfo.sta} REJECTED:`, error);
          return { lineCode: lineInfo.line, staCode: lineInfo.sta, data: null, success: false, error: error };
        });
    });
    console.log("[Main] All promises created. Awaiting Promise.all...");
    try {
      const resolvedPromisesData = await Promise.all(allPromises);
      console.log("[Main] Promise.all resolved.");
      const successfulLineData = [];
      let apiFetchErrorCount = 0;
      resolvedPromisesData.forEach((item) => {
        if (item.success && item.data && (item.data.status === 1 || item.data.status === "1")) {
          successfulLineData.push(item); // item already contains lineCode, staCode, data
        } else {
          apiFetchErrorCount++;
          console.warn(`[Main] No valid data or API error for ${item.lineCode}-${item.staCode}.`);
        }
      });
      console.log("[Main] Processed results. Successful line data count:", successfulLineData.length, "Error count:", apiFetchErrorCount);
      if (successfulLineData.length > 0) {
        console.log("[Main] Calling displayResults.");
        displayResults(successfulLineData, STATION_CODES[stationCode] || stationQuery); // Pass successfulLineData
        console.log("[Main] displayResults completed.");
        if (apiFetchErrorCount > 0) {
          showStatusMessage(`Displayed available data. ${apiFetchErrorCount} line(s) failed to load or had no service.`, "info", 7000);
        } else {
          if (statusMessages.classList.contains("status-loading")) {
            statusMessages.classList.remove("status-visible");
          }
        }
      } else {
        showStatusMessage(`Could not fetch any valid ETA data for "${STATION_CODES[stationCode] || stationQuery}". The MTR API might be unavailable, the station has no current services, or the input was invalid.`, "error", 10000);
        etaResultsArea.innerHTML = "";
      }
    } catch (error) {
      console.error("[Main] CRITICAL error in Promise.all or subsequent processing:", error);
      showStatusMessage("An unexpected critical error occurred. Check console.", "error");
      etaResultsArea.innerHTML = "";
    }
  });

  function displayResults(successfulLineData, requestedStationName) {
    console.log("[Display] Starting displayResults. Successful Line Data count:", successfulLineData.length, "Station:", requestedStationName);
    etaResultsArea.innerHTML = ""; // Clear previous results
    let earliestSysTime = null;

    const allIndividualTrains = [];

    successfulLineData.forEach(({ lineCode, staCode, data: lineApiData }) => {
      if (!lineApiData || (lineApiData.status !== 1 && lineApiData.status !== "1") || !lineApiData.data) {
        return; // Skip if this line's data is invalid
      }

      if (lineApiData.sys_time) {
        const currentSysDate = new Date(lineApiData.sys_time.replace(/-/g, "/"));
        if (!earliestSysTime || currentSysDate < earliestSysTime) {
          earliestSysTime = currentSysDate;
        }
      }

      const lineSchedulePayload = lineApiData.data; // e.g., {"KTL-YAT": {"UP": [...], "DOWN": [...]}}
      const lineSpecificKey = `${lineCode}-${staCode}`;
      let directionsToParse = [];

      if (lineSchedulePayload[lineSpecificKey]) {
        const scheduleUnderKey = lineSchedulePayload[lineSpecificKey];
        if (scheduleUnderKey.UP) directionsToParse.push({ key: "UP", trains: scheduleUnderKey.UP });
        if (scheduleUnderKey.DOWN) directionsToParse.push({ key: "DOWN", trains: scheduleUnderKey.DOWN });
        // If neither UP/DOWN, but the key itself is an array (e.g. some single-direction services)
        else if (Array.isArray(scheduleUnderKey)) {
            directionsToParse.push({ key: lineCode, trains: scheduleUnderKey }); // Use lineCode as key
        }
      } else { // Fallback to generic UP/DOWN keys directly under lineSchedulePayload
        if (lineSchedulePayload.UP) directionsToParse.push({ key: "UP", trains: lineSchedulePayload.UP });
        if (lineSchedulePayload.DOWN) directionsToParse.push({ key: "DOWN", trains: lineSchedulePayload.DOWN });
      }

      directionsToParse.forEach(dir => {
        if (dir.trains && Array.isArray(dir.trains)) {
          dir.trains.forEach(train => {
            allIndividualTrains.push({
              ...train, // Spread all properties from the train object
              lineCode: lineCode,
              originalDirectionKey: dir.key, // "UP", "DOWN", or lineCode
              apiFullData: lineApiData // Keep reference to full API data for curr_time
            });
          });
        }
      });
    });

    if (allIndividualTrains.length === 0) {
      console.warn("[Display] No individual trains collected from any line.");
      showStatusMessage(`No train services found for "${requestedStationName}".`, "info");
      return;
    }

    // Group trains by line, platform, and destination
    const groupedTrains = {};
    allIndividualTrains.forEach(train => {
      const groupKey = `${train.lineCode}-${train.plat}-${train.dest}`;
      if (!groupedTrains[groupKey]) {
        groupedTrains[groupKey] = {
          lineCode: train.lineCode,
          platform: train.plat,
          destinationCode: train.dest,
          originalDirectionKey: train.originalDirectionKey,
          trains: []
        };
      }
      groupedTrains[groupKey].trains.push(train);
    });

    // Prepare data for rendering and sort individual train groups
    const renderableRowData = Object.values(groupedTrains).map(group => {
      // Sort trains within each group by sequence or ttnt
      group.trains.sort((a, b) => (parseInt(a.seq) || Infinity) - (parseInt(b.seq) || Infinity) || (parseInt(a.ttnt) || Infinity) - (parseInt(b.ttnt) || Infinity));

      const etas = [];
      const scheduledTimes = [];
      const remarks = [];
      const firstTrain = group.trains[0] || {};

      for (let i = 0; i < 4; i++) {
        const train = group.trains[i];
        if (train) {
          if (train.ttnt !== undefined && train.ttnt !== "") {
            const ttntVal = parseInt(train.ttnt);
            if (ttntVal <= 0 && train.time && train.apiFullData && train.apiFullData.curr_time) {
              const now = new Date(train.apiFullData.curr_time.replace(/-/g, "/"));
              const trainTime = new Date(train.time.replace(/-/g, "/"));
              etas.push(trainTime <= now ? `<strong style="color: var(--primary-color);">Dep</strong>` : `<strong style="color: var(--primary-color);">Arr</strong>`);
            } else {
              etas.push(train.ttnt);
            }
          } else {
            etas.push("–");
          }
          let schedTimeText = formatTime(train.time);
          if (train.valid === "N" || (train.isdelay === "Y" && (train.ttnt === undefined || train.ttnt === ""))) {
            schedTimeText += ' <span class="remark-symbol">*</span>';
          }
          scheduledTimes.push(schedTimeText);
          remarks.push(buildTrainRemarks(train, group.lineCode));
        } else {
          etas.push("–");
          scheduledTimes.push("–");
          remarks.push("–");
        }
      }

      return {
        lineCode: group.lineCode,
        platform: group.platform || "N/A",
        destinationName: STATION_CODES[group.destinationCode] || group.destinationCode,
        etas: etas,
        // For simplicity, show scheduled time & remarks of the 1st train in the group
        firstScheduledTime: scheduledTimes[0],
        firstRemark: remarks[0],
        originalDirectionKey: group.originalDirectionKey,
        firstEtaSortVal: firstTrain.ttnt !== undefined ? parseInt(firstTrain.ttnt) : Infinity,
      };
    });

    // Sort renderableRowData: Line -> Direction (UP < DOWN) -> First ETA
    renderableRowData.sort((a, b) => {
      const lineNameA = MTR_LINES[a.lineCode] || a.lineCode;
      const lineNameB = MTR_LINES[b.lineCode] || b.lineCode;
      if (lineNameA.localeCompare(lineNameB) !== 0) {
        return lineNameA.localeCompare(lineNameB);
      }
      // Custom sort for direction: UP, then DOWN, then others alphabetically
      const dirOrder = { "UP": 1, "DOWN": 2 };
      const dirA = dirOrder[a.originalDirectionKey] || 3;
      const dirB = dirOrder[b.originalDirectionKey] || 3;
      if (dirA !== dirB) {
        return dirA - dirB;
      }
      if (dirA === 3 && a.originalDirectionKey.localeCompare(b.originalDirectionKey) !== 0) { // Sort other keys alphabetically
          return a.originalDirectionKey.localeCompare(b.originalDirectionKey);
      }
      return a.firstEtaSortVal - b.firstEtaSortVal;
    });


    if (renderableRowData.length === 0) {
      console.warn("[Display] No renderable rows after grouping and processing.");
      showStatusMessage(`No train services found to display for "${requestedStationName}".`, "info");
      return;
    }

    // Create single table structure
    const tableContainer = document.createElement("div");
    tableContainer.className = "eta-table-container"; // This will get the animation

    const table = document.createElement("table");
    table.className = "eta-results";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Line</th>
          <th>Destination</th>
          <th>Plat.</th>
          <th>ETA 1</th>
          <th>ETA 2</th>
          <th>ETA 3</th>
          <th>ETA 4</th>
          <th>Sched. Time</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    renderableRowData.forEach(rowItem => {
      const row = tbody.insertRow();

      const cellLine = row.insertCell();
      const lineTag = document.createElement("span");
      lineTag.className = `route-tag ${getRouteTagClass(rowItem.lineCode)}`;
      lineTag.textContent = rowItem.lineCode;
      cellLine.appendChild(lineTag);

      row.insertCell().textContent = rowItem.destinationName;
      row.insertCell().textContent = rowItem.platform;
      row.insertCell().innerHTML = rowItem.etas[0]; // Use innerHTML for Arr/Dep strong tags
      row.insertCell().innerHTML = rowItem.etas[1];
      row.insertCell().innerHTML = rowItem.etas[2];
      row.insertCell().innerHTML = rowItem.etas[3];
      row.insertCell().innerHTML = rowItem.firstScheduledTime; // Use innerHTML for remark symbol
      row.insertCell().textContent = rowItem.firstRemark;
    });

    tableContainer.appendChild(table);
    etaResultsArea.appendChild(tableContainer);

    if (earliestSysTime) {
        dataTimestampElem.textContent = `Data as of: ${earliestSysTime.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium' })}`;
    } else { dataTimestampElem.textContent = ""; }

    console.log("[Display] Results displayed successfully on page in new format.");
    if (statusMessages.classList.contains("status-loading") || statusMessages.classList.contains("status-info")) {
         statusMessages.classList.remove("status-visible");
    }
  } // End of displayResults

  stationInput.addEventListener("keypress", (event) => { /* ... (same as before) ... */
    if (event.key === "Enter") {
      event.preventDefault();
      fetchEtaButton.click();
    }
  });
}); // End of DOMContentLoaded
