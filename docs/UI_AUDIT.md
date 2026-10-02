# Auditoria da estação de trabalho

Data: 02/10/2026. Aplicativo da raiz, branch `feature`. Escopo: interface e fluxo de escolhas. Geração, comparação e publicação continuam pendentes. As capturas usam escolhas de teste introduzidas pelo fluxo real da interface; não representam resultados do gerador.

## Inventário de preservação

Conferido nas três rodadas. Ajustes visuais não modificaram o catálogo.

| Área | Conteúdo e comportamento preservados | Evidência |
| --- | --- | --- |
| Identidade e propósito | Grade Horária Automatizada, LIA Impact Lab, Case 3, planejamento de disciplinas/bloqueios/preferências | Título do documento, cabeçalho e introdução |
| Período e fonte | 2025.2 e 2026.1, link oficial fixado, revisão, oferta histórica | Seletor, faixa de oferta, link e detalhes no rodapé |
| Códigos, nomes e contagens | Apenas oferta do período; nome completo ou abreviação oficial identificada; crédito desconhecido não vira zero; turmas deduplicadas | Catálogo, detalhes, revisão, Vitest e apuração Python de cada disciplina |
| Bloqueios completos | Segunda a sábado, início/fim, inclusão/edição/remoção, durações proporcionais, sobreposições preservadas | Formulário, semana/dia, lista completa e revisão |
| Preferências e ordem | Cinco critérios, ativação opcional, exclusão cedo/tarde e reordenação por botões | Preferências, revisão, reducer e fluxo Chromium |
| Revisão editável | Resumo por seção, caminhos de edição, fechamento por botão e Esc, foco restaurado | Revisão, capturas de início/fim e testes |
| Alertas, links e limites | Validação de horário, falha de armazenamento, fonte/versionamento, limites de matrícula, geração desativada | Alertas, metadados, rodapé e testes |
| Trabalho preexistente | Cópia aninhada, BMad, skills e arquivo AGENTS já preparado preservados | Status inicial registrado na sessão; 17 hashes da cópia aninhada iguais entre início da auditoria e encerramento |

## Rodadas

1. **Primeira inspeção e fluxo.** Capturas das seções e revisão nas quatro larguras. O teste detectou ordenação sem nome acessível independente do texto das opções e retorno de foco ausente após Esc. Ambos corrigidos. Testes de contraste/semântica por axe, persistência, filtros, edição, período e falhas passaram até a asserção de foco.
2. **Repetição após as correções funcionais.** Os seis cenários existentes passaram. Inspeção das imagens identificou o atalho de navegação fora de foco aparecendo em capturas de página inteira. Também motivou a prevenção de cortes em intervalos curtos e pistas estreitas de sobreposição. O cabeçalho dos painéis e o fim da revisão passaram a ser fotografados explicitamente.
3. **Revisão final.** Sete cenários passaram, incluindo bloqueios curtos e sobrepostos em 1024 px. Capturas de todas as seções, estados iniciais e início/fim da revisão em 360/768/1440/1920 px, além de condições de resiliência. Sem sobreposição de controles ou rolagem horizontal nas dimensões verificadas. A lista contém os horários completos mesmo quando um intervalo visual é curto demais para texto. A apuração independente do catálogo foi repetida, sem alteração nos números.

A terceira rodada também ajustou a concordância dos contadores e a descrição de créditos sem valor confirmado.

As áreas de catálogo e controles têm rolagem própria para manter a posição do calendário ao trocar de seção. A revisão usa rolagem quando excede a altura da tela; seus controles permanecem alcançáveis por teclado. Fontes locais têm fallback legível. Conteúdo não depende de animação, transparência, hover ou arrastar.

## Verificações

- `npm test`: 30 testes, 3 arquivos. CSV com campos delimitados/aspas/quebras, deduplicação, identidade por período, nomes ausentes, créditos ausentes/divergentes, filtros e desempates de ordenação; estado por período, bloqueios inválidos e consecutivos/sobrepostos; exclusão de prioridades incompatíveis e armazenamento malformado/indisponível.
- `npm run lint`: sem avisos ou erros. O aviso de falha de armazenamento sincroniza um sistema externo em efeito; essa exceção foi comentada localmente, sem desligar a regra global.
- `npm run build`: TypeScript e Vite aprovados. Fontes `.woff2` locais, sem carregamento de provedor externo. `dist/` é o artefato estático para publicação futura.
- `npm run test:e2e`: 7 cenários Chromium contra o preview do build em `/grade-horaria-automatizada/`, sem erros de JavaScript. Quatro fluxos completos por largura, teclado/resiliência, bloqueios sobrepostos e ausência de armazenamento/fontes. Axe executado nas três seções e revisão, com tags WCAG 2 A/AA e 2.1 A/AA, sem violações detectadas. Isso complementa, e não substitui, a inspeção visual e de teclado.
- `python3 scripts/verify-catalog.py /private/tmp/grade-turmas.csv /private/tmp/grade-disciplinas.csv`: os 2.714 pares período/disciplina, nomes, créditos, contagens, totais e hashes corresponderam ao agregado. [Relatório](catalog-verification.json).
- Zoom nativo de **200%** no Chrome via atalho do navegador, confirmado pela barra do Chrome. Documento e viewport com **735 px CSS**, sem overflow horizontal. Formulário operável; revisão rolável até “Concluir revisão”; Esc devolveu foco a “Revisar escolhas”. Capturas foram examinadas na sessão. O zoom foi restaurado a 100% e o bloqueio de teste removido.
- Teste automatizado complementar de reflow equivalente a 200% em 720 px CSS e densidade 2, movimento reduzido; emulação de `prefers-reduced-transparency`, com superfície opaca e `backdrop-filter: none`; fonte bloqueada, com texto e fluxo mantidos.

## Capturas finais

| Largura | Inicial | Disciplinas | Disponibilidade | Preferências | Revisão |
| --- | --- | --- | --- | --- | --- |
| 360 | [Imagem](evidence/round-3/360-initial.png) | [Imagem](evidence/round-3/360-disciplinas.png) | [Imagem](evidence/round-3/360-disponibilidade.png) | [Início](evidence/round-3/360-preferencias.png) · [Ordem](evidence/round-3/360-preferencias-fim.png) | [Início](evidence/round-3/360-revisao.png) · [Fim](evidence/round-3/360-revisao-fim.png) |
| 768 | [Imagem](evidence/round-3/768-initial.png) | [Imagem](evidence/round-3/768-disciplinas.png) | [Imagem](evidence/round-3/768-disponibilidade.png) | [Início](evidence/round-3/768-preferencias.png) · [Ordem](evidence/round-3/768-preferencias-fim.png) | [Início](evidence/round-3/768-revisao.png) · [Fim](evidence/round-3/768-revisao-fim.png) |
| 1440 | [Imagem](evidence/round-3/1440-initial.png) | [Imagem](evidence/round-3/1440-disciplinas.png) | [Imagem](evidence/round-3/1440-disponibilidade.png) | [Início](evidence/round-3/1440-preferencias.png) · [Ordem](evidence/round-3/1440-preferencias-fim.png) | [Início](evidence/round-3/1440-revisao.png) · [Fim](evidence/round-3/1440-revisao-fim.png) |
| 1920 | [Imagem](evidence/round-3/1920-initial.png) | [Imagem](evidence/round-3/1920-disciplinas.png) | [Imagem](evidence/round-3/1920-disponibilidade.png) | [Início](evidence/round-3/1920-preferencias.png) · [Ordem](evidence/round-3/1920-preferencias-fim.png) | [Início](evidence/round-3/1920-revisao.png) · [Fim](evidence/round-3/1920-revisao-fim.png) |

Outras condições: [sobreposições](evidence/round-3/1024-overlapping-blocks.png), [reflow e movimento reduzido](evidence/round-3/720-zoom200-reduced-motion.png), [transparência reduzida](evidence/round-3/720-no-transparency.png), [fallback de fontes/armazenamento](evidence/round-3/360-font-and-storage-fallback.png). As rodadas anteriores estão preservadas em `evidence/round-1/` e `evidence/round-2/`.

## Limites da evidência

Nenhuma geração, pontuação ou comparação de grades foi implementada ou testada. A verificação usa a oferta histórica oficial da revisão fixada, sem serviços de matrícula ou consulta em tempo real. A publicação não foi realizada nem configurada. O comportamento do site publicado decorrerá do mesmo artefato estático; seu armazenamento será próprio da origem publicada. Firefox, Safari e leitores de tela completos não foram auditados nesta etapa.
