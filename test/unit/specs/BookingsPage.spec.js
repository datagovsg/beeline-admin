import BookingsPage from '@/pages/bookings.vue'
import { mount } from '@vue/test-utils'
import { delay, mockAjax, testStore } from '../util'
import querystring from 'querystring'
import MockDate from 'mockdate' // Cannot use jasmine clock because it 'stops' time
import _ from 'lodash'
import FIXTURE_DATA from '../../fixtures/booking-data.json'

describe('bookings.vue', () => {
  let bookingsPage = null

  afterEach(() => {
    MockDate.reset()
  })

  beforeEach(async () => {
    MockDate.set(new Date(2018, 5, 15))
    bookingsPage = await mockAjax({
      ['GET /custom/wrs/report?' + querystring.stringify({
        transportCompanyId: 33,
        tripStartDate: Date.UTC(2018, 5, 1),
        tripEndDate: Date.UTC(2018, 6, 1)
        // statuses: JSON.stringify(['valid', 'refunded', 'void'])
      }) + '&statuses&page&perPage']: [
        200,
        FIXTURE_DATA,
        (request, response) => {
          const statusesJson = JSON.parse(request.query.statuses)
          expect(statusesJson.includes('valid')).toBe(true)
          expect(statusesJson.includes('refunded')).toBe(true)
          expect(statusesJson.includes('void')).toBe(true)
        }
      ]
    }, async () => {
      const bookingsPage = mount(
        BookingsPage,
        {
          propsData: {companyId: 33},
          store: testStore({})
        }
      )
      await delay(10)
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

  it('should open the issue ticket dialog when "edit" is clicked, and change tickets', async () => {
    const rows = bookingsPage.findAll(`table.transactions-view > tbody > tr`)

    rows.at(0).findAll('button').filter(b => b.text().includes('Edit')).at(0).trigger('click')
    await delay(1)

    expect(bookingsPage.find('.modal-body').isVisible()).toBe(true)
  })

  it('should open the issue ticket dialog when "edit selected tickets" is clicked, and change tickets', async () => {
    const rows = bookingsPage.findAll(`table.transactions-view > tbody > tr`)

    // So happens that #3,4,5 are Mandai tickets, i.e. same route so this works
    rows.at(3).find('input[type="checkbox"]').trigger('click')
    await delay(1)
    rows.at(4).find('input[type="checkbox"]').trigger('click')
    await delay(1)
    bookingsPage.findAll('button').filter(b => b.text().includes('Edit Selected'))
      .at(0).trigger('click')
    await delay(1)

    expect(bookingsPage.find('.modal-body').isVisible()).toBe(true)
  })
})
