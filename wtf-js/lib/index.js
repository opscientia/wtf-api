const ethers = require('ethers');
const Buffer = require('buffer/').Buffer;

// import { fixedBufferXOR as xor, sandwichIDWithBreadFromContract, padBase64, hexToString, searchForPlainTextInBase64 } from 'wtfprotocol-helpers';
const { hexToString } = require('wtfprotocol-helpers');
const {
  ConnectionFailedError,
  UnsupportedServiceError
} = require('./errors');

const vjwtABI = require('./contracts/VerifyJWT.json');
const wtfBiosABI = require('./contracts/WTFBios.json');
const idAggABI = require('./contracts/IdentityAggregator.json');
const contractAddresses = process.env.WTF_USE_TEST_CONTRACT_ADDRESSES == "true" 
                          ? require('./contracts/contractAddresses.json')["test"]
                          : require('./contracts/contractAddresses.json')["production"]
const idAggStr = 'IdentityAggregator';
const vjwtStr = 'VerifyJWT';
const wtfBiosStr = 'WTFBios';
const supportedNetworks = Object.keys(contractAddresses[vjwtStr]);
const getSupportedServices = () => {
  let supportedServices = [];
  for (network of Object.keys(contractAddresses[vjwtStr])) {
    for (service of Object.keys(contractAddresses[vjwtStr][network])) {
      if (supportedServices.indexOf(service) == -1) {
        supportedServices.push(service);
      }
    }
  }
  return supportedServices;
}
const supportedServices = getSupportedServices();


// let provider = new ethers.providers.JsonRpcProvider(process.env.MORALIS_NODE_URL);
let provider = ethers.getDefaultProvider()

const getIdAggregators = () => {
  let idAggregators = {};
  for (network of Object.keys(contractAddresses[idAggStr])) {
    const idAggregatorAddr = contractAddresses[idAggStr][network];
    if (idAggregatorAddr){
      idAggregators[network] = new ethers.Contract(idAggregatorAddr, idAggABI, provider);
    }
  }
  return idAggregators || new Error('No IdentityAggregator contracts found on any network');
}

const getVerifyJWTs = (service) => {
  let vjwts = {};
  for (network of Object.keys(contractAddresses[vjwtStr])) { 
    const vjwtAddress = contractAddresses[vjwtStr][network][service];
    if (vjwtAddress) {
      vjwts[network] = new ethers.Contract(vjwtAddress, vjwtABI, provider);;
    }
  }
  if (vjwts) {
    return vjwts;
  }
  throw UnsupportedServiceError(service);
}

const getWTFBiosContracts = () => {
  let wtfBiosContracts = {};
  for (network of Object.keys(contractAddresses[wtfBiosStr])) {
    const WTFBiosAddr = contractAddresses[wtfBiosStr][network];
    if (WTFBiosAddr){
      wtfBiosContracts[network] = new ethers.Contract(WTFBiosAddr, wtfBiosABI, provider);
    }
  }
  if (wtfBiosContracts) {
    return wtfBiosContracts;
  }
  throw new Error('Cannot find contract for WTF names and bios on any network');
}

/**
 * Searches all networks for a VerifyJWT with creds corresponding to the user's address.
 * Returns the first creds found. NOTE: Does not return multiple values when the user has
 * different creds on different chains.
 */
const getCreds = async (vjwts, userAddress) => {
  for (network of Object.keys(vjwts)) {
    const vjwt = vjwts[network];
    const credsBytes = await vjwt.credsForAddress(userAddress);
    if (credsBytes) {
      return hexToString(credsBytes);
    }
  }
  return '';
}

// See comment above getCreds().
const getAddress = async (vjwts, encodedCreds) => {
  for (network of Object.keys(vjwts)) {
    const vjwt = vjwts[network];
    const address = await vjwt.addressForCreds(encodedCreds);
    if (address) {
      return address;
    }
  }
  return '';
}

// See comment above getCreds().
const getBio = async (wtfBiosContracts, userAddress) => {
  for (network of Object.keys(wtfBiosContracts)) {
    const wtfBios = wtfBiosContracts[network];
    const bio = await wtfBios.bioForAddress(userAddress);
    if (bio) {
      return bio;
    }
  }
  return '';
}

// See comment above getCreds().
 const getName = async (wtfBiosContracts, userAddress) => {
  for (network of Object.keys(wtfBiosContracts)) {
    const wtfBios = wtfBiosContracts[network];
    const name = await wtfBios.nameForAddress(userAddress);
    if (name) {
      return name;
    }
  }
  return '';
}

/**
 * Specify the URL of the JSON RPC provider used by WTF.
 * @param {string} rpcURL The provider URL
 */
exports.setProviderURL = async (rpcURL) => {
  try {
    provider = new ethers.providers.JsonRpcProvider(rpcURL)
  }
  catch (err) {
    throw ConnectionFailedError()
  }
}

/**
 * Get the credentials issued by a specific service that are associated
 * with a user's address.
 * @param {string} address User's crypto address
 * @param {string} service The platform that issued the credentials (e.g., 'google')
 * @returns The user's credentials (e.g., 'xyz@gmail.com')
 */
exports.credentialsForAddress = async (address, service) => {
  const vjwts = getVerifyJWTs(service);
  return await getCreds(vjwts, address);
}

/**
 * Get the address associated with specific credentials that were issued
 * by a specific service.
 * @param {string} creds The user's credentials (e.g., 'xyz@gmail.com')
 * @param {string} service The platform that issued the credentials (e.g., 'google')
 * @returns The user's crypto address
 */
exports.addressForCredentials = async (creds, service) => {
  const vjwts = getVerifyJWTs(service);
  const encodedCreds = Buffer.from(creds);
  return await getAddress(vjwts, encodedCreds);
}

/**
 * Get all every registered user address on WTF for every supported network and service.
 * @return Dictionary of networks and user addresses with shape: {'network': {'service': ['0xabc...',],},}
 */
exports.getAllUserAddresses = async () => {
  let userAddresses = {};
  for (network of Object.keys(contractAddresses[vjwtStr])) {
    userAddresses[network] = {};
    for (service of Object.keys(contractAddresses[vjwtStr][network])) {
      const vjwtAddr = contractAddresses[vjwtStr][network][service];
      const vjwt = new ethers.Contract(vjwtAddr, vjwtABI, provider);
      try {
        const addresses = await vjwt.getRegisteredAddresses();
        userAddresses[network][service] = addresses;
      }
      catch (err) {
        console.log(err);
        console.log("An error occurred when calling VerifyJWT. It is possible that " +
                    "the provider you are using does not support one of the networks used by WTF.");
        userAddresses[network][service] = [];
      }
    }
  }
  return userAddresses;
}

/**
 * Get bio associated with user's address.
 * @param {string} address The user's crypto address
 * @returns User bio
 */
exports.bioForAddress = async (address) => {
  const wtfBiosContracts = getWTFBiosContracts();
  // return await wtfBios.bioForAddress(address);
  return await getBio(wtfBiosContracts, address);
}

/**
 * Get name associated with user's address.
 * @param {string} address The user's crypto address
 * @returns User name
 */
 exports.nameForAddress = async (address) => {
  const wtfBiosContracts = getWTFBiosContracts();
  // return await wtfBios.nameForAddress(address);
  return await getName(wtfBiosContracts, address)
}

/**
 * Get the credentials, name, and bio associated with the specified address.
 * @param {string} address The user's crypto address
 * @returns An object containing networks, credentials, name, and bio. 
 *          Example: {'ethereum': {'creds': ['xyz@gmail.com',], 'name': 'Greg', 'bio': 'Person'},}
 */
exports.getHolo = async (address) => {
  const idAggregators = await getIdAggregators();
  let crossChainHolo = {};
  for (network of Object.keys(idAggregators)) {
    const idAggregator = idAggregators[network]
    try {
      const {0: creds, 1: name, 2: bio} = await idAggregator.getAllAccounts(address);
      const credsNameBio = {'creds': [], 'name': name, 'bio': bio}
      for (const cred of creds) {
        credsNameBio['creds'].push(hexToString(cred));
      } 
      crossChainHolo[network] = credsNameBio;
    }
    catch (err) {
      console.log(err);
      console.log("An error occurred when calling IdentityAggregator. It is possible that " +
                  "the provider you are using does not support one of the networks used by WTF.");
      crossChainHolo[network] = {};
    }
  }
  return crossChainHolo;
}
