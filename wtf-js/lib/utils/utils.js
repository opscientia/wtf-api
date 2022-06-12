
module.exports.logFailedContractCall = (error, contract, network) => {
  // console.log(error);
  if (network) {
    console.log(`An error occurred when calling ${contract} on network "${network}". `
                + `It is possible that the provider you are using does not support `
                + `one of the networks used by WTF.`);
  } else {
    console.log(`An error occurred when calling ${contract}. `
                + `It is possible that the provider you are using does not support `
                + `one of the networks used by WTF.`);
  }
}
