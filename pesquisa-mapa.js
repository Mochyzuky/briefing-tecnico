(() => {
  "use strict";

  const host = document.querySelector("[data-research-map]");
  if (!host) return;

  const svg = host.querySelector("[data-map-svg]");
  const fallback = host.querySelector("[data-map-fallback]");
  const status = host.querySelector("[data-map-status]");
  const details = host.querySelector("[data-map-station-details]");
  const stationList = host.querySelector("[data-map-station-list]");
  const projectionCenter = { latitude: -11.42, longitude: -58.76 };
  const earthRadiusKm = 6371.0088;
  const mapCenter = 350;
  const pixelsPerKm = 1.2;
  const ns = "http://www.w3.org/2000/svg";
  const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let dragging = null;
  let stations = [];
  let scaleLine = null;
  let scaleText = null;

  const createSvgElement = (name, attributes = {}) => {
    const node = document.createElementNS(ns, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };

  const project = (longitude, latitude) => {
    const phi0 = projectionCenter.latitude * Math.PI / 180;
    const lambda0 = projectionCenter.longitude * Math.PI / 180;
    const phi = latitude * Math.PI / 180;
    let deltaLambda = longitude * Math.PI / 180 - lambda0;
    deltaLambda = (deltaLambda + Math.PI) % (2 * Math.PI) - Math.PI;
    const sinPhi0 = Math.sin(phi0);
    const cosPhi0 = Math.cos(phi0);
    const cosine = Math.max(-1, Math.min(1,
      sinPhi0 * Math.sin(phi) + cosPhi0 * Math.cos(phi) * Math.cos(deltaLambda)));
    const angle = Math.acos(cosine);
    const factor = angle === 0 ? 1 : angle / Math.sin(angle);
    const xKm = earthRadiusKm * factor * Math.cos(phi) * Math.sin(deltaLambda);
    const yKm = earthRadiusKm * factor *
      (cosPhi0 * Math.sin(phi) - sinPhi0 * Math.cos(phi) * Math.cos(deltaLambda));
    return [mapCenter + xKm * pixelsPerKm, mapCenter - yKm * pixelsPerKm];
  };

  const coordinatesFor = (geometry) => {
    if (!geometry) return [];
    if (geometry.type === "Polygon") return geometry.coordinates.map((ring) => ring);
    if (geometry.type === "MultiPolygon") return geometry.coordinates.flatMap((polygon) => polygon);
    return [];
  };

  const pathData = (ring) => ring.map(([longitude, latitude], index) => {
    const [x, y] = project(longitude, latitude);
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ") + " Z";

  const addPath = (group, ring, className, attributes = {}) => {
    const path = createSvgElement("path", { d: pathData(ring), "class": className, ...attributes });
    group.append(path);
    return path;
  };

  const updateTransform = () => {
    const layer = svg.querySelector("[data-map-viewport]");
    if (layer) {
      layer.setAttribute("transform",
        `translate(${panX} ${panY}) translate(${mapCenter} ${mapCenter}) scale(${zoom}) translate(${-mapCenter} ${-mapCenter})`);
    }
    host.querySelector('[data-map-action="zoom-in"]').disabled = zoom >= 8;
    host.querySelector('[data-map-action="zoom-out"]').disabled = zoom <= 1;
    const scaleKm = [100, 50, 25, 20, 10, 5].find((value) => value <= 100 / zoom) || 5;
    if (scaleLine && scaleText) {
      scaleLine.setAttribute("x2", String(72 + scaleKm * pixelsPerKm * zoom));
      scaleText.textContent = `${number.format(scaleKm)} km`;
    }
  };

  const selectStation = (station) => {
    const properties = station.properties;
    const distance = number.format(properties.distancia_centro_km);
    const lines = [
      `${properties.nome} (${properties.codigo})`,
      `${distance} km em linha reta a partir do centro do mapa.`,
      properties.cobertura_pct == null
        ? "Cobertura de dados: não informada."
        : `Cobertura dos dados de 2024: ${number.format(properties.cobertura_pct)}%.`,
      properties.pct_area > 0
        ? `Parte da área de estudo mais próxima desta estação: ${number.format(properties.pct_area)}%.`
        : "Sem área de influência calculada dentro do recorte de estudo.",
      `Situação dos dados: ${properties.situacao_dados}.`,
    ];
    details.textContent = lines.join(" ");
    svg.querySelectorAll(".research-map-station").forEach((marker) => {
      const selected = marker.getAttribute("data-station-code") === properties.codigo;
      marker.classList.toggle("is-selected", selected);
      marker.setAttribute("aria-pressed", String(selected));
    });
    stationList.querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.stationCode === properties.codigo));
    });
  };

  const addStations = (features, group) => {
    stations = features;
    features.forEach((station) => {
      const properties = station.properties;
      const [longitude, latitude] = station.geometry.coordinates;
      const [x, y] = project(longitude, latitude);
      const marker = createSvgElement("g", {
        "class": `research-map-station${properties.cobertura_pct === 0 ? " is-no-data" : ""}`,
        transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
        role: "button",
        tabindex: "0",
        "data-station-code": properties.codigo,
        "aria-label": `${properties.nome} (${properties.codigo}), a ${number.format(properties.distancia_centro_km)} quilômetros do centro`,
        "aria-pressed": "false",
      });
      const title = createSvgElement("title");
      title.textContent = `${properties.nome} · ${properties.situacao_dados}`;
      marker.append(title);
      marker.append(createSvgElement("circle", {
        "class": "research-map-station-halo",
        r: properties.codigo === "A920" ? 12 : 8,
      }));
      marker.append(createSvgElement("circle", {
        "class": "research-map-station-dot",
        r: properties.codigo === "A920" ? 7 : 4.5,
      }));
      const labelOnLeft = x > mapCenter + 220;
      const label = createSvgElement("text", {
        x: labelOnLeft ? "-10" : "10",
        y: "-8",
        "text-anchor": labelOnLeft ? "end" : "start",
        "class": "research-map-station-label",
      });
      label.textContent = properties.nome;
      marker.append(label);
      marker.addEventListener("click", () => selectStation(station));
      marker.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectStation(station);
        }
      });
      group.append(marker);

      const item = document.createElement("button");
      item.type = "button";
      item.dataset.stationCode = properties.codigo;
      item.setAttribute("aria-pressed", "false");
      item.textContent = `${properties.nome} · ${number.format(properties.distancia_centro_km)} km`;
      item.addEventListener("click", () => {
        selectStation(station);
        marker.focus();
      });
      stationList.append(item);
    });
  };

  const buildMap = (layers) => {
    const title = createSvgElement("title", { id: "research-map-title" });
    title.textContent = "Juína e estações meteorológicas próximas";
    const description = createSvgElement("desc", { id: "research-map-description" });
    description.textContent = "Mapa regional com limites de estados, contorno municipal, áreas de influência por proximidade e estações meteorológicas selecionáveis.";
    const defs = createSvgElement("defs");
    const clip = createSvgElement("clipPath", { id: "research-map-clip" });
    clip.append(createSvgElement("rect", { x: 50, y: 50, width: 600, height: 600 }));
    defs.append(clip);
    svg.replaceChildren(title, description, defs);
    svg.setAttribute("aria-labelledby", "research-map-title research-map-description");

    svg.append(createSvgElement("rect", {
      x: 50, y: 50, width: 600, height: 600, rx: 3, "class": "research-map-water",
    }));

    const viewport = createSvgElement("g", { "data-map-viewport": "" });
    const clipped = createSvgElement("g", { "clip-path": "url(#research-map-clip)" });
    viewport.append(clipped);
    svg.append(viewport);

    const states = createSvgElement("g", { "data-layer-content": "administrative", "class": "research-map-state-layer" });
    layers.states.features.forEach((feature, index) => {
      coordinatesFor(feature.geometry).forEach((ring) => addPath(
        states, ring, "research-map-state",
        { fill: index % 2 ? "#f1efe6" : "#e9e8df", "fill-rule": "evenodd" },
      ));
    });
    clipped.append(states);

    const grid = createSvgElement("g", { "class": "research-map-grid" });
    for (let value = -200; value <= 200; value += 100) {
      const position = mapCenter + value * pixelsPerKm;
      grid.append(createSvgElement("line", { x1: position, y1: 50, x2: position, y2: 650 }));
      grid.append(createSvgElement("line", { x1: 50, y1: position, x2: 650, y2: position }));
    }
    clipped.append(grid);

    const areas = createSvgElement("g", { "data-layer-content": "areas" });
    const colors = { A920: "#d8bd83", A927: "#55a8d6", A913: "#829b7e" };
    layers.areas.features.forEach((feature) => coordinatesFor(feature.geometry).forEach((ring) => {
      addPath(areas, ring, "research-map-influence", {
        fill: colors[feature.properties.codigo] || "#aab8bb",
      });
    }));
    clipped.append(areas);

    const municipal = createSvgElement("g", { "data-layer-content": "administrative" });
    layers.municipal.features.forEach((feature) => coordinatesFor(feature.geometry).forEach((ring) => {
      addPath(municipal, ring, "research-map-municipality");
    }));
    clipped.append(municipal);

    const center = createSvgElement("g", { "class": "research-map-center", "aria-hidden": "true" });
    center.append(createSvgElement("line", { x1: mapCenter - 7, y1: mapCenter, x2: mapCenter + 7, y2: mapCenter }));
    center.append(createSvgElement("line", { x1: mapCenter, y1: mapCenter - 7, x2: mapCenter, y2: mapCenter + 7 }));
    clipped.append(center);

    const stationLayer = createSvgElement("g", { "data-layer-content": "stations" });
    addStations(layers.stations.features, stationLayer);
    clipped.append(stationLayer);

    const frame = createSvgElement("rect", { x: 50, y: 50, width: 600, height: 600, rx: 3, "class": "research-map-frame" });
    svg.append(frame);
    const scale = createSvgElement("g", { "class": "research-map-scale", "aria-hidden": "true" });
    scaleLine = createSvgElement("line", { x1: 72, y1: 82, x2: 192, y2: 82 });
    scaleText = createSvgElement("text", { x: 132, y: 74, "text-anchor": "middle" });
    scale.append(scaleLine, scaleText);
    const north = createSvgElement("text", { x: 622, y: 83, "text-anchor": "middle" });
    north.textContent = "N ↑";
    scale.append(north);
    svg.append(scale);

    host.querySelectorAll("[data-map-layer]").forEach((input) => {
      input.disabled = false;
      input.addEventListener("change", () => {
        svg.querySelectorAll(`[data-layer-content="${input.dataset.mapLayer}"]`).forEach((layer) => {
          layer.classList.toggle("is-hidden", !input.checked);
        });
      });
    });
    host.querySelectorAll("[data-map-action]").forEach((button) => {
      button.disabled = false;
      button.addEventListener("click", () => {
        if (button.dataset.mapAction === "reset") {
          zoom = 1;
          panX = 0;
          panY = 0;
        } else {
          zoom = Math.max(1, Math.min(8, zoom * (button.dataset.mapAction === "zoom-in" ? 1.5 : 1 / 1.5)));
        }
        updateTransform();
      });
    });
    svg.addEventListener("wheel", (event) => {
      event.preventDefault();
      zoom = Math.max(1, Math.min(8, zoom * (event.deltaY < 0 ? 1.15 : 1 / 1.15)));
      updateTransform();
    }, { passive: false });
    svg.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".research-map-station")) return;
      dragging = { x: event.clientX, y: event.clientY };
      svg.setPointerCapture(event.pointerId);
      svg.classList.add("is-dragging");
    });
    svg.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const rect = svg.getBoundingClientRect();
      panX += (event.clientX - dragging.x) * 700 / rect.width;
      panY += (event.clientY - dragging.y) * 700 / rect.height;
      dragging = { x: event.clientX, y: event.clientY };
      panX = Math.max(-500, Math.min(500, panX));
      panY = Math.max(-500, Math.min(500, panY));
      updateTransform();
    });
    const stopDragging = () => {
      dragging = null;
      svg.classList.remove("is-dragging");
    };
    svg.addEventListener("pointerup", stopDragging);
    svg.addEventListener("pointercancel", stopDragging);

    updateTransform();
    fallback.setAttribute("hidden", "");
    svg.removeAttribute("hidden");
    status.textContent = `${stations.length} estações carregadas. Arraste o mapa para explorar a região.`;
    const highlight = stations.find((station) => station.properties.codigo === "A920");
    if (highlight) selectStation(highlight);
  };

  const loadMap = async () => {
    const paths = [
      "assets/research/estados-regiao-juina.geojson",
      "assets/research/limite-juina.geojson",
      "assets/research/areas-influencia-pesquisa-juina.geojson",
      "assets/research/estacoes-pesquisa-juina.geojson",
    ];
    const responses = await Promise.all(paths.map((path) => fetch(path)));
    const failed = responses.find((response) => !response.ok);
    if (failed) throw new Error(`Não foi possível carregar ${failed.url} (${failed.status}).`);
    const [states, municipal, areas, stationData] = await Promise.all(responses.map((response) => response.json()));
    buildMap({ states, municipal, areas, stations: stationData });
  };

  loadMap().catch((error) => {
    status.textContent = "O mapa interativo não pôde ser carregado. A imagem estática e os arquivos de dados continuam disponíveis abaixo.";
    console.error("[mapa de pesquisa] Falha ao carregar as camadas geográficas:", error);
  });
})();
