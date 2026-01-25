# ✈️ TRMNL Aviation Monitor

A clean, high-contrast air traffic monitor for [TRMNL](https://trmnl.com/) E-ink displays. This project includes the Liquid HTML templates and a Cloudflare Worker script to fetch and format flight data.

## Features
- **Real-time Data:** Displays Altitude, Speed, Heading, and Callsigns.
- **Multiple Layouts:**
  - **Half Vertical:** Shows top 3 aircraft (best for upright split-screen).
  - **Half Horizontal:** Shows top 2 aircraft side-by-side (best for landscape split-screen).
  - **Quadrant:** Shows the single closest aircraft (optimized for 1/4 screen).
- **Visuals:** Custom icons for altitude/speed/heading and a distinct high-contrast design.

Here is a significantly improved `README.md` that includes the missing configuration steps found in your source code (like Environment Variables and KV Caching) and clarifies the deployment process.

---
## 🚀 Deployment Guide

### Prerequisites

* A **TRMNL** E-ink Display.
* A free **[Cloudflare](https://dash.cloudflare.com/)** account.
* Your location coordinates (Latitude & Longitude).

### Step 1: The Brain (Cloudflare Worker)

We need a small server script to fetch flight data, filter it, and format it for the TRMNL. We will use Cloudflare Workers (free tier).

1. **Create the Worker:**
* Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
* Go to **Workers & Pages** > **Create Application** > **Create Worker**.
* Name it `trmnl-aviation-monitor` and click **Deploy**.


2. **Add the Code:**
* Click **Edit Code**.
* Delete the existing "Hello World" code.
* Copy the **entire contents** of `Src/Worker.js` from this repository and paste it into the editor.
* Click **Save and Deploy**.


3. **Configure Location (Crucial Step):**
* Go back to your Worker's overview page (click the back arrow).
* Navigate to **Settings** > **Variables and Secrets**.
* Click **Add** and define the following variables to target your home/office:
* `LATITUDE`: Your latitude (e.g., `40.7128`).
* `LONGITUDE`: Your longitude (e.g., `-74.0060`).
* `RADIUS_NM`: Scan radius in nautical miles (recommended: `25`).




> **Note:** If you skip this step, the worker defaults to New Delhi (IGI Airport) coordinates.


4. **(Optional) Enable Caching:**
* To prevent hitting API rate limits, you can enable KV caching.
* In Cloudflare, go to **Storage & Databases** > **KV** > **Create Namespace**. Name it `FLIGHT_CACHE`.
* Go back to your Worker > **Settings** > **Variables and Secrets** > **KV Namespace Bindings**.
* Bind the variable name `FLIGHT_KV` to your `FLIGHT_CACHE` namespace.
* Add a new environment variable: `ENABLE_KV` = `true`.



### Step 2: The Face (TRMNL Plugin)

Now we tell the TRMNL display how to show the data.

1. **Create the Plugin:**
* Go to your [TRMNL Dashboard](https://trmnl.com/dashboard).
* Navigate to **Plugins** > **Private Plugins**.
* Click **+ Add New Plugin**.


2. **Configure Strategy:**
* **Name:** `Aviation Monitor`
* **Strategy:** Select **Polling**.
* **Poller URL:** Paste your Cloudflare Worker URL (e.g., `https://trmnl-aviation-monitor.yourname.workers.dev`).


3. **Choose Your Layout:**
* Open the `Templates/` folder in this repo and choose a file:
* `Full.html`: Best for a dedicated screen.
* `Half Horizontal`: Best for tracking two planes in landscape mode.
* `half verticle.html`: Best for a list view in portrait mode.


* Copy the HTML content and paste it into the **Markup** section of the TRMNL plugin editor.
* Click **Save**.



### Step 3: Go Live

1. Go to **Screens** in your TRMNL dashboard.
2. Add your new **Aviation Monitor** plugin to a layout slot.
3. Refresh your device!

---

## 🛠️ Advanced Customization

### Airline Naming

The worker includes a massive `AIRLINE_MAP` object to convert ICAO codes (e.g., `BAW`) to names (`British Airways`). If you see "Other" or "Unknown" frequently, you can add local airlines to the `AIRLINE_MAP` object in `worker.js`.

### Filtering

By default, the script filters out **IndiGo** flights (line 144: `.filter(f => f.airline !== "IndiGo")`). This was likely a personal preference of the author.

* **To remove this filter:** Delete or comment out that line in `worker.js`.
* **To filter tracking:** You can modify this logic to only show specific airlines or aircraft types.

---

## ❓ Troubleshooting

**"No Traffic Detected"**

* Check your `LATITUDE` and `LONGITUDE` variables in Cloudflare.
* Increase the `RADIUS_NM` variable (try `40` or `50`).
* Verify the API is working by visiting your Worker URL in a browser. You should see a JSON response.

**"Unknown Airline"**

* The airline code isn't in the mapping list. You can add it manually in the `worker.js` file under `const AIRLINE_MAP`.

**Screen shows code/markup instead of design**

* Ensure you copied the HTML *exactly* into the TRMNL Markup field, including the `{% assign ... %}` tags at the top.

## License

MIT License
