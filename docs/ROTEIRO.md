# Roteiro de construção — Case 3: Grade Horária Automatizada

**Versão inicial:** 29/09/2026

**Atualização de execução:** 01/10/2026. O plano original abaixo foi preservado; resultados e mudanças estão ao final.

**Equipe:** [preencher nomes, até 4 integrantes]

**Repositório:** https://github.com/ribeirore/grade-horaria-automatizada

**Prazo da entrega:** 02/10/2026, 23h59

Este documento registra o plano antes da construção do produto. A equipe pode editar decisões e escopo conforme aprender com os dados, anotando mudanças relevantes no [AI Log](AI_LOG.md).

## 1. Entendimento

O aluno recebe uma oferta de turmas, mas precisa testar manualmente combinações de disciplinas, horários e compromissos pessoais. Nosso produto receberá uma lista de disciplinas desejadas e horários indisponíveis, montará grades sem choque e apresentará alternativas ordenadas por preferências do aluno. Cada turma será escolhida por inteiro: todos os seus blocos semanais entram juntos na grade.

O aplicativo propõe combinações de horários. Ele não efetiva matrícula nem garante que o aluno possa cursar uma disciplina, pois a base do case não contém histórico individual, currículo ou cadeia completa de pré-requisitos.

## 2. Escopo

### Obrigatório para o produto

- Selecionar um dos períodos presentes na base e buscar disciplinas ofertadas nesse período.
- Escolher exatamente uma turma completa por disciplina solicitada.
- Respeitar bloqueios de dia e horário informados pelo aluno e eliminar sobreposição entre aulas.
- Ordenar grades viáveis conforme preferências explícitas: menos intervalos entre aulas, início mais cedo ou mais tarde, fim mais cedo e menos dias no campus.
- Exibir a grade semanal com dias em colunas e horários em linhas; apresentar alternativas distintas e a comparação dos critérios.
- Informar quando não houver solução para as restrições escolhidas, com uma explicação verificável.
- Disponibilizar aplicação online e instruções para reproduzi-la localmente.

### Desejável, se houver tempo após o núcleo funcionar

- Destacar qual troca de turma diferencia duas alternativas.
- Permitir travar uma turma escolhida ao recalcular.
- Gerar uma imagem ou versão imprimível da grade.

### Fora do escopo desta entrega

- Integração com o Micro-Horário em tempo real e dados externos aos do case.
- Efetivação de matrícula, verificação de elegibilidade, currículo completo ou pré-requisitos.
- Previsão de demanda, garantia de vaga e remanejamento institucional de salas ou professores.

## 3. Dados e decisões de interpretação

Usaremos somente `turmas_horarios.csv` e `disciplinas.csv` fornecidos no [repositório oficial do Impact Lab](https://github.com/igor-peres/impact-lab-sieng2026). O primeiro cobre 2025.2 e 2026.1, com 74.381 linhas para 4.947 turmas identificadas por `(periodo, turma_id)`. Na análise inicial, essas linhas correspondiam a 7.952 combinações distintas de turma, dia, início e fim. Muitas linhas repetem o mesmo bloco com valores diferentes de vagas, sala ou professor.

O processamento agrupará por turma e deduplicará seus blocos temporais. Os campos mínimos do motor são `periodo`, `turma_id`, `cod_disciplina`, `disciplina_abrev`, `dia_semana`, `hora_inicio` e `hora_fim`. `creditos` é informação de exibição. O catálogo fornecerá nomes completos quando houver correspondência; 927 códigos ofertados não constavam nele na análise inicial. `vagas`, `sala_id`, `professor_id` e `cod_departamento` não determinarão a grade no MVP. O processo deverá relatar anomalias encontradas, sem alterar os CSVs de origem.

## 4. Decisões técnicas

- **Aplicação:** React + TypeScript + Vite, com interface em português. A grade será desenhada no navegador com CSS, mantendo posição e duração proporcionais aos horários.
- **Hospedagem:** GitHub Pages em repositório público. O projeto será compilado como site estático, sem servidor ou conta de usuário. A publicação será configurada quando houver uma aplicação funcional.
- **Dados:** um passo de preparação transformará a oferta oficial em um conjunto menor de disciplinas, turmas e blocos, com checagens de consistência. A origem e o período deverão ficar visíveis ao usuário.
- **Motor:** código TypeScript executado no navegador. A primeira abordagem será busca combinatória com poda imediata por conflitos e indisponibilidade. Antes de afirmar que uma grade é a melhor, mediremos o tempo e verificaremos se todas as combinações relevantes foram avaliadas; se for necessário limitar a busca, a interface dirá “melhores encontradas”, sem alegar ótimo global.
- **Pontuação:** restrições de choque e bloqueio são obrigatórias. Preferências só ordenam grades válidas. Os critérios e sua prioridade serão apresentados ao aluno, para que o resultado seja explicável.

Escolhemos processamento no navegador e hospedagem estática para permitir uma publicação gratuita e simples. Uma integração futura com a oferta atual do Micro-Horário precisaria de um importador próprio e de nova validação dos campos.

## 5. Etapas planejadas

1. **29/09 — início:** criar repositório, aplicação mínima e documentação; confirmar membros e responsabilidades da equipe.
2. **30/09 — dados e motor:** normalizar blocos, implementar restrições, obter grades válidas e testar casos simples e impossíveis.
3. **01/10 — experiência:** seleção de disciplinas, bloqueios, preferências, grade visual e alternativas.
4. **02/10 — entrega:** testes finais, publicação, README reproduzível, AI Log, Relatório Final e vídeo de até dois minutos.

As datas internas são metas de trabalho, não marcos adicionais da organização. Repriorizaremos itens desejáveis se o núcleo ainda não passar nos critérios de aceite.

## 6. Critérios de aceite

- Toda grade exibida contém uma e apenas uma turma para cada disciplina pedida e inclui todos os blocos dessa turma.
- Nenhum par de blocos da grade se sobrepõe; blocos consecutivos, em que um termina quando o outro começa, são aceitos.
- Nenhuma aula ocupa um intervalo bloqueado pelo aluno.
- As alternativas são combinações distintas, e as métricas exibidas correspondem aos horários da própria grade.
- Um caso impossível recebe uma mensagem correta, sem exibir uma grade inválida.
- A busca e a ordenação são verificadas com exemplos pequenos cujo resultado pode ser conferido manualmente. O tempo de resposta para uma seleção representativa será medido antes de fixar limites.
- Qualquer pessoa consegue executar o projeto a partir do README e acessar a versão publicada.
- Vídeo, links e os três documentos exigidos estão presentes no repositório na entrega final.

## 7. Estratégia de IA e validação

Usamos Codex (OpenAI) como apoio para análise dos dados, planejamento, implementação e revisão de código. A equipe revisará decisões de produto, executará testes, conferirá grades e registrará interações que mudarem a solução no [AI Log](AI_LOG.md). A IA não será tratada como fonte de verdade para os dados ou para resultados do motor.

As instruções da competição mencionam Claude na estratégia de IA e pedem que o relatório informe outras ferramentas usadas. **Pendente de decisão da equipe:** se e como usar Claude como segunda revisão durante a construção, ou confirmar com a organização se seu uso é obrigatório. O relatório final registrará apenas as ferramentas efetivamente utilizadas.

## 8. Pontos a confirmar com a equipe

- [ ] Nomes dos integrantes e divisão de responsabilidades.
- [ ] Confirmação de que a formação da equipe foi registrada com a organização; o PDF não descreve formulário ou canal de inscrição.
- [ ] Prioridade padrão entre os critérios de preferência e quantidade de alternativas a mostrar.
- [ ] Estratégia de uso de Claude, conforme a instrução da competição.
- [ ] Link e responsável pelo vídeo final.

## 9. Execução e mudanças — 01/10/2026

Após autorização da equipe, a branch `feature` foi criada a partir do init. Dados, motor, interface e testes foram implementados no mesmo ciclo; as datas de 30/09 e 01/10 acima eram metas, não execução registrada.

- Normalização concluída: 4.943 turmas e 7.942 encontros utilizáveis; quatro turmas com sobreposição interna excluídas, originais preservados.
- Busca em Web Worker, limites aproximados de 3,5s/um milhão de nós, resultado parcial explícito e até oito alternativas de horários distintos.
- Preferências com pesos 0–5; padrão implementado: intervalos 5, dias 2, início/fim 0. É uma escolha inicial ajustável, ainda sujeita à aceitação humana.
- Seleção por período, busca, turmas fixadas, bloqueios, perfis/pesos, calendário, detalhes e persistência local implementados.
- Exportação JSON e estilo de impressão implementados; conferência manual de download/impressão pendente.
- Treze testes automatizados passaram; oráculo independente em 40 casos, integridade dos dois períodos e validação de interação descritos em [VALIDACAO.md](VALIDACAO.md).
- Feedback da equipe: blocos de aula estavam grandes; linhas reduzidas de 54px para 42px, preservando proporção temporal. Corrigida rolagem da grade no celular.
- **Hospedagem adiada por pedido explícito da equipe.** CI somente valida/compila; nenhuma implantação ou merge na `main`. Caminho gratuito em [PUBLICACAO.md](PUBLICACAO.md).

Os critérios do produto estão implementados e testados nos casos registrados. Entrega da competição continua pendente de validação humana, registro da equipe, decisão sobre Claude, vídeo e aplicação online quando autorizada. Não marcar a competição como concluída apenas porque o desenvolvimento terminou.
