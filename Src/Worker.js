// --- CONFIGURATION ---
const DEFAULT_CONFIG = {
  =========================================================================
    // ⚙️ USER CONFIGURATION
    // =========================================================================
    // 1. Go to google.com/maps, right-click your house, and copy the Lat/Lng.
    // 2. Paste them below.
  LAT: "0.000",
  LON: "0.000",
  RADIUS: "15"  // Set how far you want to "see" in Nautical Miles (nm).
};

// --- AIRLINE MAPPING (INDIA & MAJOR INTERNATIONAL) ---
const AIRLINE_MAP = {
  // --- DOMESTIC INDIA ---
  AIC: "Air India", IGO: "IndiGo", VTI: "Vistara", SEJ: "SpiceJet",
  AXB: "Air India Express", AKY: "Akasa Air", IAD: "AIX Connect",
  GOW: "Go First", LGL: "IndiaOne Air", FLY: "Big Charter",

  // --- MAJOR INTERNATIONAL ---
  UAE: "Emirates", QTR: "Qatar Airways", ETD: "Etihad", SVA: "Saudia",
  FDB: "flydubai", GFA: "Gulf Air", KAC: "Kuwait Airways", OMA: "Oman Air",
  RJA: "Royal Jordanian", SIA: "Singapore Airlines", THA: "Thai Airways",
  MAS: "Malaysia Airlines", AXM: "AirAsia", HVN: "Vietnam Airlines",
  CAL: "China Airlines", CPA: "Cathay Pacific", GIA: "Garuda Indonesia",
  JAL: "Japan Airlines", ANA: "All Nippon", BAW: "British Airways",
  VIR: "Virgin Atlantic", DLH: "Lufthansa", AFR: "Air France", KLM: "KLM",
  FIN: "Finnair", SWR: "Swiss", LOT: "LOT Polish", AFL: "Aeroflot",
  THY: "Turkish Airlines", UAL: "United", AAL: "American", ACA: "Air Canada",
  DAL: "Delta", PIA: "Pakistan Intl", ALK: "SriLankan", BGB: "Biman Bangladesh",
  KZA: "Air Astana", UZB: "Uzbekistan Airways", ETH: "Ethiopian",

  // --- CARGO ---
  FDX: "FedEx", UPS: "UPS", GTI: "Atlas Air", CLX: "Cargolux",
  BOX: "AeroLogic", BCS: "DHL"
};

// --- HELPER FUNCTIONS ---

function getAirline(callsign) {
  if (!callsign || callsign.length < 3) return null;
  return AIRLINE_MAP[callsign.substring(0, 3).toUpperCase()] || null;
}

function toRad(deg) { 
  return deg * (Math.PI / 180); 
}

function getDist(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth Radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const dKm = R * c;
  return dKm * 0.539957; // Convert km to Nautical Miles
}

function getDir(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2-lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1))*Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1))*Math.cos(toRad(lat2))*Math.cos(toRad(lon2-lon1));
  const brng = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(brng / 45) % 8];
}

// --- MAIN WORKER LOGIC ---

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 1. Get Location Parameters
    const lat = parseFloat(url.searchParams.get('lat') || env.LATITUDE || DEFAULT_CONFIG.LAT);
    const lon = parseFloat(url.searchParams.get('lon') || env.LONGITUDE || DEFAULT_CONFIG.LON);
    const radius = parseFloat(url.searchParams.get('radius_nm') || env.RADIUS_NM || DEFAULT_CONFIG.RADIUS);

    // 2. Fetch Data from AirplanesLive API
    const apiUrl = `https://api.airplanes.live/v2/point/${lat}/${lon}/${radius}`;
    const apiHeaders = {
      'User-Agent': 'TRMNL-Flight-Tracker/1.0'
    };

    try {
      const resp = await fetch(apiUrl, { headers: apiHeaders });
      
      if (!resp.ok) {
        return new Response(`API Error: ${resp.status}`, { status: 500 });
      }
      
      const data = await resp.json();
      const acList = data.ac || [];

      // 3. Process, Filter, & Format Data
      let flights = acList
        .filter(ac => {
          return ac.lat && ac.lon && ac.alt_baro !== "ground";
        })
        .map(ac => {
          const dist = getDist(lat, lon, ac.lat, ac.lon);
          return {
            callsign: (ac.flight || ac.hex || "N/A").trim(),
            airline: getAirline((ac.flight || "").trim()),
            type: ac.t || null,
            // NEW: Capture the description from API (e.g. "AIRBUS A-320neo")
            desc: ac.desc ? ac.desc.toUpperCase() : null,
            dist: Math.round(dist * 10) / 10,
            dir: getDir(lat, lon, ac.lat, ac.lon),
            alt: typeof ac.alt_baro === 'number' ? ac.alt_baro : 0,
            spd: ac.gs || 0,
            v_spd: ac.baro_rate || 0,
            hdg: ac.track || 0,
            hex: ac.hex,
          };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5); // Limit to 5 nearest

      // 4. Map to TRMNL expected format
      const trmnlFlights = flights.map(f => ({
        callsign: f.callsign,
        airline: f.airline,
        aircraftType: f.type,
        description: f.desc, // Passing the description field
        distance: f.dist,
        direction: f.dir,
        altitude: f.alt,
        speed: f.spd,
        verticalSpeed: f.v_spd,
        heading: f.hdg,
        hex: f.hex
      }));

      // 5. Construct Final Payload
      const payload = {
        merge_variables: {
          timestamp: new Date().toLocaleTimeString("en-US", { 
              hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" 
          }),
          aircraft_count: acList.length,
          flights: trmnlFlights,
          location: { 
            lat: lat, 
            lon: lon, 
            radius_nm: radius 
          }
        }
      };

      // 6. Return JSON Response
      return new Response(JSON.stringify(payload), {
        headers: { 
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }
  }
};
