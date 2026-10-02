# MatriculIA — requisitos do MVP

Versão 1.0 · 02/10/2026 · Renata Ribeiro e Herick Pinheiro · LIA Impact Lab, Case 3.

## Problema e público

Alunos precisam combinar disciplinas ofertadas e compromissos pessoais sem testar manualmente cada turma. A MatriculIA sugere até cinco horários distintos, com uma turma completa por disciplina, e permite comparar critérios explícitos. A oferta é histórica, dos períodos 2025.2 e 2026.1; a ferramenta apoia planejamento e não garante matrícula.

## Escopo

- REQ-001: buscar disciplinas por nome/código na oferta oficial do período; manter nomes ausentes e créditos desconhecidos identificados.
- REQ-002: escolher disciplinas e cadastrar, editar e remover bloqueios de segunda a sábado, com início anterior ao fim.
- REQ-003: ativar e ordenar preferências de intervalos, início cedo/tarde, término cedo e dias no campus; cedo/tarde são incompatíveis.
- REQ-004: gerar uma turma indivisível por disciplina, sem colisões internas, externas ou com bloqueios; adjacência é permitida.
- REQ-005: apresentar até cinco horários distintos, ordenados lexicograficamente conforme prioridades, sem pesos ocultos.
- REQ-006: exibir aulas proporcionais, todos os encontros e comparação das métricas; permitir selecionar alternativas.
- REQ-007: informar busca completa, melhores encontradas, impossibilidade comprovada, ausência de turmas utilizáveis ou erro. Busca limitada sem resultado não prova impossibilidade.
- REQ-008: executar fora da thread da interface, permitir cancelamento e invalidar resultados ao mudar escolhas.
- REQ-009: preservar rascunhos locais por período e oferecer teclado, foco, reflow e informações textuais equivalentes ao calendário.
- REQ-010: disponibilizar aplicação pública, repositório reproduzível, documentação, relatório editável e roteiro do vídeo obrigatório. O vídeo será gravado pela equipe.

Matrícula institucional, pré-requisitos, currículo, garantia de vagas, dados em tempo real, exportação e turma fixa ficam fora deste MVP. O roteiro inicial contém desejos futuros; este PRD prevalece para a versão integrada.

## Jornada

1. Selecionar período e disciplinas da oferta.
2. Reservar horários indisponíveis e ordenar critérios opcionais.
3. Revisar e gerar; cancelar se necessário.
4. Escolher entre até cinco alternativas, conferir aulas e métricas.
5. Ajustar escolhas e gerar novamente. Resultados anteriores deixam de valer imediatamente.

## Condições de sucesso

Todas as grades contêm exatamente uma turma inteira por disciplina, sem choque. As métricas correspondem aos encontros exibidos. A ordenação corresponde à sequência escolhida; empates são determinísticos. Testes independentes comprovam casos pequenos e a normalização oficial. Fluxos completos passam em 360/768/1440/1920 px, com teclado e axe. A versão pública carrega dados e Worker no caminho do GitHub Pages. A entrega da competição só está completa após o vídeo público da equipe.

## Fontes e decisões

Dados: revisão oficial `d506455be974a49c8aa79ab74cd89731a60cfefc`, hashes registrados no catálogo. Requisitos da conclusão: plano aprovado nesta execução. Fontes históricas: [Roteiro](ROTEIRO.md), [AI Log](AI_LOG.md), rascunho BMad anterior. Arquitetura e contratos: [especificação](../spec/spec-architecture-matriculia.md). Estado e evidências: [etapas](ETAPAS.md).
