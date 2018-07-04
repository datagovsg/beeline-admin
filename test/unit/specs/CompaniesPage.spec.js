import CompaniesPage from '@/pages/companies.vue'
import { mount } from '@vue/test-utils'
import { delay, mockAjax, testStore } from '../util'

describe('contact-list.vue', () => {
  let companiesPage = null

  const COMPANIES_DATA = require('../../fixtures/companies-data.json')

  beforeEach(async () => {
    companiesPage = await mockAjax({
      'GET /companies': [
        200,
        COMPANIES_DATA
      ]
    }, async () => {
      const companiesPage = mount(
        CompaniesPage,
        {
          sync: false,
          propsData: {
            companyId: '4'
          },
          store: testStore({})
        }
      )
      await delay(10)
      return companiesPage
    })
  })

  function findControl (label) {
    return companiesPage.findAll('div.form-group')
      .filter(d => {
        const e = d.find('label')
        return e.exists() && e.text().trim().startsWith(label)
      })
      .at(0)
      .find('input,textarea')
  }

  it('should render the page', async () => {
    const catchThatBusData = COMPANIES_DATA.find(c => c.id === 4)

    expect(findControl('Name').element.value).toBe(catchThatBusData.name)
    expect(findControl('Email').element.value).toBe(catchThatBusData.email)
    expect(findControl('Contact No.').element.value).toBe(catchThatBusData.contactNo)
    expect(findControl('SMS Operator Code').element.value).toBe(catchThatBusData.smsOpCode)
    expect(findControl('Terms and Conditions').element.value).toBe(catchThatBusData.terms)
    expect(findControl('Features').element.value).toBe(catchThatBusData.features)
  })

  it('should save the contact list', async () => {

    async function setValue(label, value) {
      const control = findControl(label)
      control.element.value = value
      control.trigger('input')
      control.trigger('change')
      await delay(1)
    }
    
    // await setValue('Name', 'Example Name')
    await setValue('Email', 'name@example.com')
    await setValue('Contact No.', '81001234')
    await setValue('SMS Operator Code', 'BeelineSG')
    await setValue('Terms and Conditions', 'My terms')
    await setValue('Features', 'My features')

    await mockAjax({
      'PUT /companies/4': [
        200,
        (request) => {
          // Name cannot be updated except by Superadmin
          // expect(request.data.name).toBe('Example Name')
          expect(request.data.email).toBe('name@example.com')
          expect(request.data.smsOpCode).toBe('BeelineSG')
          expect(request.data.contactNo).toBe('81001234')
          expect(request.data.terms).toBe('My terms')
          expect(request.data.features).toBe('My features')
          return {}
        }
      ]
    }, async () => {
      companiesPage
        .findAll('.btn.btn-primary')
        .filter(e => e.text().trim() === 'Save')
        .at(0)
        .trigger('click')
      await delay(1)
    })
    
  })
})
