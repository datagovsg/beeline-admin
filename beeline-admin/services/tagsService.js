const systemTags = [
  'public', 'lite', 'mandai', 'crowdstart',
  'notify-when-empty', 'success', 'failed',
]

export default function () {
  this.getCreditTags = function(tags) {
    return _.difference(tags, systemTags)
  }
}
