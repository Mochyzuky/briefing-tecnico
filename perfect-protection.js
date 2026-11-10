/* Perfect Protection — catálogo por tipo de aeronave e orçamento de múltipla escolha (v3 · out/2026)
 *
 * Só age na página que tiver o formulário [data-pp-quote].
 *   · Cada tipo de aeronave tem a sua própria linha de itens: <fieldset data-pp-tipo="Monomotor">, etc.
 *     Só a linha do tipo escolhido aparece; as outras ficam ocultas e desativadas (não entram no pedido).
 *   · Os cards do catálogo têm o link [data-pp-tipo-link="Monomotor"], que escolhe o tipo no formulário.
 *   · O resumo "Seu pedido" e a barra flutuante [data-pp-bar] mostram o que já foi marcado.
 *   · No envio, monta uma mensagem organizada e abre o WhatsApp para revisão.
 *
 * Para criar um tipo novo: acrescente o rádio name="tipo", o <fieldset data-pp-tipo="..."> com os itens
 * e, se quiser, um card com data-pp-tipo-link="..." — sempre com o mesmo texto nos três lugares.
 *
 * Usa o número central do script.js (BT.CONTATO / BT.whatsapp) quando disponível.
 * Privacidade: nada é salvo nem enviado a servidores; o texto só vai para o WhatsApp se a pessoa enviar.
 */
(() => {
  "use strict";

  const form = document.querySelector("form[data-pp-quote]");
  if (!form) return;

  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const NUMERO_RESERVA = "5566996448934";

  const linhas = $$("fieldset[data-pp-tipo]", form);
  const radiosTipo = $$('input[name="tipo"]', form);
  const linksTipo = $$("[data-pp-tipo-link]");
  const campoModelo = form.querySelector("#pp-aircraft");
  const campoQtd = form.querySelector("#pp-qtd");
  const dica = form.querySelector("[data-pp-type-hint]");
  const notaItens = form.querySelector("[data-pp-items-note]");
  const resumoLista = form.querySelector("[data-pp-summary]");
  const erroTipo = form.querySelector("#pp-type-error");
  const erroItens = form.querySelector("#pp-items-error");
  const barra = document.querySelector("[data-pp-bar]");
  const secaoContato = document.getElementById("contato");
  const placeholderPadrao = campoModelo?.placeholder || "";

  const escolha = (nome) => form.querySelector(`input[name="${nome}"]:checked`)?.value || "";
  const texto = (nome) => (form.elements.namedItem(nome)?.value || "").trim();
  const linhaAtiva = () => linhas.find((f) => f.dataset.ppTipo === escolha("tipo")) || null;
  const marcados = () => {
    const linha = linhaAtiva();
    return linha ? $$('input[name="itens"]:checked', linha).map((c) => c.value) : [];
  };
  const quantidade = () => {
    const n = Math.round(Number(campoQtd?.value));
    return Number.isFinite(n) && n >= 1 ? Math.min(n, 99) : 1;
  };
  const tituloDaLinha = (linha) => {
    const t = (linha?.querySelector("legend")?.textContent || "").replace(/^Itens para\s+/i, "").trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  };

  document.body.classList.add("pp-quote-ready");

  /* ---------------- mostra só a linha do tipo escolhido ---------------- */
  function aplicarTipo() {
    const tipo = escolha("tipo");
    linhas.forEach((linha) => {
      const ativa = linha.dataset.ppTipo === tipo;
      linha.hidden = !ativa;
      linha.disabled = !ativa;
    });
    const linha = linhaAtiva();
    if (dica) dica.hidden = Boolean(linha);
    if (notaItens) notaItens.textContent = linha ? `linha ${tituloDaLinha(linha)} · marque um ou vários` : "escolha o tipo de aeronave na etapa 1";
    if (campoModelo) campoModelo.placeholder = linha?.dataset.ppPlaceholder || placeholderPadrao;
    if (tipo && erroTipo) erroTipo.hidden = true;
    linksTipo.forEach((link) => {
      const ativo = link.dataset.ppTipoLink === tipo;
      link.classList.toggle("is-active", ativo);
      link.closest(".pp-card")?.classList.toggle("is-selected", ativo);
      if (ativo) link.setAttribute("aria-current", "true"); else link.removeAttribute("aria-current");
    });
  }

  /* ---------------- resumo, contadores e barra ---------------- */
  const rotuloQuantidade = (n) => (n === 1 ? "item selecionado" : "itens selecionados");

  function atualizar() {
    aplicarTipo();
    const itens = marcados();
    const n = itens.length;

    $$("[data-pp-count]").forEach((el) => { el.textContent = String(n); });
    $$("[data-pp-count-label]").forEach((el) => { el.textContent = rotuloQuantidade(n); });

    if (resumoLista) {
      const vazio = escolha("tipo") ? "Nenhum item marcado ainda." : "Escolha o tipo de aeronave para começar.";
      resumoLista.replaceChildren(...(n
        ? itens.map((item) => Object.assign(document.createElement("li"), { textContent: item }))
        : [Object.assign(document.createElement("li"), { className: "pp-summary-empty", textContent: vazio })]));
    }

    const meta = (chave, valor) => { const el = form.querySelector(`[data-pp-sum="${chave}"]`); if (el) el.textContent = valor; };
    meta("tipo", escolha("tipo") || "A definir");
    meta("modelo", texto("modelo") || "A definir");
    meta("quantidade", String(quantidade()));
    meta("personalizacao", escolha("personalizacao") || "Sem personalização");

    if (n && erroItens) erroItens.hidden = true;
    atualizarBarra();
  }

  let contatoNaTela = false;
  function atualizarBarra() {
    if (barra) barra.hidden = !(marcados().length > 0 && !contatoNaTela);
  }
  if (barra && secaoContato && "IntersectionObserver" in window) {
    new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { contatoNaTela = e.isIntersecting; });
      atualizarBarra();
    }, { threshold: 0.05 }).observe(secaoContato);
  }

  /* ---------------- cards do catálogo → escolhem o tipo ---------------- */
  linksTipo.forEach((link) => {
    link.addEventListener("click", (event) => {
      const radio = radiosTipo.find((r) => r.value === link.dataset.ppTipoLink);
      if (!radio) return;
      event.preventDefault();
      radio.checked = true;
      atualizar();
      const destino = linhaAtiva() || radio.closest("fieldset");
      destino?.scrollIntoView({ behavior: "smooth", block: "start" });
      radio.focus({ preventScroll: true });
    });
  });

  /* ---------------- mensagem e envio ---------------- */
  function montarMensagem() {
    const linha = linhaAtiva();
    const msg = ["Olá! Quero um orçamento da Perfect Protection.", ""];
    msg.push(`Tipo de aeronave: ${escolha("tipo")}`);
    if (texto("modelo")) msg.push(`Fabricante e modelo: ${texto("modelo")}`);
    msg.push(`Quantidade de aeronaves: ${quantidade()}`);
    if (escolha("local")) msg.push(`Fica parada em: ${escolha("local")}`);
    msg.push("", `Itens da linha ${tituloDaLinha(linha)}:`);
    marcados().forEach((item) => msg.push(`• ${item}`));
    msg.push("", `Personalização: ${escolha("personalizacao") || "Sem personalização"}`);
    if (texto("observacoes")) msg.push(`Observações: ${texto("observacoes")}`);
    return msg.join("\n");
  }

  function abrirWhatsApp(mensagem) {
    const BT = window.BT;
    if (BT?.whatsapp?.abrir) { BT.whatsapp.abrir(mensagem); return; }
    const url = new URL(`https://wa.me/${BT?.CONTATO?.whatsapp || NUMERO_RESERVA}`);
    url.searchParams.set("text", mensagem);
    const janela = window.open(url.toString(), "_blank");
    if (janela) janela.opener = null;
    else window.location.assign(url.toString());
  }

  function mostrarErro(erro, alvo) {
    if (erro) erro.hidden = false;
    alvo?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!escolha("tipo")) {
      mostrarErro(erroTipo, radiosTipo[0]?.closest("fieldset"));
      radiosTipo[0]?.focus({ preventScroll: true });
      return;
    }
    if (!marcados().length) {
      const linha = linhaAtiva();
      mostrarErro(erroItens, linha);
      linha?.querySelector('input[name="itens"]')?.focus({ preventScroll: true });
      return;
    }
    abrirWhatsApp(montarMensagem());
  });

  form.addEventListener("change", atualizar);
  form.addEventListener("input", (e) => { if (e.target.name === "modelo" || e.target.name === "quantidade") atualizar(); });
  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      if (erroTipo) erroTipo.hidden = true;
      if (erroItens) erroItens.hidden = true;
      atualizar();
    }, 0);
  });

  atualizar();
})();
