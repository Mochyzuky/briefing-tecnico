/* Local chart builder for briefing.html. User data stays in this page. */
(() => {
  "use strict";

  const form = document.querySelector("[data-plotter-form]");
  if (!form) return;

  const dataInput = form.elements.data;
  const titleInput = form.elements.chartTitle;
  const xInput = form.elements.xLabel;
  const yInput = form.elements.yLabel;
  const typeInput = form.elements.chartType;
  const status = document.querySelector("[data-plotter-status]");
  const chart = document.querySelector("[data-plotter-chart]");
  const heading = document.querySelector("[data-plotter-heading]");
  const tbody = document.querySelector("[data-plotter-table]");
  const xHead = document.querySelector("[data-plotter-x-head]");
  const yHead = document.querySelector("[data-plotter-y-head]");
  const sample = "Categoria;Valor\nJan;12\nFev;18\nMar;15\nAbr;24\nMai;21";
  let currentRows = [];
  let currentSvg = null;
  let currentHeaders = ["Categoria", "Valor"];

  const svgElement = (name, attrs, text) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (text != null) node.textContent = text;
    return node;
  };
  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.dataset.error = String(error);
  };
  const formatValue = (value) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);

  function parseRows(text) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 3) throw new Error("Informe uma linha de cabeçalho e pelo menos dois pontos de dados.");
    const delimiter = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
    const split = (line) => line.split(delimiter).map((cell) => cell.trim());
    const headers = split(lines[0]);
    if (headers.length !== 2 || headers.some((cell) => !cell)) {
      throw new Error("A primeira linha deve ter exatamente dois nomes de coluna: categoria e valor.");
    }
    const body = lines.slice(1);
    if (body.length > 50) throw new Error("Use no máximo 50 linhas de dados por gráfico.");
    const labelsSeen = new Set();
    const rows = body.map((line, index) => {
      const cells = split(line);
      if (cells.length !== 2 || !cells[0] || !cells[1]) {
        throw new Error(`Confira a linha ${index + 2}: cada linha precisa de um rótulo e um valor.`);
      }
      const normalized = delimiter === ";" ? cells[1].replace(",", ".") : cells[1];
      const value = Number(normalized);
      if (!Number.isFinite(value)) throw new Error(`O valor da linha ${index + 2} não é um número válido.`);
      if (labelsSeen.has(cells[0])) throw new Error(`A categoria "${cells[0]}" aparece mais de uma vez.`);
      labelsSeen.add(cells[0]);
      return { label: cells[0], value };
    });
    return { headers, rows };
  }

  function buildSvg(rows, headers, title, xLabel, yLabel, type) {
    const width = 900;
    const height = 470;
    const margin = { top: 42, right: 30, bottom: 110, left: 80 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const values = rows.map((row) => row.value);
    const minValue = Math.min(0, ...values);
    const maxValue = Math.max(0, ...values);
    const span = maxValue - minValue || 1;
    const tickStep = span / 4;
    const y = (value) => margin.top + ((maxValue - value) / span) * plotHeight;
    const root = svgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-labelledby": "plot-title plot-desc",
      xmlns: "http://www.w3.org/2000/svg"
    });
    root.append(svgElement("title", { id: "plot-title" }, title || "Gráfico"));
    root.append(svgElement("desc", { id: "plot-desc" }, `${type === "line" ? "Gráfico de linha" : "Gráfico de colunas"} com ${rows.length} categorias. Eixo horizontal: ${xLabel}. Eixo vertical: ${yLabel}.`));
    for (let i = 0; i <= 4; i += 1) {
      const tick = minValue + tickStep * i;
      const tickY = y(tick);
      root.append(svgElement("line", { x1: margin.left, y1: tickY, x2: width - margin.right, y2: tickY, class: "plot-grid" }));
      root.append(svgElement("text", { x: margin.left - 12, y: tickY + 4, "text-anchor": "end" }, formatValue(tick)));
    }
    root.append(svgElement("line", { x1: margin.left, y1: margin.top, x2: margin.left, y2: height - margin.bottom, class: "plot-axis" }));
    root.append(svgElement("line", { x1: margin.left, y1: y(0), x2: width - margin.right, y2: y(0), class: "plot-axis" }));
    const band = plotWidth / rows.length;
    const points = rows.map((row, index) => ({
      x: margin.left + band * (index + 0.5),
      y: y(row.value),
      row
    }));

    if (type === "line") {
      root.append(svgElement("polyline", {
        points: points.map((point) => `${point.x},${point.y}`).join(" "),
        class: "plot-line"
      }));
      points.forEach((point) => root.append(svgElement("circle", {
        cx: point.x, cy: point.y, r: 5, class: "plot-dot"
      })));
    } else {
      const barWidth = Math.min(44, band * 0.66);
      points.forEach((point) => {
        const zeroY = y(0);
        root.append(svgElement("rect", {
          x: point.x - barWidth / 2,
          y: Math.min(point.y, zeroY),
          width: barWidth,
          height: Math.max(1, Math.abs(zeroY - point.y)),
          rx: 2,
          class: "plot-series"
        }));
      });
    }
    const labelEvery = rows.length > 14 ? Math.ceil(rows.length / 14) : 1;
    points.forEach((point, index) => {
      if (index % labelEvery !== 0 && index !== rows.length - 1) return;
      root.append(svgElement("text", {
        x: point.x,
        y: height - margin.bottom + 22,
        "text-anchor": "end",
        transform: `rotate(-38 ${point.x} ${height - margin.bottom + 22})`
      }, point.row.label));
    });
    root.append(svgElement("text", { x: margin.left + plotWidth / 2, y: height - 12, "text-anchor": "middle" }, xLabel));
    const yAxis = svgElement("text", {
      x: 20,
      y: margin.top + plotHeight / 2,
      "text-anchor": "middle",
      transform: `rotate(-90 20 ${margin.top + plotHeight / 2})`
    }, yLabel);
    root.append(yAxis);
    return root;
  }

  function render() {
    try {
      const { headers, rows } = parseRows(dataInput.value);
      const title = titleInput.value.trim() || "Gráfico";
      const xLabel = xInput.value.trim() || headers[0];
      const yLabel = yInput.value.trim() || headers[1];
      const svg = buildSvg(rows, headers, title, xLabel, yLabel, typeInput.value);
      chart.replaceChildren(svg);
      chart.setAttribute("aria-label", title);
      heading.textContent = title;
      xHead.textContent = xLabel;
      yHead.textContent = yLabel;
      const tableRows = rows.map((row) => {
        const tr = document.createElement("tr");
        const label = document.createElement("td");
        const value = document.createElement("td");
        label.textContent = row.label;
        value.textContent = formatValue(row.value);
        tr.append(label, value);
        return tr;
      });
      tbody.replaceChildren(...tableRows);
      currentRows = rows;
      currentHeaders = headers;
      currentSvg = svg;
      setStatus(`Gráfico atualizado com ${rows.length} pontos. Os dados permanecem somente nesta página.`);
      return true;
    } catch (error) {
      setStatus(error.message, true);
      dataInput.focus();
      return false;
    }
  }

  function download(filename, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  form.addEventListener("input", (event) => {
    if (event.target !== dataInput) render();
  });
  form.querySelector("[data-plotter-sample]").addEventListener("click", () => {
    dataInput.value = sample;
    titleInput.value = "Exemplo de dados";
    xInput.value = "Categoria";
    yInput.value = "Valor";
    typeInput.value = "bar";
    render();
  });
  form.querySelector("[data-plotter-clear]").addEventListener("click", () => {
    dataInput.value = "";
    chart.replaceChildren();
    tbody.replaceChildren();
    currentRows = [];
    currentSvg = null;
    setStatus("Dados limpos. Cole uma tabela ou restaure o exemplo.", false);
    dataInput.focus();
  });
  document.querySelector("[data-plotter-download-svg]").addEventListener("click", () => {
    if (!currentSvg) return setStatus("Gere um gráfico válido antes de baixar o SVG.", true);
    const source = new XMLSerializer().serializeToString(currentSvg);
    download("grafico-briefing-tecnico.svg", new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  });
  document.querySelector("[data-plotter-download-csv]").addEventListener("click", () => {
    if (!currentRows.length) return setStatus("Gere um gráfico válido antes de baixar o CSV.", true);
    const escapeCell = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [currentHeaders, ...currentRows.map((row) => [row.label, row.value])]
      .map((line) => line.map(escapeCell).join(";"))
      .join("\r\n");
    download("dados-briefing-tecnico.csv", new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  });
  render();
})();
