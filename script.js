(function(){
  "use strict";

  window.addEventListener('error', function(e){
    const c = document.getElementById('content');
    if(c) c.innerHTML = '<div class="state-msg error">Something went wrong loading the app: ' + (e.message || 'unknown error') + '</div>';
  });

  const state = {
    unit: 'c',
    lat: null, lon: null,
    place: null,
    data: null,
  };

  const el = {
    content: document.getElementById('content'),
    stateMsg: document.getElementById('stateMsg'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    locateBtn: document.getElementById('locateBtn'),
    suggestions: document.getElementById('suggestions'),
    unitC: document.getElementById('unitC'),
    unitF: document.getElementById('unitF'),
  };

  // ---------- weather code mapping ----------
  const WMO = {
    0:  { label: 'Clear sky',        group: 'clear'  },
    1:  { label: 'Mostly clear',     group: 'clear'  },
    2:  { label: 'Partly cloudy',    group: 'cloudy' },
    3:  { label: 'Overcast',         group: 'cloudy' },
    45: { label: 'Fog',              group: 'fog'    },
    48: { label: 'Icy fog',          group: 'fog'    },
    51: { label: 'Light drizzle',    group: 'rain'   },
    53: { label: 'Drizzle',          group: 'rain'   },
    55: { label: 'Dense drizzle',    group: 'rain'   },
    56: { label: 'Freezing drizzle', group: 'rain'   },
    57: { label: 'Freezing drizzle', group: 'rain'   },
    61: { label: 'Light rain',       group: 'rain'   },
    63: { label: 'Rain',             group: 'rain'   },
    65: { label: 'Heavy rain',       group: 'rain'   },
    66: { label: 'Freezing rain',    group: 'rain'   },
    67: { label: 'Freezing rain',    group: 'rain'   },
    71: { label: 'Light snow',       group: 'snow'   },
    73: { label: 'Snow',             group: 'snow'   },
    75: { label: 'Heavy snow',       group: 'snow'   },
    77: { label: 'Snow grains',      group: 'snow'   },
    80: { label: 'Rain showers',     group: 'rain'   },
    81: { label: 'Rain showers',     group: 'rain'   },
    82: { label: 'Violent showers',  group: 'rain'   },
    85: { label: 'Snow showers',     group: 'snow'   },
    86: { label: 'Snow showers',     group: 'snow'   },
    95: { label: 'Thunderstorm',     group: 'storm'  },
    96: { label: 'Thunderstorm, hail', group: 'storm' },
    99: { label: 'Thunderstorm, hail', group: 'storm' },
  };

  function wmo(code){ return WMO[code] || { label: 'Unknown', group: 'cloudy' }; }

  // ---------- icons (inline svg, one stroke style) ----------
  function icon(group, isDay){
    const stroke = 'currentColor';
    const common = 'fill="none" stroke="'+stroke+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    if(group === 'clear' && isDay){
      return `<svg viewBox="0 0 24 24" ${common}><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>`;
    }
    if(group === 'clear' && !isDay){
      return `<svg viewBox="0 0 24 24" ${common}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>`;
    }
    if(group === 'cloudy'){
      return `<svg viewBox="0 0 24 24" ${common}><path d="M7 18h10.5a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6-1.7A4 4 0 0 0 7 18z"/></svg>`;
    }
    if(group === 'fog'){
      return `<svg viewBox="0 0 24 24" ${common}><path d="M4 9h13M3 13h16M6 17h14"/></svg>`;
    }
    if(group === 'rain'){
      return `<svg viewBox="0 0 24 24" ${common}><path d="M7 14h10.5a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6-1.7A4 4 0 0 0 7 14z"/><path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2"/></svg>`;
    }
    if(group === 'snow'){
      return `<svg viewBox="0 0 24 24" ${common}><path d="M7 13h10.5a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6-1.7A4 4 0 0 0 7 13z"/><path d="M8 18v3M8 18l-1.5 1M8 18l1.5 1M16 18v3M16 18l-1.5 1M16 18l1.5 1"/></svg>`;
    }
    if(group === 'storm'){
      return `<svg viewBox="0 0 24 24" ${common}><path d="M7 12h10.5a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.6-1.7A4 4 0 0 0 7 12z"/><path d="M13 14l-3 5h3l-2 4"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" ${common}><circle cx="12" cy="12" r="4.5"/></svg>`;
  }

  // ---------- unit conversion ----------
  function fmtTemp(celsius){
    if(state.unit === 'f') return Math.round(celsius * 9/5 + 32);
    return Math.round(celsius);
  }
  function unitLabel(){ return state.unit === 'f' ? '°F' : '°C'; }

  // ---------- sky theme ----------
  function applyTheme(group, isDay){
    const body = document.body;
    body.className = '';
    let cls = 'theme-cloudy-day';
    if(group === 'clear') cls = isDay ? 'theme-clear-day' : 'theme-clear-night';
    else if(group === 'cloudy') cls = isDay ? 'theme-cloudy-day' : 'theme-cloudy-night';
    else if(group === 'rain') cls = 'theme-rain';
    else if(group === 'snow') cls = 'theme-snow';
    else if(group === 'fog') cls = 'theme-fog';
    else if(group === 'storm') cls = 'theme-storm';
    body.classList.add(cls);
  }

  function buildSky(group, isDay){
    let html = '';
    if(group === 'clear'){
      if(isDay){
        html += '<div class="sun"></div>';
      } else {
        html += '<div class="moon"></div><div class="stars">' + starsHtml(28) + '</div>';
      }
      html += cloudsHtml(isDay ? 1 : 0);
    } else if(group === 'cloudy'){
      if(!isDay) html += '<div class="stars">' + starsHtml(14) + '</div>';
      html += cloudsHtml(3);
    } else if(group === 'fog'){
      html += fogHtml();
    } else if(group === 'rain'){
      html += cloudsHtml(2) + rainHtml(40);
    } else if(group === 'snow'){
      html += cloudsHtml(2) + snowHtml(30);
    } else if(group === 'storm'){
      html += cloudsHtml(2) + rainHtml(30) + '<div class="lightning"></div>';
    }
    return html;
  }

  function starsHtml(n){
    let s = '';
    for(let i=0;i<n;i++){
      const top = Math.random()*55;
      const left = Math.random()*94 + 2;
      const delay = (Math.random()*3).toFixed(2);
      s += `<span style="top:${top}%;left:${left}%;animation-delay:${delay}s;"></span>`;
    }
    return s;
  }

  function cloudsHtml(n){
    let s = '';
    const sizes = [ [90,34], [130,44], [70,28] ];
    for(let i=0;i<n;i++){
      const sz = sizes[i % sizes.length];
      const top = 20 + i*38 + Math.random()*20;
      const dur = 40 + Math.random()*30;
      const delay = -Math.random()*40;
      s += `<div class="cloud" style="width:${sz[0]}px;height:${sz[1]}px;top:${top}px;animation-duration:${dur}s;animation-delay:${delay}s;"></div>`;
    }
    return s;
  }

  function rainHtml(n){
    let s = '<div class="rain">';
    for(let i=0;i<n;i++){
      const left = Math.random()*100;
      const dur = 0.5 + Math.random()*0.5;
      const delay = Math.random()*2;
      s += `<span style="left:${left}%;animation-duration:${dur}s;animation-delay:${delay}s;"></span>`;
    }
    return s + '</div>';
  }

  function snowHtml(n){
    let s = '<div class="snow">';
    for(let i=0;i<n;i++){
      const left = Math.random()*100;
      const size = 3 + Math.random()*4;
      const dur = 4 + Math.random()*5;
      const delay = Math.random()*5;
      s += `<span style="left:${left}%;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:${delay}s;"></span>`;
    }
    return s + '</div>';
  }

  function fogHtml(){
    let s = '';
    for(let i=0;i<4;i++){
      s += `<div class="fog-band" style="top:${20+i*50}px;animation-delay:${i*1.5}s;"></div>`;
    }
    return s;
  }

  // ---------- rendering ----------
  function dayName(iso, tz){
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
  function dateShort(iso){
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function hourLabel(iso){
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric' });
  }

  function render(){
    const data = state.data;
    if(!data) return;
    const cw = data.current_weather;
    const info = wmo(cw.weathercode);
    const isDay = cw.is_day === 1;

    applyTheme(info.group, isDay);

    // find matching hourly index
    const times = data.hourly.time;
    let idx = times.findIndex(t => t === cw.time);
    if(idx === -1){
      // fallback: nearest hour
      const cwTime = new Date(cw.time).getTime();
      let best = 0, bestDiff = Infinity;
      times.forEach((t,i)=>{ const diff = Math.abs(new Date(t).getTime()-cwTime); if(diff<bestDiff){bestDiff=diff; best=i;} });
      idx = best;
    }

    const feelsLike = data.hourly.apparent_temperature[idx];
    const humidity = data.hourly.relative_humidity_2m[idx];
    const pressure = data.hourly.surface_pressure[idx];
    const visibility = data.hourly.visibility[idx];
    const uv = data.hourly.uv_index[idx];
    const todaily = data.daily;
    const todayMax = todaily.temperature_2m_max[0];
    const todayMin = todaily.temperature_2m_min[0];
    const sunrise = todaily.sunrise[0];
    const sunset = todaily.sunset[0];

    const placeStr = state.place ? state.place : `${data.latitude.toFixed(2)}°, ${data.longitude.toFixed(2)}°`;
    const localTime = new Date(cw.time).toLocaleString('en-US', { weekday:'long', hour:'numeric', minute:'2-digit' });

    // hourly strip: next 24 hrs from idx
    let hourlyCards = '';
    for(let i=idx; i<Math.min(idx+24, times.length); i++){
      const t = times[i];
      const code = data.hourly.weathercode[i];
      const info2 = wmo(code);
      const hIsDay = data.hourly.is_day ? data.hourly.is_day[i] === 1 : isDay;
      const temp = fmtTemp(data.hourly.temperature_2m[i]);
      const pop = data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] : null;
      hourlyCards += `
        <div class="hour-card">
          <div class="h-time">${i===idx ? 'Now' : hourLabel(t)}</div>
          ${icon(info2.group, hIsDay)}
          <div class="h-temp">${temp}°</div>
          ${pop!==null ? `<div class="h-pop">${pop}%</div>` : ''}
        </div>`;
    }

    // daily rows
    let dailyRows = '';
    const maxOfWeek = Math.max(...todaily.temperature_2m_max);
    const minOfWeek = Math.min(...todaily.temperature_2m_min);
    for(let i=0;i<todaily.time.length;i++){
      const code = todaily.weathercode[i];
      const info3 = wmo(code);
      const hi = fmtTemp(todaily.temperature_2m_max[i]);
      const lo = fmtTemp(todaily.temperature_2m_min[i]);
      const pop = todaily.precipitation_probability_max ? todaily.precipitation_probability_max[i] : null;
      const name = i===0 ? 'Today' : dayName(todaily.time[i]);
      dailyRows += `
        <div class="day-row">
          <div class="d-name">${name}<small>${dateShort(todaily.time[i])}</small></div>
          ${icon(info3.group, true)}
          ${pop!==null ? `<div class="d-pop">${pop}%</div>` : '<div></div>'}
          <div class="d-range"><span class="lo">${lo}°</span><span class="bar"></span><span class="hi">${hi}°</span></div>
        </div>`;
    }

    el.content.innerHTML = `
      <div class="hero">
        <div class="sky">${buildSky(info.group, isDay)}</div>
        <div class="hero-content">
          <div class="place-row">
            <div class="place-name">${placeStr}</div>
            <div class="place-time">${localTime}</div>
          </div>
          <div class="temp-row">
            <div class="temp-big">${fmtTemp(cw.temperature)}°</div>
            <div class="temp-meta">
              <div class="condition">${info.label}</div>
              <div class="feels">Feels like ${fmtTemp(feelsLike)}${unitLabel()}</div>
              <div class="minmax">H <b>${fmtTemp(todayMax)}°</b>&nbsp;&nbsp;L <b>${fmtTemp(todayMin)}°</b></div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-title">Next 24 hours</div>
      <div class="hourly-strip">${hourlyCards}</div>

      <div class="section-title">7-day forecast</div>
      <div class="daily-list">${dailyRows}</div>

      <div class="section-title">Conditions</div>
      <div class="details-grid">
        <div class="detail-card">
          <div class="d-label">Humidity</div>
          <div class="d-value">${humidity}%</div>
        </div>
        <div class="detail-card">
          <div class="d-label">Wind</div>
          <div class="d-value">${Math.round(cw.windspeed)}</div>
          <div class="d-sub">km/h, ${degToCompass(cw.winddirection)}</div>
        </div>
        <div class="detail-card">
          <div class="d-label">Pressure</div>
          <div class="d-value">${Math.round(pressure)}</div>
          <div class="d-sub">hPa</div>
        </div>
        <div class="detail-card">
          <div class="d-label">Visibility</div>
          <div class="d-value">${(visibility/1000).toFixed(1)}</div>
          <div class="d-sub">km</div>
        </div>
        <div class="detail-card">
          <div class="d-label">UV index</div>
          <div class="d-value">${Math.round(uv)}</div>
          <div class="d-sub">${uvLabel(uv)}</div>
        </div>
        <div class="detail-card">
          <div class="d-label">Sunrise</div>
          <div class="d-value">${hourLabel(sunrise)}</div>
        </div>
        <div class="detail-card">
          <div class="d-label">Sunset</div>
          <div class="d-value">${hourLabel(sunset)}</div>
        </div>
      </div>

      <footer>Data from Open-Meteo · updated ${new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</footer>
    `;
  }

  function degToCompass(deg){
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg/45) % 8];
  }
  function uvLabel(uv){
    if(uv<3) return 'Low';
    if(uv<6) return 'Moderate';
    if(uv<8) return 'High';
    if(uv<11) return 'Very high';
    return 'Extreme';
  }

  // ---------- data fetching ----------
  async function fetchWeather(lat, lon, placeName){
    setLoading(`Loading weather for ${placeName || 'this location'}…`);
    try{
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true` +
        `&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weathercode,surface_pressure,visibility,uv_index,is_day` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max` +
        `&timezone=auto`;
      const res = await fetch(url);
      if(!res.ok) throw new Error('Weather service unavailable');
      const data = await res.json();
      state.data = data;
      state.place = placeName;
      state.lat = lat; state.lon = lon;
      render();
    } catch(err){
      setError("Couldn't load weather right now. Check your connection and try again.");
      console.error(err);
    }
  }

  async function geocode(query){
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Geocoding failed');
    return res.json();
  }

  function setLoading(msg){
    el.content.innerHTML = `<div class="state-msg">${msg}</div>`;
  }
  function setError(msg){
    el.content.innerHTML = `<div class="state-msg error">${msg}</div>`;
  }

  function placeLabel(item){
    const parts = [item.name];
    if(item.admin1 && item.admin1 !== item.name) parts.push(item.admin1);
    if(item.country) parts.push(item.country);
    return parts.join(', ');
  }

  // ---------- search UI ----------
  let debounceTimer = null;
  el.searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = el.searchInput.value.trim();
    if(q.length < 2){ el.suggestions.classList.remove('open'); return; }
    debounceTimer = setTimeout(async () => {
      try{
        const results = await geocode(q);
        if(!results.results || results.results.length === 0){
          el.suggestions.innerHTML = `<button disabled>No matches found</button>`;
          el.suggestions.classList.add('open');
          return;
        }
        el.suggestions.innerHTML = results.results.map(r => `
          <button data-lat="${r.latitude}" data-lon="${r.longitude}" data-label="${placeLabel(r)}">
            <span>${placeLabel(r)}</span><small>${r.timezone ? r.timezone.split('/').pop() : ''}</small>
          </button>
        `).join('');
        el.suggestions.classList.add('open');
      } catch(e){
        el.suggestions.classList.remove('open');
      }
    }, 350);
  });

  el.suggestions.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-lat]');
    if(!btn) return;
    const lat = parseFloat(btn.dataset.lat);
    const lon = parseFloat(btn.dataset.lon);
    const label = btn.dataset.label;
    el.suggestions.classList.remove('open');
    el.searchInput.value = label;
    fetchWeather(lat, lon, label);
  });

  document.addEventListener('click', (e) => {
    if(!e.target.closest('.search-wrap')) el.suggestions.classList.remove('open');
  });

  async function doSearch(){
    const q = el.searchInput.value.trim();
    if(!q) return;
    setLoading(`Searching for "${q}"…`);
    try{
      const results = await geocode(q);
      if(!results.results || results.results.length === 0){
        setError(`No place found matching "${q}". Try a different search.`);
        return;
      }
      const top = results.results[0];
      fetchWeather(top.latitude, top.longitude, placeLabel(top));
    } catch(e){
      setError("Search failed. Check your connection and try again.");
    }
  }

  el.searchBtn.addEventListener('click', doSearch);
  el.searchInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ el.suggestions.classList.remove('open'); doSearch(); }
  });

  el.locateBtn.addEventListener('click', () => {
    if(!navigator.geolocation){
      setError("Location isn't available in this browser. Try searching instead.");
      return;
    }
    setLoading("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, null),
      () => setError("Location access denied. Try searching for a city instead.")
    );
  });

  el.unitC.addEventListener('click', () => {
    if(state.unit === 'c') return;
    state.unit = 'c';
    el.unitC.classList.add('active'); el.unitC.setAttribute('aria-pressed','true');
    el.unitF.classList.remove('active'); el.unitF.setAttribute('aria-pressed','false');
    render();
  });
  el.unitF.addEventListener('click', () => {
    if(state.unit === 'f') return;
    state.unit = 'f';
    el.unitF.classList.add('active'); el.unitF.setAttribute('aria-pressed','true');
    el.unitC.classList.remove('active'); el.unitC.setAttribute('aria-pressed','false');
    render();
  });

  // ---------- initial load ----------
  function init(){
    let settled = false;
    const fallback = () => {
      if(settled) return;
      settled = true;
      fetchWeather(28.6139, 77.2090, 'New Delhi, India');
    };

    // Hard timeout: if geolocation doesn't answer either way (some sandboxed
    // previews and file:// pages never call back at all), we still proceed.
    const hardTimeout = setTimeout(fallback, 4000);

    try{
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if(settled) return;
            settled = true;
            clearTimeout(hardTimeout);
            fetchWeather(pos.coords.latitude, pos.coords.longitude, null);
          },
          () => {
            if(settled) return;
            settled = true;
            clearTimeout(hardTimeout);
            fallback();
          },
          { timeout: 3500 }
        );
      } else {
        clearTimeout(hardTimeout);
        fallback();
      }
    } catch(e){
      clearTimeout(hardTimeout);
      fallback();
    }
  }

  init();
})();