# GradeLIA — Grade Horária Automatizada

Assistente de horários para o Case 3 do LIA Impact Lab (PUC-Rio). Escolha disciplinas, bloqueie compromissos e compare grades válidas ordenadas pelas suas preferências. Uma turma entra sempre por inteiro, com todos os encontros semanais.

**Estado em 01/10/2026:** aplicação implementada na branch `feature`, com testes locais. Sem hospedagem neste momento, por decisão da equipe. Não houve merge na `main`.

## Executar

Requisitos: Node.js **22.12+** e npm. Nenhuma chave de API, senha, banco de dados ou serviço pago é necessária.

```bash
git clone https://github.com/ribeirore/grade-horaria-automatizada.git
cd grade-horaria-automatizada
git switch feature
npm ci
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://localhost:5173/grade-horaria-automatizada/`. Os CSVs oficiais estão versionados: o JSON da oferta é gerado automaticamente antes de desenvolver, testar ou compilar.

```bash
npm run lint
npm test
npm run build
npm run preview
```

`dist/` contém o aplicativo estático pronto para futura publicação. O workflow de CI executa lint, testes e build; **não publica o site**. Para experimentar rapidamente, clique em **Experimentar um exemplo**.

## Funcionalidades

- Ofertas 2025.2 e 2026.1; busca por nome ou código, sem distinção de acentos/caixa.
- Até 12 disciplinas, uma turma completa de cada; turma específica pode ser fixada.
- Bloqueios por dia ou de segunda a sexta, horário e nome opcionais; até 60 blocos.
- Pesos de 0 a 5 para intervalos, dias no campus, início cedo/tarde e fim cedo; cinco perfis e ajustes personalizados.
- Até oito grades com horários distintos, métricas e pontuação explicada.
- Grade segunda a sábado, duração proporcional, cores por disciplina e detalhes de todos os encontros ao clicar. Layout responsivo com rolagem na grade/alternativas quando necessário.
- Configuração salva neste navegador, exportação JSON e estilo de impressão.
- Explicações de incompatibilidade e aviso quando a busca não é exaustiva.

## Dados e interpretação

Usamos **somente** os CSVs do [repositório oficial do Impact Lab](https://github.com/igor-peres/impact-lab-sieng2026). Cópias intactas e README da fonte ficam em `data/raw/`; hashes SHA-256 e exclusões em [quality-report.json](data/quality-report.json). Recorte extraído em 17/08/2026: **não é a oferta atual de matrícula**.

| Tratamento | Resultado |
| --- | ---: |
| Linhas originais da oferta | 74.381 |
| Turmas `(periodo, turma_id)` | 4.947 |
| Blocos temporais distintos antes das exclusões | 7.952 |
| Turmas utilizáveis | 4.943 |
| Blocos utilizáveis | 7.942 |
| Códigos sem correspondência no catálogo | 927 |
| 2026.1: disciplinas / turmas utilizáveis | 1.348 / 2.520 |
| 2025.2: disciplinas / turmas utilizáveis | 1.363 / 2.423 |

Agrupamos os encontros da turma, deduplicamos `(dia, início, fim)` e rejeitamos sobreposição interna. Quatro turmas foram excluídas sem alterar os originais: `TEO3235-1FW` (2025.2), `ART1028-18D`, `ECO1352-2JA` e `ENG4922-3VA` (2026.1). Sem catálogo, mostramos a abreviação oficial. Professor e sala são identificadores anônimos, não aparecem como dados reais. Vagas repetidas não são disponibilidade nem demanda.

## Motor e pontuação

React + TypeScript + Vite; preparação dos CSVs em Node.js. O motor roda em **Web Worker**, com busca em profundidade, ordenação pelas disciplinas com menos opções e poda por incompatibilidade. Alterar a configuração cancela a busca anterior e invalida seus resultados.

Choques, bloqueios e turmas fixadas são obrigatórios. Intervalos adjacentes são permitidos. Entre grades válidas, menor custo é melhor:

```text
custo = horas de intervalo na semana × peso_intervalos
      + número de dias com aula × peso_dias
      + penalidade de início × peso_início
      + média das horas de saída × peso_fim

penalidade de início:
  cedo   = média das horas de início nos dias com aula
  tarde  = 24 − média das horas de início nos dias com aula
  neutro = 0
```

As médias consideram somente dias com aula; horários destacados nos cartões são o primeiro e último da semana. Intervalo é tempo vazio **entre** aulas do mesmo dia. Empates usam intervalos, dias e identificador estável. Créditos contam uma vez por turma, não por encontro.

Limite: **1.000.000 nós ou aproximadamente 3,5 segundos**, com checagem periódica. Busca completa: melhores grades pelos critérios. Busca limitada: melhores **encontradas**, sem garantia de ótimo ou prova de impossibilidade. Turmas diferentes com horários idênticos não ocupam vários cartões; a contagem de combinações continua incluindo essas turmas.

## Estrutura

```text
data/raw/                 CSVs oficiais preservados
data/quality-report.json  Auditoria da normalização
scripts/prepare-data.mjs   CSV → public/data/offering.json
src/solver.ts              Restrições, métricas e busca
src/solver.worker.ts       Execução em segundo plano
src/ui.tsx                 Calendário e ícones
src/App.tsx                Configuração e fluxo do aluno
tests/solver.test.ts       Testes de dados e motor
docs/                     Documentação editável
```

## Limites e privacidade

Não efetiva matrícula, verifica vagas, pré-requisitos, histórico, elegibilidade ou integralização curricular. Não importa oferta externa nem integra Micro-Horário. Sem login, chamadas a modelos de IA, analytics ou envio de preferências a servidor: baixa a oferta e calcula localmente. Armazenamento local pode ser limpo/desativado pelo navegador; a aplicação funciona sem ele.

## Documentação e entrega

- [Roteiro](docs/ROTEIRO.md), preservando o planejamento anterior à construção.
- [AI Log](docs/AI_LOG.md), decisões e erros realmente encontrados.
- [Relatório Final](docs/RELATORIO_FINAL.md), sete respostas e pendências.
- [Validação](docs/VALIDACAO.md), evidências e limites dos testes.
- [Publicação futura](docs/PUBLICACAO.md), caminho gratuito sem implantação automática.

Pendências do hackathon: revisão humana, nomes/registro, confirmação sobre Claude, hospedagem quando autorizada e vídeo de até dois minutos. **Não afirmamos que essas etapas já foram concluídas.**
