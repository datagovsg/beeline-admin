import BookingsPage from '@/pages/bookings.vue'
import sinon from 'sinon'
import * as redirect from '@/shared/redirect'
import { delay, mockAjax, mountTestPage } from '../util'
import querystring from 'querystring'
import _ from 'lodash'
import FIXTURE_DATA from '../../fixtures/booking-data.json'

describe('bookings.vue', () => {
  let bookingsPage = null
  let clock = null

  afterEach(() => {
    clock.restore()
  })

  beforeEach(async () => {
    clock = sinon.useFakeTimers({
      now: new Date(2018, 5, 15),
      shouldAdvanceTime: true
    })
    bookingsPage = await mockAjax({
      'GET /routes': [200, []],
      ['GET /custom/wrs/report?' + querystring.stringify({ // eslint-disable-line
        transportCompanyId: 33,
        tripStartDate: Date.UTC(2018, 5, 1),
        tripEndDate: Date.UTC(2018, 6, 1)
        // statuses: JSON.stringify(['valid', 'refunded', 'void'])
      }) + '&statuses&page&perPage']: [
        200,
        (request) => {
          const statusesJson = JSON.parse(request.query.statuses)
          expect(statusesJson.includes('valid')).toBe(true)
          expect(statusesJson.includes('refunded')).toBe(true)
          expect(statusesJson.includes('void')).toBe(true)
          return FIXTURE_DATA
        }
      ]
    }, async () => {
      const bookingsPage = await mountTestPage(
        BookingsPage,
        {
          sync: false,
          propsData: {companyId: 33}

        }
      )
      await delay(1050) // There is a 1-second debounce
      return bookingsPage
    })
  })

  it('should render all bookings', async () => {
    const rows = bookingsPage.findAll(`table.transactions-view > tbody > tr`)

    expect(rows.length).toBe(FIXTURE_DATA.rows.length)

    for (let i of _.range(FIXTURE_DATA.rows.length)) {
      const row = FIXTURE_DATA.rows[i]
      const rowText = rows.at(i).text()
      expect(rowText).toContain(row.user.name)
      expect(rowText).toContain(row.user.email)
      // FIXME: if you want to test for the display of other information,
      // do it here.
    }
  })

  /**
   * Submit the issue ticket modal, and check that the `issue_free` endpoint
   * was called. Verify that the cancelledTicketIds are correct.
   * @param {} routeId
   * @param {*} ticketIds
   */
  async function checkCancelledTicketsOnModalSubmit (ticketIds) {
    let called = false
    await mockAjax({
      'POST /transactions/tickets/issue_free': [
        200,
        {},
        (request, response) => {
          // We only check cursorily that the data has been
          // passed from IssueTicket modal to the endpoint
          // Detailed checks should be done at IssueTicketModal.spec.vue
          expect(request.data.cancelledTicketIds)
            .toEqual(ticketIds)
          called = true
        }
      ]
    }, async () => {
      expect(bookingsPage.find('.modal-footer .btn.btn-primary').trigger('click'))
      await delay(1)
      expect(called).toBe(true)
    })
  }

  it('should open the issue ticket dialog when "edit" is clicked, and change tickets', async () => {
    const rows = bookingsPage.findAll(`table.transactions-view > tbody > tr`)

    rows.at(0).findAll('button').filter(b => b.text().includes('Edit')).at(0).trigger('click')
    await delay(1)

    expect(bookingsPage.find('.modal-body').isVisible()).toBe(true)

    await checkCancelledTicketsOnModalSubmit(
      [FIXTURE_DATA.rows[0].id]
    )
  })

  it('should open the issue ticket dialog when "edit selected tickets" is clicked, and change tickets', async () => {
    const rows = bookingsPage.findAll(`table.transactions-view > tbody > tr`)

    // So happens that #3,4,5 are Mandai tickets, i.e. same route so this works
    rows.at(3).find('input[type="checkbox"]').setChecked(true)
    await delay(5)
    rows.at(4).find('input[type="checkbox"]').setChecked(true)
    await delay(5)
    bookingsPage.findAll('button').filter(b => b.text().includes('Edit Selected'))
      .at(0).trigger('click')
    await delay(1)

    expect(
      bookingsPage.findAll('button').filter(b => b.text().includes('Edit Selected'))
        .at(0).element.disabled
    ).toBeFalsy

    expect(bookingsPage.find('.modal-body').isVisible()).toBe(true)

    await checkCancelledTicketsOnModalSubmit(
      [FIXTURE_DATA.rows[3].id, FIXTURE_DATA.rows[4].id]
    )
  })

  it('should void after confirmation', async () => {
    const rows = bookingsPage.findAll(`table.transactions-view > tbody > tr`)

    // So happens that #3,4,5 are Mandai tickets, i.e. same route so this works
    async function triggerVoid () {
      rows.at(3).findAll('.btn')
        .filter(btn => btn.text().trim() === 'Void')
        .at(0)
        .trigger('click')
      await delay(1)
    }

    let called = false
    await mockAjax({
      [`PUT /tickets/${FIXTURE_DATA.rows[3].id}/status`]: [
        200,
        request => ({status: request.data.status}),
        (request, response) => {
          called = true
          expect(request.data.status).toBe('void')
        }
      ]
    }, async () => {
      await triggerVoid()

      // Modal should now appear, asking to confirm
      bookingsPage.find(`.modal-footer .btn:not(.btn-primary)`).trigger('click')
      await delay(1)
      expect(called).toBe(false)

      // Trigger again, this time to confirm
      await triggerVoid()

      // Modal should now appear, asking to confirm
      bookingsPage.find(`.modal-footer .btn.btn-primary`).trigger('click')
      await delay(1)
      expect(called).toBe(true)
    })
  })

  it('should send WRS email to admin', async () => {
    const rows = bookingsPage.findAll(`table.transactions-view > tbody > tr`)

    // So happens that #3,4,5 are Mandai tickets, i.e. same route so this works
    async function triggerEmail () {
      rows.at(3).find('.btn.send-wrs-email')
        .trigger('click')
      await delay(1)
    }

    let called = false
    await mockAjax({
      [`POST /custom/wrs/email/${FIXTURE_DATA.rows[3].ticketSale.transactionId}`]: [
        200,
        request => ({}),
        (request, response) => { called = true }
      ]
    }, async () => {
      await triggerEmail()

      // Modal should now appear, asking to confirm
      bookingsPage.find(`.modal-footer .btn:not(.btn-primary)`).trigger('click')
      await delay(1)
      expect(called).toBe(false)

      // Trigger again, this time to confirm
      await triggerEmail()

      // Modal should now appear, asking to confirm
      bookingsPage.find(`.modal-footer .btn.btn-primary`).trigger('click')
      await delay(1)
      expect(called).toBe(true)
    })
  })

  it('should download CSV', async () => {
    let called = false

    await mockAjax({
      'POST /downloads': [
        200,
        (request) => {
          const query = querystring.parse(request.data.uri.split('?', 2)[1])
          expect(query.tripStartDate).toBe(Date.UTC(2018, 5, 1).toString())
          expect(query.tripEndDate).toBe(Date.UTC(2018, 6, 1).toString())
          expect(query.format).toBe('csv')
          expect(query.transportCompanyId).toBe('33')
          expect(query.page).toBe(undefined)
          expect(query.perPage).toBe(undefined)
          expect(JSON.parse(query.statuses)).toEqual(['valid', 'refunded', 'void'])
          called = true

          return {token: 'FAKE_DOWNLOAD_TOKEN'}
        }
      ]
    }, async () => {
      let sandbox = sinon.createSandbox({})

      try {
        let stub = sinon.stub(redirect, 'default')

        bookingsPage.findAll(`.btn.btn-default`)
          .filter(b => b.text().trim() === 'Download CSV')
          .at(0).trigger('click')
        await delay(1)

        expect(stub.calledOnceWith(`${process.env.BACKEND_URL}/download/FAKE_DOWNLOAD_TOKEN`))
      } finally {
        sandbox.restore()
      }
      expect(called).toEqual(true)
    })
  })
})
