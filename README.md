# Project

# Aloft — Weather, Plainly

A responsive weather app built with plain HTML, CSS, and JavaScript — no frameworks, no build step. Features a live, animated sky backdrop that reflects real current conditions (sun, moon, drifting clouds, rain, snow, fog, or lightning) layered over a photographic sky background that tints itself by weather and time of day.

## Files

```
.
├── index.html   # Markup, links styles.css and script.js
├── styles.css   # All styling, animations, responsive rules
└── script.js    # App logic: fetching data, search, rendering
```

Keep all three files in the same folder — `index.html` loads the other two by relative path.

## Features

- **Live weather data** — current conditions, next 24 hours, and a 7-day forecast
- **City search** with debounced autocomplete suggestions, plus a "use my location" button
- **°C / °F toggle**
- **Detail cards** — feels-like temperature, humidity, wind speed & direction, pressure, visibility, UV index, sunrise, and sunset
- **Dynamic sky scene** — the animated backdrop and the background color tint both change automatically based on the actual weather code and day/night flag returned by the API
- **Fully responsive** — tuned breakpoints from small phones up through large desktop, including a landscape-phone layout
- Graceful loading and error states, with a hard fallback timeout so a stuck or blocked geolocation request can never leave the app hanging

## Tech & data sources

- **Weather & forecast data:** [Open-Meteo](https://open-meteo.com/) — free, no API key required
- **Geocoding (city search):** Open-Meteo Geocoding API
- **Background photo:** [Pexels](https://www.pexels.com/) — free to use, no attribution required
- **Fonts:** Fraunces, Inter, and JetBrains Mono via Google Fonts

## Getting started

1. Download `index.html`, `styles.css`, and `script.js` into the same folder.
2. Open `index.html` in a browser.
3. Allow location access for local weather, or use the search bar to look up any city.

> Open it as an actual file in your regular browser — not inside a restricted in-app preview — since the app needs to reach `open-meteo.com` and `images.pexels.com` over the network.

## How it works

**On load**, the app tries `navigator.geolocation` for your position. If that's denied, unavailable, or doesn't respond within 4 seconds, it falls back to a default city (New Delhi) so the app never gets stuck waiting.

**Search** debounces input by 350ms, queries the Open-Meteo geocoding API, and shows up to 6 matching places in a dropdown. Selecting one (or pressing Enter) fetches weather for that location.

**Rendering** finds the current hour's index in the hourly forecast array to pull feels-like temperature, humidity, pressure, visibility, and UV index, then builds the hourly strip and 7-day list from the same response — one API call covers the whole page.

## The sky theme

Each weather code from the API is mapped to a group — `clear`, `cloudy`, `rain`, `snow`, `fog`, or `storm` — and combined with the API's `is_day` flag to pick one of eight themes. Each theme applies:

1. A color-tint overlay on top of the fixed sky photo (light and warm for a clear day, progressively darker and cooler toward night and storms)
2. A matching animated scene in the current-conditions card — e.g. falling snow and drifting clouds for `snow`, twinkling stars for a clear night, a periodic flash for `storm`

Animations respect `prefers-reduced-motion` and are disabled for users who have that OS-level preference set.

## Notes & limitations

- Weather and geocoding calls go directly to Open-Meteo's public API from the browser — no backend or API key involved.
- The background photo is a single fixed image tinted by weather; it is not swapped per condition.
- Wind speed is shown in km/h and visibility in km regardless of the °C/°F toggle (the toggle only affects temperature values).
- 
