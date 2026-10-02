# AI Log — decisões relevantes

Registre somente interações de IA que alteraram arquitetura, interpretação dos dados, implementação ou escopo. Em cada entrada, mantenha objetivo, contexto, instrução, resultado, validação e decisão. Descreva a instrução de forma fiel; não é necessário copiar toda a conversa.

## 28/09/2026 — Interpretação inicial do case e da base

- **Objetivo:** decidir o recorte do produto antes de programar.
- **Contexto:** instruções técnicas do LIA Impact Lab, README do Case 3 e amostras de `turmas_horarios.csv` e `disciplinas.csv`.
- **Instrução à IA:** ler primeiro o README, depois um trecho das tabelas, e propor um plano de ataque para a grade automatizada.
- **Resultado:** foco em uma turma completa por disciplina, eliminação de choques e bloqueios, alternativas ordenadas por preferências. A IA destacou repetições de blocos e cobertura incompleta do catálogo.
- **Validação:** a equipe conferiu o escopo no PDF e no README. A IA contou 74.381 linhas, 4.947 turmas e 7.952 blocos temporais distintos na oferta, além de 927 códigos ofertados sem entrada no catálogo. Os critérios do motor ainda precisarão de testes independentes.
- **Decisão:** construir primeiro um assistente de grade para aluno, precedido por uma etapa de normalização dos horários.

## 29/09/2026 — Stack e inicialização

- **Objetivo:** preparar um repositório reproduzível e documentação antes da implementação.
- **Contexto:** repositório GitHub vazio indicado pela equipe; exigência de artefato online gratuito e documentação do processo.
- **Instrução à IA:** escolher a stack, criar somente o init do projeto e o roteiro, mantendo os documentos editáveis.
- **Resultado:** projeto React + TypeScript + Vite, planejado para GitHub Pages; README inicial, Roteiro, AI Log e estrutura do Relatório Final.
- **Validação:** o repositório remoto foi confirmado como vazio antes da criação dos arquivos; `npm run build` e `npm run lint` passaram localmente. A equipe ainda deve revisar o Roteiro e preencher os responsáveis.
- **Decisão:** manter a stack estática no início e implementar o motor e a interface nas próximas etapas. A hospedagem será configurada quando o aplicativo estiver funcional.

## Modelo para a próxima decisão relevante

### Data — título

- **Objetivo:**
- **Contexto:**
- **Instrução à IA:**
- **Resultado:**
- **Validação:**
- **Decisão:**

## 02/10/2026 — Estação de trabalho e fluxo de escolhas

- **Objetivo:** implementar o plano confirmado para a interface, preservando o aplicativo aninhado e o trabalho local existente.
- **Contexto:** aplicativo inicial na raiz, direção visual mineral/verde com vidro fosco e fontes locais, oferta oficial dos períodos 2025.2/2026.1. Geração e comparação de grades ficaram explicitamente fora da etapa.
- **Instrução à IA:** executar o plano em contexto novo, preparar dados agregados reproduzíveis, implementar disciplinas/bloqueios/preferências/revisão e persistência por período, inspecionar cada seção em quatro larguras e verificar o build servido no caminho do GitHub Pages.
- **Resultado:** componentes separados, reducer de escolhas, validação de rascunhos versionados, calendário proporcional com visão diária em telas pequenas e lista equivalente de todos os bloqueios. “Gerar grade” desativado, sem aulas, métricas ou resultados simulados. Fontes Space Grotesk e Source Sans 3 empacotadas localmente com `font-display: swap`.
- **Dados:** revisão oficial fixada em `d506455be974a49c8aa79ab74cd89731a60cfefc`, com SHA-256 dos dois arquivos. Agregação por período/código e turmas por `(periodo, turma_id)`; abreviações oficiais identificam nome completo ausente. Créditos divergentes ou ausentes permanecem desconhecidos. Somente o agregado entra no site; CSVs brutos ficaram em arquivos temporários externos ao repositório.
- **Validação:** 30 testes Vitest e 7 cenários Playwright; lint e build passaram. Python conferiu independentemente todos os 2.714 pares período/disciplina e os hashes dos CSVs. Três rodadas de auditoria com capturas em 360/768/1440/1920 px, axe sem violações nas regras executadas, teclado/foco, movimento reduzido, transparência reduzida e fontes/armazenamento bloqueados. Zoom nativo de 200% inspecionado no Chrome: viewport CSS de 735 px, documento de 735 px, visão diária, revisão rolável e foco restaurado após Esc. Evidência detalhada em `docs/UI_AUDIT.md`.
- **Correções nas rodadas:** nome acessível da ordenação, retorno de foco da revisão, ocultação robusta do atalho de navegação, rótulos de blocos curtos/sobrepostos e capturas do começo/fim da revisão. A conferência de dados foi repetida após as revisões. A cópia aninhada manteve os mesmos hashes dos 17 arquivos conferidos.
- **Decisão:** entregar interface e build estático prontos para a próxima etapa; motor, comparação, publicação e vídeo seguem pendentes. Dados históricos não equivalem a oferta atual ou garantia de matrícula. Skills efetivamente aplicadas: `unslop-ui` e `vercel-react-best-practices`.

## 02/10/2026 — Consolidação do front MatriculIA

- **Objetivo:** concluir o plano de entrega em cinco etapas preservando o front aprovado.
- **Contexto:** branch local feature com alterações não commitadas; motor remoto na origin/feature, sem misturar interfaces.
- **Instrução à IA:** executar o plano em contexto novo e preservar trabalhos locais, BMad, skills e cópia aninhada.
- **Resultado:** inventário inicial em arquivo temporário; identidade MatriculIA com lâmpada SVG própria. Nenhum dado da oferta foi modificado.
- **Validação:** 30 testes de domínio, lint e build aprovados; catálogo conferido por Python em 2.714 pares. Fluxos Chromium executados antes do commit.
- **Decisão:** versionar apenas arquivos explicitamente selecionados; preservar branch remota feature; vídeo pendente de gravação pela equipe.
