module.exports = {
  props: ['name', 'value'],
  methods: {
    resolve(data) {
      this.$emit('resolve', data)
    },
    reject(data) {
      this.$emit('reject', data)
    },
  }
}
