# Integração do motor

Origem: [commit d2e4c6a](https://github.com/ribeirore/grade-horaria-automatizada/commit/d2e4c6a), autoria Git de Herick Pinheiro (`herick721`). Referência remota lida: `origin/feature`, ponta `cc96474`. A branch remota foi preservada. Importação seletiva e adaptação de `src/solver.ts`, `src/solver.worker.ts`, contratos de `src/types.ts` e casos de `tests/solver.test.ts`; interface remota, exportação, impressão, pesos e turma fixa não foram importados. Histórico remoto preservado em `docs/history/`.

Preservados: busca com poda por conflitos e viabilidade das disciplinas restantes, turma indivisível, adjacência, medição, deduplicação de alternativas e Worker. Revisados: ranking lexicográfico conforme prioridades da interface, limite de cinco, identidade explícita por período/código, representante determinístico, créditos desconhecidos e verificação dos limites em cada nó. Cancelamento termina Worker; mudanças de entrada invalidam resultados e qualquer retorno atrasado.

A preparação usa os mesmos arquivos e hashes do catálogo. Python confere independentemente cada turma e todos os encontros. Excluídas por sobreposição interna: TEO3235-1FW (2025.2), ART1028-18D, ECO1352-2JA e ENG4922-3VA (2026.1). Oferta bruta: 4.947 turmas/7.952 blocos; utilizável: 4.943/7.942. Nome ou crédito ausente não é inventado.

## Evidências da versão integrada

- Vitest: domínio da interface, normalização, colisões, adjacência, sábado, desconhecidos, ranking, limites e exemplo oficial.
- Oráculo independente sem poda: 40 casos, cinco ordens; confere contagem e cinco melhores combinações.
- Exemplo MAT4162, INF1383, FIS4002 e CRE1227 em 2026.1: 203 combinações, cinco horários distintos, 17 créditos; primeiro resultado sem intervalos usando intervalos/dias.
- Python: [normalização](scheduling-verification.json) e [catálogo](catalog-verification.json).
- 14 cenários Chromium contra build de produção, incluindo geração nas quatro larguras, alternativas/teclado, cancelamento durante carga real de Worker, erro recuperável e bloqueios eliminando todas as opções. Axe sem violações nas regras WCAG executadas.
- Capturas da rodada 4 inspecionadas: [360](evidence/round-4/360-generation.png), [768](evidence/round-4/768-alternative.png), [1440](evidence/round-4/1440-generation.png), [1920](evidence/round-4/1920-alternative.png). Sem controle encoberto ou overflow; lista completa equivale aos encontros do calendário. Reflow de 200% e falhas de armazenamento/fontes mantêm os testes anteriores.

Evidências anteriores do Herick (`docs/history/VALIDACAO-herick.md`) e do front (`docs/UI_AUDIT.md`) têm escopos diferentes. Não comprovam esta integração por si. A rodada 4 verifica o front integrado com o Worker real. Busca limitada é verificada no domínio; não foi forçado um milhão de nós na auditoria visual. Safari, Firefox e leitor de tela completo não foram auditados. Vite avisa sobre o tamanho do chunk de dados carregado sob demanda (767 kB, 88 kB gzip); é dado histórico, não serviço remoto nem condição de falha do build.
