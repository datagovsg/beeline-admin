import AdminPage from '@/pages/admins.vue'
import { mount } from '@vue/test-utils'
import { delay, mockAjax, testStore, mountTestPage } from '../util'
import axios from 'axios'
import sinon from 'sinon'

describe('admins.vue', () => {
  let adminPage = null

  beforeEach(async () => {
    adminPage = await mockAjax({
      'GET /companies/5/admins': [
        200,
        [
          {
            id: 101,
            name: 'Amanda',
            email: 'amanda@example.com',
            transportCompanies: [
              {
                id: 5,
                adminCompany: {
                  permissions: []
                }
              }
            ]
          },
          {
            id: 103,
            name: 'Aisha',
            email: 'aisha@example.com',
            transportCompanies: [
              {
                id: 5,
                adminCompany: {
                  permissions: ['manage-routes', 'manage-drivers',
                    'drive', 'update-trip-status',
                    'message-passengers', 'view-passengers',
                    'manage-notifications', 'manage-customers'] // operations
                }
              }
            ]
          },
          {
            id: 102,
            name: 'Aardvark',
            email: 'aardvark@example.com',
            transportCompanies: [
              {
                id: 5,
                adminCompany: {
                  permissions: []
                }
              }
            ]
          }
        ]
      ]
    }, async () => {
      const adminPage = mountTestPage(
        AdminPage,
        {
          propsData: {companyId: 5}

        }
      )
      await delay(10)
      return adminPage
    })
  })

  it('should render all the admins', async () => {
    const rows = adminPage.findAll(`table.admin-table tbody tr`)

    expect(rows.length).toBe(3)

    // Note: expect the entries to be sorted by ID, so Aisha comes after Aardvark
    expect(rows.at(0).text().includes('Amanda'))
    expect(rows.at(1).text().includes('Aardvark'))
    expect(rows.at(2).text().includes('Aisha'))

    // Check operations box is checked for Aisha
    expect(rows.at(2).findAll('input[type="checkbox"]').at(0).is(':checked')).toBe(false)
    expect(rows.at(2).findAll('input[type="checkbox"]').at(1).is(':checked')).toBe(false)
    expect(rows.at(2).findAll('input[type="checkbox"]').at(2).is(':checked')).toBe(false)
    expect(rows.at(2).findAll('input[type="checkbox"]').at(3).is(':checked')).toBe(true)
    expect(rows.at(2).findAll('input[type="checkbox"]').at(4).is(':checked')).toBe(false)
    expect(rows.at(2).findAll('input[type="checkbox"]').at(5).is(':checked')).toBe(false)
  })

  it('should delete admins on request', async () => {
    let deleted = false

    await mockAjax({
      'DELETE /companies/5/admins/102': [200, {}, () => { deleted = true }]
    }, async () => {
      adminPage.findAll(`table.admin-table tbody tr`).at(1)
        .find('.delete-button')
        .trigger('click')

      await delay(10)
      expect(adminPage.find('.modal-footer .btn-primary').isVisible()).toBe(true)

      expect(deleted).toBe(false)
      adminPage.find('.modal-footer .btn-primary').trigger('click')
      await delay(10)
      expect(deleted).toBe(true)
    })
  })

  it('should create admins on request', async () => {
    let called = false

    await mockAjax({
      'POST /companies/5/admins': [
        200,
        {},
        ({data}, response) => {
          called = true
          expect(data.name).toBe('Ben')
          expect(data.email).toBe('benben@example.com')
          expect(data.permissions).toContain('refund')
        }]
    }, async () => {
      adminPage.find('.add-admin')
        .trigger('click')

      // Extra row created
      await delay(10)
      expect(adminPage.findAll('table.admin-table tbody tr').length).toBe(4)

      adminPage.find('table.admin-table tbody tr:nth-child(4) input[type="email"]')
        .setValue('benben@example.com')

      adminPage.find('table.admin-table tbody tr:nth-child(4) input[type="text"]')
        .setValue('Ben')

      adminPage.findAll('table.admin-table tbody tr:nth-child(4) input[type="checkbox"]')
        .at(1) // Issue refunds
        .setChecked(true)

      adminPage.find('table.admin-table tbody tr:nth-child(4) .update-button')
        .trigger('click')

      await delay(1)
      expect(called).toBe(true)
    })
  })

  it('should update admin permissions on request', async () => {
    let called = false

    await mockAjax({
      // Mr Aardvark
      'PUT /companies/5/admins/102': [
        200,
        {},
        ({data}, response) => {
          called = true
          expect(data.permissions).toContain('view-drivers')
          expect(data.permissions).toContain('view-admins')
          expect(data.permissions).toContain('view-transactions')
          expect(data.permissions).toContain('monitor-operations')
        }]
    }, async () => {
      adminPage.findAll('table.admin-table tbody tr:nth-child(2) input[type="checkbox"]')
        .at(0) // Issue tickets
        .setChecked(true)

      adminPage.find('table.admin-table tbody tr:nth-child(2) .update-button')
        .trigger('click')

      await delay(1)
      expect(called).toBe(true)
    })
  })
})
