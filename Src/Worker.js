/**
 * TRMNL FLIGHT TRACKER WORKER // V2.0 (Lite)
 * Primary: Airplanes.live | Secondary: ADSB.lol (routes)
 * Features: Route lookup, Expanded Airlines, No Caching required
 */

// --- CONFIGURATION ---
const DEFAULT_CONFIG = {
  LAT: 28.5562,   // New Delhi
  LON: 77.1000,
  RADIUS_NM: 25,
  ROUTE_API_TIMEOUT: 4000  // 4 second timeout for route API
};

// --- EXPANDED AIRLINE MAPPING ---
// --- EXPANDED AIRLINE MAPPING (WORLDWIDE) ---
const AIRLINE_MAP = {
  // --- NORTH AMERICA (MAJORS) ---
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
  PAT: "US Army", UAF: "UAE Air Force"
};

// --- HELPER FUNCTIONS ---

function safeParseFloat(value, defaultValue) {
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getAirlineFromCallsign(callsign) {
  if (!callsign || typeof callsign !== 'string') return null;
  const cleanCallsign = callsign.trim().toUpperCase();
  
  // Try IATA (2-letter)
  const iataMatch = cleanCallsign.match(/^([A-Z]{2})\d+/);
  if (iataMatch && AIRLINE_MAP[iataMatch[1]]) return AIRLINE_MAP[iataMatch[1]];
  
  // Try ICAO (3-letter)
  const icaoMatch = cleanCallsign.match(/^([A-Z]{3})\d+/);
  if (icaoMatch && AIRLINE_MAP[icaoMatch[1]]) return AIRLINE_MAP[icaoMatch[1]];
  
  return null;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c) * 0.539957; 
}

function getDirectionFromBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.cos((lon2 - lon1) * Math.PI / 180);
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(bearing / 45) % 8];
}

function processRouteData(flight, routeData) {
  if (!routeData) return null;
  try {
    const routeCodes = routeData._airport_codes_iata || routeData.route;
    if (!routeCodes) return null;
    const codes = routeCodes.split('-');
    if (codes.length < 2) return null;
    
    const originCode = codes[0];
    const destCode = codes[codes.length - 1];
    const airports = routeData._airports || [];
    
    const getDisplayName = (code) => {
      const airport = airports.find(a => a.iata === code || a.icao === code);
      return airport?.name || airport?.municipality || code;
    };
    return `${getDisplayName(originCode)} → ${getDisplayName(destCode)}`;
  } catch (error) {
    return null;
  }
}

function isValidAircraft(ac, currentTime = Date.now()) {
  if (!ac.lat || !ac.lon) return false;
  if (ac.lat === 0 && ac.lon === 0) return false; 
  if (ac.alt_baro === "ground" || (ac.gs < 50 && ac.alt_baro < 500)) return false;
  if (ac.seen && (currentTime - ac.seen * 1000) > 300000) return false; 
  return true;
}

// --- MAIN WORKER ---
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    const lat = safeParseFloat(url.searchParams.get('lat') || env.LATITUDE, DEFAULT_CONFIG.LAT);
    const lon = safeParseFloat(url.searchParams.get('lon') || env.LONGITUDE, DEFAULT_CONFIG.LON);
    const radius = safeParseFloat(url.searchParams.get('radius_nm') || env.RADIUS_NM, DEFAULT_CONFIG.RADIUS_NM);
    
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return new Response(JSON.stringify({ error: "Invalid coordinates provided" }), { status: 400 });
    }
    
    // --- API CALL: Airplanes.live ---
    const primaryApiUrl = `https://api.airplanes.live/v2/point/${lat}/${lon}/${radius}`;
    
    let acList = [];
    try {
      const resp = await fetch(primaryApiUrl, {
        headers: { 'User-Agent': 'TRMNL-FlightTracker/2.0', 'Accept': 'application/json' }
      });
      if (!resp.ok) throw new Error(`Airplanes.live API error: ${resp.status}`);
      const data = await resp.json();
      acList = data.ac || [];
    } catch (primaryError) {
      console.error("Primary API failed:", primaryError);
      return new Response(JSON.stringify({
          error: "Could not fetch flight data",
          merge_variables: {
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }),
            aircraft_count: 0,
            flights: [],
            location: { lat, lon, radius_nm: radius }
          }
        }), { headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
    // --- PROCESS AIRCRAFT DATA ---
    const currentTime = Date.now();
    const validAircraft = acList.filter(ac => isValidAircraft(ac, currentTime));
    
    let flights = validAircraft
      .map(ac => {
        const distance = calculateDistance(lat, lon, ac.lat, ac.lon);
        return {
          hex: ac.hex,
          callsign: (ac.flight || ac.hex || "N/A").trim(),
          airline: getAirlineFromCallsign(ac.flight),
          type: ac.t || "UNK",
          description: ac.desc || ac.t || "Unknown",
          lat: ac.lat,
          lon: ac.lon,
          distance: Math.round(distance * 10) / 10,
          direction: getDirectionFromBearing(lat, lon, ac.lat, ac.lon),
          altitude: typeof ac.alt_baro === 'number' ? Math.round(ac.alt_baro) : 0,
          speed: ac.gs ? Math.round(ac.gs) : 0,
          verticalSpeed: ac.baro_rate || 0,
          heading: ac.track || 0,
          route_pretty: null
        };
      })
      .filter((flight, index, self) => index === self.findIndex(f => f.hex === flight.hex))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
    
    // --- SECONDARY API: ADSB.lol for Route Data ---
    // (Only fetch route for the #1 closest aircraft to be efficient)
    if (flights.length > 0) {
        const topFlight = flights[0];
        if (topFlight.callsign && topFlight.callsign.length >= 3 && topFlight.callsign !== "N/A") {
            try {
                const routeFetch = fetch("https://api.adsb.lol/api/0/routeset", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "User-Agent": "TRMNL-FlightTracker/2.0" },
                    body: JSON.stringify({ planes: [{ callsign: topFlight.callsign, lat: topFlight.lat, lng: topFlight.lon }] })
                });
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), DEFAULT_CONFIG.ROUTE_API_TIMEOUT));
                
                const routeResp = await Promise.race([routeFetch, timeoutPromise]);
                if (routeResp.ok) {
                    const routeList = await routeResp.json();
                    if (routeList && routeList[0]) {
                        flights[0].route_pretty = processRouteData(flights[0], routeList[0]);
                    }
                }
            } catch (e) { console.warn("Route API failed:", e.message); }
        }
    }
    
    // --- FINAL PAYLOAD ---
    const payload = {
      merge_variables: {
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }),
        aircraft_count: validAircraft.length,
        flights: flights.map(f => ({
          callsign: f.callsign,
          airline: f.airline || "UNKNOWN",
          aircraftType: f.type,
          description: f.description,
          distance: f.distance,
          direction: f.direction,
          altitude: f.altitude,
          speed: f.speed,
          verticalSpeed: f.verticalSpeed,
          heading: f.heading,
          route_pretty: f.route_pretty
        })),
        location: { lat, lon, radius_nm: radius }
      }
    };
    
    return new Response(JSON.stringify(payload), {
      headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
