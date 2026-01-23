/**
 * TRMNL FLIGHT TRACKER // V5.2 (Toggleable KV Edition)
 * - Base: V5.1 (Merged Edition)
 * - Feature: Added ENABLE_KV switch to config
 */

const DEFAULT_CONFIG = {
  LAT: 28.5562,      // IGI Airport (Placeholder - update these)
  LON: 77.1000,
  RADIUS_NM: 25,
  KV_KEY: "flight_cache_v2",
  ENABLE_KV: true    // <--- SET TO FALSE TO DISABLE CACHE
};

const AIRLINE_MAP = {
  // --- NORTH AMERICA (MAJOR CARRIERS) ---
  AAL: "American Airlines", UAL: "United Airlines", DAL: "Delta Air Lines", 
  ACA: "Air Canada", SWA: "Southwest", JBU: "JetBlue", ASA: "Alaska Airlines", 
  NKS: "Spirit", FFT: "Frontier", WJA: "WestJet", TSC: "Air Transat", 
  AMX: "Aeromexico", VOI: "Volaris", HAL: "Hawaiian", ALO: "Allegiant",

  // --- NORTH AMERICA (REGIONALS - OPERATING AS MAJOR CARRIERS) ---
  SKW: "SkyWest", RPA: "Republic Airways", JIA: "PSA Airlines", ENY: "Envoy Air",
  EDV: "Endeavor Air", ASH: "Mesa Airlines", QXE: "Horizon Air", GJS: "GoJet",
  CPZ: "Compass", PDT: "Piedmont", JAZ: "Jazz Aviation",

  // --- SOUTH AMERICA ---
  TAM: "LATAM", LAN: "LATAM", LPE: "LATAM Peru", LXP: "LATAM",
  AVA: "Avianca", GLO: "Gol Transportes", AZU: "Azul", ARG: "Aerolineas Argentinas",
  CMP: "Copa Airlines", SKX: "Sky Airline", JAT: "JetSMART", 

  // --- EUROPE (LEGACY CARRIERS) ---
  BAW: "British Airways", DLH: "Lufthansa", AFR: "Air France", KLM: "KLM",
  IBE: "Iberia", AZA: "ITA Airways", SWR: "Swiss", AUA: "Austrian",
  SAS: "SAS", FIN: "Finnair", EIN: "Aer Lingus", TAP: "TAP Portugal",
  LOT: "LOT Polish", THY: "Turkish Airlines", AFL: "Aeroflot",
  ICE: "Icelandair", NAX: "Norwegian", VIR: "Virgin Atlantic", BEL: "Brussels Airlines",

  // --- EUROPE (LOW COST & LEISURE) ---
  RYR: "Ryanair", EZY: "easyJet", EJU: "easyJet Europe", WZZ: "Wizz Air",
  WMT: "Wizz Air Malta", TVF: "Transavia", VLG: "Vueling",
  EWG: "Eurowings", EXS: "Jet2", TUI: "TUI Fly", TOM: "TUI UK",
  CFG: "Condor", EDW: "Edelweiss", NSS: "Norwegian Shuttle",

  // --- MIDDLE EAST ---
  UAE: "Emirates", QTR: "Qatar Airways", ETD: "Etihad",
  SVA: "Saudia", GFA: "Gulf Air", KAC: "Kuwait Airways",
  OMA: "Oman Air", RJA: "Royal Jordanian", MEA: "Middle East Airlines",
  FDB: "flydubai", ABY: "Air Arabia", JZR: "Jazeera",
  ELY: "El Al", MSR: "EgyptAir", IAW: "Iraqi Airways",

  // --- ASIA (CHINA & EAST ASIA) ---
  CCA: "Air China", CSN: "China Southern", CES: "China Eastern",
  CHH: "Hainan Airlines", CSC: "Sichuan Airlines", CXA: "XiamenAir", CQN: "Chongqing",
  CPA: "Cathay Pacific", HDA: "Cathay Dragon", CRK: "Hong Kong Airlines",
  JAL: "Japan Airlines", ANA: "All Nippon", APJ: "Peach",
  KAL: "Korean Air", AAR: "Asiana", JNA: "Jin Air",
  EVA: "EVA Air", CAL: "China Airlines",

  // --- ASIA (SE/SOUTH/CENTRAL) ---
  SIA: "Singapore Airlines", MAS: "Malaysia Airlines", GIA: "Garuda Indonesia",
  THA: "Thai Airways", HVN: "Vietnam Airlines", VJC: "VietJet",
  AIC: "Air India", IGO: "IndiGo", VTI: "Vistara", SEJ: "SpiceJet",
  AXB: "Air India Express", AKY: "Akasa Air", IAD: "AIX Connect",
  ALK: "SriLankan", BBC: "Biman Bangladesh", PIA: "Pakistan Int",
  KZR: "Air Astana", UZB: "Uzbekistan Airways", AXM: "AirAsia",
  JAI: "Jet Airways", STA: "Star Air", ALL: "Alliance Air",

  // --- OCEANIA ---
  QFA: "Qantas", QLK: "QantasLink", ANZ: "Air New Zealand",
  VOZ: "Virgin Australia", JST: "Jetstar", RXA: "Rex",
  FJI: "Fiji Airways", NGU: "Air Niugini",

  // --- AFRICA ---
  ETH: "Ethiopian Airlines", SAA: "South African", RAM: "Royal Air Maroc",
  KQA: "Kenya Airways", DAH: "Air Algerie", RWD: "RwandAir",
  LNI: "Lion Air", TUN: "Tunisair",

  // --- CARGO & LOGISTICS ---
  FDX: "FedEx", UPS: "UPS Airlines", GTI: "Atlas Air", CLX: "Cargolux",
  BOX: "AeroLogic", KHK: "Kitty Hawk", CKS: "Kalitta Air",
  PAC: "Polar Air", BCS: "DHL", DHK: "DHL Air",
  QJE: "Quikjet", BDG: "Blue Dart",

  // --- PRIVATE / BUSINESS JETS ---
  EJA: "NetJets", NJE: "NetJets Europe", VJT: "VistaJet",
  LXJ: "Flexjet", GAC: "GlobeAir", AZE: "Arcus Air",
  XRO: "Exxr", ADN: "Danish Air Transport",

  // --- MILITARY / GOVERNMENT ---
  RCH: "US Air Force (Reach)", CNV: "US Navy (Convoy)", RRR: "Royal Air Force",
  CFC: "Canadian Forces", ASY: "Royal Australian AF",
  IAM: "Italian Air Force", GAF: "German Air Force",
  AME: "Spanish Air Force", COTAM: "French Air Force",
  PAT: "US Army", UAF: "UAE Air Force",

  // --- UNKNOWN FALLBACK ---
  UNKNOWN: "Unknown Airline"
};

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(updateFlightCache(env));
  },

  async fetch(request, env, ctx) {
    // 0. Determine if KV is enabled (Env Var overrides Config)
    const isKVEnabled = env.ENABLE_KV !== undefined 
      ? (String(env.ENABLE_KV) === "true") 
      : DEFAULT_CONFIG.ENABLE_KV;

    // 1. Try Cache (Only if Enabled AND Binding exists)
    if (isKVEnabled && env.FLIGHT_KV) {
      const cached = await env.FLIGHT_KV.get(DEFAULT_CONFIG.KV_KEY);
      if (cached) {
        return new Response(cached, { 
          headers: { 'content-type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } 
        });
      }
    }

    // 2. Live Fetch
    const freshData = await updateFlightCache(env);
    return new Response(JSON.stringify(freshData), { 
      headers: { 'content-type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } 
    });
  }
};

async function updateFlightCache(env) {
  const lat = parseFloat(env.LATITUDE || DEFAULT_CONFIG.LAT);
  const lon = parseFloat(env.LONGITUDE || DEFAULT_CONFIG.LON);
  const radius = parseFloat(env.RADIUS_NM || DEFAULT_CONFIG.RADIUS_NM);

  // Check KV setting inside function as well
  const isKVEnabled = env.ENABLE_KV !== undefined 
      ? (String(env.ENABLE_KV) === "true") 
      : DEFAULT_CONFIG.ENABLE_KV;

  try {
    const resp = await fetch(`https://api.airplanes.live/v2/point/${lat}/${lon}/${radius}`, { 
        headers: { 'User-Agent': 'TRMNL-Worker-V5.2' } 
    });
    const data = await resp.json();
    const acList = data.ac || [];

    if (acList.length === 0) return { status: "No aircraft; cache preserved" };

    // --- DATA MAPPING ---
    let processed = acList
      .filter(ac => ac.lat && ac.alt_baro !== "ground")
      .map(ac => {
        const d = calculateDistance(lat, lon, ac.lat, ac.lon);
        return {
          // Identifiers
          callsign: (ac.flight || ac.hex || "").trim(),
          airline: getAirlineFromCallsign(ac.flight),
          
          // Info
          aircraftType: ac.t || "Unknown", 
          description: ac.desc || ac.t || "Unknown Aircraft", 

          // Metrics
          altitude: typeof ac.alt_baro === 'number' ? ac.alt_baro : 0,
          speed: Math.round(ac.gs || 0),
          heading: ac.track || 0,
          verticalSpeed: ac.baro_rate || 0,
          
          // Location
          distance: Math.round(d * 10) / 10,
          direction: getDirectionFromBearing(lat, lon, ac.lat, ac.lon),
          
          // Technical (Hidden)
          lat: ac.lat, 
          lon: ac.lon,
          
          // NEW FIELDS for Airport Names
          origin_full: "---",
          destination_full: "---"
        };
      })
      .filter(f => f.airline !== "IndiGo") 
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    // --- STAGGERED PARALLEL ROUTE FETCH ---
    if (processed.length > 0) {
      await Promise.allSettled(processed.map(async (flight, i) => {
        if (flight.airline === "Other" || flight.callsign.length < 3) return;

        // Jitter: Wait 250ms * index to avoid API block
        await new Promise(r => setTimeout(r, i * 250));

        try {
          const routeResp = await fetch("https://api.adsb.lol/api/0/routeset", {
            method: "POST",
            headers: { "Content-Type": "application/json", "User-Agent": "TRMNL-Worker-Names" },
            body: JSON.stringify({ planes: [{ callsign: flight.callsign, lat: flight.lat, lng: flight.lon }] })
          });
          
          if (routeResp.ok) {
            const routeData = await routeResp.json();
            if (routeData && routeData[0]) {
               // EXTRACT FULL NAMES HERE
               const airportNames = getAirportNamesFromAPI(routeData[0]);
               flight.origin_full = airportNames.origin;
               flight.destination_full = airportNames.dest;
            }
          }
        } catch (err) {
          console.warn(`Route failed for ${flight.callsign}`);
        }
      }));

      const payload = {
        merge_variables: {
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }),
          aircraft_count: processed.length,
          flights: processed
        }
      };

      // WRITE TO KV (Only if Enabled AND Binding exists)
      if (isKVEnabled && env.FLIGHT_KV) {
        await env.FLIGHT_KV.put(DEFAULT_CONFIG.KV_KEY, JSON.stringify(payload));
      }
      return payload;
    }
    return { status: "Filtered result empty" };

  } catch (e) {
    return { error: e.message };
  }
}

// --- NEW HELPER: Extracts Full Names (e.g., "Indira Gandhi Int'l") ---
function getAirportNamesFromAPI(routeData) {
  const fallback = { origin: "---", dest: "---" };
  
  // 1. Check for codes
  const routeCodes = routeData._airport_codes_iata || routeData.route; 
  if (!routeCodes || typeof routeCodes !== 'string') return fallback;
  
  const codes = routeCodes.split('-');
  if (codes.length < 2) return fallback;

  const originCode = codes[0];
  const destCode = codes[codes.length - 1];
  
  // 2. Find Airport Objects in the API response
  const airports = routeData._airports || [];
  
  // Helper to find name by code
  const getName = (code) => {
    const match = airports.find(a => a.iata === code || a.icao === code);
    // Prefer Name, then Municipality, then just Code
    return match ? match.name : code;
  };

  return {
    origin: getName(originCode),
    dest: getName(destCode)
  };
}

// --- STANDARD HELPERS ---
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; const dLat = (lat2-lat1)*Math.PI/180; const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) * 0.539957;
}

function getDirectionFromBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2-lon1)*Math.PI/180)*Math.cos(lat2*Math.PI/180);
  const x = Math.cos(lat1*Math.PI/180)*Math.sin(lat2*Math.PI/180)-Math.sin(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.cos((lon2-lon1)*Math.PI/180);
  const b = (Math.atan2(y, x)*180/Math.PI+360)%360;
  return ["N","NE","E","SE","S","SW","W","NW"][Math.round(b/45)%8];
}

function getAirlineFromCallsign(call) {
  if (!call) return "Other";
  const clean = call.trim().toUpperCase();
  const match = clean.match(/^([A-Z]{3})/);
  if (match && AIRLINE_MAP[match[1]]) return AIRLINE_MAP[match[1]];
  const iataMatch = clean.match(/^([A-Z]{2})/);
  if (iataMatch && AIRLINE_MAP[iataMatch[1]]) return AIRLINE_MAP[iataMatch[1]];
  return "Other";
}
