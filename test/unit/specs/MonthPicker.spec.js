import MonthPicker from '@/components/MonthPicker.vue'
import { delay, mountTestPage } from '../util'

describe('MonthPicker', () => {
  let monthPicker = null
  let lastSelected = null

  beforeEach(async () => {
    monthPicker = mountTestPage(
      MonthPicker,
      {
        propsData: {companyId: 5},

        listeners: {
          input: (e) => { lastSelected = e }
        }
      }
    )
    await delay(1)
    lastSelected = null
  })

  it('should change year and select month', async () => {
    const yearChangeButtons = monthPicker.findAll(`table thead button`)
    const monthButtons = () => monthPicker.findAll(`table tbody button`)
    const yearDisplay = monthPicker.find(`table thead tr`)

    const year = new Date().getUTCFullYear()

    expect(yearDisplay.text()).toContain(year.toString())

    // decrement the year
    yearChangeButtons.at(0).trigger('click')
    await delay(1)

    expect(yearDisplay.text()).toContain(
      ((year - 1).toString()))

    // select January
    monthButtons().at(0).trigger('click')
    await delay(1)
    expect(lastSelected.getTime()).toBe(Date.UTC(year - 1, 0, 1))

    // increment the year
    yearChangeButtons.at(1).trigger('click')
    await delay(1)
    yearChangeButtons.at(1).trigger('click')
    await delay(1)

    expect(yearDisplay.text()).toContain(
      ((year + 1).toString()))

    // select July
    monthButtons().at(6).trigger('click')
    await delay(1)
    expect(lastSelected.getTime()).toBe(Date.UTC(year + 1, 6, 1))
  })
})
