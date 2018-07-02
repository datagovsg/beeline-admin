import IssueTicket from '@/modals/IssueTicket.vue'
import { mount } from '@vue/test-utils'
import { delay, mockAjax, testStore } from '../util'
import MockDate from 'mockdate' // Cannot use jasmine clock because it 'stops' time
import _ from 'lodash'

describe('IssueTicket.vue', () => {
  let issueTicketModal = null
  let issueTicketPromise = null
  let issueTicketResult = null

  const ROUTE_10 = {
    id: 10,
    label: 'R10',
    trips: [
      {
        id: 10001,
        routeId: 10,
        date: new Date(Date.UTC(2018, 5, 16)).toISOString(),
        isRunning: true,
        tripStops: [
          {
            id: 10101,
            canAlight: false,
            canBoard: true,
            stopId: 600,
            stop: {description: 'Bus stop 600'},
            time: new Date(2018, 5, 16, 7, 45).toISOString(),
          },
          {
            id: 10102,
            canAlight: false,
            canBoard: true,
            stopId: 601,
            stop: {description: 'Bus stop 601'},
            time: new Date(2018, 5, 16, 7, 46).toISOString(),
          },
          {
            id: 10103,
            canAlight: true,
            canBoard: false,
            stopId: 602,
            stop: {description: 'Bus stop 602'},
            time: new Date(2018, 5, 16, 8, 15).toISOString(),
          },
          {
            id: 10104,
            canAlight: true,
            canBoard: false,
            stopId: 603,
            stop: {description: 'Bus stop 603'},
            time: new Date(2018, 5, 16, 8, 16).toISOString(),
          },
        ],
      },
      {
        id: 10002,
        routeId: 10,
        date: new Date(Date.UTC(2018, 5, 30)).toISOString(),
        isRunning: true,
        tripStops: [
          {
            id: 20101,
            canAlight: false,
            canBoard: true,
            stopId: 600,
            stop: {description: 'Bus stop 600'},
            time: new Date(2018, 5, 30, 7, 45).toISOString(),
          },
          {
            id: 20102,
            canAlight: false,
            canBoard: true,
            stopId: 601,
            stop: {description: 'Bus stop 601'},
            time: new Date(2018, 5, 30, 7, 46).toISOString(),
          },
          {
            id: 20105,
            canAlight: false,
            canBoard: true,
            stopId: 605,
            stop: {description: 'Bus stop 605'},
            time: new Date(2018, 5, 30, 7, 47).toISOString(),
          },
          {
            id: 20103,
            canAlight: true,
            canBoard: false,
            stopId: 602,
            stop: {description: 'Bus stop 602'},
            time: new Date(2018, 5, 30, 8, 15).toISOString(),
          },
          {
            id: 20104,
            canAlight: true,
            canBoard: false,
            stopId: 603,
            stop: {description: 'Bus stop 603'},
            time: new Date(2018, 5, 30, 8, 16).toISOString(),
          },
        ],
      }
    ]
  }

  const PASSENGER_LISTS = [
    [
      {
        id: 99999,
        userId: 3000,
        email: 'user@example.com',
        name: 'Testing',
        telephone: '+6561234567',
        ticketId: 1,
        boardStopId: 2,
        alightStopId: 3,
        bsStopId: 4,
        tripId: 10001
      },
    ]
  ]

  async function initializeModalWithProps (props) {
    let modalLoaded = null

    issueTicketPromise = new Promise((resolve, reject) => {
      modalLoaded = mockAjax({
        'GET /routes/10?': [200, ROUTE_10, (request, response) => {}],
        'GET /routes?': [200, [ROUTE_10]],
      }, async () => {
        const issueTicketModal = mount(
          IssueTicket,
          {
            on: {resolve, reject},
            propsData: {
              routeId: 10,
              boardStopStopId: null,
              alightStopStopId: null,
              ...props,
            },
            store: testStore({})
          }
        )
        await delay(2)
        return issueTicketModal
      })
    })

    issueTicketPromise.then(result => issueTicketResult = result)

    issueTicketModal = await modalLoaded
  }

  afterEach(() => {
    MockDate.reset()
  })

  beforeEach(async () => {
    MockDate.set(new Date(2018, 5, 15))
  })

  it('should load the dates in the calendar', async () => {
    await initializeModalWithProps({})

    const rows = issueTicketModal.findAll(`table.date-picker > tbody > tr > td:not(.different-month)`)

    expect(rows.length).toBe(30) // 30 days in June

    for (let i = 1; i <= 30; i++) {
      const classes = rows.filter(r => r.text().trim() === `${i}`).at(0).element.className

      if (i === 16 || i === 30) {
        expect(classes.includes('disabled')).toBe(false)
      } else {
        expect(classes.includes('disabled')).toBe(true)
      }
    }
  })

  async function clickOnDate(i) {
    const rows = issueTicketModal.findAll(`table.date-picker > tbody > tr > td:not(.different-month)`)

    expect(rows.length).toBe(30) // 30 days in June

    rows.filter(r => r.text().trim() === `${i}`).trigger('click')
    await delay(1)
  }

  it('should load the stops in the stops list', async () => {
    await initializeModalWithProps({})

    await clickOnDate(16) // select 16 => [16]

    function getSelectOptions () {
      return [
        issueTicketModal.findAll(`select[name="boardingStop"] option`).wrappers.map(s => s.element.value),
        issueTicketModal.findAll(`select[name="alightingStop"] option`).wrappers.map(s => s.element.value),
      ]
    }

    ;(() => { // scope out the boarding and alighting selects
      const [boardingSelectOptions, alightingSelectOptions] = getSelectOptions()

      // expect all the boarding stops to be present...
      expect(boardingSelectOptions.includes('600')).toBe(true)
      expect(boardingSelectOptions.includes('601')).toBe(true)
      expect(alightingSelectOptions.includes('602')).toBe(true)
      expect(alightingSelectOptions.includes('603')).toBe(true)

      expect(boardingSelectOptions.length).toBe(2)
      expect(alightingSelectOptions.length).toBe(2)
    })()

    await clickOnDate(16) // deselect 16 => []

    ;(() => { // scope out the boarding and alighting selects
      const [boardingSelectOptions, alightingSelectOptions] = getSelectOptions()

      // expect all the boarding stops to be present...
      expect(boardingSelectOptions.length).toBe(0)
      expect(alightingSelectOptions.length).toBe(0)
    })()

    await clickOnDate(16)
    await clickOnDate(30) // select 16, 30 => [16, 30]

    ;(() => { // scope out the boarding and alighting selects
      const [boardingSelectOptions, alightingSelectOptions] = getSelectOptions()

      expect(boardingSelectOptions.includes('600')).toBe(true)
      expect(boardingSelectOptions.includes('601')).toBe(true)
      expect(alightingSelectOptions.includes('602')).toBe(true)
      expect(alightingSelectOptions.includes('603')).toBe(true)
    })()

    await clickOnDate(16) // deselect 16 => [30]
    ;(() => { // scope out the boarding and alighting selects
      const [boardingSelectOptions, alightingSelectOptions] = getSelectOptions()

      expect(boardingSelectOptions.includes('600')).toBe(true)
      expect(boardingSelectOptions.includes('601')).toBe(true)
      expect(boardingSelectOptions.includes('605')).toBe(true)
      expect(alightingSelectOptions.includes('602')).toBe(true)
      expect(alightingSelectOptions.includes('603')).toBe(true)
    })()
  })

  it('should return the final request', async () => {
    await initializeModalWithProps({
      users: [{id: 999}, {id: 998}],
      cancelledTickets: [
        {
          id: 500,
          boardStop: {
            trip: {date: '2018-01-01', route: {label: 'XXX'}},
            stop: {description: 'abc'},
            time: '2018-01-01T19:00:00Z',
          },
          alightStop: {
            trip: {date: '2018-01-01', route: {label: 'XXX'}},
            stop: {description: 'abc'},
            time: '2018-01-01T19:00:00Z',
          },
          ticketSale: {transactionId: 666}
        },
        {
          id: 501,
          boardStop: {
            trip: {date: '2018-01-02', route: {label: 'XXX'}},
            stop: {description: 'abc'},
            time: '2018-01-01T19:00:00Z',
          },
          alightStop: {
            trip: {date: '2018-01-02', route: {label: 'XXX'}},
            stop: {description: 'abc'},
            time: '2018-01-01T19:00:00Z',
          },
          ticketSale: {transactionId: 667}
        },
      ]
    })

    await clickOnDate(16)
    await clickOnDate(30)

    issueTicketModal.find(`select[name="boardingStop"] option[value="600"]`).setSelected()
    await delay(1)
    issueTicketModal.find(`select[name="alightingStop"] option[value="603"]`).setSelected()
    await delay(1)

    issueTicketModal.find('.btn.btn-primary').trigger('click')
    await delay(1)

    issueTicketResult = issueTicketModal.emitted().resolve[0][0]

    for (let userId of [999, 998]) {
      expect(issueTicketResult.trips.filter(t => t.userId === userId)[0].tripId).toBe(10001)
      expect(issueTicketResult.trips.filter(t => t.userId === userId)[0].boardStopId).toBe(10101)
      expect(issueTicketResult.trips.filter(t => t.userId === userId)[0].alightStopId).toBe(10104)
      expect(issueTicketResult.trips.filter(t => t.userId === userId)[1].tripId).toBe(10002)
      expect(issueTicketResult.trips.filter(t => t.userId === userId)[1].boardStopId).toBe(20101)
      expect(issueTicketResult.trips.filter(t => t.userId === userId)[1].alightStopId).toBe(20104)
    }
    expect(issueTicketResult.trips.length).toBe(4)
    expect(typeof issueTicketResult.description).toBe('string')
    expect(issueTicketResult.cancelledTicketIds.length).toBe(2)
    expect(issueTicketResult.cancelledTicketIds).toContain(500)
    expect(issueTicketResult.cancelledTicketIds).toContain(501)
  })

  it('should detect conflicts', async () => {
    await initializeModalWithProps({users: [{id: 3000}]})

    await mockAjax({
      'GET /trips/10001/passengers': [200, PASSENGER_LISTS[0]],
      'GET /trips/10002/passengers': [200, []]
    }, async () => {
      await clickOnDate(16)
      expect(issueTicketModal.find('.user-text-wrap').text().replace(/\s+/g, ' '))
        .toContain('This user already has a trip on 16 Jun 2018')

      await clickOnDate(16)
      expect(issueTicketModal.find('.user-text-wrap').text().replace(/\s+/g, ' ')
        .includes('This user already has a trip on 16 Jun 2018')).toBeFalsy()

      await clickOnDate(30)
      expect(issueTicketModal.find('.user-text-wrap').text().replace(/\s+/g, ' ')
        .includes('This user already has a trip on 16 Jun 2018')).toBeFalsy()
      expect(issueTicketModal.find('.user-text-wrap').text().replace(/\s+/, ' ')
        .includes('This user already has a trip on 30 Jun 2018')).toBeFalsy()
    })
  })
})
