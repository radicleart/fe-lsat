// import VueCookies from 'vue-cookies'

// const token = ''
// const lsatPath = API_PATH + '/lsat'
// const assetsPath = location.protocol + '//localhost:8044'
// Authorization: 'Bearer ' + token

const headers = {
  // 'X-XSRF-TOKEN': VueCookies.get('XSRF-TOKEN'),
  'Content-Type': 'application/json'
}

const axiosHelper = {
  resolvePort () {
    return window.location.hostname + ':8082'
  },
  getParams (endPoint) {
    const API_PATH = process.env.RADICLE_API
    return {
      method: 'get',
      url: API_PATH + endPoint,
      headers: headers
    }
  },
  postParams (endPoint, data) {
    const API_PATH = process.env.VUE_APP_RADICLE_API
    return {
      method: 'post',
      url: API_PATH + endPoint,
      headers: headers,
      data: data
    }
  }
}
export default axiosHelper
