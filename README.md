# Briefing Técnico

Site estático em HTML, CSS e JavaScript. Não há etapa de build: o workflow `.github/workflows/pages.yml` publica o conteúdo na branch `main` pelo GitHub Pages.

Site público: <https://mochyzuky.github.io/briefing-tecnico/>

## Atualizar

Edite os arquivos, faça commit e envie as alterações para `main`. A publicação começa automaticamente em **Actions → Publicar site no GitHub Pages**. O repositório deve permanecer público para que o site fique disponível neste endereço.

Para testar localmente, execute `py -m http.server 8000` na pasta do site e abra <http://localhost:8000/>.

- WhatsApp: constante `CONTATO` em `script.js`; revise também os links diretos para `wa.me` se o número mudar.
- Fontes de pesquisa e clima: `data/fontes-pesquisa.js` e `data/observatorio-dados.js`.
- Fontes do mercado: `data/mercado-fontes.js`.
- Página do produtor rural: `produtor-rural.html`; `scr.html` redireciona para a nova página para preservar links antigos.

## Atualização do site (11/11/2026)

A versão enviada em `briefing-tecnico-site-2026-11-11` reorganiza a navegação e os conteúdos: a página inicial usa os cards com as três marcas e inclui acesso ao Mercado; tempo/clima e estudos de aviação ficam no Briefing Técnico; o Observatório ganhou estudos de aviação e deixou de exibir a antiga galeria de fotos da região; a área rural passou para `produtor-rural.html`; e as páginas Mercado, Diamantes e Privacidade foram atualizadas. A área de Perfect Protection não traz mais a declaração de representação nem o bloco de recursos aeronáuticos. O arquivo `scr.html` redireciona visitantes e links antigos para `produtor-rural.html`.

Arquivos removidos desta versão: `assets/cloud-records/`, `assets/scr/scr-logo.svg` e `assets/scr/scr-compartilhar.jpg`. O workflow de publicação foi mantido e exclui tanto este README quanto `LEIA-ME-CLAUDE-DESEMPENHO.md` do artefato público.

Para uma futura avaliação de desempenho e organização, consulte `LEIA-ME-CLAUDE-DESEMPENHO.md`. O documento pede medições antes/depois e preservação do conteúdo e dos fluxos existentes; não é necessário reorganizar arquivos sem ganho mensurável.

## DNS do domínio próprio

O domínio pretendido é **`briefingtecnico.com.br`** (sem acento). Ele é ASCII e não precisa de conversão para punycode. O domínio próprio está temporariamente desativado no GitHub Pages enquanto o DNS não estiver configurado. Não adicione um arquivo `CNAME` nem configure o domínio no GitHub Pages antes de confirmar que os registros DNS abaixo foram criados e propagados. Quando estiverem prontos, configure `briefingtecnico.com.br` em **Settings → Pages → Custom domain** e adicione um arquivo `CNAME` na raiz contendo exatamente `briefingtecnico.com.br`.

No DNS autoritativo do domínio, os registros esperados são:

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` (ou vazio) | `185.199.108.153` |
| A | `@` (ou vazio) | `185.199.109.153` |
| A | `@` (ou vazio) | `185.199.110.153` |
| A | `@` (ou vazio) | `185.199.111.153` |
| AAAA | `@` (ou vazio) | `2606:50c0:8000::153` |
| AAAA | `@` (ou vazio) | `2606:50c0:8001::153` |
| AAAA | `@` (ou vazio) | `2606:50c0:8002::153` |
| AAAA | `@` (ou vazio) | `2606:50c0:8003::153` |
| CNAME | `www` | `mochyzuky.github.io` |

Após a propagação, confira **Settings → Pages** no GitHub e habilite **Enforce HTTPS** quando o certificado estiver disponível. A configuração em `www` é adicional; o endereço principal é o domínio sem `www`.

Para verificar os registros, consulte os tipos A, AAAA para o domínio raiz e CNAME para `www`. Mantenha o endereço `https://mochyzuky.github.io/briefing-tecnico/` até que o DNS do domínio próprio esteja pronto e validado.

## Conteúdo e créditos

A versão de 11/11/2026 foi copiada da pasta `briefing-tecnico-site-2026-11-11`. Não foram incluídos ZIPs, backups ou arquivos de trabalho. Os créditos de dados e imagens e a licença da base de municípios estão em `privacidade.html` e `data/municipios/LICENCA-MIT.txt`.

Não há uma licença geral para reutilização do site. A licença MIT aplica-se somente à base de municípios indicada no arquivo de licença.
