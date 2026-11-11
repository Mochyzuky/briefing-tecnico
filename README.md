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

O endereço escolhido é **`www.briefingtecnico.com.br`** (sem acento). Ele foi configurado em **Settings → Pages → Custom domain** e a propriedade do domínio foi verificada na conta GitHub. Este site é publicado por GitHub Actions; a configuração do domínio fica no Pages, não em um arquivo `CNAME` no repositório.

No DNS autoritativo do domínio, o registro necessário é:

| Tipo | Nome | Valor |
|---|---|---|
| CNAME | `www` | `mochyzuky.github.io` |

Mantenha também o TXT de verificação do domínio. Registros A e AAAA na raiz não são necessários para usar apenas `www`. A emissão do certificado HTTPS pode demorar: confira **Settings → Pages** e habilite **Enforce HTTPS** quando estiver disponível.

O domínio acentuado `briefingtécnico.com.br` (`xn--briefingtcnico-jkb.com.br`) é separado e não está configurado como domínio deste site. Um CNAME por si só não faz um segundo domínio servir ou redirecionar o site: para utilizá-lo, é necessário configurar e proteger um redirecionamento HTTPS separado. Não altere seus registros sem verificar a configuração existente.

O endereço anterior é <https://mochyzuky.github.io/briefing-tecnico/>. Depois que o HTTPS do domínio próprio estiver válido, atualize as URLs absolutas de imagens de compartilhamento para `https://www.briefingtecnico.com.br/`.

## Conteúdo e créditos

A versão de 11/11/2026 foi copiada da pasta `briefing-tecnico-site-2026-11-11`. Não foram incluídos ZIPs, backups ou arquivos de trabalho. Os créditos de dados e imagens e a licença da base de municípios estão em `privacidade.html` e `data/municipios/LICENCA-MIT.txt`.

Não há uma licença geral para reutilização do site. A licença MIT aplica-se somente à base de municípios indicada no arquivo de licença.
