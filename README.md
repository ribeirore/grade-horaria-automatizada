# Grade Horária Automatizada

Projeto da equipe para o Case 3 do LIA Impact Lab (PUC-Rio). O objetivo é ajudar um aluno a escolher uma turma completa para cada disciplina desejada, respeitar seus horários indisponíveis e comparar grades sem choque conforme suas preferências.

**Estado em 29/09/2026:** repositório inicializado. O motor de sugestões e a grade visual ainda não foram implementados. Esta página será atualizada durante o hackathon.

## Executar o projeto inicial

Requisitos: Node.js 22.12+ e npm.

```bash
npm install
npm run dev
```

Para verificar a compilação:

```bash
npm run build
```

A stack é React, TypeScript e Vite. Planejamos publicar o produto no GitHub Pages, que aceita repositórios públicos no plano gratuito. O endereço do aplicativo será incluído aqui quando ele estiver funcional.

## Dados

Durante a competição, usaremos somente os dados do [repositório oficial do Impact Lab](https://github.com/igor-peres/impact-lab-sieng2026), conforme as instruções. Os arquivos de oferta disponíveis para análise são `turmas_horarios.csv` e `disciplinas.csv`, dos períodos 2025.2 e 2026.1. A importação e o processamento ainda não foram implementados neste init.

Uma turma é identificada por `(periodo, turma_id)` e seus blocos semanais são indivisíveis. Linhas repetidas de um mesmo horário exigem normalização antes de gerar as grades. O catálogo de disciplinas não cobre toda a oferta; o nome abreviado do arquivo de horários servirá como referência quando o nome completo não estiver disponível.

## Documentação da competição

- [Roteiro de construção](docs/ROTEIRO.md) — entendimento, escopo, decisões, etapas, critérios de aceite e estratégia de IA.
- [AI Log](docs/AI_LOG.md) — decisões relevantes tomadas com apoio de IA e sua validação.
- [Relatório Final](docs/RELATORIO_FINAL.md) — estrutura editável a concluir após a implementação.

## Entrega

- Aplicativo online: **pendente**.
- Vídeo de até 2 minutos: **pendente**.
- Instruções completas para reproduzir a solução e resultados dos testes: **pendentes da implementação**.

O produto auxilia a escolha de horários; não efetiva matrícula nem verifica integralização curricular ou pré-requisitos, pois esses dados não foram fornecidos no case.
