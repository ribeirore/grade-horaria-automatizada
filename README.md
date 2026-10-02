# Grade Horária Automatizada

Aplicativo da equipe para o Case 3 do LIA Impact Lab (PUC-Rio). A estação de trabalho permite escolher disciplinas da oferta oficial, cadastrar indisponibilidades, ordenar preferências e revisar as escolhas.

**Estado em 02/10/2026:** interface e fluxo implementados. O calendário mostra somente bloqueios informados pelo usuário. Geração e comparação de grades continuam pendentes; “Gerar grade” permanece desativado. O produto não efetiva matrícula, verifica pré-requisitos, integralização curricular ou garante vagas.

## Executar

Requisitos: Node.js 22.12+ e npm. A implementação foi verificada com Node.js 24.16.0.

```bash
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite, incluindo `/grade-horaria-automatizada/`. O aplicativo em desenvolvimento e o build estático usam o mesmo código. Os rascunhos são locais, versionados e separados por período; trocar de período preserva as escolhas anteriores. O armazenamento pertence à origem do navegador (protocolo, domínio e porta). Desenvolvimento, preview e site publicado podem ter rascunhos diferentes. Se o armazenamento falhar, a interface continua funcionando e avisa sobre a perda possível ao sair.

## Validar e preparar o build

```bash
npm test
npm run lint
npm run build
npx playwright install chromium  # necessário uma vez para os testes de navegador
npm run test:e2e
npm run preview
```

`npm test` executa 30 testes Vitest. `npm run test:e2e` executa 7 cenários Chromium contra **o build de produção**, servido por preview no caminho do GitHub Pages. Inclui fluxos em 360/768/1440/1920 px, busca sem resultados, filtros, edição e remoção, preferências incompatíveis, revisão, persistência, teclado, movimento reduzido, contraste por axe, transparência reduzida e falhas de fontes/armazenamento. O zoom de 200% também foi inspecionado manualmente no Chrome; o teste automatizado cobre seu equivalente de layout com viewport reduzido e densidade 2.

As capturas de execuções comuns ficam em `test-results/visual-evidence/`, sem sobrescrever as rodadas documentadas. Para registrar uma nova rodada, use `AUDIT_ROUND=4 npm run test:e2e` após recompilar.

O build está em `dist/`, com fontes e suas licenças locais. O `base` do Vite já é `/grade-horaria-automatizada/`. A configuração ou realização da publicação está fora desta entrega. Publicação, vídeo e motor de sugestões permanecem pendentes.

## Dados oficiais e reprodução

Usamos exclusivamente `turmas_horarios.csv` e `disciplinas.csv` da [base oficial do Impact Lab](https://github.com/igor-peres/impact-lab-sieng2026/tree/d506455be974a49c8aa79ab74cd89731a60cfefc/data/case3_grade_horaria), revisão fixa `d506455be974a49c8aa79ab74cd89731a60cfefc` de 01/09/2026. São ofertas históricas, sem atualização em tempo real.

| Período | Disciplinas ofertadas | Turmas distintas | Blocos distintos | Sem nome completo | Créditos desconhecidos |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2025.2 | 1.364 | 2.424 | 3.892 | 669 | 1 |
| 2026.1 | 1.350 | 2.523 | 4.060 | 711 | 1 |

Uma turma mantém a identidade `(periodo, turma_id)`. As 74.381 linhas de horário são deduplicadas para contagem: 4.947 turmas e 7.952 blocos temporais distintos. O site empacota apenas código, nome oficial ou abreviação identificada, créditos confirmados e quantidade de turmas por disciplina/período. Nome completo ausente não é inventado; créditos ausentes ou divergentes são desconhecidos e não viram zero. Dados brutos, salas e pseudônimos de professores não entram no bundle.

Para preparar novamente o catálogo a partir da revisão fixada (requer rede):

```bash
npm run data:prepare
```

Também é possível usar cópias dos dois CSVs baixadas para **fora do repositório**:

```bash
npm run data:prepare -- /private/tmp/grade-turmas.csv /private/tmp/grade-disciplinas.csv
python3 scripts/verify-catalog.py /private/tmp/grade-turmas.csv /private/tmp/grade-disciplinas.csv
```

O preparador verifica hashes SHA-256 antes de aceitar os arquivos. A apuração independente usa a biblioteca CSV do Python e confere cada um dos 2.714 pares período/disciplina, seus nomes, créditos, contagens, totais e hashes. Seu relatório está em [docs/catalog-verification.json](docs/catalog-verification.json).

## Organização e evidências

- `src/components/` — disciplinas, formulário de bloqueios, preferências, calendário e revisão.
- `src/domain/` — agregação, busca, reducer, validação e persistência, com testes próximos aos módulos.
- `src/data/catalog.json` — catálogo agregado com revisão e hashes da fonte.
- `scripts/` — preparação do catálogo e conferência independente.
- `tests/browser/` — cenários reais de navegador, executados pelo Playwright.
- [Auditoria da interface](docs/UI_AUDIT.md) — três rodadas, correções, inventário de preservação e capturas.
- [Roteiro da competição](docs/ROTEIRO.md), [AI Log](docs/AI_LOG.md) e [Relatório Final](docs/RELATORIO_FINAL.md) — histórico e entregas da competição. O roteiro original inclui etapas futuras do motor e da publicação; a auditoria descreve o escopo desta implementação.

A implementação pertence ao aplicativo da raiz, na branch `feature`. A cópia aninhada `grade-horaria-automatizada/`, os arquivos BMad, skills locais e as alterações preexistentes foram preservados. Nenhum commit ou deploy foi realizado nesta etapa.
