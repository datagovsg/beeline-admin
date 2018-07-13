import IssueRouteCredits from '@/modals/IssueRouteCredits.vue'
import sinon from 'sinon'
import { mount } from '@vue/test-utils'
import { delay, mockAjax, testStore, mountTestPage } from '../util'

describe('IssueRouteCredits.vue', () => {
  let issueRouteCreditsModal = null
  let issueRouteCreditsResult = null
  let issueRouteCreditsError = null
  
  async function initializeModalWithProps (props) {
    await mockAjax({
      'GET /user/4567': [
        200,
        {"id":4567,"email":"joel@example.com","emailVerified":true,"name":"Joel","telephone":"+6582226264","type":null,"status":"valid",
        "lastComms":"2018-07-05T07:00:32.957Z","lastLogin":"2018-07-05T07:00:44.443Z","notes":null,
        "savedPaymentInfo":{"id":"cus_CMEThqL9gkpIYN","email":null,"object":"customer","created":1519113492,"currency":null,"discount":null,"livemode":false,"metadata":{"userId":"62921"},
        "shipping":null,"delinquent":false,"description":null,"subscriptions":{"url":"/v1/customers/cus_CMEThqL9gkpIYN/subscriptions","data":[],"object":"list","has_more":false,"total_count":0},
        "default_source":"card_1Bxn9YIt6Q7WukI6tL4hCBH4","invoice_prefix":"8AE0F4A","account_balance":0},"lastUsedAppName":"Beeline","createdAt":"2017-10-05T03:05:29.080Z","updatedAt":"2018-07-11T08:40:46.300Z"}
      ],
    }, async () => {
      issueRouteCreditsModal = mountTestPage(
        IssueRouteCredits,
        {
          sync: false,
          listeners: {
            resolve (s) { issueRouteCreditsResult = s },
            reject (e) { issueRouteCreditsError = true },
          },
          propsData: {
            userId: 4567,
            tag: 'abcd-efgh',
            ...props,
          },

        }
      )
      await delay(2)
    })
  }

  beforeEach(async () => {
    issueRouteCreditsModal = issueRouteCreditsError = issueRouteCreditsResult = null
  })

  it('should return the right data', async () => {
    await initializeModalWithProps({})

    const quantityCtrl = issueRouteCreditsModal.find(`input[name="quantity"]`)
    const descriptionCtrl = issueRouteCreditsModal.find(`textarea[name="description"]`)

    quantityCtrl.element.value = '3'
    quantityCtrl.trigger('input')

    descriptionCtrl.element.value = 'Hello world!'
    descriptionCtrl.trigger('input')

    await delay(1)

    issueRouteCreditsModal.find('.btn.btn-primary').trigger('click')

    await delay(1)

    expect(issueRouteCreditsResult).toEqual({
      userId: 4567,
      tag: 'abcd-efgh',
      quantity: 3,
      description: 'Hello world!'
    })
  })

  it('should reject if cancelled', async () => {
    await initializeModalWithProps({})

    issueRouteCreditsModal.find('.btn.btn-default').trigger('click')

    await delay(1)

    expect(issueRouteCreditsError).toBeTruthy()
  })
})
