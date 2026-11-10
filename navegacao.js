/* Briefing Técnico — navegação por assuntos (v2 · 15/10/2026)
 *
 * Arquivo carregado depois de script.js. Substitui menu.js.
 *   1. Janelas da página inicial: cada assunto abre uma janela; só uma fica aberta por vez.
 *      Fecha com o botão "Fechar", com a tecla Esc ou ao escolher outro assunto.
 *   2. Links como index.html#janela-glossario abrem a janela certa ao chegar de outra página.
 *   3. Barra de seções (.local-nav): destaca a seção que está na tela.
 *
 * O botão "Assuntos" no celular continua sendo tratado em script.js.
 * Sem JavaScript, o site continua navegável pelos links das páginas.
 */
(() => {
  "use strict";

  const seguro = (nome, fn) => {
    try { fn(); } catch (erro) { console.warn(`[navegação] ${nome}:`, erro); }
  };
  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));

  seguro("janelas de assunto", () => {
    const botoes = $$("button[data-janela]");
    const janelas = $$(".janela");
    if (botoes.length === 0 || janelas.length === 0) return;

    const menu = $(".menu-toggle");
    const nav = $("#main-navigation");
    let origem = null;

    const fechar = (devolverFoco = false) => {
      janelas.forEach((j) => { j.hidden = true; });
      botoes.forEach((b) => b.setAttribute("aria-expanded", "false"));
      const retorno = origem;
      origem = null;
      if (devolverFoco && retorno) retorno.focus();
    };

    const abrir = (id, botao = null, focar = true) => {
      const janela = document.getElementById(id);
      if (!janela || !janela.classList.contains("janela")) return;
      janelas.forEach((j) => { j.hidden = j !== janela; });
      botoes.forEach((b) => b.setAttribute("aria-expanded", String(b.getAttribute("aria-controls") === id)));
      origem = botao;
      if (focar) janela.focus({ preventScroll: true });
    };

    const fecharMenuDoCelular = () => {
      if (menu && nav && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        menu.setAttribute("aria-expanded", "false");
      }
    };

    botoes.forEach((botao) => {
      botao.addEventListener("click", () => {
        const id = botao.getAttribute("aria-controls");
        const jaAberta = botao.getAttribute("aria-expanded") === "true";
        fecharMenuDoCelular();
        if (jaAberta) fechar(true);
        else abrir(id, botao);
      });
    });

    $$("[data-fechar]").forEach((botao) => botao.addEventListener("click", () => fechar(true)));

    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape" && janelas.some((j) => !j.hidden)) fechar(true);
    });

    const abrirPeloEndereco = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id.startsWith("janela-")) return;
      const botao = botoes.find((b) => b.getAttribute("aria-controls") === id) || null;
      abrir(id, botao, false);
    };
    window.addEventListener("hashchange", abrirPeloEndereco);
    abrirPeloEndereco();
  });

  seguro("barra de seções", () => {
    if (!("IntersectionObserver" in window)) return;
    $$(".local-nav").forEach((barra) => {
      const linha = $(".local-nav-row", barra) || barra;
      const pares = $$('a[href^="#"]', barra)
        .filter((a) => a.getAttribute("href").length > 1)
        .map((a) => ({ a, secao: document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1))) }))
        .filter((p) => p.secao);
      if (pares.length === 0) return;

      const marcar = (secao) => pares.forEach(({ a, secao: s }) => {
        const ativa = s === secao;
        a.classList.toggle("is-active", ativa);
        if (ativa) {
          a.setAttribute("aria-current", "location");
          if (linha.scrollWidth > linha.clientWidth) {
            linha.scrollTo({ left: a.offsetLeft - (linha.clientWidth - a.offsetWidth) / 2, behavior: "smooth" });
          }
        } else {
          a.removeAttribute("aria-current");
        }
      });

      const observador = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => { if (e.isIntersecting) marcar(e.target); });
      }, { rootMargin: "-45% 0px -50% 0px" });
      pares.forEach(({ secao }) => observador.observe(secao));
    });
  });
})();
