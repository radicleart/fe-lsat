import { Lsat } from 'lsat-js'

const lsatHelper = {
  storeLsat (response, productId) {
    const header = response.headers['www-authenticate']
    const prod = JSON.parse(localStorage.getItem('402-' + productId))
    prod.lsat = Lsat.fromHeader(header)
    localStorage.setItem('402-' + productId, JSON.stringify(prod))
    return prod.lsat
  },
  storeToken (preimage, productId) {
    const prod = JSON.parse(localStorage.getItem('402-' + productId))
    // const lsat = JSON.parse(localStorage.getItem('402-lsat-' + productId))
    prod.token = prod.lsat.baseMacaroon + ':' + preimage
    localStorage.setItem('402-' + productId, prod)
    return prod.token
  },
  getLsat (productId) {
    const prod = JSON.parse(localStorage.getItem('402-' + productId))
    return prod.lsat
  },
  getToken (productId) {
    const prod = JSON.parse(localStorage.getItem('402-' + productId))
    return prod.token
  }
}
export default lsatHelper
