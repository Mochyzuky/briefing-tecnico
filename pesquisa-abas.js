/* Briefing Técnico — Abas de pesquisa (pesquisa.html)
 * Monta as abas a partir de data/fontes-pesquisa.js. Para mudar as fontes, edite só aquele arquivo.
 */
(function () {
  "use strict";

  var dados = window.BT_PESQUISA;
  var raiz = document.getElementById("abas-pesquisa");
  if (!raiz || !dados || !dados.temas || !dados.temas.length) return;
  var recortes = {
    rural: ["clima", "territorio", "producao", "mercado", "credito", "legislacao", "empresa", "ferramentas"],
    briefing: ["geociencias"],
    aviacao: ["aviacao"]
  };
  var recorte = document.body.dataset.fontes;
  var temas = recortes[recorte] ? dados.temas.filter(function (tema) {
    return recortes[recorte].indexOf(tema.id) !== -1;
  }) : dados.temas;
  if (!temas.length) {
    raiz.textContent = "Não há fontes cadastradas para esta área.";
    return;
  }

  function externo(url) { return /^https?:\/\//i.test(url); }

  function el(tag, attrs, texto) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (texto != null) n.textContent = texto;
    return n;
  }

  function dataBR(iso) {
    var p = String(iso || "").split("-");
    return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : "";
  }

  var lista = el("div", { "class": "abas-lista", role: "tablist", "aria-label": "Temas de pesquisa" });
  var paineis = el("div", { "class": "abas-paineis" });
  var botoes = [];

  temas.forEach(function (tema, i) {
    var idAba = "aba-" + tema.id;
    var idPainel = "abas-" + tema.id;
    var externas = tema.fontes.filter(function (f) { return externo(f.url); });

    var botao = el("button", {
      type: "button", role: "tab", id: idAba, "class": "aba",
      "aria-controls": idPainel, "aria-selected": "false", tabindex: "-1"
    });
    botao.appendChild(el("span", null, tema.titulo));
    botao.appendChild(el("small", null, String(tema.fontes.length)));
    lista.appendChild(botao);
    botoes.push(botao);

    var painel = el("section", { role: "tabpanel", id: idPainel, "class": "aba-painel", "aria-labelledby": idAba, tabindex: "0" });
    painel.hidden = true;

    var topo = el("div", { "class": "aba-topo" });
    var txt = el("div");
    txt.appendChild(el("h4", null, tema.titulo));
    txt.appendChild(el("p", null, tema.resumo));
    topo.appendChild(txt);

    if (externas.length > 1) {
      var abrir = el("button", { type: "button", "class": "aba-abrir-todas" }, "Abrir as " + externas.length + " fontes em abas");
      var aviso = el("p", { "class": "aba-aviso", role: "status", "aria-live": "polite" });
      abrir.addEventListener("click", function () {
        var abertas = 0;
        externas.forEach(function (f) {
          var w = window.open(f.url, "_blank");
          if (w) { abertas++; try { w.opener = null; } catch (e) { /* ignora */ } }
        });
        if (abertas < externas.length) {
          aviso.textContent = "O navegador abriu " + abertas + " de " + externas.length + " abas. Para abrir todas de uma vez, permita pop-ups deste site (ícone na barra de endereço) e clique de novo, ou use os links abaixo.";
        } else {
          aviso.textContent = externas.length + " abas abertas.";
        }
      });
      var acoes = el("div", { "class": "aba-acoes" });
      acoes.appendChild(abrir);
      acoes.appendChild(aviso);
      topo.appendChild(acoes);
    }
    painel.appendChild(topo);

    var ul = el("ul", { "class": "aba-fontes" });
    tema.fontes.forEach(function (f) {
      var li = el("li", { "class": externo(f.url) ? "fonte" : "fonte fonte-interna" });
      var a = el("a", { href: f.url });
      if (externo(f.url)) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener noreferrer"); }
      a.appendChild(el("strong", null, f.nome));
      a.appendChild(el("span", { "aria-hidden": "true" }, externo(f.url) ? "↗" : "→"));
      li.appendChild(a);
      li.appendChild(el("span", { "class": "fonte-org" }, f.org));
      li.appendChild(el("p", null, f.para));
      if (f.aviso) li.appendChild(el("p", { "class": "fonte-aviso" }, f.aviso));
      ul.appendChild(li);
    });
    painel.appendChild(ul);
    paineis.appendChild(painel);
  });

  raiz.textContent = "";
  raiz.appendChild(lista);
  raiz.appendChild(paineis);
  if (dados.conferido) {
    raiz.appendChild(el("p", { "class": "abas-rodape" }, "Endereços conferidos em " + dataBR(dados.conferido) + ". Este site não copia o conteúdo dessas fontes: ele só indica onde consultá-las."));
  }

  function ativar(indice, focar) {
    botoes.forEach(function (b, i) {
      var ativo = i === indice;
      b.setAttribute("aria-selected", ativo ? "true" : "false");
      b.tabIndex = ativo ? 0 : -1;
      document.getElementById(b.getAttribute("aria-controls")).hidden = !ativo;
    });
    if (focar) botoes[indice].focus();
    // no celular, rola a fila de abas até a aba escolhida
    var b = botoes[indice];
    if (lista.scrollWidth > lista.clientWidth) lista.scrollLeft = Math.max(0, b.offsetLeft - 12);
  }

  botoes.forEach(function (b, i) {
    b.addEventListener("click", function () {
      ativar(i, false);
      if (history.replaceState) history.replaceState(null, "", "#" + b.getAttribute("aria-controls"));
    });
    b.addEventListener("keydown", function (e) {
      var n = botoes.length, alvo = null;
      if (e.key === "ArrowRight") alvo = (i + 1) % n;
      else if (e.key === "ArrowLeft") alvo = (i - 1 + n) % n;
      else if (e.key === "Home") alvo = 0;
      else if (e.key === "End") alvo = n - 1;
      if (alvo !== null) { e.preventDefault(); ativar(alvo, true); }
    });
  });

  // abre a aba indicada no endereço (ex.: pesquisa.html#abas-credito)
  var inicial = 0;
  var hash = (location.hash || "").replace("#", "");
  botoes.forEach(function (b, i) { if (b.getAttribute("aria-controls") === hash) inicial = i; });
  ativar(inicial, false);
  if (hash.indexOf("abas-") === 0) {
    raiz.scrollIntoView({ block: "start" });
    // Ao chegar por um link como pesquisa.html#abas-credito, o navegador foca o painel e desenha
    // o contorno de foco (uma linha dourada dupla). Tira esse foco depois que a página carrega.
    var tirarFoco = function () {
      var ativo = document.activeElement;
      if (ativo && ativo.classList && ativo.classList.contains("aba-painel")) ativo.blur();
    };
    if (document.readyState === "complete") setTimeout(tirarFoco, 0);
    else window.addEventListener("load", function () { setTimeout(tirarFoco, 0); });
  }
})();
