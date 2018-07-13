import NotificationsPage from '@/pages/notifications.vue'
import { mount } from '@vue/test-utils'
import { delay, mockAjax, testStore, mountTestPage } from '../util'
import _ from 'lodash'

describe('notifications.vue', () => {
  let notificationsPage = null
  let routeEventSubscriptions = null
  let otherEventSubscriptions = null

  const INITIAL_EVENT_SUBSCRIPTIONS = [
    {
      "id": 1332,
      "event": "passengersMessaged",
      "transportCompanyId": 2,
      "agent": {
        "name": "cschua",
        "notes": { "telegramChatId": "987654" }
      },
      "formatter": "0",
      "handler": "telegram",
      "params": {
        "ignoreIfEmpty": true,
        "transportCompanyIds": [2]
      },
    },
    {
      "id": 1331,
      "event": "noPings",
      "transportCompanyId": 2,
      "agent": {
        "name": "cschua",
        "notes": { "telegramChatId": "987654" }
      },
      "formatter": "0",
      "handler": "telegram",
      "params": {
        "minsBefore": [5, 25, 25],
        "ignoreIfEmpty": true,
        "transportCompanyIds": [2]
      },
    },
    {
      "id": 1334,
      "event": "lateETA",
      "transportCompanyId": 2,
      "agent": {
        "name": "cschua",
        "notes": { "telegramChatId": "987654" }
      },
      "formatter": "0",
      "handler": "telegram",
      "params": {
        "timeAfter": 600000,
        "ignoreIfEmpty": true,
        "transportCompanyIds": [2]
      },
    },
    {
      "id": 1333,
      "event": "tripCancelled",
      "transportCompanyId": 2,
      "agent": {
        "name": "cschua",
        "notes": { "telegramChatId": "987654" }
      },
      "formatter": "0",
      "handler": "telegram",
      "params": {
        "ignoreIfEmpty": true,
        "transportCompanyIds": [2]
      },
    },
    {
      "id": 1370,
      "event": "noPings",
      "transportCompanyId": 2,
      "agent": {
        "name": "dssq",
        "notes": { "telegramChatId": "123456" }
      },
      "formatter": "0",
      "handler": "telegram",
      "params": {
        "minsBefore": [5],
        "transportCompanyIds": [2]
      },
    }
  ]

  beforeEach(async () => {
    notificationsPage = await mockAjax(
      {
        'GET /companies/2/eventSubscriptions': [
          200,
          INITIAL_EVENT_SUBSCRIPTIONS
        ],
      },
      async () => {
        const notificationsPage = mountTestPage(
          NotificationsPage,
          {
            sync: false,
            propsData: {
              companyId: '2',
            },

          }
        )
        await delay(2)
        return notificationsPage
      })

    routeEventSubscriptions = notificationsPage.find('.route-event-subscriptions')
    otherEventSubscriptions = notificationsPage.find('.other-event-subscriptions')
  })

  it('should delete all route events on delete', async () => {
    const called = {}

    await mockAjax({
      'DELETE /companies/2/eventSubscriptions/1331': [
        200, {}, () => {called[1331] = true}
      ],
      'DELETE /companies/2/eventSubscriptions/1332': [
        200, {}, () => {called[1332] = true}
      ],
      'DELETE /companies/2/eventSubscriptions/1333': [
        200, {}, () => {called[1333] = true}
      ],
      'DELETE /companies/2/eventSubscriptions/1334': [
        200, {}, () => {called[1334] = true}
      ],
    }, async () => {
      routeEventSubscriptions.findAll('tbody tr')
        .filter(row => row.findAll('input').wrappers
          .some(t => t.element.value === "cschua"))
        .at(0)
        .find('td .btn.btn-danger')
        .trigger('click')
      await delay(1)
  
      notificationsPage.find('.modal-footer .btn.btn-primary').trigger('click')
      await delay(1)

      expect(called).toEqual({
        1331: true,
        1332: true,
        1333: true,
        1334: true,
      })
    })
  })

  it('should delete and recreate all route events on delete', async () => {
    const deleted = {}
    const posted = []

    await mockAjax({
      'DELETE /companies/2/eventSubscriptions/1331': [
        200, {}, () => {deleted[1331] = true}
      ],
      'DELETE /companies/2/eventSubscriptions/1332': [
        200, {}, () => {deleted[1332] = true}
      ],
      'DELETE /companies/2/eventSubscriptions/1333': [
        200, {}, () => {deleted[1333] = true}
      ],
      'DELETE /companies/2/eventSubscriptions/1334': [
        200, {}, () => {deleted[1334] = true}
      ],
      'POST /companies/2/eventSubscriptions': [
        200,
        (request) => {
          expect(request.data.agent.name).toBe('cschua')
          expect(request.data.agent.notes.telegramChatId).toBe('987654')
          expect(request.data.formatter).toBe('0')
          expect(request.data.handler).toBe('telegram')
          posted.push(request.data.event)
          return {id: Math.floor(Math.random() * 1e6), ...request.data}
        }
      ]
    }, async () => {
      const cschuaRow = routeEventSubscriptions.findAll('tbody tr')
        .filter(row => row.findAll('input').wrappers
          .some(t => t.element.value === "cschua"))
        .at(0)

      const newBookingCheckbox = cschuaRow.findAll('input[type="checkbox"]')
        .at(1)
      newBookingCheckbox.element.checked = true
      newBookingCheckbox.trigger('change')
      newBookingCheckbox.trigger('input')
      
      cschuaRow
        .find('td .btn.btn-default')
        .trigger('click')
      await delay(1)

      expect(deleted).toEqual({
        1331: true,
        1332: true,
        1333: true,
        1334: true,
      })
      expect(_.sortBy(posted)).toEqual(_.sortBy([
        'newBooking', 'noPings', 'tripCancelled', 'lateETA', 'passengersMessaged'
      ]))
    })
  })

  // TODO: Add test for .parse and .serialize --> these are fairly
  // complicated functions

  // TODO: test "other event subscriptions", but since these are
  // for Beeline maintainers mostly, and we have other means of
  // handling errors here, skip writing tests for now
})
