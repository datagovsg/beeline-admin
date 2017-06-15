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

      promise.catch((err) => {
        console.log(err)
      }).then(() => {
        this.isShown = false
      })

      return promise
    }
  }
}
