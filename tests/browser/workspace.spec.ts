import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdir } from 'node:fs/promises'

const evidence = process.env.AUDIT_ROUND
  ? `docs/evidence/round-${process.env.AUDIT_ROUND}`
  : 'test-results/visual-evidence'
async function capture(page: Page, name: string) {
  await mkdir(evidence, { recursive: true })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.panel-content').evaluate((node) => {
    node.scrollTop = 0
  })
  await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: true })
}
async function accessible(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(
    result.violations.map(({ id, nodes }) => ({
      id,
      elements: nodes.map((node) => node.target),
    })),
  ).toEqual([])
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
}
async function addBlock(page: Page, day: string, start: string, end: string) {
  await page.getByLabel('Dia da semana').selectOption(day)
  await page.getByLabel('Início', { exact: true }).fill(start)
  await page.getByLabel('Fim', { exact: true }).fill(end)
  await page
    .getByRole('button', { name: '+ Adicionar bloqueio', exact: true })
    .click()
}

for (const width of [360, 768, 1440, 1920]) {
  test(`fluxo completo, acessibilidade e capturas em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width < 800 ? 900 : 1080 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('./')
    await expect(
      page.getByRole('heading', { name: 'Planeje sua próxima grade.' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Gerar grade', exact: true }),
    ).toBeDisabled()
    await capture(page, `${width}-initial`)
    await noOverflow(page)
    const search = page.getByLabel('Buscar por código ou nome')
    await search.fill('ZZZ inexistente')
    await expect(
      page.getByRole('heading', { name: 'Nenhuma disciplina encontrada' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Limpar busca e filtro' }).click()
    await search.fill('calculo')
    await expect(page.locator('.course').first()).toBeVisible()
    await search.fill('MAT')
    const add = page.getByRole('button', { name: /^Adicionar MAT/ }).first()
    const codigo = (await add.getAttribute('aria-label'))!.replace(
      'Adicionar ',
      '',
    )
    await add.click()
    await page.getByLabel('Só selecionadas').check()
    await expect(page.locator('.course')).toHaveCount(1)
    await page.getByLabel('Ordenar', { exact: true }).selectOption('turmas')
    await page.locator('.course summary').click()
    await capture(page, `${width}-disciplinas`)
    await accessible(page)

    await page
      .getByRole('button', { name: 'Disponibilidade', exact: true })
      .click()
    await addBlock(page, '0', '12:00', '09:00')
    await expect(page.getByRole('alert')).toHaveText(
      'O fim precisa ser posterior ao início.',
    )
    await addBlock(page, '0', '09:00', '12:00')
    await addBlock(page, '2', '13:30', '15:00')
    await addBlock(page, '5', '07:15', '08:00')
    await expect(page.locator('.block-list li')).toHaveCount(3)
    await page
      .getByRole('button', { name: 'Editar Segunda 09:00–12:00', exact: true })
      .click()
    await page.getByLabel('Fim', { exact: true }).fill('11:30')
    await page
      .getByRole('button', { name: 'Salvar bloqueio', exact: true })
      .click()
    await expect(page.locator('.block-list')).toContainText('09:00–11:30')
    await page
      .getByRole('button', { name: 'Remover bloqueio Sábado 07:15–08:00' })
      .click()
    await expect(page.locator('.block-list li')).toHaveCount(2)
    const calendar = page
      .locator('.calendar-block')
      .filter({ hasText: '09:00' })
    if (width >= 768)
      expect((await calendar.boundingBox())!.height).toBeCloseTo(95, 0)
    await capture(page, `${width}-disponibilidade`)
    await accessible(page)
    await noOverflow(page)
    if (width < 768) {
      await expect(
        page.getByRole('button', { name: 'Dia anterior', exact: true }),
      ).toBeDisabled()
      for (let i = 0; i < 5; i++)
        await page
          .getByRole('button', { name: 'Próximo dia', exact: true })
          .click()
      await expect(
        page.getByRole('button', { name: 'Próximo dia', exact: true }),
      ).toBeDisabled()
      await expect(page.locator('.block-list li')).toHaveCount(2)
    }
    await page
      .getByRole('button', { name: 'Preferências', exact: true })
      .click()
    await page
      .getByLabel('Menos intervalos entre aulas', { exact: true })
      .check()
    await page.getByLabel('Começar mais cedo', { exact: true }).check()
    await page.getByLabel('Começar mais tarde', { exact: true }).check()
    await expect(
      page.getByLabel('Começar mais cedo', { exact: true }),
    ).not.toBeChecked()
    await page.getByLabel('Terminar mais cedo', { exact: true }).check()
    await page.getByLabel('Menos dias no campus', { exact: true }).check()
    await page
      .getByRole('button', { name: 'Subir Menos dias no campus', exact: true })
      .click()
    await expect(page.locator('.priorities li').nth(2)).toContainText(
      'Menos dias no campus',
    )
    await capture(page, `${width}-preferencias`)
    await page.locator('.panel-content').evaluate((node) => {
      node.scrollTop = node.scrollHeight
    })
    await page.screenshot({
      path: `${evidence}/${width}-preferencias-fim.png`,
      fullPage: true,
    })
    await accessible(page)
    await page.getByRole('button', { name: 'Revisar escolhas' }).click()
    await expect(page.getByRole('dialog')).toContainText(codigo)
    await expect(page.getByRole('dialog')).toContainText('09:00–11:30')
    await capture(page, `${width}-revisao`)
    await page
      .getByRole('button', { name: 'Concluir revisão' })
      .scrollIntoViewIfNeeded()
    await page.screenshot({
      path: `${evidence}/${width}-revisao-fim.png`,
      fullPage: true,
    })
    await accessible(page)
    await page
      .getByRole('button', { name: 'Editar disciplinas', exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Disciplinas', exact: true }),
    ).toBeFocused()
    await page.getByLabel('Período da oferta').selectOption('20252')
    await expect(page.locator('.block-list li')).toHaveCount(0)
    await page.getByLabel('Período da oferta').selectOption('20261')
    await expect(page.locator('.block-list li')).toHaveCount(2)
    await page.reload()
    await expect(page.locator('.block-list li')).toHaveCount(2)
    await page.getByRole('button', { name: 'Revisar escolhas' }).click()
    await expect(page.getByRole('dialog')).toContainText(codigo)
    await page.keyboard.press('Escape')
    await expect(
      page.getByRole('button', { name: 'Revisar escolhas' }),
    ).toBeFocused()
    await noOverflow(page)
    expect(errors).toEqual([])
  })
}

test('teclado, foco, zoom equivalente a 200%, movimento reduzido e transparência desativada', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 720, height: 540 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto('./')
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Ir para as escolhas' }),
  ).toBeFocused()
  expect(
    await page
      .getByRole('link', { name: 'Ir para as escolhas' })
      .evaluate((node) => getComputedStyle(node).outlineStyle),
  ).toBe('solid')
  await page.keyboard.press('Enter')
  await page
    .getByRole('button', { name: 'Disponibilidade', exact: true })
    .focus()
  await page.keyboard.press('Enter')
  await addBlock(page, '0', '00:00', '00:15')
  await addBlock(page, '5', '23:30', '23:59')
  await noOverflow(page)
  await accessible(page)
  await capture(page, '720-zoom200-reduced-motion')
  const session = await context.newCDPSession(page)
  await session.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-transparency', value: 'reduce' },
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ],
  })
  expect(
    await page
      .locator('.glass')
      .first()
      .evaluate((node) => getComputedStyle(node).backdropFilter),
  ).toBe('none')
  await capture(page, '720-no-transparency')
  await context.close()
})

test('bloqueios sobrepostos e curtos mantêm duração e lista equivalente', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto('./')
  await page
    .getByRole('button', { name: 'Disponibilidade', exact: true })
    .click()
  await addBlock(page, '0', '09:00', '12:00')
  await addBlock(page, '0', '10:00', '11:30')
  await addBlock(page, '0', '12:00', '12:15')
  const blocks = await page.locator('.calendar-block').all()
  expect((await blocks[0].boundingBox())!.height).toBeCloseTo(114, 0)
  expect((await blocks[1].boundingBox())!.height).toBeCloseTo(57, 0)
  expect((await blocks[2].boundingBox())!.height).toBeCloseTo(9.5, 0)
  expect((await blocks[0].boundingBox())!.x).toBeLessThan(
    (await blocks[1].boundingBox())!.x,
  )
  await expect(page.locator('.block-list li')).toHaveCount(3)
  await capture(page, '1024-overlapping-blocks')
  await accessible(page)
})

test('falha no armazenamento e fontes ausentes mantêm a interface operável', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('armazenamento bloqueado')
      },
    })
  })
  await page.route('**/*.woff2', (route) => route.abort())
  await page.setViewportSize({ width: 360, height: 900 })
  await page.goto('./')
  await expect(page.getByRole('alert')).toContainText(
    'armazenamento está indisponível',
  )
  await page
    .getByRole('button', { name: 'Disponibilidade', exact: true })
    .click()
  await addBlock(page, '1', '10:00', '11:00')
  await expect(page.locator('.block-list li')).toHaveCount(1)
  await capture(page, '360-font-and-storage-fallback')
  await noOverflow(page)
  await accessible(page)
})
