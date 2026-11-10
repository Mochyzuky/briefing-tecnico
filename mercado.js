/* Briefing Técnico — Pesquisa de mercado (mercado.html)
 *
 * Módulos
 *   1. Indicadores   · dólar, IC-Br Agropecuária, IPCA e Selic direto dos dados abertos do Banco Central (SGS)
 *   2. Fontes        · busca e filtros sobre data/mercado-fontes.js (o site não copia cotações de terceiros)
 *   3. Calculadoras  · variação, relação de troca, valor do animal, saca × tonelada (tudo no aparelho)
 *   4. Minhas cotações · anotações salvas só neste navegador, com variação e planilha CSV
 *   5. Subnavegação  · destaca a seção visível
 *
 * Depende de script.js para menu, cabeçalho e links do WhatsApp.
 */
(() => {
  "use strict";

  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));
  const isNum = (v) => typeof v === "number" && Number.isFinite(v);
  const nf0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nf4 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const DIA = 86400000;

  function modulo(nome, fn) {
    try { fn(); } catch (erro) { console.error(`[Mercado] O módulo "${nome}" falhou:`, erro); }
  }

  /** Cria um elemento com classe e texto (sem HTML vindo de dados). */
  function el(tag, classe, texto) {
    const no = document.createElement(tag);
    if (classe) no.className = classe;
    if (texto !== undefined && texto !== null) no.textContent = texto;
    return no;
  }

  const sinal = (v, casas = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${(casas === 2 ? nf2 : nf1).format(Math.abs(v))}`;
  const seta = (v) => (v > 0.0001 ? "▲" : v < -0.0001 ? "▼" : "=");
  const semAcento = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  /* ================================================================== */
  /* 1. Indicadores — Banco Central (SGS, dados abertos)                 */
  /* ================================================================== */
  const CACHE_MS = 30 * 60 * 1000;
  const dataBR = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const lerDataBR = (t) => { const [d, m, a] = t.split("/").map(Number); return new Date(Date.UTC(a, m - 1, d)); };
  const fmtDataBR = (d) => `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  const fmtMesAno = (d) => `${MESES[d.getUTCMonth()]}/${String(d.getUTCFullYear()).slice(2)}`;

  async function serieSGS(codigo, consulta, { ignorarCache = false } = {}) {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados${consulta}`;
    const chave = `bt:mercado:sgs:${url}`;
    if (!ignorarCache) {
      try {
        const salvo = JSON.parse(sessionStorage.getItem(chave) || "null");
        if (salvo && Date.now() - salvo.t < CACHE_MS) return salvo.pontos.map((p) => ({ data: new Date(p.data), valor: p.valor }));
      } catch { /* sem cache */ }
    }
    const controle = new AbortController();
    const prazo = setTimeout(() => controle.abort(), 15000);
    try {
      const resposta = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer", signal: controle.signal, headers: { Accept: "application/json" } });
      if (!resposta.ok) throw new Error(`O Banco Central respondeu com status ${resposta.status}.`);
      const bruto = await resposta.json();
      if (!Array.isArray(bruto)) throw new Error("Resposta inesperada do Banco Central.");
      const pontos = bruto
        .map((p) => ({ data: lerDataBR(String(p.data)), valor: Number(String(p.valor).replace(",", ".")) }))
        .filter((p) => isNum(p.valor) && !Number.isNaN(p.data.getTime()));
      if (pontos.length === 0) throw new Error("Série sem valores.");
      try { sessionStorage.setItem(chave, JSON.stringify({ t: Date.now(), pontos: pontos.map((p) => ({ data: p.data.getTime(), valor: p.valor })) })); } catch { /* segue */ }
      return pontos;
    } finally {
      clearTimeout(prazo);
    }
  }

  /** Último ponto com data até `alvo`. */
  const valorAte = (pontos, alvo) => { let achado = null; for (const p of pontos) { if (p.data <= alvo) achado = p; else break; } return achado; };
  /** Último valor de cada mês (para a minilinha de 12 meses). */
  function mensal(pontos, meses = 13) {
    const porMes = new Map();
    pontos.forEach((p) => porMes.set(`${p.data.getUTCFullYear()}-${p.data.getUTCMonth()}`, p));
    return Array.from(porMes.values()).slice(-meses);
  }

  /** Minilinha (sparkline) com leitura ao passar o dedo ou o mouse. */
  function desenharMinilinha(caixa, pontos, formatar) {
    if (!caixa) return;
    caixa.replaceChildren();
    if (pontos.length < 2) return;
    const L = 200, A = 52, M = 6;
    const vals = pontos.map((p) => p.valor);
    const min = Math.min(...vals), max = Math.max(...vals);
    const faixa = max - min || 1;
    const x = (i) => M + (i * (L - 2 * M)) / (pontos.length - 1);
    const y = (v) => A - M - ((v - min) / faixa) * (A - 2 * M);
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${L} ${A}`);
    svg.setAttribute("role", "img");
    const ini = pontos[0], fim = pontos[pontos.length - 1];
    svg.setAttribute("aria-label", `Evolução: ${formatar(ini.valor)} em ${fmtMesAno(ini.data)} e ${formatar(fim.valor)} em ${fmtMesAno(fim.data)}.`);
    const linha = document.createElementNS(NS, "polyline");
    linha.setAttribute("points", pontos.map((p, i) => `${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" "));
    linha.setAttribute("class", "mkt-spark-line");
    const guia = document.createElementNS(NS, "line");
    guia.setAttribute("class", "mkt-spark-guide");
    guia.setAttribute("y1", "2"); guia.setAttribute("y2", String(A - 2));
    guia.style.visibility = "hidden";
    const ponto = document.createElementNS(NS, "circle");
    ponto.setAttribute("r", "4");
    ponto.setAttribute("class", "mkt-spark-dot");
    const alvo = document.createElementNS(NS, "rect");
    alvo.setAttribute("width", String(L)); alvo.setAttribute("height", String(A));
    alvo.setAttribute("fill", "transparent");
    svg.append(guia, linha, ponto, alvo);

    const leitura = el("p", "mkt-spark-read");
    const padrao = `${fmtMesAno(ini.data)} – ${fmtMesAno(fim.data)}`;
    const marcar = (i, ativo) => {
      ponto.setAttribute("cx", x(i).toFixed(1));
      ponto.setAttribute("cy", y(pontos[i].valor).toFixed(1));
      guia.setAttribute("x1", x(i).toFixed(1)); guia.setAttribute("x2", x(i).toFixed(1));
      guia.style.visibility = ativo ? "visible" : "hidden";
      leitura.textContent = ativo ? `${fmtMesAno(pontos[i].data)} · ${formatar(pontos[i].valor)}` : padrao;
    };
    const mover = (evento) => {
      const caixaSvg = svg.getBoundingClientRect();
      const px = ((evento.clientX - caixaSvg.left) / caixaSvg.width) * L;
      const i = Math.max(0, Math.min(pontos.length - 1, Math.round(((px - M) / (L - 2 * M)) * (pontos.length - 1))));
      marcar(i, true);
    };
    alvo.addEventListener("pointermove", mover);
    alvo.addEventListener("pointerdown", mover);
    alvo.addEventListener("pointerleave", () => marcar(pontos.length - 1, false));
    marcar(pontos.length - 1, false);
    caixa.append(svg, leitura);
  }

  function pintarDeltas(cartao, itens) {
    const lista = $("[data-ind-deltas]", cartao);
    if (!lista) return;
    lista.replaceChildren(...itens.filter(Boolean).map(([rotulo, valor, sufixo = "%"]) => {
      const casas = sufixo.includes("p.p.") ? 2 : 1;
      const arred = Number(valor.toFixed(casas)); // seta e sinal coerentes com o número exibido
      const li = el("li");
      li.append(el("span", "mkt-delta-label", rotulo), el("span", "mkt-delta-value", `${seta(arred)} ${sinal(arred, casas)}${sufixo}`));
      return li;
    }));
  }

  const INDICADORES = {
    async dolar(cartao, opcoes) {
      const hoje = new Date();
      const pontos = await serieSGS(1, `?formato=json&dataInicial=${dataBR(new Date(hoje - 400 * DIA))}&dataFinal=${dataBR(hoje)}`, opcoes);
      const ult = pontos[pontos.length - 1];
      const ref30 = valorAte(pontos, new Date(ult.data - 30 * DIA));
      const ref12 = valorAte(pontos, new Date(ult.data - 365 * DIA));
      $("[data-ind-valor]", cartao).textContent = `R$ ${nf4.format(ult.valor)}`;
      pintarDeltas(cartao, [
        ref30 && ["30 dias", (ult.valor / ref30.valor - 1) * 100],
        ref12 && ["12 meses", (ult.valor / ref12.valor - 1) * 100]
      ]);
      desenharMinilinha($("[data-ind-spark]", cartao), mensal(pontos), (v) => `R$ ${nf4.format(v)}`);
      $("[data-ind-data]", cartao).textContent = `Banco Central · série 1 · cotação de ${fmtDataBR(ult.data)}`;
    },
    async icbr(cartao, opcoes) {
      const pontos = await serieSGS(27575, "/ultimos/13?formato=json", opcoes);
      const ult = pontos[pontos.length - 1];
      const ant = pontos[pontos.length - 2];
      const ref12 = pontos.length >= 13 ? pontos[pontos.length - 13] : null;
      $("[data-ind-valor]", cartao).textContent = nf2.format(ult.valor);
      pintarDeltas(cartao, [
        ant && ["No mês", (ult.valor / ant.valor - 1) * 100],
        ref12 && ["12 meses", (ult.valor / ref12.valor - 1) * 100]
      ]);
      desenharMinilinha($("[data-ind-spark]", cartao), pontos, (v) => nf2.format(v));
      $("[data-ind-data]", cartao).textContent = `Banco Central · série 27575 · referência ${fmtMesAno(ult.data)}`;
    },
    async ipca(cartao, opcoes) {
      const pontos = await serieSGS(13522, "/ultimos/13?formato=json", opcoes);
      const ult = pontos[pontos.length - 1];
      const ant = pontos[pontos.length - 2];
      const ref12 = pontos.length >= 13 ? pontos[pontos.length - 13] : null;
      $("[data-ind-valor]", cartao).textContent = `${nf2.format(ult.valor)}%`;
      pintarDeltas(cartao, [
        ant && ["No mês", ult.valor - ant.valor, " p.p."],
        ref12 && ["12 meses", ult.valor - ref12.valor, " p.p."]
      ]);
      desenharMinilinha($("[data-ind-spark]", cartao), pontos, (v) => `${nf2.format(v)}%`);
      $("[data-ind-data]", cartao).textContent = `Banco Central · série 13522 · referência ${fmtMesAno(ult.data)}`;
    },
    async selic(cartao, opcoes) {
      const hoje = new Date();
      const pontos = await serieSGS(432, `?formato=json&dataInicial=${dataBR(new Date(hoje - 400 * DIA))}&dataFinal=${dataBR(new Date(hoje.getTime() + 60 * DIA))}`, opcoes);
      const agora = valorAte(pontos, new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()))) || pontos[pontos.length - 1];
      // Procura a última mudança da meta antes do valor atual.
      const ate = pontos.filter((p) => p.data <= agora.data);
      let i = ate.length - 1;
      while (i >= 0 && ate[i].valor === agora.valor) i -= 1;
      const anterior = i >= 0 ? ate[i] : null;
      const desde = ate[i + 1].data;
      $("[data-ind-valor]", cartao).textContent = `${nf2.format(agora.valor)}%`;
      const lista = $("[data-ind-deltas]", cartao);
      const itens = [];
      if (anterior) {
        const li = el("li");
        li.append(el("span", "mkt-delta-label", `Desde ${fmtDataBR(desde)}`), el("span", "mkt-delta-value", `${seta(agora.valor - anterior.valor)} ${sinal(agora.valor - anterior.valor, 2)} p.p.`));
        itens.push(li);
        const li2 = el("li");
        li2.append(el("span", "mkt-delta-label", "Meta anterior"), el("span", "mkt-delta-value", `${nf2.format(anterior.valor)}%`));
        itens.push(li2);
      } else {
        const li = el("li");
        li.append(el("span", "mkt-delta-label", "Últimos 12 meses"), el("span", "mkt-delta-value", "sem mudança"));
        itens.push(li);
      }
      lista.replaceChildren(...itens);
      $("[data-ind-data]", cartao).textContent = "Banco Central · série 432 · meta vigente";
    }
  };

  modulo("indicadores", () => {
    const secao = $("[data-indicadores]");
    if (!secao) return;
    const status = $("[data-ind-status]", secao);
    const botao = $("[data-ind-refresh]", secao);

    async function carregar(ignorarCache) {
      if (botao) botao.disabled = true;
      secao.setAttribute("aria-busy", "true");
      if (status) status.textContent = "Consultando o Banco Central…";
      const cartoes = $$("[data-ind]", secao);
      const resultados = await Promise.allSettled(cartoes.map((c) => INDICADORES[c.dataset.ind]?.(c, { ignorarCache })));
      let falhas = 0;
      resultados.forEach((r, i) => {
        if (r.status === "rejected") {
          falhas += 1;
          const lista = $("[data-ind-deltas]", cartoes[i]);
          if (lista) lista.replaceChildren(el("li", "mkt-delta-erro", "Não foi possível carregar agora."));
          console.warn("[Mercado] Indicador", cartoes[i].dataset.ind, r.reason);
        }
      });
      const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
      if (status) {
        status.textContent = falhas === cartoes.length
          ? "O Banco Central não respondeu agora. Verifique a conexão e toque em Atualizar."
          : `Consultado às ${hora} · Fonte: Banco Central do Brasil, Sistema Gerenciador de Séries Temporais (dados abertos).${falhas ? " Alguns indicadores não carregaram." : ""}`;
      }
      secao.removeAttribute("aria-busy");
      if (botao) botao.disabled = false;
    }
    if (botao) botao.addEventListener("click", () => carregar(true));
    carregar(false);
  });

  /* ================================================================== */
  /* 2. Fontes de cotação                                                */
  /* ================================================================== */
  modulo("fontes", () => {
    const dados = window.BT_MERCADO;
    const caixa = $("[data-fontes]");
    const form = $("[data-filtros]");
    if (!dados || !caixa || !form) return;

    const chips = $("[data-chips]", form);
    const regiao = $("[data-regiao]", form);
    const busca = $("#mkt-busca", form);
    const contagem = $("[data-contagem]");
    const params = new URLSearchParams(location.search);
    const estado = {
      produto: dados.produtos[params.get("produto")] ? params.get("produto") : "",
      regiao: dados.regioes[params.get("regiao")] ? params.get("regiao") : "",
      q: params.get("q") || ""
    };

    // Monta filtros
    const opcoes = [["", "Todos"], ...Object.entries(dados.produtos)];
    opcoes.forEach(([chave, rotulo]) => {
      const b = el("button", "mkt-chip", rotulo);
      b.type = "button";
      b.dataset.produto = chave;
      chips.append(b);
    });
    Object.entries(dados.regioes).forEach(([chave, rotulo]) => {
      const o = el("option", null, rotulo);
      o.value = chave;
      regiao.append(o);
    });
    regiao.value = estado.regiao;
    busca.value = estado.q;

    const ehExterno = (url) => /^https?:\/\//.test(url);
    const produtosDaFonte = (f) => Array.from(new Set(f.links.flatMap((l) => l.produtos || [])));
    const textoDaFonte = (f) => semAcento([
      f.nome, f.org, f.descricao,
      ...f.links.map((l) => l.rotulo),
      ...produtosDaFonte(f).map((p) => dados.produtos[p]),
      ...f.regioes.map((r) => dados.regioes[r])
    ].join(" "));

    function cartao(f) {
      const art = el("article", "mkt-source");
      const topo = el("header", "mkt-source-top");
      const titulo = el("div");
      titulo.append(el("h3", null, f.nome), el("p", "mkt-source-org", f.org));
      topo.append(titulo);
      if (f.destaque) topo.append(el("span", "mkt-badge", f.destaque));
      art.append(topo, el("p", "mkt-source-desc", f.descricao));

      const tags = el("ul", "mkt-tags");
      tags.setAttribute("aria-label", "Produtos");
      produtosDaFonte(f).forEach((p) => {
        const li = el("li", p === estado.produto ? "is-match" : null, dados.produtos[p]);
        tags.append(li);
      });
      art.append(tags);

      const links = el("div", "mkt-links");
      const lista = estado.produto ? f.links.filter((l) => (l.produtos || []).includes(estado.produto)) : f.links;
      lista.forEach((l) => {
        const a = el("a", "mkt-link");
        a.href = l.url;
        if (ehExterno(l.url)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        a.append(document.createTextNode(l.rotulo), el("span", null, ehExterno(l.url) ? " ↗" : " →"));
        if (ehExterno(l.url)) a.setAttribute("aria-label", `${l.rotulo} — ${f.nome} (abre em nova aba)`);
        links.append(a);
      });
      art.append(links);

      const meta = el("dl", "mkt-meta");
      [["Atualização", f.frequencia], ["Acesso", f.acesso], ["Regiões", f.regioes.map((r) => dados.regioes[r]).join(", ")]].forEach(([dt, dd]) => {
        if (!dd) return;
        const linha = el("div");
        linha.append(el("dt", null, dt), el("dd", null, dd));
        meta.append(linha);
      });
      art.append(meta);
      if (f.aviso) art.append(el("p", "mkt-source-warn", f.aviso));
      return art;
    }

    function atualizarUrl() {
      const p = new URLSearchParams();
      if (estado.produto) p.set("produto", estado.produto);
      if (estado.regiao) p.set("regiao", estado.regiao);
      if (estado.q.trim()) p.set("q", estado.q.trim());
      const qs = p.toString();
      history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`);
    }

    function render() {
      $$(".mkt-chip", chips).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.produto === estado.produto)));
      const termos = semAcento(estado.q).split(/\s+/).filter(Boolean);
      const achadas = dados.fontes.filter((f) =>
        (!estado.produto || produtosDaFonte(f).includes(estado.produto))
        && (!estado.regiao || f.regioes.includes(estado.regiao))
        && termos.every((t) => textoDaFonte(f).includes(t)));

      if (achadas.length === 0) {
        const vazio = el("div", "mkt-empty");
        vazio.append(el("p", null, "Nenhuma fonte encontrada com esses filtros."));
        const limpar = el("button", "button button-ghost", "Limpar filtros");
        limpar.type = "button";
        limpar.addEventListener("click", () => { estado.produto = ""; estado.regiao = ""; estado.q = ""; regiao.value = ""; busca.value = ""; render(); });
        vazio.append(limpar);
        caixa.replaceChildren(vazio);
      } else {
        caixa.replaceChildren(...achadas.map(cartao));
      }
      const partes = [];
      if (estado.produto) partes.push(`para ${dados.produtos[estado.produto]}`);
      if (estado.regiao) partes.push(`em ${dados.regioes[estado.regiao]}`);
      contagem.textContent = `${achadas.length} ${achadas.length === 1 ? "fonte" : "fontes"}${partes.length ? ` ${partes.join(" ")}` : ""}`;
      atualizarUrl();
    }

    chips.addEventListener("click", (e) => {
      const b = e.target instanceof Element ? e.target.closest(".mkt-chip") : null;
      if (!b) return;
      estado.produto = b.dataset.produto;
      render();
    });
    regiao.addEventListener("change", () => { estado.regiao = regiao.value; render(); });
    let espera;
    busca.addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(() => { estado.q = busca.value; render(); }, 150); });
    form.addEventListener("submit", (e) => { e.preventDefault(); estado.q = busca.value; render(); });
    render();
  });

  /* ================================================================== */
  /* 3. Calculadoras                                                     */
  /* ================================================================== */
  const num = (form, nome) => {
    const campo = form.elements.namedItem(nome);
    if (!(campo instanceof HTMLInputElement)) return NaN;
    const v = campo.valueAsNumber;
    return isNum(v) ? v : NaN;
  };
  const POR_UNIDADE = { "R$/@": "por arroba", "R$/saca": "por saca", "R$/cabeça": "por cabeça", "R$/kg": "por kg", "R$/t": "por tonelada" };

  function resultado(saida, principal, detalhes = []) {
    const linhas = [el("strong", "mkt-result-main", principal), ...detalhes.filter(Boolean).map((d) => el("span", "mkt-result-detail", d))];
    saida.replaceChildren(...linhas);
    saida.classList.add("has-value");
  }
  function aviso(saida, texto) {
    saida.replaceChildren(document.createTextNode(texto));
    saida.classList.remove("has-value");
  }

  const CALCULOS = {
    variacao(form, saida) {
      const a = num(form, "anterior"), b = num(form, "atual");
      const unidade = form.elements.namedItem("unidade").value;
      if (!(a > 0) || !isNum(b)) return aviso(saida, "Preencha os dois preços.");
      const dif = b - a;
      const pct = (dif / a) * 100;
      const sufixo = POR_UNIDADE[unidade] ? ` ${POR_UNIDADE[unidade]}` : "";
      const principal = Math.abs(pct) < 0.005 ? "Sem variação" : `${pct > 0 ? "Alta" : "Queda"} de ${nf2.format(Math.abs(pct))}%`;
      resultado(saida, principal, [
        `${dif >= 0 ? "+" : "−"}${brl.format(Math.abs(dif))}${sufixo}`,
        `De ${brl.format(a)} para ${brl.format(b)}${sufixo}`
      ]);
    },
    "troca-boi"(form, saida) {
      const sel = form.elements.namedItem("categoria").value;
      const outro = $("[data-peso-outro]", form);
      if (outro) outro.hidden = sel !== "outro";
      const arrobas = sel === "outro" ? num(form, "arrobas") : Number(sel);
      const repo = num(form, "reposicao"), boi = num(form, "boi");
      if (!(repo > 0) || !(boi > 0)) return aviso(saida, "Preencha os preços do animal e do boi gordo.");
      const relacao = repo / boi;
      const detalhes = [`Para comprar 1 animal são necessárias ${nf2.format(relacao)} arrobas de boi gordo.`];
      if (arrobas > 0) {
        const arrobaRepo = repo / arrobas;
        const agio = (arrobaRepo / boi - 1) * 100;
        detalhes.push(`Arroba do animal de reposição: ${brl.format(arrobaRepo)} (${agio >= 0 ? "ágio" : "deságio"} de ${nf1.format(Math.abs(agio))}% sobre o boi gordo).`);
      }
      resultado(saida, `${nf2.format(relacao)} @ por cabeça`, detalhes);
    },
    "troca-graos"(form, saida) {
      const grao = form.elements.namedItem("grao").value;
      const insumo = (form.elements.namedItem("insumo").value || "").trim() || "insumo";
      const pg = num(form, "graoPreco"), pi = num(form, "insumoPreco");
      if (!(pg > 0) || !(pi > 0)) return aviso(saida, "Preencha os preços do grão e do insumo.");
      const sacas = pi / pg;
      resultado(saida, `${nf1.format(sacas)} sacas por tonelada`, [
        `São ${nf1.format(sacas)} sacas de ${grao} para pagar 1 t de ${insumo}.`,
        `Cada saca paga ${nf1.format(1000 / sacas)} kg de ${insumo}.`
      ]);
    },
    animal(form, saida) {
      const peso = num(form, "peso"), rend = num(form, "rendimento"), preco = num(form, "preco");
      if (!(peso > 0) || !(rend > 0)) return aviso(saida, "Preencha o peso e a cotação.");
      const arrobas = (peso * rend) / 100 / 15;
      if (!(preco > 0)) return resultado(saida, `${nf2.format(arrobas)} @ de carcaça`, ["Informe a cotação para estimar o valor do animal."]);
      const valor = arrobas * preco;
      resultado(saida, brl.format(valor), [
        `${nf2.format(arrobas)} @ de carcaça (${nf1.format(rend)}% de ${nf0.format(peso)} kg)`,
        `Equivale a ${brl.format(valor / peso)} por kg vivo.`
      ]);
    },
    saca(form, saida) {
      const preco = num(form, "precoSaca"), sacas = num(form, "sacas");
      if (!(preco > 0) && !(sacas > 0)) return aviso(saida, "Preencha o preço ou a quantidade de sacas.");
      const detalhes = [];
      let principal = "";
      if (preco > 0) { principal = `${brl.format((preco * 1000) / 60)} por tonelada`; }
      if (sacas > 0) {
        const t = (sacas * 60) / 1000;
        const texto = `${nf2.format(t)} t em ${nf0.format(sacas)} sacas`;
        if (principal) detalhes.push(texto); else principal = texto;
        if (preco > 0) detalhes.push(`Valor da produção: ${brl.format(sacas * preco)}`);
      }
      resultado(saida, principal, detalhes);
    }
  };

  modulo("calculadoras", () => {
    $$("form[data-calc]").forEach((form) => {
      const calcular = CALCULOS[form.dataset.calc];
      const saida = $("[data-resultado]", form);
      if (!calcular || !saida) return;
      const rodar = () => { try { calcular(form, saida); } catch (e) { console.error(e); } };
      form.addEventListener("input", rodar);
      form.addEventListener("change", rodar);
      form.addEventListener("submit", (e) => { e.preventDefault(); rodar(); });
      rodar();
    });
  });

  /* ================================================================== */
  /* 4. Minhas cotações (salvas só neste navegador)                      */
  /* ================================================================== */
  modulo("minhas cotações", () => {
    const form = $("[data-log-form]");
    const corpo = $("[data-log-corpo]");
    if (!form || !corpo) return;
    const CHAVE = "bt:mercado:cotacoes:v1";
    const vazio = $("[data-log-vazio]");
    const filtro = $("[data-log-filtro]");
    const tabela = corpo.closest("table");
    const btnCsv = $("[data-log-csv]");
    const btnLimpar = $("[data-log-limpar]");

    const ler = () => { try { const v = JSON.parse(localStorage.getItem(CHAVE) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
    const gravar = (lista) => { try { localStorage.setItem(CHAVE, JSON.stringify(lista)); return true; } catch { return false; } };
    let registros = ler();

    const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
    const dataCampo = form.elements.namedItem("data");
    if (dataCampo && !dataCampo.value) dataCampo.value = hojeISO();
    const fmtISO = (iso) => { const [a, m, d] = iso.split("-"); return `${d}/${m}/${a}`; };
    const grupo = (r) => `${r.produto}|${semAcento(r.praca).trim()}|${r.unidade}`;
    const ordenar = (lista) => lista.slice().sort((a, b) => (a.data === b.data ? b.id - a.id : a.data < b.data ? 1 : -1));
    const fmtPreco = (r) => `${brl.format(r.preco)}${r.unidade.replace("R$", "")}`;

    /** Variação de cada registro em relação ao anterior (mais antigo) do mesmo produto, praça e unidade. */
    function comVariacao(lista) {
      const asc = ordenar(lista).reverse();
      const ultimoDoGrupo = new Map();
      const variacao = new Map();
      asc.forEach((r) => {
        const anterior = ultimoDoGrupo.get(grupo(r));
        variacao.set(r.id, anterior && anterior.preco > 0 ? ((r.preco - anterior.preco) / anterior.preco) * 100 : null);
        ultimoDoGrupo.set(grupo(r), r);
      });
      return variacao;
    }

    function render() {
      const produtos = Array.from(new Set(registros.map((r) => r.produto))).sort((a, b) => a.localeCompare(b, "pt-BR"));
      const escolhido = filtro.value;
      filtro.replaceChildren(el("option", null, "Todos os produtos"));
      filtro.firstChild.value = "";
      produtos.forEach((p) => { const o = el("option", null, p); o.value = p; filtro.append(o); });
      filtro.value = produtos.includes(escolhido) ? escolhido : "";

      const variacao = comVariacao(registros);
      const visiveis = ordenar(registros).filter((r) => !filtro.value || r.produto === filtro.value);
      corpo.replaceChildren(...visiveis.map((r) => {
        const tr = el("tr");
        const v = variacao.get(r.id);
        const tdVar = el("td", "num");
        if (v === null || v === undefined) tdVar.append(el("span", "mkt-var-first", "primeira"));
        else tdVar.append(el("span", "mkt-var", `${seta(v)} ${sinal(v, 2)}%`));
        const excluir = el("button", "mkt-del", "Excluir");
        excluir.type = "button";
        excluir.setAttribute("aria-label", `Excluir cotação de ${r.produto} em ${fmtISO(r.data)}`);
        excluir.addEventListener("click", () => { registros = registros.filter((x) => x.id !== r.id); gravar(registros); render(); });
        const tdAcao = el("td", "mkt-actions-cell");
        tdAcao.append(excluir);
        tr.append(el("td", null, fmtISO(r.data)), el("td", null, r.produto), el("td", null, r.praca), el("td", "num", fmtPreco(r)), tdVar, tdAcao);
        return tr;
      }));
      const temDados = registros.length > 0;
      if (tabela) tabela.hidden = !temDados;
      if (vazio) vazio.hidden = temDados;
      if (btnCsv) btnCsv.disabled = !temDados;
      if (btnLimpar) btnLimpar.disabled = !temDados;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const preco = num(form, "preco");
      if (!(preco >= 0)) return;
      registros.push({
        id: Date.now(),
        data: form.elements.namedItem("data").value || hojeISO(),
        produto: form.elements.namedItem("produto").value,
        praca: form.elements.namedItem("praca").value.trim(),
        preco,
        unidade: form.elements.namedItem("unidade").value
      });
      if (!gravar(registros)) console.warn("[Mercado] Não foi possível salvar no navegador.");
      form.elements.namedItem("preco").value = "";
      form.elements.namedItem("preco").focus();
      render();
    });
    filtro.addEventListener("change", render);

    if (btnCsv) btnCsv.addEventListener("click", () => {
      const variacao = comVariacao(registros);
      const linhas = [["data", "produto", "praca_ou_fonte", "preco", "unidade", "variacao_%"].join(";")];
      ordenar(registros).forEach((r) => {
        const v = variacao.get(r.id);
        const campo = (t) => `"${String(t).replace(/"/g, '""')}"`;
        linhas.push([fmtISO(r.data), campo(r.produto), campo(r.praca), String(r.preco).replace(".", ","), r.unidade, isNum(v) ? v.toFixed(2).replace(".", ",") : ""].join(";"));
      });
      const blob = new Blob([`﻿${linhas.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = el("a");
      a.href = url;
      a.download = `minhas-cotacoes-${hojeISO()}.csv`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    });

    if (btnLimpar) {
      let armado = null;
      const textoOriginal = btnLimpar.textContent;
      btnLimpar.addEventListener("click", () => {
        if (!armado) {
          btnLimpar.textContent = "Confirmar: apagar tudo";
          btnLimpar.classList.add("is-armed");
          armado = setTimeout(() => { armado = null; btnLimpar.textContent = textoOriginal; btnLimpar.classList.remove("is-armed"); }, 4000);
          return;
        }
        clearTimeout(armado);
        armado = null;
        btnLimpar.textContent = textoOriginal;
        btnLimpar.classList.remove("is-armed");
        registros = [];
        gravar(registros);
        render();
      });
    }
    render();
  });

  /* ================================================================== */
  /* 5. Subnavegação                                                     */
  /* ================================================================== */
  modulo("subnavegação", () => {
    const links = $$("[data-subnav] a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    const pares = links.map((a) => ({ a, s: document.getElementById(a.getAttribute("href").slice(1)) })).filter((p) => p.s);
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        pares.forEach(({ a, s }) => a.classList.toggle("is-active", s === e.target));
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    pares.forEach(({ s }) => obs.observe(s));
  });
})();
