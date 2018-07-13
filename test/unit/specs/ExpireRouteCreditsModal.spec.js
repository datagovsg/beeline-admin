import ExpireRouteCredits from '@/modals/ExpireRouteCredits.vue'
import { mount } from '@vue/test-utils'
import { delay, mockAjax, testStore, mountTestPage } from '../util'

describe('ExpireRouteCredits.vue', () => {
  let expireRouteCreditsModal = null
  let expireRouteCreditsResult = null
  let expireRouteCreditsError = null
  
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
      expireRouteCreditsModal = mountTestPage(
        ExpireRouteCredits,
        {
          sync: false,
          listeners: {
            resolve: result => expireRouteCreditsResult = result,
            reject: err => expireRouteCreditsError = true,
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
    expireRouteCreditsModal = expireRouteCreditsError = expireRouteCreditsResult = null
  })

  it('should return the right data', async () => {
    await initializeModalWithProps({})

    const quantityCtrl = expireRouteCreditsModal.find(`input[name="quantity"]`)

    quantityCtrl.element.value = '3'
    quantityCtrl.trigger('input')

    await delay(1)

    expireRouteCreditsModal.find('.btn.btn-primary').trigger('click')

    await delay(1)

    expect(expireRouteCreditsResult).toEqual({
      quantity: 3,
    })
  })

  it('should reject if cancelled', async () => {
    await initializeModalWithProps({})

    expireRouteCreditsModal.find('.btn.btn-default').trigger('click')

    await delay(1)

    expect(expireRouteCreditsError).toBeTruthy()
  })
})
