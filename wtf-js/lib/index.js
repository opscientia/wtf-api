const ethers = require('ethers');

const vjwtABI = require('./contracts/VerifyJWT.json');
const idAggABI = require('./contracts/IdentityAggregator.json');
// TODO: contractAddresses contains mock addresses. Update the json file with deployed contract addresses
const contractAddresses = require('./contracts/contractAddresses.json');
// this may help:
// import { fixedBufferXOR as xor, sandwichIDWithBreadFromContract, padBase64, hexToString, searchForPlainTextInBase64 } from 'wtfprotocol-helpers';
const { hexToString } = require('wtfprotocol-helpers');

const supportedNetworks = ['ethereum'];
const supportedServices = ['orcid', 'google'];

const idAggStr = 'IdentityAggregator';
const vjwtStr = 'VerifyJWT';


// NOTE: This is only the outline of this function. Needs to be tested. Also handle errors.
exports.credentialsForAddress = async (address, network, service) => {
//   const provider = ethers.getDefaultProvider(); // TODO: ethers.getDefaultProvider({ infura: { projectId, projectSecret } });
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

  // query idAggregator for keywords
  const idAggregatorAddr = contractAddresses[idAggStr][network];
  const idAggregator = new ethers.Contract(idAggregatorAddr, idAggABI, provider);
  const keywords = await idAggregator.getKeywords();

  // query each vjwt for creds
  for (const keyword of keywords) {
    if (keyword == service) {
      const vjwtAddr = contractAddresses[vjwtStr][network][keyword];
      const vjwt = new ethers.Contract(vjwtAddr, vjwtABI, provider);
      const credsBytes = await vjwt.credsForAddress(address);
      return hexToString(credsBytes);
    }
  }
  // TODO: We need standardized error messages and response codes
  return "No " + service + " credentials found for " + address + " on " + network;
}


// NOTE: This is only the outline of this function. Needs to be tested.
exports.addressForCredentials = async (network, creds, service) => {
//   const provider = ethers.getDefaultProvider(); // TODO: ethers.getDefaultProvider({ infura: { projectId, projectSecret } });
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

  // query idAggregator for keywords
  const idAggregatorAddr = contractAddresses[idAggStr][network];
  const idAggregator = new ethers.Contract(idAggregatorAddr, idAggABI, provider);
  const keywords = await idAggregator.getKeywords();

  const encodedCreds = Buffer.from(creds);

  // query each vjwt for address
  for (const keyword of keywords) {
    if (keyword == service) {
      const vjwtAddr = contractAddresses[vjwtStr][network][keyword];
      const vjwt = new ethers.Contract(vjwtAddr, vjwtABI, provider);
      return await vjwt.addressForCreds(encodedCreds);
    }
  }
  // TODO: We need standardized error messages and response codes
  return "No " + service + " credentials found for " + creds + " on " + network;
}


/**
 * Get all every registered user address on WTF for every supported network
 * @return Dictionary of networks and user addresses with shape: {'network': {'service': ['0xabc...',],},}
 */
exports.getAllUserAddresses = async () => {
//   const provider = ethers.getDefaultProvider(); // TODO: ethers.getDefaultProvider({ infura: { projectId, projectSecret } });
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  let userAddresses = {};
  for (network of supportedNetworks) {
    userAddresses[network] = {};
    for (keyword of supportedServices) {
      const vjwtAddr = contractAddresses[vjwtStr][network][keyword];
      const vjwt = new ethers.Contract(vjwtAddr, vjwtABI, provider);
      const addresses = await vjwt.getRegisteredAddresses();
      userAddresses[network][keyword] = addresses;
    }
  }
  return userAddresses;
}
