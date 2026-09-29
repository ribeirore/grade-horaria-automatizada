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
