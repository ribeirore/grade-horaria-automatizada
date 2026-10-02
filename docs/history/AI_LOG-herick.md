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

## 01/10/2026 — Implementação completa na branch feature

- **Objetivo:** construir a aplicação do hackathon e manter relatório editável.
- **Contexto:** init existente; apenas dados oficiais; grade semelhante ao portal, com duração proporcional; hospedagem inicialmente prevista gratuita.
- **Instrução à IA:** criar branch `feature`, trabalhar até montar toda a aplicação e anotar no relatório. Depois, não hospedar e reduzir blocos visuais grandes.
- **Resultado:** normalização auditável, motor TypeScript em Web Worker, seleção/trava de turmas, bloqueios, preferências, alternativas, calendário responsivo, persistência local, exportação e impressão. Dados oficiais versionados; CI sem deploy.
- **Validação:** build/lint/test locais; 13 testes aprovados, enumeração independente de 40 conjuntos, integridade de toda a base utilizável e exemplo real com 203 combinações. Testes de navegador confirmaram mudança de ranking, turma fixada, persistência, outro período, bloqueios e cenários impossíveis. Detalhes e pendências em [VALIDACAO.md](VALIDACAO.md).
- **Decisão:** restrições rígidas separadas de pesos; alternativas deduplicadas por horários; limite de busca anunciado. Quatro turmas com conflito interno excluídas, não corrigidas por suposição. Sem Micro-Horário externo, sem LLM em runtime, sem merge/main ou hospedagem.

**Fechamento técnico:** branch enviada ao remoto; CI GitHub aprovada no commit `49d9416`. Preview local do build confirmou dados e worker com 203 combinações, sem erros de console capturados. `main` permaneceu no init `e81ede6`.

## 01/10/2026 — Erros de interface encontrados na validação

- **Objetivo:** verificar se o que o usuário preenche é o que o motor recebe.
- **Contexto:** formulário inicial de horários controlado pelo estado React e layout CSS com mínimo temporal no calendário.
- **Instrução à IA:** testar os fluxos reais, não só compilar; a equipe também pediu blocos menores.
- **Resultado inicial incorreto:** campos exibiam 18h–13h, mas envio usava 13h–18h e criava bloqueios; uma correção parcial ainda revertia campos após renderização. No celular, o calendário expandia a página inteira.
- **Validação da correção:** horários nativos não controlados e `FormData` rejeitam intervalo invertido mesmo após editar o nome. Intervalo válido gera cinco bloqueios, repetição não duplica e INF1383 fica corretamente inviável. Ajuste do mínimo dos itens CSS deixou página/área útil com mesma largura de 375px.
- **Decisão:** ler valores efetivos no envio; manter rolagem interna; reduzir linhas de 54px para 42px sem mudar duração. Não declarar download/impressão/hospedagem validados onde não houve evidência.

## Modelo para a próxima decisão relevante

### Data — título

- **Objetivo:**
- **Contexto:**
- **Instrução à IA:**
- **Resultado:**
- **Validação:**
- **Decisão:**
