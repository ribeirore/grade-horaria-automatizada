---
title: Arquitetura do MVP MatriculIA
version: '1.0'
date_created: 2026-10-02
last_updated: 2026-10-02
owner: Renata Ribeiro e Herick Pinheiro
tags: [architecture, app, data]
---

# Introduction

Contrato da aplicação estática MatriculIA para sugerir até cinco grades com oferta histórica oficial do LIA Impact Lab. Este documento consolida o plano inicial e a revisão de conclusão.

## 1. Purpose & Scope

Orientar implementação, revisão e validação da interface React/TypeScript, normalização e busca no navegador. Público: equipe e avaliadores. Não há servidor, matrícula, pré-requisitos, garantia de vaga, exportação ou turma fixa. [ASSUMPTION] Navegador moderno com Web Worker e JavaScript habilitados; falhas recebem mensagem recuperável.

## 2. Definitions

MVP: produto mínimo viável. Turma: identidade `(periodo, turma_id)` e conjunto indivisível de encontros. Bloco/Slot: dia 0–5 (segunda–sábado), início/fim em minutos inteiros desde meia-noite. Conflito: mesmo dia e `a.start < b.end && b.start < a.end`. Grade: exatamente uma turma completa por disciplina. Prioridade: critério na sequência definida pelo aluno. Busca completa: espaço relevante percorrido ou inviabilidade estrutural provada. Horário distinto: conjunto de encontros por disciplina diferente; trocar apenas a identificação de uma turma não cria alternativa.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: usar catálogo por período com nome oficial ou abreviação identificada e créditos `number | null`.
- **REQ-002**: bloqueios válidos, editáveis, segunda a sábado, rascunhos versionados por período.
- **REQ-003**: prioridades ordenadas `intervalos | cedo | tarde | termino | dias`; cedo e tarde mutuamente exclusivos.
- **REQ-004**: turma completa, intervalos adjacentes aceitos, nenhum conflito com turma ou bloqueio.
- **REQ-005**: até cinco horários distintos; comparar critérios em ordem lexicográfica; empate final pela assinatura das identidades, sem critério oculto.
- **REQ-006**: calendário proporcional e lista de todos os encontros; métricas comparáveis.
- **REQ-007**: distinguir diagnóstico estrutural, busca completa sem solução, limite, erro e cancelamento.
- **REQ-008**: Worker terminável; qualquer mudança de entrada cancela e invalida resultados.
- **REQ-009**: operar com teclado, foco visível e sem overflow horizontal nas quatro larguras; lista equivalente ao gráfico.
- **REQ-010**: publicar build com base `/grade-horaria-automatizada/`, CI e documentação reproduzível.
- **SEC-001**: não enviar escolhas a serviços; não empacotar CSV bruto, salas ou pseudônimos de professores.
- **CON-001**: somente dois CSVs oficiais, revisão fixa e SHA-256 verificado; identidade inclui período.
- **CON-002**: excluir turmas com blocos internos sobrepostos, registrar motivo; não corrigir fonte por suposição.
- **CON-003**: limite inicial de 1.000.000 nós ou 3.500 ms; medição é cooperativa entre nós, não prazo rígido do navegador.
- **GUD-001**: preservar visual e rascunhos do front; desconhecido não vira zero.
- **PAT-001**: domínio puro → Worker → estado React → calendário/resultados; persistir apenas escolhas.

## 4. Interfaces & Data Contracts

Artefatos separados: `src/data/catalog.json` para leitura da oferta; `src/data/scheduling.json` para turmas normalizadas, com a mesma `source` (revisão, hashes e contagens), períodos e exclusões.

```ts
type Slot = { day: number; start: number; end: number }
type Section = { id: string; periodo: string; code: string; label: string; credits: number | null; slots: Slot[] }
type Course = { code: string; name: string; sections: Section[] }
type SolveRequest = {
  periodo: string; courses: Course[]; blocks: Slot[]
  priorities: ('intervalos' | 'cedo' | 'tarde' | 'termino' | 'dias')[]
  limit?: number; maxNodes?: number; maxMs?: number
}
type Metrics = {
  gapMinutes: number; days: number; classMinutes: number
  earliest: number; latest: number; averageStart: number; averageEnd: number
  credits: number | null
}
type Grade = { sections: Section[]; metrics: Metrics; signature: string }
type SolveResult = {
  grades: Grade[]; complete: boolean; feasibleCount: number
  nodes: number; elapsedMs: number; issues: string[]
}
// Worker recebe SolveRequest e responde { result: SolveResult } | { error: string }.
// Cancelamento termina o Worker; não retorna resultados parciais de uma busca cancelada.
```

Métricas: intervalos são minutos entre aulas no mesmo dia; dias conta dias com aula; início/fim são médias do primeiro/último horário somente em dias com aula. `tarde` compara início em ordem decrescente. Sem prioridades, apenas assinatura desempata. Créditos somam uma vez por disciplina e ficam `null` se qualquer parcela for desconhecida. `feasibleCount` conta combinações de turmas visitadas, não horários únicos nem vagas.

## 5. Acceptance Criteria

- **AC-001 / REQ-001, CON-001, SEC-001**: dado CSV oficial, preparar e conferir em Python produz os mesmos nomes, créditos, turmas e hashes sem campos privados.
- **AC-002 / REQ-002, REQ-003**: dado rascunho, trocar período/recarregar preserva escolhas; horário invertido é rejeitado; cedo/tarde não coexistem.
- **AC-003 / REQ-004, CON-002**: dado bloqueio em um encontro, toda turma é descartada; aulas consecutivas são aceitas; quatro turmas anômalas não são geradas.
- **AC-004 / REQ-005**: dado pequeno caso enumerável, todas as combinações viáveis e as cinco melhores distintas correspondem ao oráculo independente para cada ordem de prioridades.
- **AC-005 / REQ-006, REQ-009**: dada alternativa, lista e calendário mostram todos os encontros; métricas são calculadas dos mesmos dados, nas quatro larguras, com teclado e axe.
- **AC-006 / REQ-007, CON-003**: dado limite antes de solução, exibir busca incompleta e nunca declarar impossibilidade; caso completo sem solução declara inviabilidade.
- **AC-007 / REQ-008**: dada busca/resultados, cancelar ou mudar entradas termina Worker, remove resultados e impede resposta obsoleta.
- **AC-008 / REQ-010**: dado build publicado, carregamento, Worker, exemplo oficial, bloqueios e alternativa passam no endereço público. Documentação registra vídeo pendente até existir link.

## 6. Test Automation Strategy

- **Test Levels**: unidade de domínio, integração de dados/Worker e fluxos reais contra build de produção.
- **Frameworks**: Vitest, Playwright Chromium e axe; biblioteca CSV Python como conferência independente.
- **Test Data Management**: casos determinísticos pequenos; fonte oficial fixada; CSV temporário fora do repositório; não simular resultados na UI.
- **CI/CD Integration**: GitHub Actions, Node 22.12+, `npm ci`, testes, lint, build, instalação Chromium e e2e antes de deploy Pages.
- **Coverage Requirements**: todos os contratos críticos com testes; não estabelecer percentual sem medição. Oráculo independente para busca/poda/ranking, normalização de todas as turmas.
- **Performance Testing**: medir exemplo oficial; testar cortes por nós/tempo e cancelamento; não prometer ótimo global quando incompleta.

## 7. Rationale & Context

Busca com poda e Worker reaproveitam o motor do Herick de `origin/feature`, commit `d2e4c6a`. Front aprovado preserva navegação, cores e fontes. Ranking lexicográfico torna a ordem de prioridades verificável. Base estática fixada permite reprodução; exclusões explícitas impedem criação de encontros fictícios. Rascunho antigo BMad e roteiro inicial são históricos.

## 8. Dependencies & External Integrations

### External Systems
- **EXT-001**: GitHub — fontes, repositório, PRs e checks.

### Third-Party Services
- **SVC-001**: GitHub Pages — hospedagem estática pública; sem backend de matrícula.

### Infrastructure Dependencies
- **INF-001**: Actions com permissão de Pages/OIDC para publicar somente main após validação.

### Data Dependencies
- **DAT-001**: `turmas_horarios.csv` e `disciplinas.csv`, revisão `d506455be974a49c8aa79ab74cd89731a60cfefc`; sem atualização automática.

### Technology Platform Dependencies
- **PLT-001**: Node.js 22.12+ para build; navegador com módulos, Worker e armazenamento local opcional; React/TypeScript/Vite.

### Compliance Dependencies
- **COM-001**: não publicar dados excluídos do bundle; registrar apenas IA efetivamente usada (Codex); redistribuir licenças das fontes locais. Não existe serviço institucional integrado.

## 9. Examples & Edge Cases

```json
{"periodo":"20261","courses":[{"code":"A","name":"A","sections":[{"id":"A-1","periodo":"20261","code":"A","label":"1","credits":null,"slots":[{"day":5,"start":540,"end":600}]}]}],"blocks":[{"day":5,"start":600,"end":660}],"priorities":["intervalos","dias"],"limit":5}
```

Aula e bloqueio adjacentes no sábado são permitidos; créditos permanecem desconhecidos. Outra turma A-2 com os mesmos encontros não cria segunda alternativa; assinatura menor representa ambas. Triângulo de três disciplinas com apenas dois horários pode ser impossível mesmo que cada par seja viável. Bloqueio pode eliminar todas as opções de uma disciplina. Se ela já não tiver turmas utilizáveis, o diagnóstico atribui causa à oferta. Alterar período cancela busca e conserva rascunho anterior.

## 10. Validation Criteria

Passar `npm test`, `npm run lint`, `npm run build`, `npm run test:e2e`, conferências Python; exemplo MAT4162/INF1383/FIS4002/CRE1227 em 2026.1 tem 203 combinações. Registrar capturas de geração/alternativas nas quatro larguras e validação pública. Relatório não confunde evidências anteriores com versão integrada nem vídeo pendente com entrega completa.

## 11. Related Specifications / Further Reading

[PRD](../docs/PRD.md) · [Etapas](../docs/ETAPAS.md) · [Roteiro histórico](../docs/ROTEIRO.md) · [AI Log](../docs/AI_LOG.md) · [Dados oficiais fixados](https://github.com/igor-peres/impact-lab-sieng2026/tree/d506455be974a49c8aa79ab74cd89731a60cfefc/data/case3_grade_horaria).
