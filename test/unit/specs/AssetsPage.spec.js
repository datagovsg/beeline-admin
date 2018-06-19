import AssetsPage from '@/pages/assets.vue'
import { mount } from '@vue/test-utils'
import { delay, mockAjax, testStore } from '../util'
import axios from 'axios'
import sinon from 'sinon'

describe('assets.vue', () => {
  let assetsPage = null

  beforeEach(async () => {
    assetsPage = await mockAjax({
      'GET /assets': [
        200,
        [
          {
            "id": "commuterApp.upgradeUrl.Android",
            "preview": "https://play.google.com/store/apps/details?id=sg.beeline&utm_source=global_co&utm_medium=prtnr&utm_c"
          },
          {
            "id": "commuterApp.upgradeUrl.iOS",
            "preview": "https://itunes.apple.com/sg/app/beeline-sg/id1010615256?ls=1&mt=8"
          },
          {
            "id": "commuterApp.minVersion",
            "preview": "1.0.0"
          },
          {
            "id": "Tags",
            "preview": "Here are some special tags:\n\n1. **public** -- Routes that will be publicly bookable on the [Beeline "
          },
          {
            "id": "FAQ",
            "preview": "## About Beeline\n\n### What is Beeline?\n\nBeeline is Singapore's first marketplace for crowdsourced bu"
          },
          {
            "id": "FAQ-grab",
            "preview": "## ABOUT GRABSHUTTLE\n\n### What is GrabShuttle?\n\nGrabShuttle is a new service that allows passengers "
          },
          {
            "id": "PublicHoliday",
            "preview": "BEGIN:VCALENDAR\nPRODID:-//Google Inc//Google Calendar 70.9054//EN\nVERSION:2.0\nCALSCALE:GREGORIAN\nMET"
          },
          {
            "id": "routepass-tc",
            "preview": "1. Route passes allow you to pre-purchase tickets without fixing a date\n2. Route passes will be vali"
          }
        ]
      ]
    }, async () => {
      const assetsPage = mount(
        AssetsPage,
        {
          store: testStore({})
        }
      )
      await delay(10)
      return assetsPage
    })
  })

  it('should render all assets', async () => {
    const rows = assetsPage.findAll(`table.assets-table tbody tr`)

    expect(rows.length).toBe(8)

    expect(rows.at(0).text().includes('FAQ'))
    expect(rows.at(0).text().includes("## About Beeline\n\n### What is Beeline?\n\nBeeline is Singapore's first marketplace for crowdsourced bu"))

    expect(rows.at(7).text().includes('routepass-tc'))
    expect(rows.at(7).text().includes('1. Route passes allow you to pre-purchase tickets without fixing a date\n2. Route passes will be vali'))
  })

  it('should delete assets on assets', async () => {
    let deleted = false

    await mockAjax({
      'DELETE /assets/FAQ': [200, {}, () => { deleted = true }],
      'GET /assets': [200, []],
    }, async () => {
      assetsPage.findAll(`table.assets-table tbody tr`).at(0)
        .find('.delete-button')
        .trigger('click')

      // modal appears and button is visible
      await delay(1)
      expect(assetsPage.find('.modal-footer .btn-primary').isVisible()).toBe(true)

      // click on button triggers delete
      expect(deleted).toBe(false)
      assetsPage.find('.modal-footer .btn-primary').trigger('click')
      await delay(10)
      expect(deleted).toBe(true)
    })
  })

  it('should create assets on request', async () => {
    let called = false

    await mockAjax({
      'PUT /assets/some-key': [
        200,
        {},
        ({data}, response) => {
          called = true
          expect(data.data).toBe('Hello my dear!')
        }]
    }, async () => {
      const button = assetsPage.find('.new-asset-button')

      expect(button.isVisible()).toBe(true)

      button.trigger('click')

      await delay(1)

      const input = assetsPage.find('.modal-body input.asset-id')
      expect(input.isVisible()).toBe(true)
      input.setValue('some-key')

      const textarea = assetsPage.find('.modal-body textarea')
      expect(textarea.isVisible()).toBe(true)
      textarea.element.textContent = 'Hello my dear!'
      textarea.trigger('input')

      const submitButton = assetsPage.find('.modal-footer .btn-primary')
      expect(submitButton.isVisible()).toBe(true)
      submitButton.trigger('click')

      expect(called).toBe(false)
      await delay(1)
      expect(called).toBe(true)
    })
  })

  it('should update assets on request', async () => {
    let called = false

    await mockAjax({
      'GET /assets/FAQ': [
        200,
        {
          id: 'FAQ',
          data: 'This is the full FAQ data'
        }
      ],
      'PUT /assets/FAQ-new': [
        200,
        {},
        ({data}, response) => {
          called = true
          expect(data.data).toBe('Hello my dear!')
        }]
    }, async () => {
      const triggerCell = assetsPage.find('table.assets-table tbody tr:nth-child(1) td:nth-child(2)')
      expect(triggerCell.text()).toContain('## About Beeline\n\n### What is ')
      triggerCell.trigger('click')

      await delay(1)

      const input = assetsPage.find('.modal-body input.asset-id')
      expect(input.isVisible()).toBe(true)
      expect(input.element.value).toBe('FAQ')
      input.setValue('FAQ-new')

      const textarea = assetsPage.find('.modal-body textarea')
      expect(textarea.isVisible()).toBe(true)
      expect(textarea.element.value).toBe('This is the full FAQ data')
      textarea.element.value = 'Hello my dear!'
      textarea.trigger('input')

      const submitButton = assetsPage.find('.modal-footer .btn-primary')
      expect(submitButton.isVisible()).toBe(true)
      submitButton.trigger('click')

      expect(called).toBe(false)
      await delay(10)
      expect(called).toBe(true)
    })
  })
})
