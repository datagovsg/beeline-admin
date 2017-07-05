module.exports = {
  data () {
    return {
      isShown: false,
      resolve: null, reject: null,
    }
  },
  methods: {
    show() {
      const promise = new Promise((resolve, reject) => {
        _.assign(this, {
          resolve, reject, isShown: true
        })
      })

      return promise.then(
        (result) => {
          this.isShown = false
          return result
        }, (err) => {
          console.error(err)
          this.isShown = false
          throw err
        })
    }
  }
}
