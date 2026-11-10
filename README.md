# Briefing Técnico

Site estático em HTML, CSS e JavaScript. Não há etapa de build: o workflow `.github/workflows/pages.yml` publica o conteúdo na branch `main` pelo GitHub Pages.

Site público: <https://mochyzuky.github.io/briefing-tecnico/>

## Atualizar

Edite os arquivos, faça commit e envie as alterações para `main`. A publicação começa automaticamente em **Actions → Publicar site no GitHub Pages**. O repositório deve permanecer público para que o site fique disponível neste endereço.

Para testar localmente, execute `py -m http.server 8000` na pasta do site e abra <http://localhost:8000/>.

- WhatsApp: constante `CONTATO` em `script.js`; revise também os links diretos para `wa.me` se o número mudar.
- Fontes de pesquisa e clima: `data/fontes-pesquisa.js`.
- Fontes do mercado: `data/mercado-fontes.js`.

## DNS do domínio próprio

O domínio próprio está temporariamente desativado no GitHub Pages enquanto o DNS não estiver configurado. Não adicione um arquivo `CNAME` nem configure o domínio no GitHub Pages antes de confirmar que os registros DNS abaixo foram criados e propagados. Quando estiverem prontos, configure `xn--briefingtcnico-jkb.com.br` em **Settings → Pages → Custom domain** e adicione o arquivo `CNAME` com esse mesmo nome técnico.

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

O pacote publicado veio de `briefing-tecnico-github.zip`. Não foram incluídos arquivos externos ao pacote, backups ou arquivos de trabalho. O conteúdo remove a área de pesca e não contém número de CPF ou registro profissional. Os créditos de dados de terceiros e a licença da base de municípios estão em `privacidade.html` e `data/municipios/LICENCA-MIT.txt`.

Não há uma licença geral para reutilização do site. A licença MIT aplica-se somente à base de municípios indicada no arquivo de licença.
