# Relatório Final — GradeLIA

Atualizado em 01/10/2026. Editável para revisão da equipe. Aplicação implementada na `feature`; hospedagem e vídeo pendentes. Sem merge na `main` ou submissão à organização.

## O que foi entregue?

Aplicação React + TypeScript + Vite para o Case 3, exclusivamente com dados oficiais. O aluno escolhe período e disciplinas, fixa turmas, informa bloqueios e ajusta preferências. O motor sugere até oito grades de horários distintos, incluindo todos os encontros de uma turma, sem choques. Calendário proporcional, créditos, dias, intervalos, pontuação, detalhes, persistência local, exportação JSON e estilo de impressão.

Normalização: 74.381 linhas → 4.943 turmas utilizáveis / 7.942 encontros únicos. Quatro turmas com sobreposição interna foram excluídas e documentadas; originais e hashes preservados.

Repositório: https://github.com/ribeirore/grade-horaria-automatizada/tree/feature. README reproduzível e [Validação](VALIDACAO.md). Treze testes automatizados passaram, incluindo enumeração independente em 40 casos pequenos. Exemplo real de quatro disciplinas: 203 combinações em 2026.1; perfil compacto encontra zero intervalo, quatro dias e 17 créditos.

Aplicativo online: **não publicado, a pedido da equipe**. Vídeo ≤2min: **[incluir link após gravar]**. Produto pronto para revisão local; não equivale à entrega integral da competição.

## O que ficou de fora por decisão consciente da equipe?

Micro-Horário em tempo real e outras fontes, para cumprir uso exclusivo dos dados do case. Matrícula, pré-requisitos, elegibilidade e vagas, porque não podem ser inferidos com segurança. Login/backend, desnecessários ao protótipo. Calendário com datas (.ics), pois a base traz horários semanais mas não datas acadêmicas suficientes. Não prometemos ótimo global quando a busca atingir seus limites.

## Quais foram as três principais decisões técnicas?

1. **Site estático com cálculo em Web Worker.** Permite futura hospedagem gratuita, dispensa chaves de API e mantém compromissos no navegador. O worker cancela buscas sem congelar a interface.
2. **Normalização auditável.** Agrupar por período/turma, deduplicar encontros e excluir conflito interno evita aulas/créditos duplicados. Nomes ausentes usam a abreviação da fonte; campos anônimos e vagas ambíguas não viram fatos inventados.
3. **Separar viabilidade de preferência e explicitar limites.** Restrições rígidas, pesos apenas para soluções válidas. Busca com poda conferida por enumerador independente; limite de tempo/nós distingue resultado completo, parcial e impossibilidade comprovada.

## Qual foi o maior erro produzido pela IA e como foi identificado e corrigido?

No formulário inicial, horários eram lidos do estado React. O teste no navegador mostrou campos editados, mas a submissão usava valores anteriores (13h–18h). Início 18h e fim 13h criou bloqueios em vez de rejeitar o intervalo. Uma primeira correção parcial ainda permitia que uma renderização revertesse o preenchimento.

A correção final usa campos nativos de horário não controlados e lê `FormData` no envio. Repetimos o cenário após editar também o nome: intervalo invertido rejeitado; 13h–18h cria cinco bloqueios segunda a sexta; repetir não duplica. Recalcular o exemplo explica corretamente que INF1383 ficou sem turma viável.

Outro erro: em tela estreita, o mínimo do calendário expandia toda a página. Corrigimos o mínimo dos itens CSS; largura da página igual à área útil e rolagem interna na grade.

## Qual parte da solução é menos confiável?

O melhor resultado para seleções com muitas opções: o espaço combinatório cresce rapidamente. Aproximadamente 3,5s ou um milhão de nós podem interromper a enumeração. A interface mantém grades válidas, mas não garante ótimo; sem solução encontrada, não afirma impossibilidade. Um sintético com 64 milhões de combinações potenciais terminou em cerca de 3,5s, parcial, retornando oito alternativas.

A base é histórica e tem catálogo incompleto; não garante matrícula atual. Download e impressão ainda precisam de conferência em navegador comum: a automação embutida não confirmou o arquivo baixado. Testes não substituem aceitação humana ou cobertura ampla de navegadores.

## Com mais duas horas, quais seriam as três próximas prioridades?

1. Aceitação pelos alunos da equipe em computadores/celulares reais, incluindo download, impressão e seleção diferente do exemplo.
2. Melhorar a busca com limites inferiores de custo/pré-cálculo de conflitos; medir ganhos sem perder transparência do status parcial.
3. Finalizar entrega: hospedagem quando autorizada, vídeo ≤2min, revisão dos documentos e confirmação de registro/requisitos.

## Quais ferramentas de IA foram usadas, além do Claude, se houver?

Codex (OpenAI), agente de análise, planejamento, implementação e validação. [AI Log](AI_LOG.md) registra decisões. Código, documentação, testes e interação foram executados pelo agente; aceitação humana continua pendente.

**Não há uso de Claude registrado até esta atualização.** A instrução técnica o menciona; confirmar com a organização se é obrigatório ou utilizá-lo realmente e registrar. Não declaramos uso sem evidência.

## Checklist da equipe

- [ ] Revisar relatório/Roteiro e preencher integrantes/responsabilidades.
- [ ] Confirmar registro e forma de submissão com a organização.
- [ ] Confirmar requisito de Claude; registrar uso se ocorrer.
- [ ] Validar produto, download e impressão.
- [ ] Autorizar e verificar hospedagem pública.
- [ ] Gravar/adicionar vídeo de até dois minutos.
- [ ] Conferir links e enviar antes de 02/10/2026, 23h59.
