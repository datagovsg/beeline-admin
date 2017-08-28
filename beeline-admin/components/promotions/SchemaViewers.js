import dateformat from 'dateformat'

export const DateFormatViewer = {
  props: {
    value: {},
    format: {},
    utc: {default: false},
  },
  render (h) {
    // FIXME: why doesn't Vue expose the text node constructor?
    return this._v(dateformat(this.value, this.format, this.utc))
  }
}

export const ContactListViewer = { // Stub
  props: ['value'],
  render (h) {
    // FIXME: why doesn't Vue expose the text node constructor?
    return this._v(JSON.stringify(this.value))
  }
}

export const RouteIdsViewer = ContactListViewer // Stub
