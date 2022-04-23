
module.exports.logFailedContractCall = (error, contract, network) => {
  console.log(error);
  console.log(`An error occurred when calling ${contract} on network "${network}". `
              + `It is possible that the provider you are using does not support `
              + `one of the networks used by WTF.`);
}
