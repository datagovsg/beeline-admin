import ContactsListPage from '@/pages/contact-lists.vue'
import { mount } from '@vue/test-utils'
import { delay, mockAjax, testStore, mountTestPage } from '../util'
import axios from 'axios'
import sinon from 'sinon'

describe('contact-lists.vue', () => {
  let contactListsPage = null

  beforeEach(async () => {
    contactListsPage = await mockAjax({
      'GET /companies/2/contactLists': [
        200,
        [
          {
            id: 1,
            description: 'First contact list',
            createdAt: '2017-01-01T00:00:00'
          },
          {
            id: 2,
            description: 'Second contact list',
            createdAt: '2018-01-01T00:00:00'
          }
        ]
      ]
    }, async () => {
      const contactListsPage = mountTestPage(
        ContactsListPage,
        {
          propsData: {
            companyId: 2
          }

        }
      )
      await delay(10)
      return contactListsPage
    })
  })

  it('should render all contact lists', async () => {
    const rows = contactListsPage.findAll(`table.contact-lists tbody tr`)

    expect(rows.length).toBe(2)

    expect(rows.at(0).text().includes('First contact list'))
    expect(rows.at(0).find('a[href]').element.href.endsWith('#/c/2/contactLists/1')).toBe(true)
    expect(rows.at(1).text().includes('Second contact list'))
    expect(rows.at(1).find('a[href]').element.href.endsWith('#/c/2/contactLists/2')).toBe(true)
  })

  it('should delete contact lists on request', async () => {
    let deleted = false

    await mockAjax({
      'DELETE /companies/2/contactLists/2': [200, {}, () => { deleted = true }],
      'GET /companies/2/contactLists': [200, []]
    }, async () => {
      contactListsPage.findAll(`table.contact-lists tbody tr`).at(1)
        .find('.delete-button')
        .trigger('click')

      // modal appears and button is visible
      await delay(1)
      expect(contactListsPage.find('.modal-footer .btn-primary').isVisible()).toBe(true)

      // click on button triggers delete
      expect(deleted).toBe(false)
      contactListsPage.find('.modal-footer .btn-primary').trigger('click')
      await delay(10)
      expect(deleted).toBe(true)
    })
  })

  it('should create contact lists on request', async () => {
    let postCalled = false
    let getCalled = false

    await mockAjax({
      'POST /companies/2/contactLists': [
        200,
        {},
        ({data}, response) => {
          postCalled = true
          expect(data.description).toBeTruthy
          expect(data.telephones.length).toBe(0)
          expect(data.emails.length).toBe(0)
        }],
      'GET /companies/2/contactLists': [200, [], () => {
        expect(postCalled).toBe(true)
        getCalled = true
      }]
    }, async () => {
      const button = contactListsPage.find('.new-contact-list-button')

      expect(button.isVisible()).toBe(true)

      button.trigger('click')

      await delay(5)

      expect(getCalled).toBe(true)
    })
  })
})
