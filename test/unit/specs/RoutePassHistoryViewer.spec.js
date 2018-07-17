import RoutePassHistory from '@/components/users/RoutePassHistory.vue'
import { delay, mockAjax, mountTestPage } from '../util'

describe('RoutePassHistory.vue', () => {
  let routePassHistory = null

  /* eslint-disable */
  const SAMPLE_HISTORY = [
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":2480937,"transactionId":290660,"itemType":"routePass","itemId":122172,"notes":{"tickets":{"375141":5.4}},"debit":"5.40","createdAt":"2018-05-04T09:48:46.441Z","updatedAt":"2018-05-04T09:48:46.441Z","transaction":{"id":290660,"committed":true,"description":"Purchase: G215 4 May","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-05-04T09:48:46.437Z","updatedAt":"2018-05-04T09:48:46.437Z"},"routePass":{"id":122172}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":2425998,"transactionId":280989,"itemType":"routePass","itemId":122171,"notes":{"tickets":{"360379":5.4}},"debit":"5.40","createdAt":"2018-04-24T09:05:01.485Z","updatedAt":"2018-04-24T09:05:01.485Z","transaction":{"id":280989,"committed":true,"description":"Purchase: G215 24 Apr","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-04-24T09:05:01.476Z","updatedAt":"2018-04-24T09:05:01.476Z"},"routePass":{"id":122171}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":2417258,"transactionId":279339,"itemType":"routePass","itemId":122170,"notes":{"tickets":{"358284":5.4}},"debit":"5.40","createdAt":"2018-04-23T01:45:40.187Z","updatedAt":"2018-04-23T01:45:40.187Z","transaction":{"id":279339,"committed":true,"description":"Purchase: G215 23 Apr","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-04-23T01:45:40.183Z","updatedAt":"2018-04-23T01:45:40.183Z"},"routePass":{"id":122170}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":2390933,"transactionId":274261,"itemType":"routePass","itemId":122169,"notes":{"tickets":{"352820":5.4}},"debit":"5.40","createdAt":"2018-04-17T07:50:51.102Z","updatedAt":"2018-04-17T07:50:51.102Z","transaction":{"id":274261,"committed":true,"description":"Purchase: G215 17 Apr","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-04-17T07:50:51.098Z","updatedAt":"2018-04-17T07:50:51.098Z"},"routePass":{"id":122169}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":2382712,"transactionId":272711,"itemType":"routePass","itemId":122168,"notes":{"tickets":{"351303":5.4}},"debit":"5.40","createdAt":"2018-04-16T00:42:43.154Z","updatedAt":"2018-04-16T00:42:43.154Z","transaction":{"id":272711,"committed":true,"description":"Purchase: G215 16 Apr","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-04-16T00:42:43.150Z","updatedAt":"2018-04-16T00:42:43.150Z"},"routePass":{"id":122168}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":2374902,"transactionId":271362,"itemType":"routePass","itemId":122172,"notes":{"routePass":{"id":122172,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.123Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.123Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.154Z","updatedAt":"2018-04-13T08:12:25.154Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122172}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":2374901,"transactionId":271362,"itemType":"routePass","itemId":122171,"notes":{"routePass":{"id":122171,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.121Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.121Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.154Z","updatedAt":"2018-04-13T08:12:25.154Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122171}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":2374900,"transactionId":271362,"itemType":"routePass","itemId":122170,"notes":{"routePass":{"id":122170,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.119Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.119Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.154Z","updatedAt":"2018-04-13T08:12:25.154Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122170}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":2374899,"transactionId":271362,"itemType":"routePass","itemId":122169,"notes":{"routePass":{"id":122169,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.116Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.116Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.153Z","updatedAt":"2018-04-13T08:12:25.153Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122169}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":2374898,"transactionId":271362,"itemType":"routePass","itemId":122168,"notes":{"routePass":{"id":122168,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.110Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.110Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.153Z","updatedAt":"2018-04-13T08:12:25.153Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122168}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":1374902,"transactionId":271362,"itemType":"routePass","itemId":122172,"notes":{"routePass":{"id":122172,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.123Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.123Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.154Z","updatedAt":"2018-04-13T08:12:25.154Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122172}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":1374901,"transactionId":271362,"itemType":"routePass","itemId":122171,"notes":{"routePass":{"id":122171,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.121Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.121Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.154Z","updatedAt":"2018-04-13T08:12:25.154Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122171}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":1374900,"transactionId":271362,"itemType":"routePass","itemId":122170,"notes":{"routePass":{"id":122170,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.119Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.119Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.154Z","updatedAt":"2018-04-13T08:12:25.154Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122170}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":1480937,"transactionId":290660,"itemType":"routePass","itemId":122172,"notes":{"tickets":{"375141":5.4}},"debit":"5.40","createdAt":"2018-05-04T09:48:46.441Z","updatedAt":"2018-05-04T09:48:46.441Z","transaction":{"id":290660,"committed":true,"description":"Purchase: G215 4 May","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-05-04T09:48:46.437Z","updatedAt":"2018-05-04T09:48:46.437Z"},"routePass":{"id":122172}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":1425998,"transactionId":280989,"itemType":"routePass","itemId":122171,"notes":{"tickets":{"360379":5.4}},"debit":"5.40","createdAt":"2018-04-24T09:05:01.485Z","updatedAt":"2018-04-24T09:05:01.485Z","transaction":{"id":280989,"committed":true,"description":"Purchase: G215 24 Apr","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-04-24T09:05:01.476Z","updatedAt":"2018-04-24T09:05:01.476Z"},"routePass":{"id":122171}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":1417258,"transactionId":279339,"itemType":"routePass","itemId":122170,"notes":{"tickets":{"358284":5.4}},"debit":"5.40","createdAt":"2018-04-23T01:45:40.187Z","updatedAt":"2018-04-23T01:45:40.187Z","transaction":{"id":279339,"committed":true,"description":"Purchase: G215 23 Apr","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-04-23T01:45:40.183Z","updatedAt":"2018-04-23T01:45:40.183Z"},"routePass":{"id":122170}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":1390933,"transactionId":274261,"itemType":"routePass","itemId":122169,"notes":{"tickets":{"352820":5.4}},"debit":"5.40","createdAt":"2018-04-17T07:50:51.102Z","updatedAt":"2018-04-17T07:50:51.102Z","transaction":{"id":274261,"committed":true,"description":"Purchase: G215 17 Apr","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-04-17T07:50:51.098Z","updatedAt":"2018-04-17T07:50:51.098Z"},"routePass":{"id":122169}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":1382712,"transactionId":272711,"itemType":"routePass","itemId":122168,"notes":{"tickets":{"351303":5.4}},"debit":"5.40","createdAt":"2018-04-16T00:42:43.154Z","updatedAt":"2018-04-16T00:42:43.154Z","transaction":{"id":272711,"committed":true,"description":"Purchase: G215 16 Apr","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-04-16T00:42:43.150Z","updatedAt":"2018-04-16T00:42:43.150Z"},"routePass":{"id":122168}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":1374899,"transactionId":271362,"itemType":"routePass","itemId":122169,"notes":{"routePass":{"id":122169,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.116Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.116Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.153Z","updatedAt":"2018-04-13T08:12:25.153Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122169}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":1374898,"transactionId":271362,"itemType":"routePass","itemId":122168,"notes":{"routePass":{"id":122168,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.110Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.110Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.153Z","updatedAt":"2018-04-13T08:12:25.153Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122168}}
  ]
  const SAMPLE_HISTORY_CONTINUATION = [ // ids adjusted to be smaller
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":480937,"transactionId":290660,"itemType":"routePass","itemId":122172,"notes":{"tickets":{"375141":5.4}},"debit":"5.40","createdAt":"2018-05-04T09:48:46.441Z","updatedAt":"2018-05-04T09:48:46.441Z","transaction":{"id":290660,"committed":true,"description":"Purchase: G215 4 May","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-05-04T09:48:46.437Z","updatedAt":"2018-05-04T09:48:46.437Z"},"routePass":{"id":122172}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":425998,"transactionId":280989,"itemType":"routePass","itemId":122171,"notes":{"tickets":{"360379":5.4}},"debit":"5.40","createdAt":"2018-04-24T09:05:01.485Z","updatedAt":"2018-04-24T09:05:01.485Z","transaction":{"id":280989,"committed":true,"description":"Purchase: G215 24 Apr","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-04-24T09:05:01.476Z","updatedAt":"2018-04-24T09:05:01.476Z"},"routePass":{"id":122171}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":417258,"transactionId":279339,"itemType":"routePass","itemId":122170,"notes":{"tickets":{"358284":5.4}},"debit":"5.40","createdAt":"2018-04-23T01:45:40.187Z","updatedAt":"2018-04-23T01:45:40.187Z","transaction":{"id":279339,"committed":true,"description":"Purchase: G215 23 Apr","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-04-23T01:45:40.183Z","updatedAt":"2018-04-23T01:45:40.183Z"},"routePass":{"id":122170}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":390933,"transactionId":274261,"itemType":"routePass","itemId":122169,"notes":{"tickets":{"352820":5.4}},"debit":"5.40","createdAt":"2018-04-17T07:50:51.102Z","updatedAt":"2018-04-17T07:50:51.102Z","transaction":{"id":274261,"committed":true,"description":"Purchase: G215 17 Apr","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-04-17T07:50:51.098Z","updatedAt":"2018-04-17T07:50:51.098Z"},"routePass":{"id":122169}},
    {"credit":"-5.40","debitF":5.4,"creditF":-5.4,"id":382712,"transactionId":272711,"itemType":"routePass","itemId":122168,"notes":{"tickets":{"351303":5.4}},"debit":"5.40","createdAt":"2018-04-16T00:42:43.154Z","updatedAt":"2018-04-16T00:42:43.154Z","transaction":{"id":272711,"committed":true,"description":"Purchase: G215 16 Apr","creatorType":"user","creatorId":"5479","type":"ticketPurchase","createdAt":"2018-04-16T00:42:43.150Z","updatedAt":"2018-04-16T00:42:43.150Z"},"routePass":{"id":122168}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":374902,"transactionId":271362,"itemType":"routePass","itemId":122172,"notes":{"routePass":{"id":122172,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.123Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.123Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.154Z","updatedAt":"2018-04-13T08:12:25.154Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122172}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":374901,"transactionId":271362,"itemType":"routePass","itemId":122171,"notes":{"routePass":{"id":122171,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.121Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.121Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.154Z","updatedAt":"2018-04-13T08:12:25.154Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122171}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":374900,"transactionId":271362,"itemType":"routePass","itemId":122170,"notes":{"routePass":{"id":122170,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.119Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.119Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.154Z","updatedAt":"2018-04-13T08:12:25.154Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122170}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":374899,"transactionId":271362,"itemType":"routePass","itemId":122169,"notes":{"routePass":{"id":122169,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.116Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.116Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.153Z","updatedAt":"2018-04-13T08:12:25.153Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122169}},
    {"credit":"5.40","debitF":-5.4,"creditF":5.4,"id":374898,"transactionId":271362,"itemType":"routePass","itemId":122168,"notes":{"routePass":{"id":122168,"tag":"rp-1176","notes":{"price":5.4,"discountCodes":[""],"discountValue":0.27},"status":"valid","userId":12345,"companyId":15,"createdAt":"2018-04-13T08:12:25.110Z","expiresAt":"2018-05-18T00:00:00.000Z","updatedAt":"2018-04-13T08:12:25.110Z"},"outstanding":5.13},"debit":"-5.40","createdAt":"2018-04-13T08:12:25.153Z","updatedAt":"2018-04-13T08:12:25.153Z","transaction":{"id":271362,"committed":true,"description":"Purchase of route pass (rp-1176)  -$1.35","creatorType":"user","creatorId":"5479","type":"routePassPurchase","createdAt":"2018-04-13T08:12:25.147Z","updatedAt":"2018-04-13T08:12:25.147Z"},"routePass":{"id":122168}}]
  /* eslint-enable */

  beforeEach(async () => {
    routePassHistory = await mockAjax({
      'GET /companies/5/route_passes/MY_TAG/users/123/history': [
        200,
        (request) => {
          if (request.query.lastId === undefined) return SAMPLE_HISTORY
          else throw new Error(`Bad last id ${request.query.lastId}`)
        }
      ]
    }, async () => {
      const routePassHistory = await mountTestPage(
        RoutePassHistory,
        {
          propsData: {companyId: '5', userId: '123', tag: 'MY_TAG', finalBalance: 10}
        }
      )
      await delay(10)
      return routePassHistory
    })
  })

  it('should render the right balances', async () => {
    const rows = routePassHistory.findAll(`tbody tr`)
    expect(rows.wrappers.length).toBe(22) // one extra row for button, one extra row for final bal
    const rowsMinusLast = rows.wrappers.slice(1, 21)

    // descriptions
    expect(rowsMinusLast.map(w => w.find('td:nth-child(2)').text()))
      .toEqual(SAMPLE_HISTORY.map(h => h.transaction.description).slice().reverse())

    // balance before
    expect(rowsMinusLast.map(w => parseInt(w.find('td:nth-child(3)').text())))
      .toEqual([
        10, 11, 12, 11, 10, 9, 8, 7, 8, 9,
        10, 11, 12, 13, 14, 15, 14, 13, 12, 11
      ])
    // change
    expect(rowsMinusLast.map(w => parseInt(w.find('td:nth-child(4)').text())))
      .toEqual([
        +1, +1, -1, -1, -1, -1, -1, +1, +1, +1,
        +1, +1, +1, +1, +1, -1, -1, -1, -1, -1
      ])
    // balance after
    expect(rowsMinusLast.map(w => parseInt(w.find('td:nth-child(5)').text())))
      .toEqual([
        11, 12, 11, 10, 9, 8, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 14, 13, 12, 11, 10
      ])
  })

  it('should load additional rows', async () => {
    // FIXME: why are transactions printed from oldest to newest??
    await mockAjax({
      'GET /companies/5/route_passes/MY_TAG/users/123/history': [
        200,
        (request) => {
          if (request.query.lastId === '1374898') return SAMPLE_HISTORY_CONTINUATION
          else throw new Error(`Bad last id ${request.query.lastId}`)
        }
      ]
    }, async () => {
      routePassHistory.find('.btn.btn-default').trigger('click')
      await delay(1)
    })

    const rows = routePassHistory.findAll(`tbody tr`)
    expect(rows.wrappers.length).toBe(31) // no more row for button, extra row for bal
    const rowsMinusLast = rows.wrappers.slice(0, 30)

    // descriptions
    expect(rowsMinusLast.map(w => w.find('td:nth-child(2)').text()))
      .toEqual(
        SAMPLE_HISTORY_CONTINUATION.map(h => h.transaction.description).slice().reverse()
          .concat(
            SAMPLE_HISTORY.map(h => h.transaction.description).slice().reverse())
      )

    // balance before
    expect(rowsMinusLast.map(w => parseInt(w.find('td:nth-child(3)').text())))
      .toEqual([
        10, 11, 12, 13, 14, 15, 14, 13, 12, 11,
        10, 11, 12, 11, 10, 9, 8, 7, 8, 9,
        10, 11, 12, 13, 14, 15, 14, 13, 12, 11
      ])
    // change
    expect(rowsMinusLast.map(w => parseInt(w.find('td:nth-child(4)').text())))
      .toEqual([
        +1, +1, +1, +1, +1, -1, -1, -1, -1, -1,
        +1, +1, -1, -1, -1, -1, -1, +1, +1, +1,
        +1, +1, +1, +1, +1, -1, -1, -1, -1, -1
      ])
    // balance after
    expect(rowsMinusLast.map(w => parseInt(w.find('td:nth-child(5)').text())))
      .toEqual([
        11, 12, 13, 14, 15, 14, 13, 12, 11, 10,
        11, 12, 11, 10, 9, 8, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 14, 13, 12, 11, 10
      ])
  })
})
