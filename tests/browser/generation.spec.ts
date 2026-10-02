import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdir } from 'node:fs/promises'

const evidence = process.env.AUDIT_ROUND ? `docs/evidence/round-${process.env.AUDIT_ROUND}` : 'test-results/integrated-evidence'
const codes = ['MAT4162', 'INF1383', 'FIS4002', 'CRE1227']
async function select(page: Page, selected = codes) {
  for (const code of selected) {
    await page.getByLabel('Buscar por código ou nome').fill(code)
    await page.getByRole('button', { name: `Adicionar ${code}`, exact: true }).click()
  }
}
async function accessible(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
  expect(result.violations).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}
for (const width of [360,768,1440,1920]) {
  test(`geração real, alternativas, métricas, encontros e teclado em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 800 ? 900 : 1080 })
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('./')
    await select(page)
    await page.getByRole('button', { name: 'Preferências', exact: true }).click()
    await page.getByLabel('Menos intervalos entre aulas', { exact: true }).check()
    await page.getByLabel('Menos dias no campus', { exact: true }).check()
    await page.getByRole('button', { name: 'Gerar grade', exact: true }).click()
    const results = page.locator('#generation-results')
    await expect(results).toContainText('203 combinações viáveis avaliadas')
    await expect(results).toBeFocused()
    await expect(page.locator('.alternative-nav button')).toHaveCount(5)
    await expect(page.locator('.active-metrics')).toContainText('0 min')
    await expect(page.locator('.meetings-list > li')).toHaveCount(4)
    await accessible(page)
    await mkdir(evidence,{recursive:true})
    await page.screenshot({ path: `${evidence}/${width}-generation.png`, fullPage:true })
    const first = await page.locator('.meetings-list').innerText()
    await page.getByRole('button',{name:'Alternativa 2',exact:true}).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button',{name:'Alternativa 2',exact:true})).toHaveAttribute('aria-pressed','true')
    await expect(page.locator('.active-metrics')).toContainText('Alternativa 2')
    // Full timetable changes, and all meetings remain available in text.
    for (const detail of await page.locator('.meetings-list details').all()) await detail.locator('summary').click()
    const total = await page.locator('.meetings-list details ul li').count()
    await expect(page.locator('.calendar-class')).toHaveCount(total)
    expect(await page.locator('.meetings-list').innerText()).not.toBe(first)
    const visibleClass = page.locator('.calendar-class:visible').first()
    if (await visibleClass.count()) {
      await visibleClass.click()
      await expect(page.locator('.meetings-list summary:focus')).toHaveCount(1)
    }
    await accessible(page)
    await page.screenshot({path:`${evidence}/${width}-alternative.png`,fullPage:true})
    await page.getByRole('button',{name:'Disponibilidade',exact:true}).click()
    await page.getByLabel('Dia da semana').selectOption('5')
    await page.getByLabel('Início',{exact:true}).fill('00:00')
    await page.getByLabel('Fim',{exact:true}).fill('07:00')
    await page.getByRole('button',{name:'+ Adicionar bloqueio',exact:true}).click()
    await expect(results).toHaveCount(0)
    await expect(page.locator('.calendar-class')).toHaveCount(0)
    await page.getByRole('button',{name:'Gerar grade',exact:true}).click()
    await expect(results).toContainText('Busca completa')
    await expect(page.locator('.block-list')).toContainText('Sábado')
    await accessible(page)
    expect(errors).toEqual([])
  })
}

test('cancelamento real e alteração durante carregamento impedem resposta obsoleta', async ({page}) => {
  await page.route('**/solver.worker-*.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 800))
    try { await route.continue() } catch { /* worker terminated by cancellation */ }
  })
  await page.goto('./')
  await select(page)
  await page.getByRole('button',{name:'Gerar grade',exact:true}).click()
  await page.getByRole('button',{name:'Cancelar busca',exact:true}).click()
  await expect(page.getByText('Busca cancelada.',{exact:false})).toBeVisible()
  await expect(page.getByRole('button',{name:'Gerar grade',exact:true})).toBeFocused()
  await expect(page.locator('#generation-results')).toHaveCount(0)
  await page.getByRole('button',{name:'Gerar grade',exact:true}).click()
  await page.getByLabel('Período da oferta').selectOption('20252')
  await expect(page.getByRole('button',{name:'Cancelar busca',exact:true})).toHaveCount(0)
  await expect(page.locator('#generation-results')).toHaveCount(0)
  await page.getByLabel('Período da oferta').selectOption('20261')
  await page.getByRole('button',{name:'Gerar grade',exact:true}).click()
  await expect(page.locator('#generation-results')).toContainText('203 combinações', {timeout:10000})
})
test('Worker indisponível recebe erro recuperável', async ({page}) => {
  await page.route('**/solver.worker-*.js',route => route.abort())
  await page.goto('./')
  await select(page,['INF1383'])
  await page.getByRole('button',{name:'Gerar grade',exact:true}).click()
  await expect(page.getByRole('alert')).toContainText('busca não carregou')
  await page.unroute('**/solver.worker-*.js')
  await page.getByRole('button',{name:'Tentar novamente',exact:true}).click()
  await expect(page.locator('#generation-results')).toContainText('Busca completa')
})
test('todos os dias bloqueados comprovam inviabilidade e não exibem aulas', async ({page}) => {
  await page.goto('./')
  await select(page,['INF1383'])
  await page.getByRole('button',{name:'Disponibilidade',exact:true}).click()
  for(let day=0;day<6;day++) {
    await page.getByLabel('Dia da semana').selectOption(String(day))
    await page.getByLabel('Início',{exact:true}).fill('00:00')
    await page.getByLabel('Fim',{exact:true}).fill('23:59')
    await page.getByRole('button',{name:'+ Adicionar bloqueio',exact:true}).click()
  }
  await page.getByRole('button',{name:'Gerar grade',exact:true}).click()
  await expect(page.locator('#generation-results')).toContainText('INF1383: nenhuma turma atende aos bloqueios')
  await expect(page.locator('#generation-results')).toContainText('Busca completa')
  await expect(page.locator('.calendar-class')).toHaveCount(0)
  await accessible(page)
})
