import ContactListPage from '@/pages/contact-list.vue'
import { mount } from '@vue/test-utils'
import { delay, mockAjax, testStore, mountTestPage } from '../util'

describe('contact-list.vue', () => {
  let contactListPage = null

  const SAMPLE_CONTACT_LIST = {
    'id': 10,
    'transportCompanyId': 15,
    'description': 'ABCDEFG',
    'telephones': [
      '+6590102031',
      '+6590102032',
      '+6590102033',
      '+6590102034',
      '+6580102035',
      '+6590102036',
      '+6590102037'
    ],
    'emails': [
      'a@example.com',
      'ab@example.com',
      'abc@example.com',
      'abcd@example.com',
      'abcde@example.com'
    ],
    'createdAt': '2017-11-27T02:09:12.185Z',
    'updatedAt': '2018-06-25T02:10:04.119Z'
  }

  beforeEach(async () => {
    contactListPage = await mockAjax({
      'GET /companies/15/contactLists/10': [
        200,
        SAMPLE_CONTACT_LIST
      ]
    }, async () => {
      const contactListPage = mountTestPage(
        ContactListPage,
        {
          sync: false,
          propsData: {
            companyId: 15,
            contactListId: 10
          }

        }
      )
      await delay(10)
      return contactListPage
    })
  })

  it('should render the contact list', async () => {
    expect(contactListPage.find('div.telephone-list textarea')
      .element.value.trim())
      .toBe(SAMPLE_CONTACT_LIST.telephones.join('\n'))

    expect(contactListPage.find('div.email-list textarea')
      .element.value.trim())
      .toBe(SAMPLE_CONTACT_LIST.emails.join('\n'))
  })

  it('should save the contact list', async () => {
    const telephoneList = contactListPage.find('div.telephone-list textarea')
    telephoneList.element.value =
    `+6581234567
    +6581234568
    +6581234569
    +6581234561`
    telephoneList.trigger('input')
    telephoneList.trigger('change')
    await delay(1)

    const emailList = contactListPage.find('div.email-list textarea')
    emailList.element.value = `
        hello@gmail.com
        gutentag@yahoo.com
    `
    emailList.trigger('input')
    emailList.trigger('change')
    await delay(1)

    let called = false
    await mockAjax({
      'PUT /companies/15/contactLists/10': [
        200,
        (request) => request.data,
        (request) => {
          expect(request.data.telephones).toEqual([
            '+6581234567',
            '+6581234568',
            '+6581234569',
            '+6581234561'
          ])
          expect(request.data.emails).toEqual([
            'hello@gmail.com',
            'gutentag@yahoo.com'
          ])
          called = true
        }
      ]
    }, async () => {
      contactListPage.find('.btn.btn-primary')
        .trigger('click')
      await delay(1)
    })
    expect(called).toBe(true)
  })
})
