/* Briefing Técnico — script principal (v3 · out/2026)
 *
 * Compartilhado por todas as páginas. Cada módulo só age se a página tiver os elementos dele,
 * e um erro em um módulo não interrompe os demais.
 *
 * Módulos
 *   1. Contato (WhatsApp)    · número em um só lugar, links [data-wa], formulários [data-whatsapp-form]
 *   2. Navegação             · menu do celular, seção atual destacada, sombra do cabeçalho
 *   3. Lista de documentos   · [data-checklist], salva no próprio navegador e envia pelo WhatsApp
 *   4. Efeitos de página     · animação de entrada [data-reveal], contadores [data-count], botão flutuante
 *   5. Astronomia            · Sol e Lua calculados localmente [data-astro]
 *   6. Previsão do tempo     · MET Norway [data-weather]
 *   7. Localidades           · municípios brasileiros em base local
 *
 * Privacidade: o script não coleta dados pessoais nem usa a localização GPS do visitante.
 * Os gráficos do Observatório ficam em observatorio.js.
 */
(() => {
  "use strict";

  const BT = (window.BT = window.BT || {});
  const TZ = "America/Cuiaba";
  const REF = { lat: -11.4205, lon: -58.7549, nome: "Juína, MT", timezone: TZ, country: "Brasil" };
  let localidadePrevisao = { ...REF };
  BT.REF = REF;
  BT.TZ = TZ;
  BT.previsaoLocalidade = localidadePrevisao;

  /** Para trocar o número de atendimento, altere somente aqui. */
  const CONTATO = Object.freeze({ whatsapp: "5566996448934", exibicao: "(66) 99644-8934" });
  BT.CONTATO = CONTATO;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const isNum = (value) => typeof value === "number" && Number.isFinite(value);
  const temObserver = "IntersectionObserver" in window;
  const reduzMovimento = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const nf0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  const fmtDia = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "short", day: "2-digit", month: "short" });
  const fmtDataHora = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const fmtHora = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  const fmtDiaMes = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "short" });
  const partesLocais = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false });

  BT.util = { $, $$, isNum, nf0, nf1, fmtDia, fmtDataHora, fmtHora };

  /** Roda um módulo isolado: se ele falhar, o erro vai para o console e o restante da página segue funcionando. */
  function modulo(nome, fn) {
    try { fn(); } catch (erro) { console.error(`[Briefing Técnico] O módulo "${nome}" falhou:`, erro); }
  }

  /** Leitura e gravação seguras no navegador (modo privado ou armazenamento bloqueado não quebram a página). */
  const armazenamento = {
    ler(chave) { try { return JSON.parse(localStorage.getItem(chave) || "null"); } catch { return null; } },
    gravar(chave, valor) { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* segue sem salvar */ } },
    apagar(chave) { try { localStorage.removeItem(chave); } catch { /* nada a fazer */ } }
  };

  /** Data e hora locais de um instante: { y, m, d, h, chave }. */
  function dataLocal(value, timezone = TZ) {
    const formatador = timezone === TZ ? partesLocais : new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false
    });
    const partes = formatador.formatToParts(new Date(value));
    const get = (type) => Number(partes.find((p) => p.type === type)?.value);
    const y = get("year");
    const m = get("month");
    const d = get("day");
    let h = get("hour");
    if (h === 24) h = 0;
    const dois = (n) => String(n).padStart(2, "0");
    return { y, m, d, h, chave: `${y}-${dois(m)}-${dois(d)}` };
  }
  BT.util.dataLocal = dataLocal;

  /* ================================================================== */
  /* 1. Contato (WhatsApp)                                               */
  /* ================================================================== */
  function linkWhatsApp(texto = "") {
    const url = new URL(`https://wa.me/${CONTATO.whatsapp}`);
    if (texto) url.searchParams.set("text", texto);
    return url.toString();
  }

  /** Abre o WhatsApp em nova aba; se o navegador bloquear, abre na mesma aba. */
  function abrirWhatsApp(texto) {
    const url = linkWhatsApp(texto);
    const janela = window.open(url, "_blank");
    if (janela) janela.opener = null;
    else window.location.assign(url);
  }
  BT.whatsapp = { link: linkWhatsApp, abrir: abrirWhatsApp };

  modulo("links do WhatsApp", () => {
    // <a data-wa="mensagem"> recebe o link com o número central; o href escrito no HTML é a reserva sem JavaScript.
    $$("a[data-wa]").forEach((a) => {
      a.href = linkWhatsApp(a.dataset.wa);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
  });

  /** Nome legível de um campo: data-label → nome conhecido → texto do <label> (sem o "(opcional)"). */
  const ROTULOS_CAMPOS = { aircraft: "Aeronave", message: "Mensagem" };
  function rotuloDoCampo(campo) {
    if (campo.dataset.label) return campo.dataset.label;
    if (ROTULOS_CAMPOS[campo.name]) return ROTULOS_CAMPOS[campo.name];
    const label = campo.id ? document.querySelector(`label[for="${CSS.escape(campo.id)}"]`) : null;
    if (label) {
      const copia = label.cloneNode(true);
      copia.querySelectorAll("span").forEach((s) => s.remove());
      const texto = copia.textContent.trim();
      if (texto) return texto;
    }
    return campo.name;
  }

  modulo("formulários do WhatsApp", () => {
    $$("form[data-whatsapp-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const intro = (form.dataset.waIntro || "").trim();
        const linhas = intro ? [intro] : [];
        for (const campo of Array.from(form.elements)) {
          const ehCampo = campo instanceof HTMLInputElement || campo instanceof HTMLSelectElement || campo instanceof HTMLTextAreaElement;
          if (!ehCampo || !campo.name || campo.disabled) continue;
          if ((campo.type === "checkbox" || campo.type === "radio") && !campo.checked) continue;
          const valor = campo.value.trim();
          if (!valor) continue;
          if (campo.name === "subject") {
            linhas.push(intro ? `Gostaria de conversar sobre: ${valor}.` : `Olá, gostaria de conversar sobre: ${valor}.`);
          } else {
            linhas.push(`${rotuloDoCampo(campo)}: ${valor}`);
          }
        }
        abrirWhatsApp(linhas.join("\n"));
      });
    });
  });

  /* ================================================================== */
  /* 2. Navegação                                                        */
  /* ================================================================== */
  modulo("menu", () => {
    const toggle = $(".menu-toggle");
    const nav = $("#main-navigation");
    if (!toggle || !nav) return;

    const aberto = () => toggle.getAttribute("aria-expanded") === "true";
    const definir = (abrir, devolverFoco = false) => {
      toggle.setAttribute("aria-expanded", String(abrir));
      nav.classList.toggle("is-open", abrir);
      if (!abrir && devolverFoco) toggle.focus();
    };

    toggle.addEventListener("click", () => definir(!aberto()));
    nav.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("a")) definir(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && aberto()) definir(false, true);
    });
    // Fecha ao tocar fora do menu.
    document.addEventListener("click", (event) => {
      if (aberto() && event.target instanceof Node && !nav.contains(event.target) && !toggle.contains(event.target)) definir(false);
    });
    // Fecha ao girar o celular ou alargar a janela para o layout de computador.
    window.matchMedia?.("(min-width: 1001px)").addEventListener?.("change", (e) => { if (e.matches) definir(false); });
  });

  modulo("seção atual no menu", () => {
    if (!temObserver) return;
    const links = $$('#main-navigation a[href^="#"]').filter((a) => a.getAttribute("href").length > 1);
    const pares = links
      .map((a) => ({ a, secao: document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1))) }))
      .filter((p) => p.secao);
    if (pares.length === 0) return;

    const marcar = (secao) => pares.forEach(({ a, secao: s }) => {
      const atual = s === secao;
      a.classList.toggle("is-current", atual);
      if (atual) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { if (e.isIntersecting) marcar(e.target); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    pares.forEach(({ secao }) => observador.observe(secao));
  });

  modulo("cabeçalho", () => {
    const header = $(".site-header");
    if (!header) return;
    let pendente = false;
    const atualizar = () => { header.classList.toggle("is-scrolled", window.scrollY > 8); pendente = false; };
    window.addEventListener("scroll", () => {
      if (!pendente) { pendente = true; requestAnimationFrame(atualizar); }
    }, { passive: true });
    atualizar();
  });

  modulo("ano", () => {
    $$("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });
  });

  /* ================================================================== */
  /* 3. Lista de documentos                                              */
  /* ================================================================== */
  modulo("lista de documentos", () => {
    $$("form[data-checklist]").forEach((form) => {
      const chave = `bt:checklist:${form.dataset.checklist}`;
      const caixas = $$('input[type="checkbox"]', form);
      const progresso = $("[data-checklist-progress]", form);
      const total = caixas.length;
      if (total === 0) return;

      const salvos = armazenamento.ler(chave);
      if (Array.isArray(salvos)) caixas.forEach((c) => { c.checked = salvos.includes(c.value); });

      const atualizar = () => {
        const marcadas = caixas.filter((c) => c.checked);
        if (progresso) progresso.textContent = `Marcados: ${marcadas.length} de ${total} documentos`;
        form.style.setProperty("--progresso", `${Math.round((marcadas.length / total) * 100)}%`);
        if (marcadas.length) armazenamento.gravar(chave, marcadas.map((c) => c.value));
        else armazenamento.apagar(chave);
      };

      form.addEventListener("change", atualizar);
      form.addEventListener("reset", () => setTimeout(atualizar, 0)); // o "reset" limpa as caixas logo depois do evento
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const tenho = caixas.filter((c) => c.checked).map((c) => `• ${c.value}`);
        const faltam = caixas.filter((c) => !c.checked).map((c) => `• ${c.value}`);
        const linhas = ["Olá! Vim pelo site. Sobre os documentos para o atendimento:"];
        if (tenho.length) linhas.push("", "Já tenho:", ...tenho);
        if (faltam.length) linhas.push("", "Ainda não tenho:", ...faltam);
        abrirWhatsApp(linhas.join("\n"));
      });
      atualizar();
    });
  });

  /* ================================================================== */
  /* 4. Efeitos de página                                                */
  /* ================================================================== */
  modulo("animação de entrada", () => {
    const itens = $$("[data-reveal]");
    if (itens.length === 0) return;
    const mostrar = (el) => el.classList.add("is-visible");
    if (!temObserver || reduzMovimento()) { itens.forEach(mostrar); return; }

    // Pequeno atraso em cascata entre itens irmãos (máx. 3 passos).
    itens.forEach((el) => {
      const irmaos = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.hasAttribute("data-reveal")) : [el];
      const posicao = Math.min(irmaos.indexOf(el), 3);
      if (posicao > 0) el.style.transitionDelay = `${posicao * 80}ms`;
    });
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        mostrar(e.target);
        observador.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    itens.forEach((el) => observador.observe(el));
  });

  modulo("contadores", () => {
    const numeros = $$("[data-count]");
    if (numeros.length === 0 || !temObserver || reduzMovimento()) return; // sem animação: fica o número final do HTML

    const animar = (el) => {
      const alvo = Number(el.dataset.count);
      if (!isNum(alvo)) return;
      const duracao = 1200;
      const inicio = performance.now();
      const passo = (agora) => {
        const t = Math.min((agora - inicio) / duracao, 1);
        const suave = 1 - (1 - t) ** 3;
        el.textContent = nf0.format(Math.round(alvo * suave));
        if (t < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    };
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        animar(e.target);
        observador.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    numeros.forEach((el) => observador.observe(el));
  });

  modulo("botão flutuante", () => {
    const botao = $("[data-float-cta]");
    if (!botao) return;
    const gatilho = $("[data-float-trigger]");
    const contato = $("#contato");
    if (!temObserver || !gatilho) { botao.classList.add("is-visible"); return; }

    // Aparece depois da abertura e some quando a seção de contato está na tela.
    const estado = { aberturaVisivel: true, contatoVisivel: false };
    const atualizar = () => botao.classList.toggle("is-visible", !estado.aberturaVisivel && !estado.contatoVisivel);
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.target === gatilho) estado.aberturaVisivel = e.isIntersecting;
        if (e.target === contato) estado.contatoVisivel = e.isIntersecting;
      });
      atualizar();
    }, { threshold: 0 });
    observador.observe(gatilho);
    if (contato) observador.observe(contato);
  });

  /* ================================================================== */
  /* 5. Astronomia: Sol e Lua (cálculo local, sem serviço externo)       */
  /* Algoritmo solar: equações do NOAA (precisão típica de ~1 min).      */
  /* Fases da Lua: séries de Meeus (erro típico de poucos minutos).      */
  /* ================================================================== */
  const RAD = Math.PI / 180;

  function parametrosSolares(jd) {
    const T = (jd - 2451545) / 36525;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T))
      + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T)
      + Math.sin(3 * M * RAD) * 0.000289;
    const lonVerdadeira = L0 + C;
    const omega = 125.04 - 1934.136 * T;
    const lambda = lonVerdadeira - 0.00569 - 0.00478 * Math.sin(omega * RAD);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));
    const y = Math.tan((eps * RAD) / 2) ** 2;
    const eqTempo = 4 * (180 / Math.PI) * (
      y * Math.sin(2 * L0 * RAD)
      - 2 * e * Math.sin(M * RAD)
      + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD)
      - 0.5 * y * y * Math.sin(4 * L0 * RAD)
      - 1.25 * e * e * Math.sin(2 * M * RAD)
    );
    return { decl, eqTempo };
  }

  /** Eventos solares de um dia civil local. lon: graus, leste positivo. */
  function eventosSolares(ano, mes, dia, lat, lon) {
    const inicioDiaUTC = Date.UTC(ano, mes - 1, dia);
    const jdEm = (ms) => ms / 86400000 + 2440587.5;
    let p = parametrosSolares(jdEm(inicioDiaUTC + (720 - 4 * lon) * 60000));
    let meioDiaMin = 720 - 4 * lon - p.eqTempo;
    p = parametrosSolares(jdEm(inicioDiaUTC + meioDiaMin * 60000));
    meioDiaMin = 720 - 4 * lon - p.eqTempo;

    const anguloHorario = (zenite) => {
      const c = (Math.cos(zenite * RAD) - Math.sin(lat * RAD) * Math.sin(p.decl)) / (Math.cos(lat * RAD) * Math.cos(p.decl));
      return c > 1 || c < -1 ? null : Math.acos(c) / RAD;
    };
    const em = (min) => new Date(inicioDiaUTC + min * 60000);
    const h0 = anguloHorario(90.833);
    const hc = anguloHorario(96);
    return {
      meioDia: em(meioDiaMin),
      nascer: h0 === null ? null : em(meioDiaMin - 4 * h0),
      ocaso: h0 === null ? null : em(meioDiaMin + 4 * h0),
      crepusculoInicio: hc === null ? null : em(meioDiaMin - 4 * hc),
      crepusculoFim: hc === null ? null : em(meioDiaMin + 4 * hc),
      duracaoMin: h0 === null ? null : 8 * h0,
      declinacao: p.decl / RAD
    };
  }

  const LUNACAO = 29.530588861;

  /** Instante (UTC) de uma fase lunar, pelas séries de Meeus (cap. 49), com os termos principais.
   *  k inteiro = lua nova; +0,25 = quarto crescente; +0,5 = lua cheia; +0,75 = quarto minguante. Erro típico de poucos minutos. */
  function instanteDaFase(k) {
    const T = k / 1236.85;
    const jde = 2451550.09766 + LUNACAO * k + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T - 0.00000011 * T ** 3) * RAD;
    const Ml = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4) * RAD;
    const F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4) * RAD;
    const O = (124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T ** 3) * RAD;
    const sin = Math.sin;
    const tipo = Math.round((k - Math.floor(k)) * 4) % 4;
    let c;
    if (tipo === 0 || tipo === 2) {
      const cheia = tipo === 2;
      c = (cheia ? -0.40614 : -0.4072) * sin(Ml)
        + (cheia ? 0.17302 : 0.17241) * E * sin(M)
        + (cheia ? 0.01614 : 0.01608) * sin(2 * Ml)
        + (cheia ? 0.01043 : 0.01039) * sin(2 * F)
        + (cheia ? 0.00734 : 0.00739) * E * sin(Ml - M)
        - (cheia ? 0.00515 : 0.00514) * E * sin(Ml + M)
        + (cheia ? 0.00209 : 0.00208) * E * E * sin(2 * M)
        - 0.00111 * sin(Ml - 2 * F) - 0.00057 * sin(Ml + 2 * F)
        + 0.00056 * E * sin(2 * Ml + M) - 0.00042 * sin(3 * Ml)
        + 0.00042 * E * sin(M + 2 * F) + 0.00038 * E * sin(M - 2 * F)
        - 0.00024 * E * sin(2 * Ml - M) - 0.00017 * sin(O);
    } else {
      c = -0.62801 * sin(Ml) + 0.17172 * E * sin(M) - 0.01183 * E * sin(Ml + M)
        + 0.00862 * sin(2 * Ml) + 0.00804 * sin(2 * F) + 0.00454 * E * sin(Ml - M)
        + 0.00204 * E * E * sin(2 * M) - 0.0018 * sin(Ml - 2 * F) - 0.0007 * sin(Ml + 2 * F)
        - 0.0004 * sin(3 * Ml) - 0.00034 * E * sin(2 * Ml - M) + 0.00032 * E * sin(M + 2 * F)
        + 0.00032 * E * sin(M - 2 * F) - 0.00028 * E * E * sin(Ml + 2 * M)
        + 0.00027 * E * sin(2 * Ml + M) - 0.00017 * sin(O);
      const W = 0.00306 - 0.00038 * E * Math.cos(M) + 0.00026 * Math.cos(Ml) - 0.00002 * Math.cos(Ml - M)
        + 0.00002 * Math.cos(Ml + M) + 0.00002 * Math.cos(2 * F);
      c += tipo === 1 ? W : -W;
    }
    return new Date((jde + c - 2440587.5) * 86400000);
  }

  const NOMES_FASES = ["Lua nova", "Quarto crescente", "Lua cheia", "Quarto minguante"];
  const kInicial = (data) => Math.floor((data.getTime() / 86400000 + 2440587.5 - 2451550.09766) / LUNACAO) - 1;

  function proximasFases(data, quantas = 4) {
    const k0 = kInicial(data);
    const achadas = [];
    for (let i = 0; i < 16; i += 1) {
      const k = k0 + i * 0.25;
      const instante = instanteDaFase(k);
      if (instante > data) achadas.push({ rotulo: NOMES_FASES[Math.round((k - Math.floor(k)) * 4) % 4], data: instante });
    }
    return achadas.sort((a, b) => a.data - b.data).slice(0, quantas);
  }

  /** Fase atual: ângulo entre as fases adjacentes, interpolado pelas fases reais. */
  function faseDaLua(data) {
    const k0 = kInicial(data);
    let anterior = null;
    let seguinte = null;
    for (let i = 0; i < 16; i += 1) {
      const k = k0 + i * 0.25;
      const t = instanteDaFase(k);
      if (t <= data) anterior = { k, t };
      else { seguinte = { k, t }; break; }
    }
    // Proteção: se a busca não cercar a data (não deve ocorrer), usa a lunação média.
    const fracaoDoQuarto = anterior && seguinte ? (data - anterior.t) / (seguinte.t - anterior.t) : 0;
    const kBase = anterior ? anterior.k : (data.getTime() / 86400000 + 2440587.5 - 2451550.09766) / LUNACAO;
    const f = (((kBase + 0.25 * fracaoDoQuarto) % 1) + 1) % 1;
    const iluminacao = (1 - Math.cos(2 * Math.PI * f)) / 2;
    let nome = "Minguante";
    if (f < 0.04 || f > 0.96) nome = "Lua nova";
    else if (f < 0.22) nome = "Crescente";
    else if (f < 0.28) nome = "Quarto crescente";
    else if (f < 0.46) nome = "Crescente gibosa";
    else if (f < 0.54) nome = "Lua cheia";
    else if (f < 0.72) nome = "Minguante gibosa";
    else if (f < 0.78) nome = "Quarto minguante";
    return { fracao: f, idadeDias: f * LUNACAO, iluminacao, nome, proximas: proximasFases(data) };
  }

  BT.astro = { eventosSolares, faseDaLua, instanteDaFase, proximasFases };

  /** Painel Sol e Lua (qualquer página com [data-astro]). */
  BT.pintarAstro = function pintarAstro(raiz = document) {
    const agora = new Date();
    const hoje = dataLocal(agora);
    const ev = eventosSolares(hoje.y, hoje.m, hoje.d, REF.lat, REF.lon);
    const lua = faseDaLua(agora);
    const set = (seletor, texto) => $$(seletor, raiz).forEach((el) => { el.textContent = texto; });
    const hhmm = (d) => (d ? fmtHora.format(d) : "—");
    const duracao = (min) => (isNum(min) ? `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, "0")} min` : "—");

    set("[data-sun-rise]", hhmm(ev.nascer));
    set("[data-sun-set]", hhmm(ev.ocaso));
    set("[data-sun-noon]", hhmm(ev.meioDia));
    set("[data-sun-length]", duracao(ev.duracaoMin));
    set("[data-sun-dawn]", hhmm(ev.crepusculoInicio));
    set("[data-sun-dusk]", hhmm(ev.crepusculoFim));
    set("[data-moon-name]", lua.nome);
    set("[data-moon-illum]", `${nf0.format(lua.iluminacao * 100)}% iluminada`);
    const prox = lua.proximas[0];
    set("[data-moon-next]", prox ? `${prox.rotulo}: ${fmtDiaMes.format(prox.data)}` : "—");
    return { ev, lua, hoje };
  };
  modulo("Sol e Lua", () => { if ($("[data-astro]")) BT.pintarAstro(); });

  /* ================================================================== */
  /* 6. Previsão: MET Norway (Locationforecast 2.0, CC BY 4.0)           */
  /* ================================================================== */
  const URL_PREVISAO = "https://api.met.no/weatherapi/locationforecast/2.0/compact";
  const URL_MUNICIPIOS = "data/municipios/";
  const CACHE_MS = 10 * 60 * 1000;
  const ESTADOS = [
    ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"], ["BA", "Bahia"], ["CE", "Ceará"],
    ["DF", "Distrito Federal"], ["ES", "Espírito Santo"], ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"],
    ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
    ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
    ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
    ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"]
  ];

  const ROTULOS = [
    ["thunder", "Trovoadas"],
    ["heavyrainshowers", "Pancadas fortes de chuva"],
    ["lightrainshowers", "Pancadas fracas de chuva"],
    ["rainshowers", "Pancadas de chuva"],
    ["heavyrain", "Chuva forte"],
    ["lightrain", "Chuva fraca"],
    ["rain", "Chuva"],
    ["fog", "Nevoeiro"],
    ["partlycloudy", "Parcialmente nublado"],
    ["cloudy", "Nublado"],
    ["fair", "Poucas nuvens"],
    ["clearsky", "Céu limpo"]
  ];

  function rotuloCondicao(simbolo) {
    if (typeof simbolo !== "string") return null;
    const codigo = simbolo.toLowerCase().split("_")[0];
    if (codigo.includes("thunder")) return "Trovoadas";
    // Variantes como "lightsleet" ou "heavysnowshowers" não começam pelo nome base.
    if (codigo.includes("sleet")) return "Chuva com gelo";
    if (codigo.includes("snow")) return "Neve";
    const achado = ROTULOS.find(([prefixo]) => codigo.startsWith(prefixo));
    if (achado) return achado[1];
    return codigo.includes("rain") ? "Chuva" : null;
  }

  /** Tipo de ícone a partir do código de símbolo. */
  function tipoIcone(simbolo) {
    if (typeof simbolo !== "string") return "nuvem";
    const s = simbolo.toLowerCase();
    const noite = s.endsWith("_night");
    if (s.includes("thunder")) return "trovoada";
    if (s.includes("heavyrain")) return "chuva-forte";
    if (s.includes("rain") || s.includes("sleet") || s.includes("snow")) return "chuva";
    if (s.startsWith("fog")) return "nevoeiro";
    if (s.startsWith("partlycloudy") || s.startsWith("fair")) return noite ? "lua-nuvem" : "sol-nuvem";
    if (s.startsWith("clearsky")) return noite ? "lua" : "sol";
    return "nuvem";
  }

  const SVG_BASE = (conteudo) => `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${conteudo}</svg>`;
  const ICONES = {
    sol: SVG_BASE('<circle cx="16" cy="16" r="5.2"/><path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2.1 2.1M22.4 22.4l2.1 2.1M7.5 24.5l2.1-2.1M22.4 9.6l2.1-2.1"/>'),
    lua: SVG_BASE('<path d="M22.5 20.5A9 9 0 0 1 11.5 9.5a9 9 0 1 0 11 11z"/>'),
    "sol-nuvem": SVG_BASE('<circle cx="12" cy="11" r="4"/><path d="M12 3v1.8M4.6 11H6.4M6.8 5.8l1.3 1.3M17.2 5.8l-1.3 1.3"/><path d="M11 25h11a4.5 4.5 0 0 0 .6-8.96A6 6 0 0 0 11.2 17.2 3.9 3.9 0 0 0 11 25z"/>'),
    "lua-nuvem": SVG_BASE('<path d="M15.5 6.5a5.5 5.5 0 1 0 6 7.3 4.6 4.6 0 0 1-6-7.3z"/><path d="M11 26h11a4.5 4.5 0 0 0 .6-8.96A6 6 0 0 0 11.2 18.2 3.9 3.9 0 0 0 11 26z"/>'),
    nuvem: SVG_BASE('<path d="M9 24h14a5 5 0 0 0 .7-9.95A7.2 7.2 0 0 0 9.9 12.6 5.7 5.7 0 0 0 9 24z"/>'),
    chuva: SVG_BASE('<path d="M9 19h14a5 5 0 0 0 .7-9.95A7.2 7.2 0 0 0 9.9 7.6 5.7 5.7 0 0 0 9 19z"/><path d="M11 23l-1.4 3M16 23l-1.4 3M21 23l-1.4 3"/>'),
    "chuva-forte": SVG_BASE('<path d="M9 18h14a5 5 0 0 0 .7-9.95A7.2 7.2 0 0 0 9.9 6.6 5.7 5.7 0 0 0 9 18z"/><path d="M10 21.5l-1.6 4M14.5 21.5l-1.6 4M19 21.5l-1.6 4M23 21.5l-1.6 4"/>'),
    trovoada: SVG_BASE('<path d="M9 18h14a5 5 0 0 0 .7-9.95A7.2 7.2 0 0 0 9.9 6.6 5.7 5.7 0 0 0 9 18z"/><path d="M16.8 18.5l-3.3 4.5h4l-2.4 4.5"/>'),
    nevoeiro: SVG_BASE('<path d="M9 15h14a4.6 4.6 0 0 0 .6-9.1A6.6 6.6 0 0 0 10.1 5 5.2 5.2 0 0 0 9 15z"/><path d="M6 19.5h20M9 23.5h14M12 27.5h8"/>')
  };
  BT.icone = (simbolo) => ICONES[tipoIcone(simbolo)] || ICONES.nuvem;

  const PONTOS_CARDEAIS = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  const direcaoDoVento = (graus) => (isNum(graus) ? PONTOS_CARDEAIS[Math.round((((graus % 360) + 360) % 360) / 22.5) % 16] : null);
  BT.direcaoDoVento = direcaoDoVento;

  /** Ponto de orvalho (fórmula de Magnus). */
  function pontoDeOrvalho(temp, umidade) {
    if (!isNum(temp) || !isNum(umidade) || umidade <= 0) return null;
    const a = 17.62;
    const b = 243.12;
    const alfa = Math.log(umidade / 100) + (a * temp) / (b + temp);
    return (b * alfa) / (a - alfa);
  }

  function interpretarPrevisao(payload, timezone = TZ) {
    const serie = payload?.properties?.timeseries;
    if (!Array.isArray(serie) || serie.length === 0) throw new Error("A fonte não retornou períodos de previsão.");

    const valida = serie
      .map((item) => ({ item, instante: item?.data?.instant?.details }))
      .filter(({ item, instante }) => typeof item?.time === "string" && isNum(instante?.air_temperature));
    if (valida.length === 0) throw new Error("A fonte não retornou os campos esperados.");

    const primeiro = valida[0];
    const det = primeiro.instante;
    const proximo = primeiro.item.data.next_1_hours || primeiro.item.data.next_6_hours || primeiro.item.data.next_12_hours;

    const atual = {
      instante: primeiro.item.time,
      simbolo: proximo?.summary?.symbol_code ?? null,
      condicao: rotuloCondicao(proximo?.summary?.symbol_code),
      temp: det.air_temperature,
      umidade: det.relative_humidity,
      ventoKmh: isNum(det.wind_speed) ? det.wind_speed * 3.6 : null,
      ventoDirecao: det.wind_from_direction,
      pressao: det.air_pressure_at_sea_level,
      nuvens: det.cloud_area_fraction,
      orvalho: pontoDeOrvalho(det.air_temperature, det.relative_humidity),
      chuva1h: proximo === primeiro.item.data.next_1_hours ? proximo?.details?.precipitation_amount ?? null : null
    };

    const horas = [];
    for (const { item, instante } of valida) {
      const h1 = item.data.next_1_hours;
      if (!h1) continue;
      horas.push({
        instante: item.time,
        temp: instante.air_temperature,
        umidade: instante.relative_humidity,
        ventoKmh: isNum(instante.wind_speed) ? instante.wind_speed * 3.6 : null,
        nuvens: instante.cloud_area_fraction,
        chuva: isNum(h1.details?.precipitation_amount) ? h1.details.precipitation_amount : 0,
        simbolo: h1.summary?.symbol_code ?? null
      });
      if (horas.length >= 48) break;
    }

    const dias = new Map();
    for (const { item, instante } of valida) {
      const local = dataLocal(item.time, timezone);
      const dia = dias.get(local.chave) || {
        chave: local.chave, min: Infinity, max: -Infinity, chuva: 0, ventoMaxKmh: 0, umidadeMin: Infinity,
        condicoes: new Map(), simbolos: new Map(), amostras: 0
      };
      dia.amostras += 1;
      const dados = item.data;
      const periodo = dados.next_1_hours || dados.next_6_hours || dados.next_12_hours;
      const h6 = dados.next_6_hours?.details;
      dia.min = Math.min(dia.min, instante.air_temperature, isNum(h6?.air_temperature_min) ? h6.air_temperature_min : Infinity);
      dia.max = Math.max(dia.max, instante.air_temperature, isNum(h6?.air_temperature_max) ? h6.air_temperature_max : -Infinity);
      if (isNum(instante.wind_speed)) dia.ventoMaxKmh = Math.max(dia.ventoMaxKmh, instante.wind_speed * 3.6);
      if (isNum(instante.relative_humidity)) dia.umidadeMin = Math.min(dia.umidadeMin, instante.relative_humidity);
      const mm = dados.next_1_hours?.details?.precipitation_amount ?? (dados.next_1_hours ? null : dados.next_6_hours?.details?.precipitation_amount);
      if (isNum(mm)) dia.chuva += mm;
      const rotulo = rotuloCondicao(periodo?.summary?.symbol_code);
      if (rotulo) {
        // Dá mais peso ao período diurno (6h–20h) ao resumir o dia.
        const peso = local.h >= 6 && local.h <= 20 ? 2 : 1;
        dia.condicoes.set(rotulo, (dia.condicoes.get(rotulo) || 0) + peso);
        dia.simbolos.set(rotulo, periodo.summary.symbol_code.replace("_night", "_day"));
      }
      dias.set(local.chave, dia);
    }

    const lista = Array.from(dias.values()).map((dia) => {
      const ordenadas = Array.from(dia.condicoes.entries()).sort((a, b) => b[1] - a[1]);
      const rotulo = ordenadas[0]?.[0] ?? null;
      return {
        chave: dia.chave,
        min: dia.min, max: dia.max, chuva: dia.chuva, ventoMaxKmh: dia.ventoMaxKmh,
        umidadeMin: Number.isFinite(dia.umidadeMin) ? dia.umidadeMin : null,
        condicao: rotulo, simbolo: rotulo ? dia.simbolos.get(rotulo) : null, amostras: dia.amostras
      };
    });

    const atualizado = payload.properties.meta?.updated_at ?? null;
    const modelo = { atual, horas, dias: lista, atualizado, timezone };
    modelo.indicadores = derivarIndicadores(modelo);
    return modelo;
  }

  /** Indicadores automáticos a partir do modelo; não substituem alertas oficiais. */
  function derivarIndicadores(modelo) {
    const itens = [];
    const prox24 = modelo.horas.slice(0, 24);
    const prox48 = modelo.horas.slice(0, 48);
    const chuva24 = prox24.reduce((soma, h) => soma + (isNum(h.chuva) ? h.chuva : 0), 0);
    const ventoMax = Math.max(0, ...prox48.map((h) => h.ventoKmh ?? 0));
    const umidMin = Math.min(...prox48.map((h) => (isNum(h.umidade) ? h.umidade : Infinity)));
    const tempMax = Math.max(-Infinity, ...prox48.map((h) => h.temp));
    const trovoada = prox24.some((h) => typeof h.simbolo === "string" && h.simbolo.includes("thunder"));

    if (trovoada) itens.push({ nivel: "atencao", texto: "Trovoadas previstas nas próximas 24 h" });
    if (chuva24 >= 20) itens.push({ nivel: "atencao", texto: `Chuva acumulada prevista de ${nf0.format(chuva24)} mm em 24 h` });
    else if (chuva24 >= 5) itens.push({ nivel: "info", texto: `Chuva prevista: ${nf1.format(chuva24)} mm em 24 h` });
    if (ventoMax >= 36) itens.push({ nivel: "atencao", texto: `Vento previsto de até ${nf0.format(ventoMax)} km/h` });
    if (Number.isFinite(umidMin) && umidMin < 30) itens.push({ nivel: "atencao", texto: `Umidade relativa prevista abaixo de 30% (mínima de ${nf0.format(umidMin)}%) nas próximas 48 h` });
    if (Number.isFinite(tempMax) && tempMax >= 35) itens.push({ nivel: "atencao", texto: `Temperatura prevista de até ${nf1.format(tempMax)} °C nas próximas 48 h` });
    return itens;
  }

  function chaveCache(localidade) {
    return `bt:previsao:v3:${localidade.lat.toFixed(4)},${localidade.lon.toFixed(4)}`;
  }
  function lerCache(localidade) {
    try {
      const bruto = sessionStorage.getItem(chaveCache(localidade));
      if (!bruto) return null;
      const { t, corpo } = JSON.parse(bruto);
      return Date.now() - t < CACHE_MS ? corpo : null;
    } catch { return null; }
  }
  function gravarCache(corpo, localidade) {
    try { sessionStorage.setItem(chaveCache(localidade), JSON.stringify({ t: Date.now(), corpo })); } catch { /* sem armazenamento: segue sem cache */ }
  }

  async function buscarJSON(url, servico) {
    if (navigator.onLine === false) throw new Error("Sem conexão com a internet.");
    const controle = new AbortController();
    const prazo = setTimeout(() => controle.abort(), 15000);
    try {
      const resposta = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: controle.signal
      });
      if (!resposta.ok) throw new Error(`${servico} respondeu com status ${resposta.status}.`);
      return await resposta.json();
    } catch (erro) {
      if (erro?.name === "AbortError") throw new Error(`A consulta ao ${servico} excedeu o tempo limite.`);
      throw erro;
    } finally {
      clearTimeout(prazo);
    }
  }

  async function buscarPrevisao({ ignorarCache = false, localidade = localidadePrevisao } = {}) {
    if (!ignorarCache) {
      const emCache = lerCache(localidade);
      if (emCache) return emCache;
    }
    const url = new URL(URL_PREVISAO);
    url.searchParams.set("lat", String(localidade.lat));
    url.searchParams.set("lon", String(localidade.lon));
    const corpo = await buscarJSON(url, "MET Norway");
    gravarCache(corpo, localidade);
    return corpo;
  }

  BT.previsao = { interpretarPrevisao, buscarPrevisao, rotuloCondicao, pontoDeOrvalho };

  const textoOuND = (valor, unidade, casas = 1) => (isNum(valor) ? `${(casas === 0 ? nf0 : nf1).format(valor)} ${unidade}` : "Não disponível");

  function pintarPrevisao(raiz, modelo) {
    const set = (seletor, texto) => { const el = $(seletor, raiz); if (el) el.textContent = texto; };
    const { atual } = modelo;
    const formatoDataHora = new Intl.DateTimeFormat("pt-BR", {
      timeZone: modelo.timezone, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    });
    const formatoDia = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC", weekday: "short", day: "2-digit", month: "short"
    });

    set("[data-weather-condition]", atual.condicao || "Condição não disponível");
    const quando = formatoDataHora.format(new Date(atual.instante));
    set("[data-weather-time]", `Estimativa para ${quando} (horário local)${modelo.atualizado ? ` · fonte atualizada em ${formatoDataHora.format(new Date(modelo.atualizado))}` : ""}.`);
    set("[data-weather-temperature]", textoOuND(atual.temp, "°C"));
    set("[data-weather-humidity]", textoOuND(atual.umidade, "%", 0));
    const dir = direcaoDoVento(atual.ventoDirecao);
    set("[data-weather-wind]", isNum(atual.ventoKmh) ? `${nf0.format(atual.ventoKmh)} km/h${dir ? ` · ${dir}` : ""}` : "Não disponível");
    set("[data-weather-pressure]", textoOuND(atual.pressao, "hPa", 0));
    set("[data-weather-cloud]", textoOuND(atual.nuvens, "%", 0));
    set("[data-weather-dewpoint]", textoOuND(atual.orvalho, "°C"));
    set("[data-weather-rain1h]", isNum(atual.chuva1h) ? `${nf1.format(atual.chuva1h)} mm` : "Não disponível");

    const icone = $("[data-weather-icon]", raiz);
    if (icone) icone.innerHTML = BT.icone(atual.simbolo); // SVG estático definido neste arquivo

    const contagem = raiz.hasAttribute("data-weather-count") ? Number(raiz.getAttribute("data-weather-count")) : 5;
    const lista = $("[data-weather-days]", raiz);
    if (lista) {
      const cartoes = modelo.dias.filter((d) => d.amostras >= 2 && isNum(d.min) && isNum(d.max)).slice(0, contagem).map((dia) => {
        const cartao = document.createElement("article");
        cartao.className = "weather-day";
        cartao.setAttribute("role", "listitem");

        const data = document.createElement("span");
        data.textContent = formatoDia.format(new Date(`${dia.chave}T12:00:00Z`));
        const condicao = document.createElement("strong");
        condicao.textContent = dia.condicao || "Condição não disponível";
        const temps = document.createElement("p");
        temps.textContent = `${nf0.format(dia.min)}° a ${nf0.format(dia.max)} °C`;
        cartao.append(data, condicao, temps);

        if (raiz.hasAttribute("data-weather-detail")) {
          const chuva = document.createElement("p");
          chuva.className = "weather-day-extra";
          chuva.textContent = dia.chuva >= 0.1 ? `Chuva: ${nf1.format(dia.chuva)} mm` : "Sem chuva prevista";
          const vento = document.createElement("p");
          vento.className = "weather-day-extra";
          vento.textContent = `Vento até ${nf0.format(dia.ventoMaxKmh)} km/h`;
          const ic = document.createElement("div");
          ic.className = "weather-day-icon";
          ic.innerHTML = BT.icone(dia.simbolo); // SVG estático
          cartao.prepend(ic);
          cartao.append(chuva, vento);
        }
        return cartao;
      });
      if (cartoes.length === 0) throw new Error("A fonte não retornou temperaturas para os próximos dias.");
      lista.replaceChildren(...cartoes);
    }

    const atual$ = $("[data-weather-current]", raiz);
    if (atual$) atual$.hidden = false;
  }

  modulo("previsão do tempo", () => {
    const raizes = $$("[data-weather]");
    if (raizes.length === 0) return;

    const status = (texto) => raizes.forEach((r) => { const el = $("[data-weather-status]", r); if (el) el.textContent = texto; });
    const mensagemLocalidade = (form, texto) => {
      const el = $("[data-location-message]", form);
      if (el) el.textContent = texto;
    };
    const botoes = $$("[data-weather-refresh]");
    const formulários = $$("[data-weather-location-form]");
    let sequenciaCarga = 0;
    let ultimaCarga = 0;

    async function carregar(forcar, localidade = localidadePrevisao) {
      const idCarga = ++sequenciaCarga;
      botoes.forEach((b) => { b.disabled = true; });
      raizes.forEach((r) => r.setAttribute("aria-busy", "true"));
      status(`Consultando a previsão para ${localidade.nome}…`);
      try {
        const payload = await buscarPrevisao({ ignorarCache: forcar, localidade });
        if (idCarga !== sequenciaCarga) return;
        const modelo = interpretarPrevisao(payload, localidade.timezone);
        raizes.forEach((r) => pintarPrevisao(r, modelo));
        localidadePrevisao = { ...localidade };
        BT.previsaoLocalidade = localidadePrevisao;
        raizes.forEach((r) => $$("[data-weather-location-label]", r).forEach((el) => { el.textContent = localidade.nome; }));
        BT.previsaoAtual = modelo;
        BT.previsaoErro = null;
        ultimaCarga = Date.now();
        document.dispatchEvent(new CustomEvent("bt:previsao", { detail: modelo }));
        status(`Previsão de modelo carregada para ${localidade.nome}. As condições podem variar na região.`);
      } catch (erro) {
        if (idCarga !== sequenciaCarga) return;
        BT.previsaoErro = String(erro?.message || erro);
        document.dispatchEvent(new CustomEvent("bt:previsao-erro", { detail: BT.previsaoErro }));
        status(`Não foi possível carregar a previsão para ${localidade.nome}. ${BT.previsaoErro}`);
      } finally {
        if (idCarga === sequenciaCarga) {
          botoes.forEach((b) => { b.disabled = false; });
          raizes.forEach((r) => r.removeAttribute("aria-busy"));
        }
      }
    }

    botoes.forEach((b) => b.addEventListener("click", () => carregar(true)));

    const normalizarNome = (valor) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
    const timezoneValido = (timezone) => {
      if (typeof timezone !== "string" || !timezone) return false;
      try { new Intl.DateTimeFormat("pt-BR", { timeZone: timezone }); return true; } catch { return false; }
    };
    for (const form of formulários) {
      const estado = $("[data-location-state]", form);
      const cidade = $("[data-location-city]", form);
      const botaoAplicar = $("[data-weather-location-form] [type='submit']", form);
      let municipios = [];
      let sequenciaMunicipios = 0;

      async function carregarMunicipios(sigla, manter = "") {
        const id = ++sequenciaMunicipios;
        cidade.disabled = true;
        cidade.replaceChildren(new Option("Carregando municípios…", ""));
        try {
          if (!ESTADOS.some(([uf]) => uf === sigla)) throw new Error("Estado inválido.");
          const lista = await buscarJSON(`${URL_MUNICIPIOS}${sigla}.json`, "lista local de municípios");
          if (id !== sequenciaMunicipios) return;
          if (!Array.isArray(lista)) throw new Error("A lista de municípios veio em formato inválido.");
          municipios = lista.filter((item) =>
            Array.isArray(item) && typeof item[0] === "string" && item[0].trim()
            && isNum(item[1]) && isNum(item[2]) && timezoneValido(item[3])
            && Math.abs(item[1]) <= 90 && Math.abs(item[2]) <= 180
          );
          if (municipios.length === 0) throw new Error("A lista de municípios está vazia ou inválida.");
          cidade.replaceChildren(...municipios.map((item, indice) => new Option(item[0], String(indice))));
          const indice = manter ? municipios.findIndex((item) => normalizarNome(item[0]) === normalizarNome(manter)) : -1;
          if (indice >= 0) cidade.value = String(indice);
          const nomeEstado = estado.selectedOptions[0]?.textContent || sigla;
          mensagemLocalidade(form, `${municipios.length} municípios de ${nomeEstado}. Juína, MT continua sendo a localidade inicial.`);
        } catch (erro) {
          if (id !== sequenciaMunicipios) return;
          municipios = [];
          cidade.replaceChildren(new Option("Não foi possível carregar os municípios", ""));
          mensagemLocalidade(form, `Falha ao carregar a lista local de municípios: ${String(erro?.message || erro)}.`);
        } finally {
          if (id === sequenciaMunicipios) cidade.disabled = municipios.length === 0;
        }
      }

      async function carregarEstados() {
        estado.replaceChildren(...ESTADOS.map(([sigla, nome]) => new Option(nome, sigla)));
        estado.value = "MT";
        await carregarMunicipios("MT", "Juína");
      }

      estado.addEventListener("change", () => carregarMunicipios(estado.value));
      carregarEstados();

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        botaoAplicar.disabled = true;
        try {
          const municipio = municipios[Number(cidade.value)];
          if (!municipio) throw new Error("Escolha um estado e um município.");
          const localidade = {
            lat: municipio[1], lon: municipio[2], timezone: municipio[3],
            nome: `${municipio[0]}, ${estado.value}`, country: "Brasil"
          };
          mensagemLocalidade(form, `Consultando a previsão para ${localidade.nome}.`);
          await carregar(false, localidade);
          if (BT.previsaoErro) {
            mensagemLocalidade(form, `Previsão não carregada: ${BT.previsaoErro}`);
          } else if (
            BT.previsaoLocalidade?.lat === localidade.lat &&
            BT.previsaoLocalidade?.lon === localidade.lon
          ) {
            mensagemLocalidade(form, `Previsão atualizada para ${localidade.nome}.`);
          }
        } catch (erro) {
          mensagemLocalidade(form, `Não foi possível definir essa localidade: ${String(erro?.message || erro)}`);
        } finally {
          botaoAplicar.disabled = false;
        }
      });
    }

    // Ao voltar para a aba depois de 10 minutos, atualiza sozinho.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && ultimaCarga && Date.now() - ultimaCarga > CACHE_MS) carregar(false);
    });
    window.addEventListener("online", () => { if (BT.previsaoErro) carregar(true); });
    carregar(false);
  });
})();
