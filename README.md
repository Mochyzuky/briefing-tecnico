# Briefing Técnico

Site estático em HTML, CSS e JavaScript. Não há etapa de build: o workflow `.github/workflows/pages.yml` publica o conteúdo na branch `main` pelo GitHub Pages.

Site público: <https://mochyzuky.github.io/briefing-tecnico/>

## Atualizar

Edite os arquivos, faça commit e envie as alterações para `main`. A publicação começa automaticamente em **Actions → Publicar site no GitHub Pages**. O repositório deve permanecer público para que o site fique disponível neste endereço.

Para testar localmente, execute `py -m http.server 8000` na pasta do site e abra <http://localhost:8000/>.

- WhatsApp: constante `CONTATO` em `script.js`; revise também os links diretos para `wa.me` se o número mudar.
- Fontes de pesquisa e clima: `data/fontes-pesquisa.js`.
- Fontes do mercado: `data/mercado-fontes.js`.

## Domínio próprio

O domínio próprio não está configurado. Não adicione um arquivo `CNAME` nem altere as configurações de domínio do Pages até confirmar a titularidade e configurar o DNS. O site funciona pelo endereço padrão do GitHub Pages enquanto isso.

## Conteúdo e créditos

O pacote publicado veio de `briefing-tecnico-github.zip`. Não foram incluídos arquivos externos ao pacote, backups ou arquivos de trabalho. O conteúdo remove a área de pesca e não contém número de CPF ou registro profissional. Os créditos de dados de terceiros e a licença da base de municípios estão em `privacidade.html` e `data/municipios/LICENCA-MIT.txt`.

Não há uma licença geral para reutilização do site. A licença MIT aplica-se somente à base de municípios indicada no arquivo de licença.
