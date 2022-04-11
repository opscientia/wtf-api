
exports.ConnectionFailedError = () => {
  return new Error('Could not connect to the specified JSON RPC provider')
}

// class UnsupportedNetworkError extends Error {
//   constructor(network) {
//     this.message = `WTF protocol does not support ${network}`
//     super(this.message)
//     this.name = 'VALIDATION_ERROR'
//   }
// }

exports.UnsupportedServiceError = (service) => {
  return new Error(`WTF protocol does not support ${service} credentials`)
}

// class UnsupportedServiceError extends Error {
//   constructor(network, service) {
//     this.message = `WTF protocol does not support ${service} credentials on ${network}`
//     super(this.message)
//     this.name = 'VALIDATION_ERROR'
//   }
// }
