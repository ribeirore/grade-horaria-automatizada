# Publicação MatriculIA

Destino: https://ribeirore.github.io/grade-horaria-automatizada/ . Base Vite preservada: `/grade-horaria-automatizada/`.

O workflow `.github/workflows/ci.yml` valida PRs e main com Node 22.12.0: instalação do lockfile, Vitest, oxlint, TypeScript/Vite e 14 fluxos Playwright contra preview de produção. Somente main aprovada publica `dist`, com artifact Pages e job dependente com permissão Pages/OIDC. Relatórios de navegador ficam como artefatos do workflow. Não há servidor, credenciais em runtime, CSVs brutos ou integração de matrícula no site.

Configuração do repositório: GitHub Pages com fonte GitHub Actions (`build_type: workflow`). A publicação usa o mesmo build de produção validado. Dados normalizados e Worker são recursos locais ao endereço público; rascunhos pertencem à origem do navegador.

Referência de infraestrutura: [GitHub — custom workflows for Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Validação pública e run serão registrados após a primeira publicação em `docs/PUBLIC_VALIDATION.md`. Vídeo permanece pendente, conforme informação da equipe.
