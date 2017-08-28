import SchemaField from './SchemaField'
import {ContactListViewer, RouteIdsViewer, DateFormatViewer} from './SchemaViewers'

export default {
  'limitByContactList': [
    new SchemaField({field: 'contactListId', viewer: ContactListViewer}),
  ],
  'limitByRoute': [
    new SchemaField({field: 'routeIds', viewer: RouteIdsViewer}),
  ],
  'limitByTripDate': [
    new SchemaField({field: 'startDate', viewer: DateFormatViewer, props: {format: 'dd-mmm-yyyy', utc: true}}),
    new SchemaField({field: 'endDate', viewer: DateFormatViewer, props: {format: 'dd-mmm-yyyy', utc: true}}),
  ],
  'limitByPurchaseDate': [
    new SchemaField({field: 'startDate', viewer: DateFormatViewer, props: {format: 'dd-mmm-yyyy', utc: true}}),
    new SchemaField({field: 'endDate', viewer: DateFormatViewer, props: {format: 'dd-mmm-yyyy', utc: true}}),
  ],
  'limitByMinTicketCount': [
    new SchemaField({field: 'n'}),
  ],
}
