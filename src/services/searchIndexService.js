import axios from 'axios'

const SEARCH_API_PATH = process.env.VUE_APP_API_INDEX

const searchIndexService = {
  removeRecord: function (field, value) {
    return new Promise(function (resolve) {
      axios.get(SEARCH_API_PATH + '/removeRecord/' + field + '/' + value).then((result) => {
        resolve(result)
      }).catch((error) => {
        resolve(new Error('Unable index record: ' + error))
      })
    })
  },
  addRecord: function (indexable) {
    return new Promise(function (resolve) {
      if (!indexable.domain) indexable.domain = location.hostname
      if (!indexable.objType) indexable.objType = 'artwork'
      if (indexable.keywords && !Array.isArray(indexable.keywords)) {
        indexable.keywords = []
      }
      if (!indexable.privacy) {
        indexable.privacy = 'public'
      }
      if (!indexable.category) {
        indexable.category = {
          id: 0,
          name: 'artwork',
          level: 1
        }
      }
      axios.post(SEARCH_API_PATH + '/addRecord', indexable).then((result) => {
        resolve(result)
      }).catch((error) => {
        resolve(new Error('Unable index record: ' + error))
      })
    })
  },
  findAssetByHash: function (assetHash) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/v1/asset/' + assetHash).then((asset) => {
        resolve(asset)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  }
}
export default searchIndexService
