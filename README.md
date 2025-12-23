# ✈️ TRMNL Aviation Monitor

A clean, high-contrast air traffic monitor for [TRMNL](https://trmnl.com/) E-ink displays. This project includes the Liquid HTML templates and a Cloudflare Worker script to fetch and format flight data.

## Features
- **Real-time Data:** Displays Altitude, Speed, Heading, and Callsigns.
- **Multiple Layouts:**
  - **Half Vertical:** Shows top 3 aircraft (best for upright split-screen).
  - **Half Horizontal:** Shows top 2 aircraft side-by-side (best for landscape split-screen).
  - **Quadrant:** Shows the single closest aircraft (optimized for 1/4 screen).
- **Visuals:** Custom icons for altitude/speed/heading and a distinct high-contrast design.

## 🚀 Deployment Guide

### Step 1: Set up the Backend (Cloudflare Workers)
TRMNL requires a JSON endpoint to fetch data. We use Cloudflare Workers (free tier) to generate this.

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Go to **Workers & Pages** > **Create Application** > **Create Worker**.
3. Name it `trmnl-aviation-monitor` and click **Deploy**.
4. Click **Edit Code**.
5. Copy the content of `src/worker.js` from this repository and paste it into the editor.
   - *Note: The provided script sends mock data for testing. To use real data, you will need to integrate an API key from OpenSky or ADSBExchange.*
6. Click **Save and Deploy**.
7. Copy your Worker URL (e.g., `https://trmnl-aviation-monitor.yourname.workers.dev`).

### Step 2: Configure TRMNL
1. Go to your [TRMNL Dashboard](https://trmnl.com/dashboard).
2. Navigate to **Plugins** > **Private Plugins**.
3. Click **+ Add New Plugin**.
4. **Name:** "Aviation Monitor".
5. **Strategy:** Select **Polling** and paste your Cloudflare Worker URL.
6. **Markup:** Copy the code from one of the files in the `templates/` folder (e.g., `half-vertical.html`) and paste it into the Markup area.
7. Save the plugin.

### Step 3: Add to Screen
1. Go to **Screens**.
2. Select a layout configuration that matches the template you chose (Half Vertical, Half Horizontal, or Quadrant).
3. Add the "Aviation Monitor" plugin to the desired slot.

## 🛠️ Customization
You can modify the `worker.js` file to change the location coordinates or filter for specific airlines.

## License
MIT
