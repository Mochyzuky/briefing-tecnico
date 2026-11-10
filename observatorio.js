/* Briefing Técnico — Observatório
 * Gráficos em SVG gerados no navegador (sem bibliotecas externas), a partir de window.BT_DADOS
 * (data/observatorio-dados.js) e da previsão carregada por script.js.
 * Também contém a ferramenta educativa de decodificação de METAR/SPECI.
 * Nada aqui envia dados do visitante a nenhum serviço.
 */
(() => {
  "use strict";

  const BT = window.BT;
  if (!BT || !BT.util) return;
  const { $, $$, isNum, nf0, nf1, dataLocal } = BT.util;
  const D = window.BT_DADOS || null;
  const TZ = BT.TZ;

  const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const MES_LONGO = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const nf2 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  const nf1f = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmtDiaMes = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "short" });

  const esc = (valor) => String(valor).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) * (r1 - r0)) / (d1 - d0 || 1);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const listaPt = (itens) => (itens.length <= 1 ? itens.join("") : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`);
  const num = (n) => (Number.isFinite(n) ? Number(n.toFixed(2)) : 0);
  const horaMin = (horas) => {
    const total = Math.round(horas * 60);
    return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, "0")} min`;
  };
  const dataCurta = (iso) => {
    const [, m, d] = iso.split("-").map(Number);
    return `${d} de ${MES_LONGO[m - 1]}`;
  };

  const cssCor = (nome, padrao) => {
    const valor = getComputedStyle(document.body).getPropertyValue(nome).trim();
    return valor || padrao;
  };
  const COR = {
    chuva: cssCor("--c-rain", "#2f78a0"),
    tmax: cssCor("--c-tmax", "#c0602a"),
    tmin: cssCor("--c-tmin", "#46688f"),
    ur: cssCor("--c-rh", "#4f8a6a"),
    lacuna: cssCor("--c-gap", "#b9b6a6"),
    umida: cssCor("--c-wet", "#2f78a0"),
    seca: cssCor("--c-dry", "#c0602a")
  };

  /* Faixas de cor do calendário diário */
  const FAIXAS = {
    tmax: {
      campo: "tmax", nome: "máxima", unidade: "°C", casas: 1,
      faixas: [
        { ate: 28, cor: "#f6e7c1", rotulo: "abaixo de 28 °C" },
        { ate: 31, cor: "#f2c585", rotulo: "28 a 31 °C" },
        { ate: 33, cor: "#e99c52", rotulo: "31 a 33 °C" },
        { ate: 35, cor: "#d1632a", rotulo: "33 a 35 °C" },
        { ate: Infinity, cor: "#8e2f1a", rotulo: "35 °C ou mais" }
      ]
    },
    rhmin: {
      campo: "rhmin", nome: "umidade mínima", unidade: "%", casas: 0,
      faixas: [
        { ate: 20, cor: "#8e2f1a", rotulo: "abaixo de 20%" },
        { ate: 30, cor: "#d1632a", rotulo: "20 a 30%" },
        { ate: 50, cor: "#f0c27a", rotulo: "30 a 50%" },
        { ate: 70, cor: "#a9cbbd", rotulo: "50 a 70%" },
        { ate: Infinity, cor: "#3f7f66", rotulo: "70% ou mais" }
      ]
    },
    rain: {
      campo: "rain", nome: "chuva", unidade: "mm", casas: 1,
      faixas: [
        { ate: 1, cor: "#ece8db", rotulo: "menos de 1 mm" },
        { ate: 5, cor: "#c6dbe6", rotulo: "1 a 5 mm" },
        { ate: 20, cor: "#8fbad2", rotulo: "5 a 20 mm" },
        { ate: 50, cor: "#4f93b8", rotulo: "20 a 50 mm" },
        { ate: Infinity, cor: "#1f5c80", rotulo: "50 mm ou mais" }
      ]
    }
  };
  const corDaFaixa = (def, valor) => def.faixas.find((f) => valor < f.ate).cor;

  let uid = 0;
  const novoId = (prefixo) => `${prefixo}-${(uid += 1)}`;

  /** Marcação SVG para áreas sem dado: listras diagonais. */
  const padraoLacuna = (id, cor = COR.lacuna, fundo = "#f4f1e8") =>
    `<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="${fundo}"/><line x1="0" y1="0" x2="0" y2="5" stroke="${cor}" stroke-width="1.6"/></pattern>`;
  const padraoCor = (id, cor) =>
    `<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="${cor}" fill-opacity=".16"/><line x1="0" y1="0" x2="0" y2="5" stroke="${cor}" stroke-width="1.6"/></pattern>`;

  const abrirSvg = (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" focusable="false" aria-hidden="true">`;

  /** Escala "bonita": retorna { min, max, ticks } cobrindo [min, max]. */
  function escalaBonita(min, max, alvo = 5) {
    if (!(max > min)) { max = min + 1; }
    const bruto = (max - min) / alvo;
    const mag = 10 ** Math.floor(Math.log10(bruto));
    const norm = bruto / mag;
    const passo = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const lo = Math.floor(min / passo + 1e-9) * passo;
    const hi = Math.ceil(max / passo - 1e-9) * passo;
    const ticks = [];
    for (let v = lo; v <= hi + passo / 2; v += passo) ticks.push(Number(v.toFixed(6)));
    return { min: lo, max: hi, ticks };
  }

  /** Caminho de linha que se interrompe nos pontos nulos. */
  function caminho(pontos) {
    let d = "";
    let aberto = false;
    for (const p of pontos) {
      if (!p) { aberto = false; continue; }
      d += `${aberto ? "L" : "M"}${num(p[0])} ${num(p[1])}`;
      aberto = true;
    }
    return d;
  }

  /** Legenda em HTML, abaixo do gráfico. itens: [{ tipo: barra|linha|tracejado|hachura, cor, rotulo }] */
  function legenda(caixa, itens) {
    if (!caixa) return null;
    let ul = caixa.nextElementSibling;
    if (!ul || !ul.classList.contains("legend-list")) {
      ul = document.createElement("ul");
      ul.className = "legend-list";
      caixa.insertAdjacentElement("afterend", ul);
    }
    ul.replaceChildren(...itens.map((item) => {
      const li = document.createElement("li");
      const marca = document.createElement("i");
      marca.className = `sw sw-${item.tipo}`;
      marca.style.setProperty("--c", item.cor);
      marca.setAttribute("aria-hidden", "true");
      li.append(marca, document.createTextNode(item.rotulo));
      return li;
    }));
    return ul;
  }

  /** Registra um gráfico que se redesenha quando a largura muda. */
  const graficos = [];
  function montar(id, desenhar) {
    const el = document.getElementById(id);
    if (!el) return null;
    const item = { el, largura: 0 };
    item.render = () => {
      const w = Math.floor(el.clientWidth);
      if (w < 120) return;
      item.largura = w;
      try {
        el.innerHTML = desenhar(w); // SVG montado a partir de números e textos próprios, com escape
      } catch (erro) {
        console.error(erro);
        el.textContent = "Não foi possível desenhar este gráfico.";
      }
    };
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => { if (Math.abs(el.clientWidth - item.largura) >= 2) item.render(); }).observe(el);
    }
    item.render();
    graficos.push(item);
    return item;
  }

  const setTexto = (seletor, texto, raiz = document) => $$(seletor, raiz).forEach((el) => { el.textContent = texto; });

  /* ================================================================== */
  /* Sub-navegação: destaca a seção visível                              */
  /* ================================================================== */
  (function subnav() {
    const links = $$(".obs-subnav a[href^='#']");
    if (links.length === 0 || !("IntersectionObserver" in window)) return;
    const linha = $(".obs-subnav-row");
    const mapa = new Map();
    links.forEach((a) => {
      const alvo = document.getElementById(a.getAttribute("href").slice(1));
      if (alvo) mapa.set(alvo, a);
    });
    const visiveis = new Set();
    const marcar = () => {
      const ordem = Array.from(mapa.keys());
      const atual = ordem.find((s) => visiveis.has(s));
      links.forEach((a) => { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
      if (!atual) return;
      const link = mapa.get(atual);
      link.classList.add("is-active");
      link.setAttribute("aria-current", "location");
      if (linha && linha.scrollWidth > linha.clientWidth) {
        const alvoX = link.offsetLeft - (linha.clientWidth - link.offsetWidth) / 2;
        linha.scrollTo({ left: Math.max(0, alvoX), behavior: "auto" });
      }
    };
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { if (e.isIntersecting) visiveis.add(e.target); else visiveis.delete(e.target); });
      marcar();
    }, { rootMargin: "-25% 0px -65% 0px", threshold: 0 });
    mapa.forEach((_, secao) => obs.observe(secao));
  })();

  /* ================================================================== */
  /* Sol e Lua: ícone da lua, lista de fases, duração do dia            */
  /* ================================================================== */
  /** Ícone da Lua visto do Hemisfério Sul: crescente iluminada à esquerda, minguante à direita. */
  function luaSvg(f) {
    const r = 44;
    const k = (1 - Math.cos(2 * Math.PI * f)) / 2;
    const a = Math.abs(1 - 2 * k) * r;
    const crescente = f < 0.5;
    const gibosa = k >= 0.5;
    let luz = "";
    if (k > 0.985) luz = `<circle cx="48" cy="48" r="${r}" fill="#f1e9cc"/>`;
    else if (k > 0.012) {
      luz = crescente
        ? `<path d="M48 4A${r} ${r} 0 0 0 48 92A${num(a)} ${r} 0 0 ${gibosa ? 0 : 1} 48 4Z" fill="#f1e9cc"/>`
        : `<path d="M48 4A${r} ${r} 0 0 1 48 92A${num(a)} ${r} 0 0 ${gibosa ? 1 : 0} 48 4Z" fill="#f1e9cc"/>`;
    }
    return `<svg viewBox="0 0 96 96" width="96" height="96" aria-hidden="true" focusable="false"><circle cx="48" cy="48" r="${r}" fill="#1f2b2e" stroke="rgba(216,189,131,.55)" stroke-width="1.5"/>${luz}</svg>`;
  }

  (function solELua() {
    if (!$("[data-moon-icon]")) return;
    const lua = BT.astro.faseDaLua(new Date());
    $$("[data-moon-icon]").forEach((el) => { el.innerHTML = luaSvg(lua.fracao); }); // SVG gerado aqui
    const fmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    $$("[data-moon-phases]").forEach((ul) => {
      ul.replaceChildren(...lua.proximas.map((fase) => {
        const li = document.createElement("li");
        const b = document.createElement("b");
        b.textContent = fase.rotulo;
        li.append(b, document.createTextNode(` · ${fmt.format(fase.data)}`));
        return li;
      }));
    });
  })();

  montar("chart-daylength", (w) => {
    const hoje = dataLocal(new Date());
    const ano = hoje.y;
    const pontos = [];
    for (let i = 0; i < 366; i += 1) {
      const dt = new Date(Date.UTC(ano, 0, 1 + i));
      if (dt.getUTCFullYear() !== ano) break;
      const ev = BT.astro.eventosSolares(ano, dt.getUTCMonth() + 1, dt.getUTCDate(), BT.REF.lat, BT.REF.lon);
      pontos.push({ i, h: ev.duracaoMin / 60, m: dt.getUTCMonth(), d: dt.getUTCDate() });
    }
    const n = pontos.length;
    const hs = pontos.map((p) => p.h);
    const esc2 = escalaBonita(Math.min(...hs) - 0.05, Math.max(...hs) + 0.05, 4);
    const H = w < 520 ? 250 : 300;
    const l = 58, r = 14, t = 42, b = 30;
    const x = lin(0, n - 1, l, w - r);
    const y = lin(esc2.min, esc2.max, H - b, t);
    const tickLabel = (v) => horaMin(v).replace(" 00 min", "").replace(" min", "");
    let s = abrirSvg(w, H);
    s += `<g class="grid ax">`;
    esc2.ticks.forEach((v) => { s += `<line x1="${l}" x2="${w - r}" y1="${num(y(v))}" y2="${num(y(v))}"/><text x="${l - 8}" y="${num(y(v)) + 4}" text-anchor="end">${esc(tickLabel(v))}</text>`; });
    s += `</g><g class="ax">`;
    MES.forEach((m, idx) => {
      const di = Math.round((Date.UTC(ano, idx, 15) - Date.UTC(ano, 0, 1)) / 86400000);
      if (w < 480 && idx % 2 === 1) return;
      s += `<text x="${num(x(di))}" y="${H - 8}" text-anchor="middle">${m}</text>`;
    });
    s += `</g>`;
    s += `<path d="${caminho(pontos.map((p) => [x(p.i), y(p.h)]))}" fill="none" stroke="${COR.tmax}" stroke-width="2.4" stroke-linejoin="round"/>`;
    const min = pontos.reduce((a, p) => (p.h < a.h ? p : a));
    const max = pontos.reduce((a, p) => (p.h > a.h ? p : a));
    [[min, "Mín.", 1], [max, "Máx.", -1]].forEach(([p, rot, dir]) => {
      s += `<circle cx="${num(x(p.i))}" cy="${num(y(p.h))}" r="3.5" fill="${COR.tmax}"/>`;
      const ancora = x(p.i) > w * 0.7 ? "end" : x(p.i) < w * 0.3 ? "start" : "middle";
      s += `<text class="lbl-small" x="${num(x(p.i))}" y="${num(y(p.h)) + (dir === 1 ? 20 : -10)}" text-anchor="${ancora}">${rot} ${esc(horaMin(p.h))} · ${p.d} ${MES[p.m]}</text>`;
    });
    const di = Math.round((Date.UTC(hoje.y, hoje.m - 1, hoje.d) - Date.UTC(ano, 0, 1)) / 86400000);
    const hojeP = pontos[clamp(di, 0, n - 1)];
    const px = x(hojeP.i), py = y(hojeP.h);
    const ancoraHoje = px > w * 0.62 ? "end" : "start";
    s += `<line x1="${num(px)}" x2="${num(px)}" y1="${t - 22}" y2="${H - b}" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="3 4"/>`;
    s += `<circle cx="${num(px)}" cy="${num(py)}" r="5.5" fill="#fffefa" stroke="currentColor" stroke-width="2"/>`;
    s += `<text class="lbl" x="${num(px) + (ancoraHoje === "end" ? -9 : 9)}" y="${t - 26}" text-anchor="${ancoraHoje}">Hoje · ${esc(horaMin(hojeP.h))}</text>`;
    return `${s}</svg>`;
  });

  /* ================================================================== */
  /* Previsão: indicadores, gráfico das próximas 24 h, tabela, herói     */
  /* ================================================================== */
  let horasPrevisao = [];

  function desenharHorario(w) {
    const horas = horasPrevisao;
    const n = horas.length;
    if (n < 2) return "";
    const estreito = w < 520;
    const l = 42, r = 12, t = 22;
    const hT = estreito ? 130 : 150;
    const yT0 = t, yT1 = t + hT;
    const yR0 = yT1 + 34, yR1 = yR0 + 62;
    const b = 26;
    const alturaTotal = yR1 + b;
    const temps = horas.map((h) => h.temp);
    const eT = escalaBonita(Math.min(...temps) - 0.5, Math.max(...temps) + 0.5, 4);
    const maxChuva = Math.max(...horas.map((h) => h.chuva || 0));
    const topoChuva = Math.max(1, Math.ceil(maxChuva));
    const x = (i) => l + ((i + 0.5) * (w - l - r)) / n;
    const yT = lin(eT.min, eT.max, yT1, yT0);
    const yR = lin(0, topoChuva, yR1, yR0);
    const largBarra = Math.max(3, ((w - l - r) / n) * 0.66);
    const corT = "#f0b35c", corR = "#7cb7d9";

    let s = abrirSvg(w, alturaTotal);
    s += `<g class="grid ax">`;
    eT.ticks.forEach((v) => { s += `<line x1="${l}" x2="${w - r}" y1="${num(yT(v))}" y2="${num(yT(v))}"/><text x="${l - 8}" y="${num(yT(v)) + 4}" text-anchor="end">${nf0.format(v)}°</text>`; });
    [0, topoChuva].forEach((v) => { s += `<line x1="${l}" x2="${w - r}" y1="${num(yR(v))}" y2="${num(yR(v))}"/><text x="${l - 8}" y="${num(yR(v)) + 4}" text-anchor="end">${nf0.format(v)}</text>`; });
    s += `</g>`;
    s += `<text class="lbl-small" x="${l}" y="${yR0 - 10}" style="fill:rgba(255,254,250,.7)">Chuva por hora (mm)</text>`;
    s += `<text class="lbl-small" x="${l}" y="${yT0 - 8}" style="fill:rgba(255,254,250,.7)">Temperatura (°C)</text>`;

    const timezone = BT.previsaoLocalidade?.timezone || TZ;
    const fmtDiaLocal = new Intl.DateTimeFormat("pt-BR", { timeZone: timezone, weekday: "short" });
    const locais = horas.map((h) => dataLocal(h.instante, timezone));
    const passoRotulo = estreito ? 6 : 3;
    s += `<g class="ax">`;
    locais.forEach((loc, i) => {
      if (loc.h % passoRotulo === 0) s += `<text x="${num(x(i))}" y="${alturaTotal - 8}" text-anchor="middle">${loc.h}h</text>`;
      if (loc.h === 0 && i > 0) {
        const xd = x(i) - (w - l - r) / n / 2;
        s += `<line x1="${num(xd)}" x2="${num(xd)}" y1="${yT0}" y2="${yR1}" stroke="rgba(255,255,255,.35)" stroke-dasharray="3 4"/>`;
        s += `<text x="${num(xd) + 5}" y="${yT0 + 12}" style="fill:rgba(255,254,250,.85)">${esc(fmtDiaLocal.format(new Date(horas[i].instante)).replace(".", ""))}</text>`;
      }
    });
    s += `</g>`;

    horas.forEach((h, i) => {
      const alt = yR1 - yR(h.chuva || 0);
      if ((h.chuva || 0) > 0) s += `<rect x="${num(x(i) - largBarra / 2)}" y="${num(yR(h.chuva))}" width="${num(largBarra)}" height="${num(Math.max(1.5, alt))}" fill="${corR}"/>`;
    });
    s += `<path d="${caminho(horas.map((h, i) => [x(i), yT(h.temp)]))}" fill="none" stroke="${corT}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
    const iMax = temps.indexOf(Math.max(...temps));
    const iMin = temps.indexOf(Math.min(...temps));
    [[iMax, "Máx."], [iMin, "Mín."]].forEach(([i, rot]) => {
      const ancora = x(i) > w * 0.75 ? "end" : x(i) < w * 0.25 ? "start" : "middle";
      const acima = rot === "Máx.";
      s += `<circle cx="${num(x(i))}" cy="${num(yT(temps[i]))}" r="4" fill="${corT}"/>`;
      s += `<text class="lbl" x="${num(x(i))}" y="${num(yT(temps[i])) + (acima ? -9 : 19)}" text-anchor="${ancora}" style="fill:#fffefa">${rot} ${nf1f.format(temps[i])}° · ${locais[i].h}h</text>`;
    });
    horas.forEach((h, i) => {
      s += `<rect x="${num(x(i) - (w - l - r) / n / 2)}" y="${yT0}" width="${num((w - l - r) / n)}" height="${yR1 - yT0}" fill="transparent"><title>${locais[i].h}h: ${nf1.format(h.temp)} °C, chuva ${nf1.format(h.chuva || 0)} mm</title></rect>`;
    });
    return `${s}</svg>`;
  }

  legenda($("#chart-hourly"), [
    { tipo: "linha", cor: "#f0b35c", rotulo: "Temperatura (°C)" },
    { tipo: "barra", cor: "#7cb7d9", rotulo: "Chuva na hora (mm)" }
  ]);
  const graficoHorario = montar("chart-hourly", desenharHorario);

  function preencherTabelaHoraria(horas) {
    const corpo = $("#table-hourly tbody");
    if (!corpo) return;
    const timezone = BT.previsaoLocalidade?.timezone || TZ;
    const formatoDataHoraLocal = new Intl.DateTimeFormat("pt-BR", {
      timeZone: timezone, weekday: "short", hour: "2-digit", minute: "2-digit"
    });
    corpo.replaceChildren(...horas.map((h) => {
      const tr = document.createElement("tr");
      const celulas = [
        formatoDataHoraLocal.format(new Date(h.instante)),
        isNum(h.temp) ? `${nf1.format(h.temp)} °C` : "—",
        isNum(h.umidade) ? `${nf0.format(h.umidade)}%` : "—",
        isNum(h.ventoKmh) ? `${nf0.format(h.ventoKmh)} km/h` : "—",
        `${nf1.format(h.chuva || 0)} mm`
      ];
      celulas.forEach((texto, idx) => {
        const td = document.createElement(idx === 0 ? "th" : "td");
        if (idx === 0) td.scope = "row";
        td.textContent = texto;
        tr.append(td);
      });
      return tr;
    }));
  }

  function pintarIndicadores(modelo) {
    const caixa = $("[data-indicators]");
    const lista = $("[data-indicators-list]");
    if (!caixa || !lista) return;
    const itens = modelo.indicadores.length > 0
      ? modelo.indicadores.map((i) => ({ texto: i.texto, classe: i.nivel === "info" ? "is-info" : "" }))
      : [{ texto: "Nenhum dos limites de referência foi ultrapassado nas próximas 48 h (trovoadas, chuva, vento, umidade e temperatura).", classe: "is-ok" }];
    lista.replaceChildren(...itens.map((i) => {
      const li = document.createElement("li");
      if (i.classe) li.className = i.classe;
      li.textContent = i.texto;
      return li;
    }));
    caixa.hidden = false;
  }

  function pintarPrevisaoObs(modelo) {
    const horas = modelo.horas.slice(0, 24);
    horasPrevisao = horas;
    const card = $("[data-hourly-card]");
    if (card && horas.length >= 6) {
      card.hidden = false;
      if (graficoHorario) graficoHorario.render();
      preencherTabelaHoraria(horas);
    }
    pintarIndicadores(modelo);
    const atual = modelo.atual;
    setTexto('[data-hero="temp"]', isNum(atual.temp) ? `${nf1.format(atual.temp)} °C` : "—");
    const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: modelo.timezone || TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(atual.instante));
    setTexto('[data-hero="cond"]', `${atual.condicao || "Condição não disponível"} · ${hora}`);
  }

  function falhaPrevisaoObs() {
    setTexto('[data-hero="temp"]', "—");
    setTexto('[data-hero="cond"]', "Previsão indisponível agora");
    const card = $("[data-hourly-card]");
    if (card) card.hidden = true;
  }

  document.addEventListener("bt:previsao", (e) => pintarPrevisaoObs(e.detail));
  document.addEventListener("bt:previsao-erro", falhaPrevisaoObs);
  if (BT.previsaoAtual) pintarPrevisaoObs(BT.previsaoAtual);
  else if (BT.previsaoErro) falhaPrevisaoObs();

  /* ================================================================== */
  /* Clima observado (INMET, Juína, 2024)                                */
  /* ================================================================== */
  if (!D) {
    const nota = $("[data-coverage-note] p");
    if (nota) nota.textContent = "Os dados desta seção não foram carregados (arquivo data/observatorio-dados.js).";
  } else {
    iniciarClima();
    iniciarRegiao();
  }

  function iniciarClima() {
    const mensal = D.monthly;
    const nomeMes = (m) => MES_LONGO[m.m - 1];

    // Aviso de cobertura, gerado a partir dos próprios dados.
    const semMin = mensal.filter((m) => m.tmin === null).map(nomeMes);
    const semChuva = mensal.filter((m) => m.rain === null).map(nomeMes);
    const chuvaParcial = mensal.filter((m) => m.rain !== null && m.rainValid < m.days).map(nomeMes);
    const nota = $("[data-coverage-note] p");
    if (nota) {
      const partes = [`A estação registrou temperatura em ${nf1.format(D.station.covPct)}% das horas de ${D.station.year}.`];
      if (semMin.length) partes.push(`Não há temperatura mínima confiável em ${listaPt(semMin)}.`);
      if (semChuva.length) partes.push(`Não há chuva confiável em ${listaPt(semChuva)}.`);
      if (chuvaParcial.length) partes.push(`Em ${listaPt(chuvaParcial)}, a chuva é parcial: nem todos os dias têm medição.`);
      partes.push("Esses meses aparecem hachurados ou sem valor nos gráficos. Não somamos um total anual de chuva para Juína, porque um ano incompleto subestima o acumulado.");
      nota.textContent = partes.join(" ");
    }

    // Indicadores-chave
    const kpis = $("[data-kpis]");
    if (kpis) {
      const e = D.extremes;
      const cartoes = [
        { rotulo: "Horas com dados", valor: `${nf1.format(D.station.covPct)}%`, detalhe: `${nf0.format(D.station.hoursTemp)} de ${nf0.format(D.station.hoursTotal)} horas`, cor: COR.ur },
        { rotulo: "Máxima do ano", valor: `${nf1f.format(e.tmax.v)} °C`, detalhe: dataCurta(e.tmax.date), cor: COR.tmax },
        { rotulo: "Mínima do ano", valor: `${nf1f.format(e.tmin.v)} °C`, detalhe: `${dataCurta(e.tmin.date)} · só dias confiáveis`, cor: COR.tmin },
        { rotulo: "Maior chuva em um dia", valor: `${nf1f.format(e.rain.v)} mm`, detalhe: dataCurta(e.rain.date), cor: COR.chuva },
        { rotulo: "Dias com UR mínima < 30%", valor: `${nf0.format(e.rh30days)}`, detalhe: `de ${nf0.format(e.rh30of)} dias com dados · menor valor ${nf0.format(e.rhmin.v)}%`, cor: COR.seca }
      ];
      kpis.replaceChildren(...cartoes.map((c) => {
        const div = document.createElement("div");
        div.className = "kpi";
        div.style.setProperty("--kpi", c.cor);
        const a = document.createElement("span"); a.textContent = c.rotulo;
        const b = document.createElement("strong"); b.textContent = c.valor;
        const d = document.createElement("small"); d.textContent = c.detalhe;
        div.append(a, b, d);
        return div;
      }));
    }

    preencherTabelaMensal(mensal);
    legenda($("#chart-monthly"), [
      { tipo: "barra", cor: COR.chuva, rotulo: "Chuva (dias com dados)" },
      { tipo: "linha", cor: COR.tmax, rotulo: "Máxima média" },
      { tipo: "linha", cor: COR.tmin, rotulo: "Mínima média" },
      { tipo: "hachura", cor: COR.lacuna, rotulo: "Dado parcial ou ausente" }
    ]);
    montar("chart-monthly", desenharMensal);

    iniciarCalendario();
    iniciarCicloDiario();
    iniciarRosa();
  }

  function preencherTabelaMensal(mensal) {
    const corpo = $("#table-monthly tbody");
    if (!corpo) return;
    corpo.replaceChildren(...mensal.map((m) => {
      const tr = document.createElement("tr");
      const parcial = m.rain !== null && m.rainValid < m.days;
      const chuva = m.rain === null ? "sem dados confiáveis" : `${nf1.format(m.rain)} mm${parcial ? ` (${m.rainValid} de ${m.days} dias)` : ""}`;
      const dias = m.rain === null ? "—" : parcial ? `${m.rainDays} (nos ${m.rainValid} dias com dados)` : String(m.rainDays);
      const cels = [
        MES_LONGO[m.m - 1],
        `${m.cov}% das horas`,
        chuva,
        dias,
        m.tmax === null ? "—" : `${nf1f.format(m.tmax)} °C`,
        m.tmin === null ? "—" : `${nf1f.format(m.tmin)} °C`,
        m.rhmin === null ? "—" : `${nf0.format(m.rhmin)}%`
      ];
      cels.forEach((texto, idx) => {
        const td = document.createElement(idx === 0 ? "th" : "td");
        if (idx === 0) td.scope = "row";
        td.textContent = texto;
        tr.append(td);
      });
      return tr;
    }));
  }

  function desenharMensal(w) {
    const mensal = D.monthly;
    const estreito = w < 520;
    const l = estreito ? 38 : 46, r = 8;
    const hA = estreito ? 120 : 150;
    const hB = estreito ? 130 : 150;
    const yA0 = 22, yA1 = yA0 + hA;
    const yB0 = yA1 + 40, yB1 = yB0 + hB;
    const yCov0 = yB1 + 48, yCov1 = yCov0 + 22;
    const alturaTotal = yCov1 + 6;
    const faixa = (w - l - r) / 12;
    const cx = (i) => l + faixa * (i + 0.5);
    const larg = Math.max(8, faixa * 0.62);

    const chuvas = mensal.map((m) => m.rain).filter((v) => v !== null);
    const eA = escalaBonita(0, Math.max(...chuvas) * 1.08, 4);
    const tmaxs = mensal.map((m) => m.tmax).filter((v) => v !== null);
    const tmins = mensal.map((m) => m.tmin).filter((v) => v !== null);
    const eB = escalaBonita(Math.min(...tmins) - 1, Math.max(...tmaxs) + 1.5, 4);
    const yA = lin(eA.min, eA.max, yA1, yA0);
    const yB = lin(eB.min, eB.max, yB1, yB0);

    const idLac = novoId("lac");
    const idParc = novoId("parc");
    let s = abrirSvg(w, alturaTotal);
    s += `<defs>${padraoLacuna(idLac)}${padraoCor(idParc, COR.chuva)}</defs>`;

    s += `<g class="grid ax">`;
    eA.ticks.forEach((v) => { s += `<line x1="${l}" x2="${w - r}" y1="${num(yA(v))}" y2="${num(yA(v))}"/><text x="${l - 6}" y="${num(yA(v)) + 4}" text-anchor="end">${nf0.format(v)}</text>`; });
    eB.ticks.forEach((v) => { s += `<line x1="${l}" x2="${w - r}" y1="${num(yB(v))}" y2="${num(yB(v))}"/><text x="${l - 6}" y="${num(yB(v)) + 4}" text-anchor="end">${nf0.format(v)}°</text>`; });
    s += `</g>`;
    s += `<text class="lbl-small" x="${l}" y="${yA0 - 8}">Chuva no mês (mm)</text>`;
    s += `<text class="lbl-small" x="${l}" y="${yB0 - 10}">Média das máximas e das mínimas (°C)</text>`;

    mensal.forEach((m, i) => {
      const nome = MES_LONGO[i];
      if (m.rain === null) {
        s += `<rect x="${num(cx(i) - larg / 2)}" y="${yA0}" width="${num(larg)}" height="${hA}" fill="url(#${idLac})" stroke="${COR.lacuna}" stroke-width=".8"><title>${nome}: sem dados confiáveis de chuva</title></rect>`;
        return;
      }
      const parcial = m.rainValid < m.days;
      const alt = Math.max(0, yA1 - yA(m.rain));
      s += `<rect x="${num(cx(i) - larg / 2)}" y="${num(yA(m.rain))}" width="${num(larg)}" height="${num(alt)}" fill="${parcial ? `url(#${idParc})` : COR.chuva}" stroke="${COR.chuva}" stroke-width="${parcial ? 1.3 : 0}"><title>${nome}: ${nf1.format(m.rain)} mm${parcial ? ` (parcial: ${m.rainValid} de ${m.days} dias com dados)` : ""}</title></rect>`;
      if (faixa >= 22 || m.rain >= 150) s += `<text class="lbl-small" x="${num(cx(i))}" y="${num(yA(m.rain)) - 5}" text-anchor="middle">${nf0.format(m.rain)}${parcial ? "*" : ""}</text>`;
    });

    const linhaT = (campo, cor, deslocamento) => {
      const pontos = mensal.map((m, i) => (m[campo] === null ? null : [cx(i), yB(m[campo])]));
      let g = `<path d="${caminho(pontos)}" fill="none" stroke="${cor}" stroke-width="2.4" stroke-linejoin="round"/>`;
      mensal.forEach((m, i) => {
        if (m[campo] === null) return;
        g += `<circle cx="${num(cx(i))}" cy="${num(yB(m[campo]))}" r="3.6" fill="${cor}"><title>${MES_LONGO[i]}: ${nf1.format(m[campo])} °C</title></circle>`;
        if (faixa >= 46) g += `<text class="lbl-small" x="${num(cx(i))}" y="${num(yB(m[campo])) + deslocamento}" text-anchor="middle">${nf1.format(m[campo])}</text>`;
      });
      return g;
    };
    s += linhaT("tmax", COR.tmax, -9);
    s += linhaT("tmin", COR.tmin, 17);

    s += `<g class="ax">`;
    mensal.forEach((m, i) => { s += `<text x="${num(cx(i))}" y="${yB1 + 18}" text-anchor="middle">${MES[i]}</text>`; });
    s += `</g>`;
    s += `<text class="lbl-small" x="${l}" y="${yCov0 - 6}">Horas com dados no mês (%)</text>`;
    mensal.forEach((m, i) => {
      const op = 0.18 + 0.82 * (m.cov / 100);
      s += `<rect x="${num(cx(i) - faixa / 2 + 1)}" y="${yCov0}" width="${num(faixa - 2)}" height="22" fill="${COR.ur}" fill-opacity="${num(op)}"><title>${MES_LONGO[i]}: ${m.cov}% das horas com dados</title></rect>`;
      s += `<text x="${num(cx(i))}" y="${yCov0 + 15}" text-anchor="middle" style="font-size:11px;font-weight:700;fill:${m.cov >= 60 ? "#fffefa" : "#192326"}">${m.cov}</text>`;
    });
    return `${s}</svg>`;
  }

  /* ---------- Calendário diário ---------- */

  function iniciarCalendario() {
    const caixa = $("#chart-heat");
    if (!caixa) return;
    const estado = { metrica: "tmax" };
    const ano = D.station.year;
    const diasNoMes = (m) => new Date(Date.UTC(ano, m + 1, 0)).getUTCDate();

    const leitura = document.createElement("p");
    leitura.className = "note-small heat-readout";
    leitura.setAttribute("aria-live", "polite");
    leitura.textContent = "Toque em um dia (ou passe o cursor) para ver o valor.";
    const textoDia = (indice, def) => {
      const dt = new Date(Date.UTC(ano, 0, 1 + indice));
      const rotuloData = `${dt.getUTCDate()} de ${MES_LONGO[dt.getUTCMonth()]}`;
      const v = D.daily[def.campo][indice];
      if (v === null || v === undefined) return `${rotuloData}: sem dados confiáveis`;
      const fmt = def.casas === 0 ? nf0 : nf1;
      return `${rotuloData}: ${def.nome} de ${fmt.format(v)} ${def.unidade}`;
    };

    const montado = montar("chart-heat", (w) => {
      const def = FAIXAS[estado.metrica];
      const serie = D.daily[def.campo];
      const esq = w < 520 ? 30 : 40;
      const topo = 22;
      const cw = (w - esq - 2) / 31;
      const alt = clamp(cw * 0.95, 14, 24);
      const total = topo + 12 * alt + 4;
      const idLac = novoId("calh");
      const ext = D.extremes[def.campo === "tmax" ? "tmax" : def.campo === "rhmin" ? "rhmin" : "rain"];
      let s = abrirSvg(w, total);
      s += `<defs>${padraoLacuna(idLac)}</defs><g class="ax">`;
      const marcas = w < 520 ? [1, 10, 20, 30] : [1, 5, 10, 15, 20, 25, 30];
      marcas.forEach((d) => { s += `<text x="${num(esq + (d - 0.5) * cw)}" y="${topo - 8}" text-anchor="middle">${d}</text>`; });
      let indice = 0;
      for (let m = 0; m < 12; m += 1) {
        const y = topo + m * alt;
        s += `<text x="${esq - 6}" y="${num(y + alt / 2 + 4)}" text-anchor="end">${MES[m]}</text>`;
        for (let d = 1; d <= diasNoMes(m); d += 1) {
          const v = serie[indice];
          const falta = v === null || v === undefined;
          const iso = `${ano}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const destaque = ext && ext.date === iso && !falta;
          s += `<rect class="cell" data-i="${indice}" x="${num(esq + (d - 1) * cw + 0.5)}" y="${num(y + 1)}" width="${num(cw - 1)}" height="${num(alt - 2)}" fill="${falta ? `url(#${idLac})` : corDaFaixa(def, v)}"${destaque ? ` stroke="#192326" stroke-width="2"` : ""}><title>${esc(textoDia(indice, def))}</title></rect>`;
          indice += 1;
        }
      }
      s += `</g>`;
      return `${s}</svg>`;
    });

    const atualizarLegenda = () => {
      const def = FAIXAS[estado.metrica];
      legenda(caixa, [
        ...def.faixas.map((f) => ({ tipo: "barra", cor: f.cor, rotulo: f.rotulo })),
        { tipo: "hachura", cor: COR.lacuna, rotulo: "sem dados confiáveis" }
      ]);
      const ul = caixa.nextElementSibling;
      if (ul && !ul.nextElementSibling?.classList.contains("heat-readout")) ul.insertAdjacentElement("afterend", leitura);
    };
    atualizarLegenda();

    const mostrar = (evento) => {
      const alvo = evento.target instanceof Element ? evento.target.closest("rect.cell") : null;
      if (!alvo) return;
      leitura.textContent = textoDia(Number(alvo.getAttribute("data-i")), FAIXAS[estado.metrica]);
    };
    caixa.addEventListener("click", mostrar);
    caixa.addEventListener("mouseover", mostrar);

    $$("[data-heat-metric]").forEach((botao) => {
      botao.addEventListener("click", () => {
        estado.metrica = botao.getAttribute("data-heat-metric");
        $$("[data-heat-metric]").forEach((b) => b.setAttribute("aria-pressed", String(b === botao)));
        const def = FAIXAS[estado.metrica];
        caixa.setAttribute("aria-label", `Calendário diário de ${D.station.year}: ${def.nome}`);
        if (montado) montado.render();
        atualizarLegenda();
        leitura.textContent = "Toque em um dia (ou passe o cursor) para ver o valor.";
      });
    });
  }

  /* ---------- Ciclo do dia ---------- */
  function iniciarCicloDiario() {
    const desenhar = (campo, unidade, sufixoTick) => (w) => {
      const umida = D.diurnal.wet[campo];
      const seca = D.diurnal.dry[campo];
      const todos = [...umida, ...seca].filter(isNum);
      const e = escalaBonita(Math.min(...todos) - 1, Math.max(...todos) + 1, 4);
      const H = w < 420 ? 230 : 250;
      const l = 40, r = 14, t = 20, b = 30;
      const x = lin(0, 23, l, w - r);
      const y = lin(e.min, e.max, H - b, t);
      let s = abrirSvg(w, H);
      s += `<g class="grid ax">`;
      e.ticks.forEach((v) => { s += `<line x1="${l}" x2="${w - r}" y1="${num(y(v))}" y2="${num(y(v))}"/><text x="${l - 6}" y="${num(y(v)) + 4}" text-anchor="end">${nf0.format(v)}${sufixoTick}</text>`; });
      s += `</g><g class="ax">`;
      for (let h = 0; h <= 21; h += 3) s += `<text x="${num(x(h))}" y="${H - 8}" text-anchor="middle">${h}h</text>`;
      s += `</g>`;
      const serie = (valores, cor, rotulo) => {
        let g = `<path d="${caminho(valores.map((v, h) => (isNum(v) ? [x(h), y(v)] : null)))}" fill="none" stroke="${cor}" stroke-width="2.6" stroke-linejoin="round"/>`;
        const ext = campo === "temp" ? Math.max(...valores.filter(isNum)) : Math.min(...valores.filter(isNum));
        const h = valores.indexOf(ext);
        const ancora = x(h) > w * 0.72 ? "end" : "middle";
        const dy = campo === "temp" ? -9 : 19;
        g += `<circle cx="${num(x(h))}" cy="${num(y(ext))}" r="4" fill="${cor}"><title>${rotulo}: ${campo === "temp" ? "máxima" : "mínima"} média de ${nf1.format(ext)}${unidade} às ${h}h</title></circle>`;
        g += `<text class="lbl" x="${num(x(h))}" y="${num(y(ext)) + dy}" text-anchor="${ancora}" style="fill:${cor}">${nf0.format(ext)}${sufixoTick} · ${h}h</text>`;
        return g;
      };
      s += serie(umida, COR.umida, "Época chuvosa");
      s += serie(seca, COR.seca, "Época seca");
      return `${s}</svg>`;
    };
    const itens = [
      { tipo: "linha", cor: COR.umida, rotulo: "Época chuvosa (jan–mar)" },
      { tipo: "linha", cor: COR.seca, rotulo: "Época seca (jun–ago)" }
    ];
    legenda($("#chart-diurnal-temp"), itens);
    legenda($("#chart-diurnal-rh"), itens);
    montar("chart-diurnal-temp", desenhar("temp", " °C", "°"));
    montar("chart-diurnal-rh", desenhar("rh", "%", "%"));
  }

  /* ---------- Rosa dos ventos ---------- */
  function iniciarRosa() {
    const caixa = $("#chart-windrose");
    if (!caixa) return;
    const { rose, calmPct, bins } = D.windrose;
    const totais = rose.map((linha) => linha.reduce((a, v) => a + v, 0));
    const maior = Math.max(...totais);
    const iTop = totais.indexOf(maior);
    const coresFaixa = ["#a7cfe0", "#4f93b8", "#1f4d73"];
    const ponto = (cx, cy, raio, graus) => [cx + raio * Math.sin((graus * Math.PI) / 180), cy - raio * Math.cos((graus * Math.PI) / 180)];

    legenda(caixa, bins.map((rotulo, i) => ({ tipo: "barra", cor: coresFaixa[i], rotulo })));
    const nota = document.createElement("p");
    nota.className = "note-small";
    const ul = caixa.nextElementSibling;
    if (ul) ul.insertAdjacentElement("afterend", nota);
    const pontos16 = BT.direcaoDoVento ? BT.direcaoDoVento(iTop * 22.5) : "";
    nota.textContent = `Calmaria (vento abaixo de 0,5 m/s): ${nf1.format(calmPct)}% das horas. Direção mais frequente: de ${pontos16} (${nf1.format(maior)}% das horas). As barras indicam de onde o vento sopra (N = norte, L = leste, S = sul, O = oeste). O vento é medido a 10 m de altura.`;

    montar("chart-windrose", (w) => {
      const lado = Math.min(w, 460);
      const cx = lado / 2, cy = lado / 2 + 2;
      const R = lado / 2 - 26;
      const r0 = 10;
      const topo = escalaBonita(0, maior * 1.05, 3);
      const raio = lin(0, topo.max, r0, R);
      let s = abrirSvg(lado, lado + 4);
      s += `<g fill="none" class="ax">`;
      topo.ticks.forEach((v) => {
        if (v === 0) return;
        s += `<circle cx="${cx}" cy="${cy}" r="${num(raio(v))}" stroke="rgba(25,35,38,.16)"/>`;
        const [lx, ly] = ponto(cx, cy, raio(v), 11.25);
        s += `<text x="${num(lx + 2)}" y="${num(ly) + 4}" style="fill:#4a5a5e;font-size:11px">${nf0.format(v)}%</text>`;
      });
      for (let g = 0; g < 360; g += 45) {
        const [x2, y2] = ponto(cx, cy, R, g);
        s += `<line x1="${cx}" y1="${cy}" x2="${num(x2)}" y2="${num(y2)}" stroke="rgba(25,35,38,.12)"/>`;
      }
      s += `</g>`;
      rose.forEach((linha, i) => {
        const centro = i * 22.5;
        const a1 = centro - 9.5, a2 = centro + 9.5;
        let acumulado = 0;
        linha.forEach((v, faixa) => {
          if (!(v > 0)) return;
          const ri = raio(acumulado), rf = raio(acumulado + v);
          acumulado += v;
          const [x1, y1] = ponto(cx, cy, ri, a1), [x2, y2] = ponto(cx, cy, rf, a1);
          const [x3, y3] = ponto(cx, cy, rf, a2), [x4, y4] = ponto(cx, cy, ri, a2);
          s += `<path d="M${num(x1)} ${num(y1)}L${num(x2)} ${num(y2)}A${num(rf)} ${num(rf)} 0 0 1 ${num(x3)} ${num(y3)}L${num(x4)} ${num(y4)}A${num(ri)} ${num(ri)} 0 0 0 ${num(x1)} ${num(y1)}Z" fill="${coresFaixa[faixa]}" stroke="#fffefa" stroke-width=".8"><title>Vento de ${BT.direcaoDoVento(centro)}: ${nf2.format(v)}% das horas (${bins[faixa]})</title></path>`;
        });
      });
      s += `<g class="ax" style="font-weight:700">`;
      [["N", 0], ["L", 90], ["S", 180], ["O", 270]].forEach(([rot, g]) => {
        const [tx, ty] = ponto(cx, cy, R + 14, g);
        s += `<text x="${num(tx)}" y="${num(ty) + 4}" text-anchor="middle" style="fill:#192326;font-size:13px">${rot}</text>`;
      });
      s += `</g>`;
      return `${s}</svg>`;
    });
  }

  /* ================================================================== */
  /* Região: estações de Mato Grosso                                     */
  /* ================================================================== */
  function iniciarRegiao() {
    const regional = D.regional;
    const completas = regional.filter((s) => s.rainDays >= 335).sort((a, b) => b.rain - a.rain);
    const juina = regional.find((s) => s.code === D.station.code);
    const barras = [...completas.map((s) => ({ ...s, parcial: false }))];
    if (juina) barras.push({ ...juina, parcial: true });
    barras.sort((a, b) => b.rain - a.rain);

    montar("chart-regional", (w) => {
      const empilhado = w < 560;
      const altLinha = empilhado ? 44 : 30;
      const l = empilhado ? 8 : clamp(Math.round(Math.max(...barras.map((b) => b.name.length)) * 6.8 + 14), 100, 190);
      const r = 90;
      const t = 6, b = 30;
      const H = t + barras.length * altLinha + b;
      const maximo = escalaBonita(0, Math.max(...barras.map((s) => s.rain)), 4);
      const x = lin(0, maximo.max, l, w - r);
      const idLac = novoId("reg");
      const idPar = novoId("regp");
      let s = abrirSvg(w, H);
      s += `<defs>${padraoCor(idPar, COR.chuva)}${padraoLacuna(idLac)}</defs><g class="grid ax">`;
      maximo.ticks.forEach((v) => { s += `<line x1="${num(x(v))}" x2="${num(x(v))}" y1="${t}" y2="${H - b}"/><text x="${num(x(v))}" y="${H - 8}" text-anchor="middle">${nf0.format(v)}</text>`; });
      s += `</g>`;
      barras.forEach((est, i) => {
        const y0 = t + i * altLinha;
        const alturaBarra = empilhado ? 16 : 18;
        const yBarra = empilhado ? y0 + 20 : y0 + (altLinha - alturaBarra) / 2;
        const nome = est.parcial ? `${est.name} (parcial)` : est.name;
        if (empilhado) s += `<text class="lbl" x="${l}" y="${y0 + 14}">${esc(nome)}</text>`;
        else s += `<text class="lbl" x="${l - 8}" y="${num(yBarra + alturaBarra / 2 + 4)}" text-anchor="end">${esc(nome)}</text>`;
        const largura = Math.max(2, x(est.rain) - l);
        const titulo = est.parcial
          ? `${est.name}: ${nf1.format(est.rain)} mm em ${est.rainDays} dias com dados (total parcial)`
          : `${est.name}: ${nf1.format(est.rain)} mm em ${est.rainDays} dias com dados · ${nf0.format(est.km)} km de Juína`;
        s += `<rect x="${l}" y="${num(yBarra)}" width="${num(largura)}" height="${alturaBarra}" fill="${est.parcial ? `url(#${idPar})` : COR.chuva}" stroke="${COR.chuva}" stroke-width="${est.parcial ? 1.3 : 0}"><title>${esc(titulo)}</title></rect>`;
        s += `<text class="lbl-small" x="${num(l + largura + 6)}" y="${num(yBarra + alturaBarra / 2 + 4)}" style="fill:#192326">${nf0.format(est.rain)} mm${est.parcial ? "*" : ""}</text>`;
      });
      return `${s}</svg>`;
    });
    legenda($("#chart-regional"), [
      { tipo: "barra", cor: COR.chuva, rotulo: "Série praticamente completa (335 dias ou mais)" },
      { tipo: "hachura", cor: COR.chuva, rotulo: "* Juína: total parcial, não comparável" }
    ]);

    const corpo = $("#table-regional tbody");
    if (corpo) {
      const proximas = regional.filter((s) => s.code !== D.station.code).slice(0, 8);
      const linhas = [...(juina ? [juina] : []), ...proximas];
      corpo.replaceChildren(...linhas.map((est) => {
        const tr = document.createElement("tr");
        const chuva = est.rainDays === 0 ? "sem dados"
          : est.rainDays >= 335 ? `${nf0.format(est.rain)} mm (${est.rainDays} dias)`
            : `${nf0.format(est.rain)} mm em ${est.rainDays} dias (parcial)`;
        const cels = [
          est.code === D.station.code ? `${est.name} (referência)` : `${est.name} · ${est.code}`,
          est.code === D.station.code ? "—" : `${nf0.format(est.km)} km`,
          est.cov > 0 ? `${nf0.format(est.cov)}%` : "sem dados",
          chuva,
          isNum(est.tmaxAbs) ? `${nf1.format(est.tmaxAbs)} °C` : "—"
        ];
        cels.forEach((texto, idx) => {
          const td = document.createElement(idx === 0 ? "th" : "td");
          if (idx === 0) td.scope = "row";
          td.textContent = texto;
          tr.append(td);
        });
        return tr;
      }));
    }
  }

  /* ================================================================== */
  /* METAR / SPECI: decodificador educativo                              */
  /* ================================================================== */
  const COBERTURA = {
    FEW: "poucas nuvens (1 a 2 oitavos do céu)",
    SCT: "nuvens esparsas (3 a 4 oitavos)",
    BKN: "nuvens fragmentadas (5 a 7 oitavos)",
    OVC: "céu encoberto (8 oitavos)"
  };
  const PREFIXO = { BC: "bancos de", DR: "levantamento baixo de", BL: "levantamento de", SH: "pancada de" };
  const POSFIXO = { MI: "baixo", PR: "parcial", FZ: "congelante" };
  const FENOMENO = {
    DZ: "garoa", RA: "chuva", SN: "neve", SG: "grãos de neve", IC: "cristais de gelo", PL: "grânulos de gelo", GR: "granizo", GS: "granizo pequeno", UP: "precipitação não identificada",
    BR: "névoa úmida", FG: "nevoeiro", FU: "fumaça", VA: "cinzas vulcânicas", DU: "poeira", SA: "areia", HZ: "névoa seca", PY: "borrifos",
    PO: "redemoinhos de poeira ou areia", SQ: "linha de instabilidade (rajadas)", FC: "nuvem funil", SS: "tempestade de areia", DS: "tempestade de poeira"
  };
  const PRECIPITACAO = new Set(["DZ", "RA", "SN", "SG", "IC", "PL", "GR", "GS", "UP"]);

  /** Decodifica um grupo de tempo presente (ex.: -RA, +TSRA, VCSH, BR). Retorna null se não for um grupo válido. */
  function decodificarFenomeno(token) {
    let resto = token;
    let intensidade = "";
    let vizinhanca = false;
    if (resto.startsWith("VC")) { vizinhanca = true; resto = resto.slice(2); }
    else if (resto.startsWith("+")) { intensidade = "forte"; resto = resto.slice(1); }
    else if (resto.startsWith("-")) { intensidade = "fraca"; resto = resto.slice(1); }
    if (resto.length < 2 || resto.length % 2 !== 0) return null;
    const descritores = [];
    const fenomenos = [];
    for (const c of resto.match(/.{2}/g)) {
      if (c === "TS" || PREFIXO[c] || POSFIXO[c]) descritores.push(c);
      else if (FENOMENO[c]) fenomenos.push(c);
      else return null;
    }
    if (descritores.length === 0 && fenomenos.length === 0) return null;
    const nomes = listaPt(fenomenos.map((c) => FENOMENO[c]));
    const antes = descritores.filter((c) => PREFIXO[c]).map((c) => PREFIXO[c]);
    const depois = descritores.filter((c) => POSFIXO[c]).map((c) => POSFIXO[c]);
    let texto;
    if (descritores.includes("TS")) texto = nomes ? `trovoada com ${nomes}` : "trovoada";
    else if (descritores.includes("SH") && !nomes) texto = "pancada de precipitação";
    else texto = [...antes, nomes, ...depois].filter(Boolean).join(" ");
    texto = texto.charAt(0).toUpperCase() + texto.slice(1);
    if (vizinhanca) return `${texto} nas vizinhanças do aeródromo (8 a 16 km)`;
    if (intensidade) return `${texto} (intensidade ${intensidade})`;
    if (fenomenos.some((c) => PRECIPITACAO.has(c))) return `${texto} (intensidade moderada)`;
    return texto;
  }

  const ktParaKmh = (kt) => kt * 1.852;
  const ftParaM = (ft) => Math.round((ft * 0.3048) / 10) * 10;
  const fmtFt = (ft) => `${nf0.format(ft)} ft (≈ ${nf0.format(ftParaM(ft))} m)`;

  function umidadeRelativa(t, td) {
    const a = 17.62, b = 243.12;
    return clamp(100 * Math.exp((a * td) / (b + td) - (a * t) / (b + t)), 0, 100);
  }

  function decodificarMetar(bruto) {
    const limpo = bruto.toUpperCase().replace(/=/g, " ").replace(/\s+/g, " ").trim();
    if (!limpo) return { erro: "Cole um METAR ou SPECI no campo acima." };
    if (limpo.length > 700) return { erro: "O texto é longo demais para um METAR. Cole apenas uma mensagem." };
    const t = limpo.split(" ");
    if (t[0] === "TAF" || t[0] === "SIGMET" || t[0] === "AIRMET") return { erro: `Esta ferramenta decodifica apenas METAR e SPECI (você colou um ${t[0]}).` };

    const linhas = [];
    const avisos = [];
    const naoReconhecidos = [];
    const resumo = [];
    let tipo = null;
    let estacao = null;
    let tempo = null;
    let i = 0;
    const add = (rotulo, tokens, texto) => linhas.push({ rotulo, cru: tokens, texto });

    if (t[i] === "METAR" || t[i] === "SPECI") { tipo = t[i]; i += 1; }
    if (tipo) add("Tipo", tipo, tipo === "METAR" ? "Observação meteorológica regular de aeródromo." : "Observação especial: emitida por mudança significativa entre dois METAR.");
    if (t[i] === "COR") { add("Correção", "COR", "Mensagem corrigida."); i += 1; }

    const reEstacao = /^[A-Z]{4}$/;
    if (reEstacao.test(t[i] || "")) { estacao = t[i]; i += 1; add("Aeródromo", estacao, `Indicador de localidade ICAO, com quatro letras. No Brasil começa com “S” (por exemplo, “SB”); consulte o nome do aeródromo no AISWEB.`); }
    const reTempo = /^(\d{2})(\d{2})(\d{2})Z$/;
    const mt = reTempo.exec(t[i] || "");
    if (mt) {
      tempo = { dia: Number(mt[1]), hora: Number(mt[2]), min: Number(mt[3]) };
      if (tempo.dia < 1 || tempo.dia > 31 || tempo.hora > 23 || tempo.min > 59) avisos.push("O grupo de data e hora tem valores fora do intervalo possível.");
      add("Data e hora", t[i], `Dia ${tempo.dia}, às ${String(tempo.hora).padStart(2, "0")}:${String(tempo.min).padStart(2, "0")} UTC (horário universal; a letra Z indica UTC).`);
      i += 1;
    }
    if (!estacao || !tempo) return { erro: "Não encontrei o aeródromo e o horário no início da mensagem. O formato esperado é, por exemplo: METAR SBXX 091700Z 08006KT 9999 …" };

    let parouEm = null;
    let ventoDito = false, visDito = false, nuvensDitas = false, tempDita = false, pressaoDita = false;
    const nuvens = [];
    const fenomenos = [];

    while (i < t.length) {
      const k = t[i];
      let m;
      if (k === "AUTO") { add("Modo", k, "Observação automática, sem observador humano."); i += 1; continue; }
      if (k === "COR") { add("Correção", k, "Mensagem corrigida."); i += 1; continue; }
      if (k === "NIL") { add("Sem dados", k, "Mensagem sem dados."); i += 1; continue; }
      if (k === "NOSIG") { add("Tendência", k, "Sem mudança significativa prevista nas próximas 2 horas."); i += 1; continue; }
      if (k === "BECMG" || k === "TEMPO" || k === "RMK" || k === "WS") { parouEm = i; break; }

      if ((m = /^(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?(KT|MPS)$/.exec(k))) {
        const unidade = m[4] === "KT" ? "kt" : "m/s";
        const velTxt = m[4] === "KT" ? `${nf0.format(Number(m[2]))} kt` : `${nf0.format(Number(m[2]))} m/s`;
        const kmh = m[4] === "KT" ? ktParaKmh(Number(m[2])) : Number(m[2]) * 3.6;
        let texto;
        if (m[1] !== "VRB" && Number(m[1]) > 360) avisos.push("Direção do vento maior que 360°: confira o texto.");
        if (Number(m[2]) === 0 && m[1] === "000") texto = "Calmo.";
        else {
          const dir = m[1] === "VRB" ? "com direção variável" : `de ${m[1]}° (${BT.direcaoDoVento(Number(m[1]))})`;
          texto = `Vento ${dir}, ${velTxt} (≈ ${nf0.format(kmh)} km/h).`;
          if (m[3]) {
            const rajada = Number(m[3]);
            texto += ` Rajadas de ${nf0.format(rajada)} ${unidade} (≈ ${nf0.format(m[4] === "KT" ? ktParaKmh(rajada) : rajada * 3.6)} km/h).`;
          }
        }
        add("Vento", k, texto);
        resumo.push(texto.replace(/\.$/, ""));
        ventoDito = true; i += 1; continue;
      }
      if ((m = /^(\d{3})V(\d{3})$/.exec(k))) {
        add("Variação da direção", k, `A direção do vento varia entre ${m[1]}° e ${m[2]}°.`);
        i += 1; continue;
      }
      if (k === "CAVOK") {
        const texto = "CAVOK: visibilidade de 10 km ou mais, sem nuvens abaixo de 5.000 ft (1.500 m), sem cumulonimbus (CB) nem torre de cumulus (TCU) e sem fenômenos significativos.";
        add("Visibilidade, tempo e nuvens", k, texto);
        resumo.push("CAVOK (visibilidade de 10 km ou mais, sem nuvens significativas nem fenômenos)");
        visDito = true; nuvensDitas = true; i += 1; continue;
      }
      if (!visDito && (m = /^(\d{4})$/.exec(k))) {
        const metros = Number(m[1]);
        let texto;
        if (metros === 9999) texto = "10 km ou mais.";
        else if (metros === 0) texto = "Menos de 50 m.";
        else if (metros >= 5000) texto = `${nf1.format(metros / 1000)} km.`;
        else texto = `${nf0.format(metros)} m.`;
        add("Visibilidade", k, texto);
        resumo.push(`Visibilidade de ${texto.replace(/\.$/, "").toLowerCase()}`);
        visDito = true; i += 1; continue;
      }
      if (!visDito && (m = /^(P?)(\d{1,2})SM$/.exec(k))) {
        const sm = Number(m[2]);
        const texto = `${m[1] ? "Mais de " : ""}${sm} milha(s) terrestre(s) (≈ ${nf1.format(sm * 1.609)} km).`;
        add("Visibilidade", k, texto); resumo.push(`Visibilidade de ${texto.replace(/\.$/, "").toLowerCase()}`);
        visDito = true; i += 1; continue;
      }
      if (!visDito && /^\d{1,2}$/.test(k) && /^\d\/\d{1,2}SM$/.test(t[i + 1] || "")) {
        const [a, b] = t[i + 1].replace("SM", "").split("/").map(Number);
        const sm = Number(k) + a / b;
        const texto = `${nf2.format(sm)} milha(s) terrestre(s) (≈ ${nf1.format(sm * 1.609)} km).`;
        add("Visibilidade", `${k} ${t[i + 1]}`, texto); resumo.push(`Visibilidade de ${texto.replace(/\.$/, "")}`);
        visDito = true; i += 2; continue;
      }
      if (!visDito && (m = /^(\d)\/(\d{1,2})SM$/.exec(k))) {
        const sm = Number(m[1]) / Number(m[2]);
        const texto = `${nf2.format(sm)} milha(s) terrestre(s) (≈ ${nf1.format(sm * 1.609)} km).`;
        add("Visibilidade", k, texto); resumo.push(`Visibilidade de ${texto.replace(/\.$/, "")}`);
        visDito = true; i += 1; continue;
      }
      if ((m = /^(\d{4})(N|NE|E|SE|S|SW|W|NW)$/.exec(k))) {
        add("Visibilidade em uma direção", k, `${nf0.format(Number(m[1]))} m na direção ${m[2]}.`);
        i += 1; continue;
      }
      if ((m = /^R(\d{2}[LCR]?)\/([PM]?)(\d{4})(?:V([PM]?)(\d{4}))?([UDN])?$/.exec(k))) {
        const prefixo = m[2] === "P" ? "mais de " : m[2] === "M" ? "menos de " : "";
        add("Alcance visual na pista (RVR)", k, `Cabeceira ${m[1]}: ${prefixo}${nf0.format(Number(m[3]))} m${m[5] ? ` a ${m[4] === "P" ? "mais de " : m[4] === "M" ? "menos de " : ""}${nf0.format(Number(m[5]))} m` : ""}.`);
        i += 1; continue;
      }
      if ((m = /^RE([A-Z+-]+)$/.exec(k)) && decodificarFenomeno(m[1])) {
        add("Fenômeno recente", k, `Recente, já cessado: ${decodificarFenomeno(m[1]).toLowerCase()}.`);
        i += 1; continue;
      }
      if ((m = /^(FEW|SCT|BKN|OVC)(\d{3}|\/\/\/)(CB|TCU)?$/.exec(k))) {
        const alt = m[2] === "///" ? null : Number(m[2]) * 100;
        const tipoNuvem = m[3] === "CB" ? " cumulonimbus (CB)" : m[3] === "TCU" ? " torre de cumulus (TCU)" : "";
        const texto = `${COBERTURA[m[1]].replace(/^./, (c) => c.toUpperCase())}${tipoNuvem ? `, ${tipoNuvem.trim()}` : ""}, base ${alt === null ? "não determinada" : `a ${fmtFt(alt)} acima do aeródromo`}.`;
        add("Nuvens", k, texto);
        nuvens.push(`${COBERTURA[m[1]].split(" (")[0]}${tipoNuvem ? ` do tipo ${tipoNuvem.trim()}` : ""} ${alt === null ? "com base não determinada" : `a ${nf0.format(alt)} ft`}`);
        nuvensDitas = true; i += 1; continue;
      }
      if ((m = /^VV(\d{3}|\/\/\/)$/.exec(k))) {
        const alt = m[1] === "///" ? null : Number(m[1]) * 100;
        const texto = alt === null ? "Visibilidade vertical não determinada (céu obscurecido)." : `Visibilidade vertical de ${fmtFt(alt)}: céu obscurecido, sem como ver as nuvens.`;
        add("Visibilidade vertical", k, texto); nuvens.push(alt === null ? "céu obscurecido" : `céu obscurecido, visibilidade vertical de ${nf0.format(alt)} ft`);
        nuvensDitas = true; i += 1; continue;
      }
      if (/^(NSC|SKC|NCD|CLR)$/.test(k)) {
        const textos = { NSC: "Sem nuvens significativas.", SKC: "Céu claro.", NCD: "Nenhuma nuvem detectada (observação automática).", CLR: "Sem nuvens abaixo de 12.000 ft (observação automática)." };
        add("Nuvens", k, textos[k]); nuvens.push(textos[k].replace(/\.$/, "").toLowerCase());
        nuvensDitas = true; i += 1; continue;
      }
      if ((m = /^(M?\d{2})\/(M?\d{2})?$/.exec(k))) {
        const val = (s) => (s.startsWith("M") ? -Number(s.slice(1)) : Number(s));
        const temp = val(m[1]);
        const orv = m[2] ? val(m[2]) : null;
        let texto = `Temperatura do ar de ${nf0.format(temp)} °C`;
        if (orv === null) texto += "; ponto de orvalho não informado.";
        else {
          texto += ` e ponto de orvalho de ${nf0.format(orv)} °C (umidade relativa aproximada de ${nf0.format(umidadeRelativa(temp, orv))}%).`;
          if (orv > temp) avisos.push("O ponto de orvalho está acima da temperatura, o que não é possível. Confira o texto.");
        }
        if (temp > 60 || temp < -90) avisos.push("Temperatura fora do intervalo esperado: confira o texto.");
        add("Temperatura e ponto de orvalho", k, texto);
        resumo.push(orv === null ? `Temperatura de ${nf0.format(temp)} °C` : `Temperatura de ${nf0.format(temp)} °C e ponto de orvalho de ${nf0.format(orv)} °C`);
        tempDita = true; i += 1; continue;
      }
      if ((m = /^Q(\d{4})$/.exec(k))) {
        const hpa = Number(m[1]);
        add("Pressão (QNH)", k, `${hpa} hPa: pressão ajustada ao nível médio do mar, usada para acertar o altímetro.`);
        if (hpa < 850 || hpa > 1100) avisos.push("QNH fora do intervalo usual (850 a 1100 hPa): confira o texto.");
        resumo.push(`QNH ${hpa} hPa`);
        pressaoDita = true; i += 1; continue;
      }
      if ((m = /^A(\d{4})$/.exec(k))) {
        const pol = Number(m[1]) / 100;
        add("Pressão (altímetro)", k, `${nf2.format(pol)} polegadas de mercúrio (≈ ${nf0.format(pol * 33.8639)} hPa).`);
        resumo.push(`Altímetro ${nf2.format(pol)} inHg`);
        pressaoDita = true; i += 1; continue;
      }
      const fen = decodificarFenomeno(k);
      if (fen && !/^(FEW|SCT|BKN|OVC)/.test(k)) {
        add("Tempo presente", k, `${fen}.`);
        fenomenos.push(fen.replace(/ \(intensidade .*\)$/, "").toLowerCase());
        i += 1; continue;
      }
      naoReconhecidos.push(k);
      i += 1;
    }

    if (parouEm !== null) {
      const restante = t.slice(parouEm).join(" ");
      add("Tendência ou observações", restante, "Esta parte (tendência BECMG/TEMPO ou observações RMK) não é decodificada por esta ferramenta. Consulte a fonte oficial.");
    }
    if (!ventoDito) avisos.push("Não encontrei o grupo de vento (por exemplo, 08006KT).");
    if (!visDito) avisos.push("Não encontrei o grupo de visibilidade (por exemplo, 9999).");
    if (!tempDita) avisos.push("Não encontrei o grupo de temperatura e ponto de orvalho (por exemplo, 33/21).");
    if (!pressaoDita) avisos.push("Não encontrei o grupo de pressão (por exemplo, Q1011).");
    if (naoReconhecidos.length) avisos.push(`Grupos não reconhecidos: ${naoReconhecidos.join(" ")}.`);

    const sentencas = [];
    sentencas.push(`${tipo === "SPECI" ? "Observação especial (SPECI)" : "Observação (METAR)"} do aeródromo ${estacao}, no dia ${tempo.dia} às ${String(tempo.hora).padStart(2, "0")}:${String(tempo.min).padStart(2, "0")} UTC.`);
    const corpo = [];
    resumo.forEach((r) => corpo.push(r));
    if (fenomenos.length) corpo.push(`Tempo presente: ${listaPt(fenomenos)}`);
    if (nuvens.length) corpo.push(`Nuvens: ${nuvens.join("; ")}`);
    if (corpo.length) sentencas.push(`${corpo.join(". ")}.`);
    return { linhas, avisos, resumo: sentencas.join(" ") };
  }
  BT.decodificarMetar = decodificarMetar;

  (function iniciarMetar() {
    const entrada = $("#metar-input");
    const saida = $("#metar-output");
    if (!entrada || !saida) return;
    const exemplo = "METAR SBXX 091700Z 08006KT 9999 SCT030 FEW040TCU 33/21 Q1011=";

    function mostrar() {
      const r = decodificarMetar(entrada.value);
      saida.replaceChildren();
      if (r.erro) {
        const p = document.createElement("p");
        p.className = "metar-erro";
        p.textContent = r.erro;
        saida.append(p);
        return;
      }
      const resumo = document.createElement("p");
      resumo.className = "metar-resumo";
      resumo.textContent = r.resumo;
      const tabela = document.createElement("table");
      tabela.className = "metar-tabela";
      const cap = document.createElement("caption");
      cap.className = "sr-only";
      cap.textContent = "Grupos do METAR e seus significados";
      tabela.append(cap);
      const corpo = document.createElement("tbody");
      r.linhas.forEach((linha) => {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.scope = "row";
        th.textContent = linha.rotulo;
        const tdCru = document.createElement("td");
        const code = document.createElement("code");
        code.textContent = linha.cru;
        tdCru.append(code);
        const tdTxt = document.createElement("td");
        tdTxt.textContent = linha.texto;
        tr.append(th, tdCru, tdTxt);
        corpo.append(tr);
      });
      tabela.append(corpo);
      saida.append(resumo, tabela);
      r.avisos.forEach((aviso) => {
        const p = document.createElement("p");
        p.className = "metar-erro";
        p.textContent = aviso;
        saida.append(p);
      });
      const nota = document.createElement("p");
      nota.className = "metar-aviso";
      nota.textContent = "Decodificação educativa. Ela não indica se as condições permitem voar. Confira sempre a mensagem na REDEMET ou no AISWEB.";
      saida.append(nota);
    }

    $("[data-metar-decode]")?.addEventListener("click", mostrar);
    $("[data-metar-example]")?.addEventListener("click", () => { entrada.value = exemplo; mostrar(); entrada.focus(); });
    $("[data-metar-clear]")?.addEventListener("click", () => { entrada.value = ""; saida.replaceChildren(); entrada.focus(); });
    entrada.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); mostrar(); } });
  })();
})();
