import UibPagination from '@/components/UibPagination.vue'
import { mount } from 'avoriaz'

const DEFAULT_PROPS = {
  boundaryLinks: true,
  itemsPerPage: 1
}

const verifyEntries = (pagination, active, symbols, boundaryLinks = true) => {
  expect(pagination.find('.active')[0].text()).to.equal(active + '')
  const allSymbols = boundaryLinks ? ['«', '‹', ...symbols, '›', '»'] : ['‹', ...symbols, '›']
  const pageEntries = pagination.find('li')
  allSymbols.forEach((s, i) => expect(pageEntries[i].text()).to.equal(s))
}

const createPaginationAndVerifyEntries = (props, symbols) => () => {
  const propsData = { ...DEFAULT_PROPS, ...props }
  const pagination = mount(UibPagination, { propsData })
  pagination.vm.$on('input', value => pagination.setProps({ value }))
  verifyEntries(pagination, props.value + 1, symbols, propsData.boundaryLinks)
  return pagination
}

describe('UibPagination.vue - Page Rendering', () => {
  it('should render selected first page correctly', createPaginationAndVerifyEntries(
    { totalItems: 10, value: 0 },
    ['1', '2', '3', '4', '5', '6', '...']
  ))

  it('should render selected last page correctly', createPaginationAndVerifyEntries(
    { totalItems: 10, value: 9 },
    ['...', '5', '6', '7', '8', '9', '10']
  ))

  it('should render middle page correctly', createPaginationAndVerifyEntries(
    { totalItems: 13, value: 6 },
    ['...', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '...']
  ))

  it('should display all pages', createPaginationAndVerifyEntries(
    { displayAllPages: true, totalItems: 8, value: 0 },
    ['1', '2', '3', '4', '5', '6', '7', '8']
  ))

  it('should hide boundary links', createPaginationAndVerifyEntries(
    { boundaryLinks: false, totalItems: 10, value: 0 },
    ['1', '2', '3', '4', '5', '6', '...']
  ))
})

describe('UibPagination.vue - Event Handling', () => {
  it('should handle incremental page change', async () => {
    const value = 3
    const pagination = createPaginationAndVerifyEntries(
      { totalItems: 15, value },
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '...']
    )()

    const nextPage = pagination.find('li[aria-label=Next]')[0]
    nextPage.trigger('click')

    verifyEntries(pagination, 5, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '...'])

    const prevPage = pagination.find('li[aria-label=Previous]')[0]
    prevPage.trigger('click')

    verifyEntries(pagination, 4, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '...'])
  })

  it('should handle page jumps', async () => {
    const value = 3
    const pagination = createPaginationAndVerifyEntries(
      { totalItems: 15, value },
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '...']
    )()

    const firstPage = pagination.find('li[aria-label="Jump to First"]')[0]
    firstPage.trigger('click')

    verifyEntries(pagination, 1, ['1', '2', '3', '4', '5', '6', '...'])

    const lastPage = pagination.find('li[aria-label="Jump to Last"]')[0]
    lastPage.trigger('click')

    verifyEntries(pagination, 15, ['...', '10', '11', '12', '13', '14', '15'])
  })

  it('should handle page selections', async () => {
    const pagination = createPaginationAndVerifyEntries(
      { displayAllItems:true, totalItems: 5, value: 0 },
      ['1', '2', '3', '4', '5']
    )()

    for (var i = 5; i >= 1; --i) {
      const page = pagination.find(`li:nth-child(${2 + i})`)[0]
      page.trigger('click')
      verifyEntries(pagination, i, ['1', '2', '3', '4', '5'])
    }

  })
})
