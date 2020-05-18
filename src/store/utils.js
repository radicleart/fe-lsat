// import sha256 from 'crypto-js/sha256'
import crypto from 'crypto'
import bitcoin from 'bitcoinjs-lib'
import bitcoinMessage from 'bitcoinjs-message'
import bs58check from 'bs58check'

const utils = {
  buildHash (hashable) {
    // return sha256(hashable).toString()
    return crypto.createHash('sha256').update(hashable).digest('hex')
  },

  signBitcoin: function (privkey, message) {
    var keyPair = bitcoin.ECPair.fromWIF(privkey)
    // console.log(keyPair)
    var privateKey = keyPair.privateKey
    var signature = bitcoinMessage.sign(
      message,
      privateKey,
      keyPair.compressed
    )
    return signature.toString('base64')
  },

  getHashPreImagePair: function (preImage) {
    if (!preImage) {
      preImage = String(Math.random())
    }
    // let hashed = sha256(preImage).toString()
    const hashed = crypto.createHash('sha256').update(preImage).digest('hex')
    return {
      preImage: preImage,
      preImageHash: hashed
    }
  },

  /**
   * Sign the given hex-encoded bytes.
   */
  verifySignature: function (publicKey, signature, message) {
    // TODO: verifying the signature doesn't work but needs to at some point..
    publicKey = bs58check.encode(publicKey) // tried also keypair.publicKey from above
    console.log(bitcoinMessage.verify(message, publicKey, signature))
  }
}

export default utils
