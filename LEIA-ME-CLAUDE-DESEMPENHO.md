# Instruções para revisar desempenho do site

Use este documento como briefing para uma revisão futura. O objetivo é melhorar o carregamento e a manutenção do site sem mudar o conteúdo, a identidade visual ou o comportamento aprovado.

## Contexto

- Site institucional estático em HTML, CSS e JavaScript, sem framework, etapa de build ou dependências de pacote.
- Publicado pelo GitHub Pages a partir da branch `main`; URL atual: <https://mochyzuky.github.io/briefing-tecnico/>.
- O domínio pretendido é `briefingtecnico.com.br`, mas está desativado no GitHub Pages até a configuração e propagação do DNS. Não reative nem altere esse domínio por conta própria.
- O site contém páginas de Briefing Técnico, observatório de tempo e clima, produtor rural, mercado, Perfect Protection, pesquisa, diamantes e privacidade.
- A página `scr.html` redireciona para `produtor-rural.html` por compatibilidade com links antigos.
- `assets` contém imagens e marcas; `data` contém dados públicos locais, incluindo municípios brasileiros e as licenças correspondentes.
- A publicação usa `.github/workflows/pages.yml`. Este briefing não deve ser enviado como arquivo do site público.

## Objetivo e processo

1. Inspecione o repositório, o histórico/diff existente e a configuração de publicação antes de editar. Preserve alterações que já estejam em andamento.
2. Estabeleça uma linha de base reproduzível: tamanho total e por tipo dos arquivos publicados, imagens maiores, quantidade de requisições e, se possível, medições de carregamento em desktop e celular. Informe ferramenta, ambiente, URLs e limitações; não invente métricas.
3. Procure melhorias concretas e mensuráveis, como dimensões/formato de imagens, carregamento responsivo, prioridade e lazy loading adequados, CSS/JavaScript realmente não utilizados, dependências externas e dados transferidos.
4. Apresente primeiro uma lista curta e priorizada de problemas com evidências, benefício esperado, risco e arquivos afetados. Não reorganize arquivos apenas por estética.
5. Se o usuário pedir a implementação, faça mudanças pequenas e reversíveis, preservando cópias/fallbacks quando necessário e atualizando todas as referências afetadas.
6. Meça novamente com o mesmo método e compare os resultados com a linha de base.

## Restrições

- Preserve textos, preços, números, fontes, avisos legais, marcas, licenças, créditos, dados e significado. Não corrija fatos ou aconselhamento técnico/jurídico sem fonte e autorização.
- Não remova imagens, scripts, estilos, páginas nem dados por parecerem sem uso; confirme referências e comportamento em todas as páginas antes de qualquer remoção.
- Preserve links relativos, navegação, formulários que abrem o WhatsApp para revisão, mapas, gráficos, pesquisa, localização, previsão do tempo, tabelas e acessibilidade responsiva.
- Não altere o número do WhatsApp, as URLs públicas, o nome do repositório, o workflow, a configuração do Pages ou o domínio.
- Não introduza frameworks, serviços de terceiros, rastreamento, cookies, bibliotecas, build step ou dependências sem demonstrar necessidade e obter autorização.
- Não minifique ou substitua os arquivos-fonte por versões opacas. Mantenha nomes e organização existentes, salvo se a mudança trouxer benefício comprovado e todas as referências forem atualizadas.
- Não edite a pasta original em Downloads nem inclua arquivos locais, backups, ZIPs, credenciais, este briefing ou materiais externos no artefato do GitHub Pages.

## Verificações esperadas

- Verifique links internos e carregamento de imagens, CSS e JavaScript em todas as páginas HTML.
- Teste os fluxos essenciais em viewport estreita e larga: menu, links/atalhos, formulários WhatsApp sem envio automático, Mercado, Observatório e ferramentas de dados.
- Confirme que `scr.html` continua redirecionando para `produtor-rural.html` e que a publicação do Pages continua excluindo este documento.
- Execute as verificações disponíveis no repositório e valide a publicação depois de alterações. Informe claramente o que foi testado e o que não pôde ser verificado.

## Resultado

Entregue um resumo com a linha de base, achados priorizados, alterações (se autorizadas), comparação antes/depois, verificações realizadas e riscos remanescentes. Se nenhuma otimização segura trouxer benefício mensurável, recomende manter a estrutura atual.
