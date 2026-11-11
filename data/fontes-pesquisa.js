/* Briefing Técnico — fontes das "Abas de pesquisa" (pesquisa.html)
 *
 * A lista única de fontes das áreas rurais, de interesse geral e da aviação.
 * pesquisa-abas.js filtra os temas para cada subpágina.
 *
 * Para incluir um site: copie um bloco { nome: ... } de dentro de "fontes", cole logo abaixo
 * e troque nome, org, para e url. Para um tema novo, copie um bloco inteiro de "temas".
 *
 *   nome  · nome curto que aparece no botão
 *   org   · instituição responsável
 *   para  · em uma frase, o que se encontra lá
 *   url   · endereço completo (https://...)  ou uma página deste site (ex.: "mercado.html")
 *   aviso · opcional: cadastro, limitação ou cuidado de uso
 *
 * Endereços conferidos em 22/10/2026. Não use endereços com "utm_" ou outros parâmetros
 * de rastreamento: copie o endereço limpo da página.
 */
window.BT_PESQUISA = {
  conferido: "2026-10-22",
  temas: [
    {
      id: "clima",
      titulo: "Tempo e clima",
      resumo: "Observações oficiais, dados históricos, alertas, previsão numérica, monitoramento agrometeorológico e o acompanhamento do El Niño.",
      fontes: [
        { nome: "INMET", org: "Instituto Nacional de Meteorologia", para: "Portal com tempo presente, previsões e produtos meteorológicos oficiais.", url: "https://portal.inmet.gov.br/" },
        { nome: "Mapa de estações", org: "INMET", para: "Localização e dados recentes das estações automáticas e convencionais.", url: "https://mapas.inmet.gov.br/" },
        { nome: "BDMEP · dados históricos", org: "INMET", para: "Séries históricas por estação e pacotes anuais de todas as estações automáticas.", url: "https://bdmep.inmet.gov.br/" },
        { nome: "Alertas", org: "INMET", para: "Avisos meteorológicos vigentes por município.", url: "https://alertas2.inmet.gov.br/" },
        { nome: "Previsão numérica", org: "CPTEC/INPE", para: "Saídas de modelo para a América do Sul. Previsão de modelo não é observação.", url: "https://previsaonumerica.cptec.inpe.br/bam/aprec/ams/" },
        { nome: "Agritempo", org: "Embrapa", para: "Monitoramento agrometeorológico: chuva, temperatura, estiagem e índices de seca.", url: "https://www.agritempo.gov.br/" },
        { nome: "El Niño · manejo e mitigação", org: "Embrapa", para: "Plataforma gratuita com recomendações regionais e medidas de gestão de riscos agroclimáticos para a agropecuária.", url: "https://www.embrapa.br/el-nino-no-brasil-manejo-e-mitigacao-de-riscos" },
        { nome: "Painel El Niño", org: "Cemaden/MCTI", para: "Boletins do painel interinstitucional com os impactos previstos do El Niño em cada região do Brasil.", url: "https://www.gov.br/cemaden/pt-br/assuntos/monitoramento/el-nino" },
        { nome: "ENSO · El Niño e La Niña", org: "NOAA Climate Prediction Center", para: "Situação oficial do ENOS e discussão mensal, em inglês.", url: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml" },
        { nome: "Monitor de Secas", org: "ANA", para: "Mapa mensal da severidade da seca no Brasil.", url: "https://monitordesecas.ana.gov.br/" },
        { nome: "Observatório", org: "Briefing Técnico", para: "Leituras do INMET em Juína, tratadas com as lacunas à vista.", url: "observatorio.html" }
      ]
    },
    {
      id: "territorio",
      titulo: "Território e satélites",
      resumo: "Imagens de satélite, vegetação, uso do solo e os cadastros ambiental e fundiário do imóvel rural.",
      fontes: [
        { nome: "Satélites", org: "CPTEC/INPE", para: "Imagens de satélite meteorológico em tempo quase real.", url: "https://satelite.cptec.inpe.br/home/index.jsp" },
        { nome: "SATVeg", org: "Embrapa", para: "Séries de NDVI e EVI por ponto ou polígono, úteis para comparar safras.", url: "https://www.satveg.cnptia.embrapa.br/satveg", aviso: "Alguns recursos exigem cadastro." },
        { nome: "TerraBrasilis", org: "INPE", para: "Desmatamento e vegetação (PRODES e DETER) em mapas.", url: "https://terrabrasilis.dpi.inpe.br/app/map/vegetation?hl=pt-br" },
        { nome: "MapBiomas", org: "Rede MapBiomas", para: "Uso e cobertura do solo ano a ano, por município ou imóvel.", url: "https://brasil.mapbiomas.org/" },
        { nome: "CAR · Cadastro Ambiental Rural", org: "Serviço Florestal Brasileiro", para: "Portal do CAR, com consulta pública e demonstrativo do imóvel.", url: "https://www.gov.br/car/pt-br" },
        { nome: "SIGEF", org: "INCRA", para: "Parcelas georreferenciadas e certificadas do meio rural.", url: "https://sigef.incra.gov.br/" }
      ]
    },
    {
      id: "producao",
      titulo: "Produção agropecuária",
      resumo: "Safra, área plantada, produtividade e rebanho, com dados por município para comparar Juína com a região.",
      fontes: [
        { nome: "Embrapa", org: "Empresa Brasileira de Pesquisa Agropecuária", para: "Pesquisas, tecnologias, publicações e unidades da Embrapa para diferentes cadeias do agronegócio brasileiro.", url: "https://www.embrapa.br/" },
        { nome: "Boletim da Safra de Grãos", org: "Conab", para: "Levantamentos mensais de área, produtividade e produção de grãos, por estado.", url: "https://www.gov.br/conab/pt-br/atuacao/informacoes-agropecuarias/safras/safra-de-graos/boletim-da-safra-de-graos" },
        { nome: "Produção Agrícola Municipal", org: "IBGE", para: "Área, produção, produtividade e valor das lavouras em cada município.", url: "https://www.ibge.gov.br/estatisticas/economicas/agricultura-e-pecuaria/9117-producao-agricola-municipal-culturas-temporarias-e-permanentes.html" },
        { nome: "Pesquisa da Pecuária Municipal", org: "IBGE", para: "Efetivo dos rebanhos e produtos de origem animal em cada município.", url: "https://www.ibge.gov.br/estatisticas/economicas/agricultura-e-pecuaria/9107-producao-da-pecuaria-municipal.html" },
        { nome: "Juína em números", org: "IBGE Cidades", para: "Panorama do município: população, economia, agropecuária e território.", url: "https://cidades.ibge.gov.br/brasil/mt/juina/panorama" },
        { nome: "Indicadores do Agro", org: "Ministério da Agricultura e Pecuária", para: "Painéis do ministério, entre eles o Agrostat, com as exportações e importações do agro.", url: "https://indicadores.agro.gov.br/" },
        { nome: "INDEA-MT", org: "Instituto de Defesa Agropecuária de Mato Grosso", para: "Defesa sanitária animal e vegetal, GTA e declaração de rebanho no estado.", url: "https://www.indea.mt.gov.br/" },
        { nome: "Embrapa Agrossilvipastoril", org: "Embrapa · Sinop (MT)", para: "Pesquisa sobre integração lavoura-pecuária-floresta e sistemas de produção de Mato Grosso.", url: "https://www.embrapa.br/agrossilvipastoril" }
      ]
    },
    {
      id: "mercado",
      titulo: "Mercado rural",
      resumo: "Cotações e indicadores da pecuária e dos grãos, com foco em Mato Grosso.",
      fontes: [
        { nome: "CEPEA", org: "Esalq/USP", para: "Indicadores de preço de boi gordo, bezerro, soja, milho e café.", url: "https://www.cepea.org.br/br" },
        { nome: "Scot Consultoria", org: "Consultoria em pecuária e grãos", para: "Boi gordo por praça, reposição e mercado futuro.", url: "https://www.scotconsultoria.com.br/", aviso: "A Scot não autoriza a reprodução das cotações." },
        { nome: "IMEA · indicadores", org: "Instituto Mato-Grossense de Economia Agropecuária", para: "Indicadores e relatórios de mercado de Mato Grosso.", url: "https://www.imea.com.br/imea-site/indicadores" },
        { nome: "Preços agropecuários", org: "Conab", para: "Preços pagos e recebidos, por produto e região.", url: "https://portaldeinformacoes.conab.gov.br/precos-agropecuarios.html" },
        { nome: "Bovinocultura", org: "Ministério da Agricultura e Pecuária", para: "Boas práticas e normas da produção de bovinos.", url: "https://www.gov.br/agricultura/pt-br/assuntos/producao-animal/boas-praticas-de-producao-animal/bovinocultura" },
        { nome: "Pesquisa de mercado", org: "Briefing Técnico", para: "Dólar, juros, commodities e calculadoras de variação e relação de troca.", url: "mercado.html" }
      ]
    },
    {
      id: "credito",
      titulo: "Crédito rural",
      resumo: "Regras do crédito rural e suas mudanças, dados oficiais de contratação, Proagro, seguro rural e zoneamento de risco climático.",
      fontes: [
        { nome: "Manual de Crédito Rural", org: "Banco Central do Brasil", para: "Texto vigente do MCR, com busca e versão em PDF.", url: "https://manuais.bcb.gov.br/app/manual/mcr/publico" },
        { nome: "Busca de normas", org: "Banco Central do Brasil", para: "Resoluções do CMN e normas do Banco Central que alteram o crédito rural, por número ou assunto.", url: "https://www.bcb.gov.br/estabilidadefinanceira/buscanormas" },
        { nome: "Matriz de Dados do Crédito Rural", org: "Banco Central do Brasil", para: "Valores concedidos por região, finalidade, produto e programa.", url: "https://www.bcb.gov.br/estabilidadefinanceira/micrrural" },
        { nome: "Matriz de Dados do Proagro", org: "Banco Central do Brasil", para: "Adesões, coberturas e comunicações de perdas do Proagro.", url: "https://www.bcb.gov.br/estabilidadefinanceira/proagro" },
        { nome: "Seguro rural (PSR)", org: "Ministério da Agricultura e Pecuária", para: "Programa de Subvenção ao Prêmio do Seguro Rural: dados, produtos, limites e normas.", url: "https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/seguro-rural" },
        { nome: "ZARC", org: "Ministério da Agricultura e Pecuária", para: "Zoneamento Agrícola de Risco Climático: janelas de plantio por cultura e município.", url: "https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/programa-nacional-de-zoneamento-agricola-de-risco-climatico" },
        { nome: "SCR · Soluções, Consultoria e Reestruturação", org: "Consultoria e serviços técnicos em crédito rural", para: "Laudos de ocorrência rural, capacidade de pagamento e organização de pedidos de renegociação.", url: "produtor-rural.html" }
      ]
    },
    {
      id: "legislacao",
      titulo: "Legislação",
      resumo: "Leis federais que sustentam o crédito rural, a política agrícola e o uso da terra, no texto oficial publicado pela Presidência da República.",
      fontes: [
        { nome: "Lei nº 4.829/1965", org: "Planalto · Presidência da República", para: "Institucionaliza o crédito rural: finalidades, beneficiários e o sistema de crédito rural.", url: "https://www.planalto.gov.br/ccivil_03/leis/l4829.htm" },
        { nome: "Decreto-Lei nº 167/1967", org: "Planalto · Presidência da República", para: "Títulos de crédito rural: cédulas rurais, nota de crédito rural, nota promissória rural e duplicata rural.", url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del0167.htm" },
        { nome: "Lei nº 8.171/1991", org: "Planalto · Presidência da República", para: "Política agrícola: objetivos, crédito, seguro, assistência técnica e Proagro.", url: "https://www.planalto.gov.br/ccivil_03/leis/l8171.htm" },
        { nome: "Lei nº 12.651/2012", org: "Planalto · Presidência da República", para: "Proteção da vegetação nativa (Código Florestal), que criou o CAR.", url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm" },
        { nome: "Lei nº 13.986/2020", org: "Planalto · Presidência da República", para: "Fundo Garantidor Solidário, patrimônio rural em afetação e Cédula Imobiliária Rural.", url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l13986.htm" }
      ]
    },
    {
      id: "empresa",
      titulo: "Empresa e tributos",
      resumo: "Abertura, registro e tributação de pequenos negócios e do produtor rural em Mato Grosso.",
      fontes: [
        { nome: "Simples Nacional · manuais", org: "Receita Federal", para: "Manuais do regime do Simples Nacional, inclusive do MEI.", url: "https://www8.receita.fazenda.gov.br/SimplesNacional/ConteudoApoio/Manuais/TelaManuais.aspx" },
        { nome: "Portal do Empreendedor", org: "Governo Federal", para: "Formalização e serviços do Microempreendedor Individual (MEI).", url: "https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" },
        { nome: "JUCEMAT", org: "Junta Comercial do Estado de Mato Grosso", para: "Registro de empresas, certidões e orientações em Mato Grosso.", url: "https://www.jucemat.mt.gov.br/" },
        { nome: "SEFAZ-MT", org: "Secretaria de Estado de Fazenda de Mato Grosso", para: "Inscrição estadual, nota fiscal e ICMS, inclusive do produtor rural.", url: "https://www.sefaz.mt.gov.br/" },
        { nome: "Sebrae Mato Grosso", org: "Sebrae", para: "Cursos, consultoria e orientação para pequenos negócios no estado.", url: "https://sebrae.com.br/sites/PortalSebrae/ufs/mt" }
      ]
    },
    {
      id: "ferramentas",
      titulo: "Dados e ferramentas",
      resumo: "Programas e bases gratuitas para montar mapas, baixar imagens de satélite e consultar séries de clima por coordenada.",
      fontes: [
        { nome: "QGIS", org: "Projeto QGIS · software livre", para: "Programa gratuito para mapas, áreas de influência e análise de imóveis rurais.", url: "https://qgis.org/" },
        { nome: "Copernicus Browser", org: "Programa Copernicus · União Europeia", para: "Imagens Sentinel recentes e antigas, com índices como o NDVI, para ver e baixar.", url: "https://browser.dataspace.copernicus.eu/", aviso: "O download exige cadastro gratuito." },
        { nome: "Catálogo de imagens", org: "INPE", para: "Imagens dos satélites CBERS e Amazonia-1, gratuitas.", url: "https://www.dgi.inpe.br/catalogo/explore", aviso: "O download exige cadastro gratuito." },
        { nome: "NASA POWER", org: "NASA", para: "Séries diárias de chuva, temperatura e radiação para qualquer coordenada. São estimativas de satélite e modelo, não medições de estação.", url: "https://power.larc.nasa.gov/data-access-viewer/" }
      ]
    },
    {
      id: "aviacao",
      titulo: "Aviação",
      resumo: "Meteorologia aeronáutica e informação oficial para quem voa.",
      fontes: [
        { nome: "REDEMET", org: "DECEA", para: "METAR, TAF, imagens de radar e satélite para a aviação.", url: "https://redemet.decea.mil.br/" },
        { nome: "AISWEB", org: "DECEA", para: "Informação aeronáutica: NOTAM, cartas e dados de aeródromos.", url: "https://aisweb.decea.mil.br/" },
        { nome: "ANAC", org: "Agência Nacional de Aviação Civil", para: "Regulamentação, aeronaves e serviços da aviação civil.", url: "https://www.gov.br/anac/pt-br" },
        { nome: "Perfect Protection", org: "Briefing Técnico", para: "Capas e acessórios de proteção para aeronaves.", url: "perfect-protection.html" }
      ]
    },
    {
      id: "geociencias",
      titulo: "Geociências e meio ambiente",
      resumo: "Geologia, diamantes de Juína e a legislação ambiental de Mato Grosso.",
      fontes: [
        { nome: "Nature", org: "Revista científica", para: "Página oficial da revista que publica pesquisas sobre diamantes superprofundos, em inglês.", url: "https://www.nature.com/nature/" },
        { nome: "GeoSGB", org: "Serviço Geológico do Brasil", para: "Mapas geológicos, recursos minerais e dados de campo.", url: "https://geosgb.sgb.gov.br/" },
        { nome: "SEMA-MT", org: "Secretaria de Estado de Meio Ambiente de Mato Grosso", para: "Licenciamento e normas ambientais do estado.", url: "https://www.sema.mt.gov.br/" },
        { nome: "Diamantes de Juína", org: "Briefing Técnico", para: "Introdução em português sobre os diamantes da região.", url: "diamantes.html" }
      ]
    }
  ]
};
