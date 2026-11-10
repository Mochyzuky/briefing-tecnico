/* Briefing Técnico — fontes da página "Pesquisa de mercado" (mercado.html)
 *
 * Para incluir um site favorito, copie um bloco { ... } abaixo, cole no fim da lista e troque:
 *   nome, org, descricao, frequencia, acesso, regioes e os links (rótulo, endereço e produtos).
 *
 * Produtos aceitos:  boi · femeas · reposicao · soja · milho · cafe · futuros · financeiro · clima
 * Regiões aceitas:   juina · mt · br · mundo
 *
 * Este site não copia as cotações dessas fontes: ele só aponta onde consultá-las.
 */
window.BT_MERCADO = {
  produtos: {
    boi: "Boi gordo",
    femeas: "Vaca e novilha",
    reposicao: "Reposição",
    soja: "Soja",
    milho: "Milho",
    cafe: "Café",
    futuros: "Mercado futuro",
    financeiro: "Dólar e juros",
    clima: "Clima e safra"
  },
  regioes: {
    juina: "Juína",
    mt: "Mato Grosso",
    br: "Brasil",
    mundo: "Internacional"
  },
  fontes: [
    {
      id: "scot",
      nome: "Scot Consultoria",
      org: "Consultoria em pecuária e grãos",
      destaque: "Base desta página",
      descricao: "Referência diária para a pecuária de corte: boi gordo por praça (em Mato Grosso: Norte, Sudoeste, Cuiabá e Sudeste), vaca e novilha gordas, reposição com relação de troca, grãos e mercado futuro.",
      frequencia: "Diária, dias úteis (fechamento às 18h)",
      acesso: "Cotações abertas · análises para assinantes",
      aviso: "A Scot não autoriza a reprodução das cotações. Consulte sempre no site da Scot.",
      regioes: ["mt", "br", "mundo"],
      links: [
        { rotulo: "Boi gordo por praça", url: "https://www.scotconsultoria.com.br/cotacoes/boi-gordo/", produtos: ["boi"] },
        { rotulo: "Vaca gorda", url: "https://www.scotconsultoria.com.br/cotacoes/vaca-gorda/", produtos: ["femeas"] },
        { rotulo: "Novilha gorda", url: "https://www.scotconsultoria.com.br/cotacoes/novilha/", produtos: ["femeas"] },
        { rotulo: "Reposição e relação de troca", url: "https://www.scotconsultoria.com.br/cotacoes/reposicao/", produtos: ["reposicao"] },
        { rotulo: "Grãos", url: "https://www.scotconsultoria.com.br/cotacoes/graos/", produtos: ["soja", "milho"] },
        { rotulo: "Mercado futuro", url: "https://www.scotconsultoria.com.br/cotacoes/mercado-futuro/", produtos: ["futuros"] },
        { rotulo: "Indicadores", url: "https://www.scotconsultoria.com.br/cotacoes/indicadores/", produtos: ["boi"] },
        { rotulo: "Boi no mundo", url: "https://www.scotconsultoria.com.br/cotacoes/boi-no-mundo/", produtos: ["boi"] }
      ]
    },
    {
      id: "agrolink-juina",
      nome: "Agrolink · Juína (MT)",
      org: "Portal do agronegócio",
      destaque: "Praça de Juína",
      descricao: "Cotações regionais coletadas na praça de Juína para boi gordo, vaca gorda e novilha gorda, com histórico dos últimos dias. Também reúne o mercado futuro.",
      frequencia: "Diária, dias úteis",
      acesso: "Aberto",
      aviso: "Preços referenciais informados ao portal, sem auditoria do Agrolink.",
      regioes: ["juina", "mt"],
      links: [
        { rotulo: "Cotações de Juína", url: "https://www.agrolink.com.br/regional/mt/juina/cotacoes", produtos: ["boi", "femeas"] },
        { rotulo: "Mercado futuro", url: "https://www.agrolink.com.br/cotacoes/mercadofinanceiro/", produtos: ["futuros"] }
      ]
    },
    {
      id: "imea",
      nome: "IMEA",
      org: "Instituto Mato-grossense de Economia Agropecuária",
      descricao: "Boletins semanais de bovinocultura, soja, milho e algodão em Mato Grosso, com recortes por macrorregião do estado, além de indicadores e painéis interativos.",
      frequencia: "Semanal",
      acesso: "Aberto · alguns materiais pedem cadastro",
      regioes: ["mt", "juina"],
      links: [
        { rotulo: "Relatórios de mercado", url: "https://www.imea.com.br/imea-site/relatorios-mercado", produtos: ["boi", "reposicao", "soja", "milho"] },
        { rotulo: "Indicadores", url: "https://www.imea.com.br/imea-site/indicadores", produtos: ["boi", "soja", "milho"] },
        { rotulo: "Painéis (dashboards)", url: "https://www.imea.com.br/imea-site/dashboards", produtos: ["boi", "soja", "milho"] }
      ]
    },
    {
      id: "cepea",
      nome: "CEPEA · Esalq/USP",
      org: "Centro de Estudos Avançados em Economia Aplicada",
      descricao: "Indicadores de referência nacional usados em contratos e na B3: boi gordo, bezerro, soja, milho e café, com séries históricas.",
      frequencia: "Diária",
      acesso: "Aberto",
      regioes: ["br"],
      links: [
        { rotulo: "Boi gordo", url: "https://www.cepea.org.br/br/indicador/boi-gordo.aspx", produtos: ["boi"] },
        { rotulo: "Bezerro", url: "https://www.cepea.org.br/br/indicador/bezerro.aspx", produtos: ["reposicao"] },
        { rotulo: "Soja", url: "https://www.cepea.org.br/br/indicador/soja.aspx", produtos: ["soja"] },
        { rotulo: "Milho", url: "https://www.cepea.org.br/br/indicador/milho.aspx", produtos: ["milho"] },
        { rotulo: "Café", url: "https://www.cepea.org.br/br/indicador/cafe.aspx", produtos: ["cafe"] }
      ]
    },
    {
      id: "noticias-agricolas",
      nome: "Notícias Agrícolas",
      org: "Portal de notícias e cotações",
      descricao: "Cotações diárias de várias praças para boi gordo, soja, milho e café, além de dólar, mercado financeiro e gráficos dos contratos futuros em Chicago (CME).",
      frequencia: "Diária",
      acesso: "Aberto",
      regioes: ["br", "mt", "mundo"],
      links: [
        { rotulo: "Boi gordo", url: "https://www.noticiasagricolas.com.br/cotacoes/boi-gordo", produtos: ["boi"] },
        { rotulo: "Soja", url: "https://www.noticiasagricolas.com.br/cotacoes/soja", produtos: ["soja"] },
        { rotulo: "Milho", url: "https://www.noticiasagricolas.com.br/cotacoes/milho", produtos: ["milho"] },
        { rotulo: "Café", url: "https://www.noticiasagricolas.com.br/cotacoes/cafe", produtos: ["cafe"] },
        { rotulo: "Futuros em Chicago · soja", url: "https://www.noticiasagricolas.com.br/cotacoes-mercado-futuro/soja", produtos: ["futuros", "soja"] },
        { rotulo: "Futuros em Chicago · milho", url: "https://www.noticiasagricolas.com.br/cotacoes-mercado-futuro/milho", produtos: ["futuros", "milho"] },
        { rotulo: "Dólar", url: "https://www.noticiasagricolas.com.br/cotacao-do-dolar/", produtos: ["financeiro"] },
        { rotulo: "Mercado financeiro", url: "https://www.noticiasagricolas.com.br/cotacoes/mercado-financeiro", produtos: ["financeiro"] }
      ]
    },
    {
      id: "conab",
      nome: "CONAB",
      org: "Companhia Nacional de Abastecimento",
      descricao: "Série oficial de preços agropecuários pagos ao produtor e no atacado, por produto e unidade da federação, com histórico para comparar safras.",
      frequencia: "Semanal e mensal",
      acesso: "Aberto",
      regioes: ["br", "mt"],
      links: [
        { rotulo: "Preços agropecuários", url: "https://portaldeinformacoes.conab.gov.br/precos-agropecuarios.html", produtos: ["boi", "soja", "milho", "cafe"] }
      ]
    },
    {
      id: "bcb",
      nome: "Banco Central do Brasil",
      org: "Sistema Gerenciador de Séries Temporais (SGS)",
      descricao: "Séries de referência do dólar (venda), juros (meta Selic), inflação (IPCA) e Índice de Commodities (IC-Br). Os indicadores destacados na página são consultados automaticamente na API do SGS; verifique a frequência e a data de referência de cada série.",
      frequencia: "Diária (dólar) · mensal (IPCA e IC-Br)",
      acesso: "Portal de Dados Abertos · consulte licença e metadados de cada conjunto",
      regioes: ["br"],
      links: [
        { rotulo: "Séries do SGS", url: "https://www3.bcb.gov.br/sgspub/", produtos: ["financeiro"] },
        { rotulo: "Ver indicadores nesta página", url: "#indicadores", produtos: ["financeiro"] }
      ]
    },
    {
      id: "msn-dinheiro",
      nome: "MSN Dinheiro",
      org: "Portal de mercados financeiros",
      destaque: "Consulta de mercados",
      descricao: "Visão geral de moedas e pares cambiais, índices, ações, fundos, criptoativos e notícias de mercado. Use para acompanhar mercados financeiros; não substitui uma fonte oficial nem cotações agropecuárias por praça.",
      frequencia: "Atualizações ao longo do pregão; confirme o horário e eventual atraso de cada instrumento",
      acesso: "Aberto · conteúdo e disponibilidade sujeitos ao MSN",
      aviso: "As cotações do MSN não são copiadas automaticamente para este site. Consulte a página original e confirme a fonte, o horário e as condições do dado.",
      regioes: ["br", "mundo"],
      links: [
        { rotulo: "Resumo do mercado", url: "https://www.msn.com/pt-br/dinheiro", produtos: ["financeiro"] },
        { rotulo: "Mercados", url: "https://www.msn.com/pt-br/dinheiro/mercados", produtos: ["financeiro"] },
        { rotulo: "Moedas", url: "https://www.msn.com/pt-br/dinheiro/cotacao-do-dolar", produtos: ["financeiro"] }
      ]
    },
    {
      id: "observatorio",
      nome: "Observatório Briefing Técnico",
      org: "Página deste site",
      descricao: "Previsão do tempo, chuva e clima observado em Juína. Ajuda a entender o que pode mexer com a safra e, por consequência, com os preços.",
      frequencia: "Contínua",
      acesso: "Aberto",
      regioes: ["juina"],
      links: [
        { rotulo: "Previsão do tempo", url: "observatorio.html#previsao", produtos: ["clima"] },
        { rotulo: "Clima observado", url: "observatorio.html#clima", produtos: ["clima"] }
      ]
    }
  ]
};
