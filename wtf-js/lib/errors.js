

exports.UnsupportedNetworkError = (network) => {
  return new Error(`WTF protocol does not support ${network}`)
}

// class UnsupportedNetworkError extends Error {
//   constructor(network) {
//     this.message = `WTF protocol does not support ${network}`
//     super(this.message)
//     this.name = 'VALIDATION_ERROR'
//   }
// }

exports.UnsupportedServiceError = (network, service) => {
  return new Error(`WTF protocol does not support ${service} credentials on ${network}`)
}

// class UnsupportedServiceError extends Error {
//   constructor(network, service) {
//     this.message = `WTF protocol does not support ${service} credentials on ${network}`
//     super(this.message)
//     this.name = 'VALIDATION_ERROR'
//   }
// }

exports.CredentialsNotFoundError = (network, service, address) => {
  return new Error(`Could not find ${service} credentials for ${address} on ${network}`)
}

exports.AddressNotFoundError = (network, service, credentials) => {
  return new Error(`Could not find address for ${service} ${credentials} on ${network}`)
}