<script>
import * as SchemaViewers from './SchemaViewers'
import {fromPairs, sortBy, keyBy} from 'lodash'
import titleCase from 'title-case'

const DefaultViewer = {
  props: ['value'],
  render (h) {
    return this._v(this.value) // FIXME: Vue's text-node constructor?
  }
}

export default {
  render (h) {
    //   <div>
    //     <div v-for="key in sortedKeys">
    //       <span>{{labelFor(key)}}</span>
    //       <span :is="componentFor(key)" :value="value[key]"
    //       ...props
    //         ></span>
    //     </div>
    //   </div>
    return h(
      'div',
      this.sortedKeys.map(key =>
        h(
          'div',
          [
            h('span', [this.labelFor(key), ': ']),
            h(
              this.componentFor(key),
              {props: {
                ...this.propsFor(key),
                value: this.value[key]
              }}
            )
          ]
        )
      )
    )
  },

  props: {
    'schema': {
      default: () => []
    },
    'value': {},
    'defaultViewer': DefaultViewer
  },

  components: {
    ...SchemaViewers,
    DefaultViewer
  },

  computed: {

    keys () {
      return this.value === null ? null : Object.keys(this.value)
    },

    schemaKeys () {
      return this.schema.map(s => s.field)
    },

    schemaByField () {
      return keyBy(this.schema, s => s.field)
    },

    sortedKeys () {
      const keyInValue = fromPairs(this.keys.map(k => [k, true]))
      const keyInSchema = fromPairs(this.schemaKeys.map(k => [k, true]))

      // First show the keys in the schema in that order
      return this.schemaKeys.filter(k => k in keyInValue)
        // Then show the remaining keys from the value
        .concat(sortBy(this.keys.filter(k => !(k in keyInSchema))))
    }
  },

  methods: {
    componentFor (key) {
      return (this.schemaByField[key] && this.schemaByField[key].viewer) || 'DefaultViewer'
    },

    labelFor (key) {
      return this.schemaByField[key]
        ? this.schemaByField[key].humanLabel
        : titleCase(key)
    },

    propsFor (key) {
      return this.schemaByField[key]
        ? this.schemaByField[key].props
        : null
    }
  }
}

</script>
