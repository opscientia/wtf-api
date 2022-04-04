const ethers = require('ethers');

const vjwtABI = require('./contracts/VerifyJWT.json');
const idAggABI = require('./contracts/IdentityAggregator.json');
// TODO: contractAddresses contains mock addresses. Update the json file with deployed contract addresses
const contractAddresses = require('./contracts/contractAddresses.json');
// this may help:
// import { fixedBufferXOR as xor, sandwichIDWithBreadFromContract, padBase64, hexToString, searchForPlainTextInBase64 } from 'wtfprotocol-helpers';


const idAggStr = 'IdentityAggregator';
const vjwtStr = 'VerifyJWT';


// NOTE: This is only the outline of this function. Needs to be tested.
exports.credentialsForAddress = async (address, network, service) => {
  const provider = ethers.getDefaultProvider(); // TODO: ethers.getDefaultProvider({ infura: { projectId, projectSecret } });

  // query idAggregator for keywords
  const idAggregatorAddr = contractAddresses[idAggStr][network];
  const idAggregator = new ethers.Contract(idAggregatorAddr, idAggABI, provider);
  const keywords = await idAggregator.getKeywords();

  // query each vjwt for creds
  for (const keyword of keywords) {
    if (keyword == service) {
      const vjwtAddr = contractAddresses[vjwtStr][network][keyword];
      const vjwt = new ethers.Contract(vjwtAddr, vjwtABI, provider);
      // It would be great to decode these from bytes to a human-readable string if necessary. It may not be necessary though; i haven't seen the output
      return await vjwt.credsForAddress(address);
    }
  }
  // TODO: We need standardized error messages and response codes
  return "No " + service + " credentials found for " + address + " on " + network;
}


// NOTE: This is only the outline of this function. Needs to be tested.
exports.addressForCredentials = async (network, creds, service) => {
  const provider = ethers.getDefaultProvider(); // TODO: ethers.getDefaultProvider({ infura: { projectId, projectSecret } });

  // TODO: Do creds need to be encoded? Are we taking a string from user (and passing bytes to vjwt)?
  // Yea, they are unfortunately encoded as bytes
  // query idAggregator for keywords
  const idAggregatorAddr = contractAddresses[idAggStr][network];
  const idAggregator = new ethers.Contract(idAggregatorAddr, idAggABI, provider);
  const keywords = await idAggregator.getKeywords();

  // query each vjwt for address
  for (const keyword of keywords) {
    if (keyword) {
      const vjwtAddr = contractAddresses[vjwtStr][network][keyword];
      const vjwt = new ethers.Contract(vjwtAddr, vjwtABI, provider);
      return await vjwt.addressForCreds(creds);
    }
  }
  // TODO: We need standardized error messages and response codes
  return "No " + service + " credentials found for " + creds + " on " + network;
}
