import SummaryPage from '@/pages/ridershipSummary.vue'
import { mount } from '@vue/test-utils'
import { delay, mockAjax, testStore } from '../util'
import axios from 'axios'
import sinon from 'sinon'

describe('admins.vue', () => {
  let summaryPage = null

  beforeEach(async () => {
    summaryPage = await mockAjax({
      // FIXME:
      // The mockAjax function needs
      // to be able to mock queryString with varying
      // order of parameters
    }, async () => {
      // FIXME:
      return null
    })
  })

  it('should render all the routes', async () => {
    // FIXME: implement
    expect(summaryPage).toBe(null)
  })
})
