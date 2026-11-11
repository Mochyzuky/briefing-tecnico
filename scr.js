/* Atendimento ao produtor rural · atendimento guiado (produtor-rural.html)
 *
 * Mesmo princípio do orçamento da Perfect Protection, adaptado ao atendimento ao produtor rural:
 *   1. o cliente escolhe o serviço (laudo, capacidade de pagamento, renegociação ou orientação);
 *   2. só aparecem as situações e os documentos indicados para aquele serviço;
 *   3. o resumo "Seu atendimento" mostra a indicação técnica, o prazo e o que ainda falta;
 *   4. no envio, a mensagem é montada em ordem e o WhatsApp abre para revisão.
 *
 * Para mudar textos de indicação, edite INDICACOES. Para incluir um documento, acrescente um
 * <label class="scr-check" data-servicos="..."> na etapa 5 do produtor-rural.html.
 * Usa o número central do script.js (BT.whatsapp) quando disponível.
 * Privacidade: nada é salvo nem enviado a servidores.
 */
(() => {
  "use strict";

  const form = document.querySelector("form[data-scr-form]");
  if (!form) return;

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));
  const NUMERO_RESERVA = "5566996448934";

  const SERVICOS = {
    laudo: "Laudo de perda de produção",
    capacidade: "Laudo: quanto a propriedade consegue pagar",
    renegociacao: "Renegociação de dívidas",
    orientacao: "Conversa inicial"
  };

  const INDICACOES = {
    laudo: {
      texto: "O laudo demonstra o evento adverso e o seu impacto na produção ou na renda, com enquadramento no MCR 2-6-4, imagens de satélite (NDVI), dados oficiais de chuva e visita à propriedade.",
      passo: "Próximo passo: depois da mensagem, envie fotos do período com data e localização e as notas fiscais de venda."
    },
    capacidade: {
      texto: "O laudo apura quanto a atividade consegue pagar por ano, com receitas e custos comprovados e as dívidas conferidas em extratos e no Registrato do Banco Central, e propõe um cronograma viável.",
      passo: "Próximo passo: separe as cédulas, os extratos com data-base e o IRPF ou DEFIS."
    },
    renegociacao: {
      texto: "O apoio reúne laudo, capacidade de pagamento e documentos em um pedido organizado para mais prazo ou renegociação (MCR 2-6-4). A decisão é do banco ou da cooperativa.",
      passo: "Próximo passo: informe o vencimento da parcela e, se já houve pedido ao banco, a resposta recebida."
    },
    orientacao: {
      texto: "Conte a situação: indicamos o caminho mais adequado e os documentos necessários antes de você procurar o banco.",
      passo: "Próximo passo: descreva nas observações o que aconteceu e quando."
    }
  };

  const grupos = $$("fieldset[data-scr-servico]", form);
  const radiosServico = $$('input[name="servico"]', form);
  const linksServico = $$("[data-scr-servico-link]");
  const docs = $$("[data-scr-docs] .scr-check", form);
  const erroServico = $("#scr-servico-erro", form);
  const barra = $("[data-scr-bar]");
  const barraTexto = $("[data-scr-bar-texto]");
  const barraBotao = $("[data-scr-bar-botao]");
  const secaoContato = document.getElementById("contato");
  const hero = $("[data-scr-hero]");
  const rotuloPorte = $("[data-scr-porte-label]", form);
  const campoPorte = form.elements.namedItem("porte");

  const escolha = (nome) => form.querySelector(`input[name="${nome}"]:checked`) || null;
  const valor = (nome) => escolha(nome)?.value || "";
  const texto = (nome) => (form.elements.namedItem(nome)?.value || "").trim();
  const servico = () => valor("servico");
  const marcados = (nome, raiz = form) => $$(`input[name="${nome}"]:checked`, raiz).filter((c) => !c.disabled).map((c) => c.value);
  const docsDoServico = () => docs.filter((d) => !d.hidden);

  document.body.classList.add("scr-quote-ready");

  /* ---------- etapas que dependem do serviço ---------- */
  function aplicarServico() {
    const s = servico();
    grupos.forEach((g) => {
      const ativo = g.dataset.scrServico === s;
      g.hidden = !ativo;
      g.disabled = !ativo;
    });
    const tipo = escolha("atividade")?.dataset.tipo || "";
    docs.forEach((d) => {
      // Documento aparece se for indicado para o serviço e, quando for específico (pecuária ou lavoura), para a atividade escolhida.
      const daAtividade = !d.dataset.atividade || !tipo || d.dataset.atividade === tipo;
      const ativo = Boolean(s) && d.dataset.servicos.split(/\s+/).includes(s) && daAtividade;
      d.hidden = !ativo;
      d.querySelector("input").disabled = !ativo;
    });
    $$("[data-scr-hint]", form).forEach((h) => { h.hidden = Boolean(s); });
    const dicaDocs = $("[data-scr-docs-hint]", form);
    if (dicaDocs) dicaDocs.hidden = Boolean(s);
    const nota = $("[data-scr-situacao-nota]", form);
    if (nota) nota.textContent = s ? `${SERVICOS[s].toLowerCase()} · marque uma ou várias` : "escolha o serviço na etapa 1";
    const notaDocs = $("[data-scr-docs-nota]", form);
    if (notaDocs) notaDocs.textContent = s ? `${docsDoServico().length} indicados para ${SERVICOS[s].toLowerCase()}` : "escolha o serviço na etapa 1";
    if (s && erroServico) erroServico.hidden = true;

    linksServico.forEach((link) => {
      const ativo = link.dataset.scrServicoLink === s;
      link.classList.toggle("is-active", ativo);
      if (ativo) link.setAttribute("aria-current", "true"); else link.removeAttribute("aria-current");
    });
    $$("[data-scr-card]").forEach((card) => card.classList.toggle("is-selected", card.dataset.scrCard === s));
  }

  function aplicarAtividade() {
    const r = escolha("atividade");
    if (rotuloPorte) rotuloPorte.textContent = r?.dataset.porte || "Área ou rebanho";
    if (campoPorte) campoPorte.placeholder = r?.dataset.portePh || "Ex.: 300 ha ou 800 cabeças";
  }

  /* ---------- resumo ---------- */
  const el = (tag, classe, conteudo) => { const n = document.createElement(tag); if (classe) n.className = classe; if (conteudo) n.textContent = conteudo; return n; };

  function atualizar() {
    aplicarServico();
    aplicarAtividade();
    const s = servico();

    const titulo = $("[data-scr-resumo-servico]", form);
    if (titulo) titulo.textContent = s ? SERVICOS[s] : "Escolha o serviço";

    const indicacao = $("[data-scr-indicacao]", form);
    if (indicacao) {
      indicacao.replaceChildren(...(s
        ? [el("p", null, INDICACOES[s].texto), el("p", "scr-passo", INDICACOES[s].passo)]
        : [el("p", null, "Na etapa 1, escolha o serviço. Aqui aparece a indicação técnica para o seu caso.")]));
      indicacao.classList.toggle("has-value", Boolean(s));
    }

    const urgente = Boolean(escolha("prazo")?.hasAttribute("data-urgente"));
    const alerta = $("[data-scr-alerta]", form);
    if (alerta) alerta.hidden = !urgente;

    const situacoes = marcados("situacao");
    const docsTodos = docsDoServico();
    const docsTem = docsTodos.filter((d) => d.querySelector("input").checked);
    const faltam = docsTodos.filter((d) => !d.querySelector("input").checked).map((d) => d.querySelector("input").value);

    const meta = (chave, v) => { const n = form.querySelector(`[data-scr-sum="${chave}"]`); if (n) n.textContent = v; };
    const atividade = valor("atividade");
    meta("atividade", atividade ? `${atividade}${texto("porte") ? ` · ${texto("porte")}` : ""}` : "A definir");
    meta("municipio", texto("municipio") || "Informe o município/UF");
    meta("situacao", situacoes.length ? (situacoes.length === 1 ? situacoes[0] : `${situacoes.length} situações`) : "A definir");
    meta("prazo", valor("prazo") || "A definir");
    meta("docs", s ? `${docsTem.length} de ${docsTodos.length} em mãos` : "—");

    const caixaFaltam = $("[data-scr-faltam]", form);
    const listaFaltam = $("[data-scr-faltam-lista]", form);
    if (caixaFaltam && listaFaltam) {
      caixaFaltam.hidden = !s || faltam.length === 0;
      listaFaltam.replaceChildren(...faltam.slice(0, 4).map((f) => el("li", null, f)));
      if (faltam.length > 4) listaFaltam.append(el("li", "scr-mais", `e mais ${faltam.length - 4}`));
    }
    atualizarBarra();
  }

  /* ---------- barra de atalho ---------- */
  const visivel = { hero: true, contato: false };
  function atualizarBarra() {
    if (!barra) return;
    const s = servico();
    barra.hidden = visivel.hero || visivel.contato;
    if (barraTexto) {
      if (s) {
        const n = marcados("docs").length;
        barraTexto.replaceChildren(el("b", null, SERVICOS[s]), document.createTextNode(` · ${n} ${n === 1 ? "documento marcado" : "documentos marcados"}`));
      } else {
        barraTexto.textContent = "Precisa de laudo, capacidade de pagamento ou renegociação?";
      }
    }
    if (barraBotao) barraBotao.textContent = s ? "Continuar" : "Solicitar atendimento";
  }
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.target === hero) visivel.hero = e.isIntersecting;
        if (e.target === secaoContato) visivel.contato = e.isIntersecting;
      });
      atualizarBarra();
    }, { threshold: 0.05 });
    if (hero) obs.observe(hero); else visivel.hero = false;
    if (secaoContato) obs.observe(secaoContato);
  }

  /* ---------- cards de serviço escolhem o serviço ---------- */
  linksServico.forEach((link) => {
    link.addEventListener("click", (evento) => {
      const radio = radiosServico.find((r) => r.value === link.dataset.scrServicoLink);
      if (!radio) return;
      evento.preventDefault();
      radio.checked = true;
      atualizar();
      const destino = document.getElementById("etapa-servico") || secaoContato;
      destino?.scrollIntoView({ behavior: "smooth", block: "start" });
      radio.focus({ preventScroll: true });
    });
  });

  /* ---------- mensagem ---------- */
  function montarMensagem() {
    const s = servico();
    const linhas = [`Olá!${texto("nome") ? ` Sou ${texto("nome")}.` : ""} Vim pelo site e quero atendimento para a minha propriedade.`, ""];
    linhas.push(`Serviço: ${SERVICOS[s]}`);
    if (valor("atividade")) linhas.push(`Atividade: ${valor("atividade")}${texto("porte") ? ` (${texto("porte")})` : ""}`);
    if (texto("municipio")) linhas.push(`Município: ${texto("municipio")}`);
    const situacoes = marcados("situacao");
    if (situacoes.length) { linhas.push("", "Situação:"); situacoes.forEach((x) => linhas.push(`• ${x}`)); }
    if (valor("prazo")) linhas.push("", `Parcela: ${valor("prazo")}`);
    if (texto("banco")) linhas.push(`Instituição financeira: ${texto("banco")}`);
    const tem = marcados("docs");
    const faltam = docsDoServico().map((d) => d.querySelector("input")).filter((c) => !c.checked).map((c) => c.value);
    if (tem.length) { linhas.push("", "Documentos que já tenho:"); tem.forEach((x) => linhas.push(`• ${x}`)); }
    if (faltam.length) { linhas.push("", "Ainda não tenho:"); faltam.forEach((x) => linhas.push(`• ${x}`)); }
    if (texto("observacoes")) linhas.push("", `Observações: ${texto("observacoes")}`);
    return linhas.join("\n");
  }

  function abrirWhatsApp(mensagem) {
    const BT = window.BT;
    if (BT?.whatsapp?.abrir) { BT.whatsapp.abrir(mensagem); return; }
    const url = new URL(`https://wa.me/${BT?.CONTATO?.whatsapp || NUMERO_RESERVA}`);
    url.searchParams.set("text", mensagem);
    const janela = window.open(url.toString(), "_blank");
    if (janela) janela.opener = null; else window.location.assign(url.toString());
  }

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (!servico()) {
      if (erroServico) erroServico.hidden = false;
      document.getElementById("etapa-servico")?.scrollIntoView({ behavior: "smooth", block: "start" });
      radiosServico[0]?.focus({ preventScroll: true });
      return;
    }
    abrirWhatsApp(montarMensagem());
  });
  form.addEventListener("change", atualizar);
  form.addEventListener("input", (e) => { if (["municipio", "porte"].includes(e.target.name)) atualizar(); });
  form.addEventListener("reset", () => {
    window.setTimeout(() => { if (erroServico) erroServico.hidden = true; atualizar(); }, 0);
  });

  // Permite chegar com o serviço já escolhido: produtor-rural.html?servico=laudo#contato
  const inicial = new URLSearchParams(location.search).get("servico");
  const radioInicial = radiosServico.find((r) => r.value === inicial);
  if (radioInicial) radioInicial.checked = true;

  atualizar();
  window.BT = window.BT || {};
  window.BT.scr = { montarMensagem };
})();
