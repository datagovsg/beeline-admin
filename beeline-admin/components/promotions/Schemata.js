import SchemaField from './SchemaField'
import {ContactListViewer, RouteIdsViewer, DateFormatViewer,
  CompanyIdViewer} from './SchemaViewers'

export default {
  'limitByContactList': [
    new SchemaField({field: 'contactListId', humanLabel: 'Contact List', viewer: ContactListViewer})
  ],
  'limitByRoute': [
    new SchemaField({field: 'routeIds', humanLabel: 'Routes', viewer: RouteIdsViewer})
  ],
  'limitByCompany': [
    new SchemaField({field: 'companyId', humanLabel: 'Company', viewer: CompanyIdViewer})
  ],
  'limitByTripDate': [
    new SchemaField({field: 'startDate', viewer: DateFormatViewer, props: {format: 'dd-mmm-yyyy', utc: true}}),
    new SchemaField({field: 'endDate', viewer: DateFormatViewer, props: {format: 'dd-mmm-yyyy', utc: true}})
  ],
  'limitByPurchaseDate': [
    new SchemaField({field: 'startDate', viewer: DateFormatViewer, props: {format: 'dd-mmm-yyyy', utc: true}}),
    new SchemaField({field: 'endDate', viewer: DateFormatViewer, props: {format: 'dd-mmm-yyyy', utc: true}})
  ],
  'limitByMinTicketCount': [
    new SchemaField({field: 'n'})
  ]
}
