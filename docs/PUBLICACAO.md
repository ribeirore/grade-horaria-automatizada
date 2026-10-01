# Publicação futura — sem implantação agora

Em 01/10/2026 a equipe pediu para manter o aplicativo apenas na `feature`. A CI valida e guarda `dist/` como artefato; não tem deploy ou permissão de publicação.

## Caminho previsto

GitHub Pages, sem backend/chaves de API. `base` do Vite já é `/grade-horaria-automatizada/`. Pages permite repositórios públicos no GitHub Free ([documentação](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)).

Quando autorizado:

1. Administrador: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Acrescentar workflow Pages com os mesmos testes/build, envio de `dist/` por `upload-pages-artifact` e publicação por `deploy-pages` ([instruções oficiais](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)).
3. Definir branch publicada e autorizá-la no ambiente `github-pages`; não fazer merge só para contornar permissões.
4. Testar site, dados, Web Worker, exemplo/bloqueio e então incluir link no README/Relatório.

Endereço esperado, **ainda não ativo/verificado**: `https://ribeirore.github.io/grade-horaria-automatizada/`.

Em outra hospedagem estática, ajustar `base` conforme o subdiretório e publicar `dist/`. Não enviar só `src/` nem esquecer `dist/data/offering.json`.

## Credenciais

Autenticação Git existente permite push; consulta não mostrou acesso administrativo. Não compartilhar senha/token em chat, documentos ou commits. Usar login seguro do GitHub/Git Credential Manager no computador; configuração Pages pode ser feita pelo dono.
