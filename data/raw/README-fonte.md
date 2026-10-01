# Case 3 — Montagem automatizada de grade horária

Workshop de IA — SIEng 2026 (28/08) · dataset de apoio · PUC-Rio / DSI

## O problema

Todo início de período o aluno monta a grade à mão: abre a oferta, anota
horário de cada turma, testa combinação, descobre choque, volta atrás. Quem faz
estágio tem restrição de turno; quem vem de longe quer aula em bloco e não
espalhada; quem está no fim do curso tem pré-requisito e turma única.

O desafio é resolver isso como problema de otimização com restrição — e o
recorte fica mais interessante porque as restrições de horário do aluno são
exatamente as mesmas que geram o problema do Case 2 (a que hora ele chega no
campus) e do estacionamento.

## Arquivos

| Arquivo | Linhas | O que é |
|---|---|---|
| `turmas_horarios.csv` | 74.381 | um bloco de aula por linha (turma × dia × faixa de hora) |
| `disciplinas.csv` | 1.017 | catálogo: nome completo, créditos, carga teórica/prática |

Cobertura: **2025.2 e 2026.1**, graduação, **4.947 turmas distintas**,
1.048 professores, 211 salas, 30 departamentos.

### turmas_horarios.csv

| Coluna | Tipo | Nota |
|---|---|---|
| `periodo` | int | `20252` ou `20261` |
| `turma_id` | texto | `COD-TURMA`, ex. `ACN1005-1DA`. Chave junto com `periodo` |
| `cod_disciplina` | texto | junta com `disciplinas.csv` |
| `turma` | texto | código da turma (`3WA`, `1DA`…) |
| `disciplina_abrev` | texto | nome abreviado do SGU; o completo está em `disciplinas.csv` |
| `dia_semana` | texto | Segunda … Sábado |
| `hora_inicio` / `hora_fim` | HH:MM | |
| `sala_id` | texto | pseudônimo de sala, estável — dá para detectar conflito de sala |
| `vagas` | int | vagas ofertadas na turma |
| `creditos` | int | créditos da turma |
| `professor_id` | texto | pseudônimo, estável — dá para detectar conflito de professor |
| `cod_departamento` | texto | ex. `LET`, `SOC`, `INF` |

Uma turma aparece em **várias linhas** — uma por bloco de aula na semana. Para
montar grade, agrupe por (`periodo`, `turma_id`) e trate o conjunto de blocos
como indivisível: o aluno pega a turma inteira ou não pega.

### disciplinas.csv

`cod_disciplina`, `disciplina` (nome completo), `creditos`, `horas_teoria`,
`horas_pratica`, `cod_departamento`.

## O que os dados já mostram

- A oferta se concentra em quatro horários de início: **09:00** (17.749 blocos),
  **11:00** (16.102), **07:00** (12.733), **13:00** (11.069).
- Terça (17.927) e quinta (17.012) carregam mais aula que segunda (15.144);
  sexta tem menos da metade da terça (7.852) e sábado é resíduo (117).
- Ou seja: o choque de horário não é aleatório, ele é estrutural. Boa parte das
  disciplinas disputa as mesmas duas ou três faixas.

## Link de um projeto de grupo de alunos (período anterior):
https://gradezou.onrender.com/

## Cuidados com os dados

1. **Vieram 2 períodos, não 4.** O e-mail pedia 2 anos (4 períodos); a base
   consultada retém 2025.2 e 2026.1 com horário completo. Dá para estudar
   variação entre períodos e estabilidade da oferta, mas não série longa.
2. **Não há estrutura curricular nem pré-requisito neste pacote** — só a oferta
   com horário. Quem quiser resolver "grade válida para formar em N períodos"
   precisa modelar o currículo como hipótese, ou pedir esse dado à DSI.
3. **Não há matrícula de aluno em turma.** A demanda real por turma não está
   aqui; use `vagas` como proxy de capacidade, não de procura.
4. Turma sem dia e sem hora definidos (TCC, seminário de conclusão,
   orientação) foi **removida**: eram 6.862 linhas que não têm horário para
   alocar e só sujariam o problema. Se o time quiser tratá-las, elas existem na
   origem.
5. `sala_id` e `professor_id` são pseudônimos. Servem para restrição
   ("mesmo professor não pode estar em duas salas às 9h de terça") e não para
   saber quem é.
6. Aula de 2h aparece como um bloco; disciplina de 4 créditos costuma aparecer
   como dois blocos em dias diferentes. Confira antes de somar carga.

## Perguntas para atacar

- Dado um conjunto de disciplinas desejadas e uma restrição de turno (ex.:
  "estágio de 13h às 18h, seg a sex"), qual a melhor grade possível? Existe
  grade viável?
- Quantas combinações válidas existem para um aluno típico de 5º período? O
  problema é grande o suficiente para justificar solver, ou heurística resolve?
- Ache o conflito estrutural: pares de disciplinas que **nunca** têm combinação
  sem choque em nenhum dos dois períodos. Essa é a lista que a coordenação
  precisa ver.
- Reprograme a oferta: mexendo no mínimo de turmas, quanto se reduz o número de
  pares em conflito? Respeitando restrição de sala e de professor.
- Combine com o Case 2: se a grade empurra o aluno para chegar às 7h, o que
  isso faz com o pico do bicicletário e do estacionamento?

## Origem e anonimização

Extraído do micro-horário do SGU acadêmico em 17/08/2026, nível graduação.
Nome de professor e código de sala passaram por HMAC-SHA256 com sal aleatório
descartado no fim da extração. Não há dado de aluno neste pacote.
