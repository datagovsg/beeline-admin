import titleCase from 'title-case'

export default class {
  constructor ({field, humanLabel = null, viewer = null, editor = null, nested = [], props = null}) {
    this.field = field
    this.humanLabel = humanLabel || titleCase(field)
    this.viewer = viewer
    this.editor = editor
    this.nested = nested
    this.props = props
  }
}
