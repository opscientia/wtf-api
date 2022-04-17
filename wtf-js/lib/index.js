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

function wtf() {

  let providers = {'default': ethers.getDefaultProvider()};
  let useSingleProivder = false;

  let useOneNetwork = '';

  const getProvider = (network) => {
    if (useSingleProivder) {
      return providers['default'];
    }
    return providers[network];
  }

  const getIdAggregators = () => {
    let idAggregators = {};
    if (useOneNetwork) {
      const provider = getProvider(useOneNetwork);
      const idAggregatorAddr = contractAddresses[idAggStr][useOneNetwork];
      idAggregators[useOneNetwork] = new ethers.Contract(idAggregatorAddr, idAggABI, provider);
    }
    else {
      for (network of Object.keys(contractAddresses[idAggStr])) {
        const provider = getProvider(network);
        const idAggregatorAddr = contractAddresses[idAggStr][network];
        if (idAggregatorAddr){
          idAggregators[network] = new ethers.Contract(idAggregatorAddr, idAggABI, provider);
        }
      }
    }
    return idAggregators || new Error('No IdentityAggregator contracts found on any network');
  }

  const getVerifyJWTs = (service) => {
    let vjwts = {}
    if (useOneNetwork) {
      const provider = getProvider(useOneNetwork);
      const vjwtAddress = contractAddresses[vjwtStr][useOneNetwork][service];
      vjwts[useOneNetwork] = new ethers.Contract(vjwtAddress, vjwtABI, provider);
    }
    else {
      for (network of Object.keys(contractAddresses[vjwtStr])) {
        const provider = getProvider(network);
        const vjwtAddress = contractAddresses[vjwtStr][network][service];
        if (vjwtAddress) {
          vjwts[network] = new ethers.Contract(vjwtAddress, vjwtABI, provider);
        }
      }
    }
    if (vjwts) {
      return vjwts;
    }
    throw UnsupportedServiceError(service);
  }

  const getWTFBiosContracts = () => {
    let wtfBiosContracts = {};
    if (useOneNetwork) {
      const provider = getProvider(useOneNetwork);
      const WTFBiosAddr = contractAddresses[wtfBiosStr][useOneNetwork];
      wtfBiosContracts[useOneNetwork] = new ethers.Contract(WTFBiosAddr, wtfBiosABI, provider);
    }
    else {
      for (network of Object.keys(contractAddresses[wtfBiosStr])) {
        const provider = getProvider(network);
        const WTFBiosAddr = contractAddresses[wtfBiosStr][network];
        if (WTFBiosAddr){
          wtfBiosContracts[network] = new ethers.Contract(WTFBiosAddr, wtfBiosABI, provider);
        }
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
      try {
        const credsBytes = await vjwt.credsForAddress(userAddress);
        if (credsBytes) {
          return hexToString(credsBytes);
        }
      }
      catch (err) {
        console.log(err);
        console.log("An error occurred when calling VerifyJWT. It is possible that " +
                    "the provider you are using does not support one of the networks used by WTF.");
      }
    }
    return '';
  }

  // See comment above getCreds().
  const getAddress = async (vjwts, encodedCreds) => {
    for (network of Object.keys(vjwts)) {
      const vjwt = vjwts[network];
      try {
        const address = await vjwt.addressForCreds(encodedCreds);
        if (address) {
          return address;
        }
      }
      catch (err) {
        console.log(err);
        console.log("An error occurred when calling VerifyJWT. It is possible that " +
                    "the provider you are using does not support one of the networks used by WTF.");
      }
    }
    return '';
  }

  // See comment above getCreds().
  const getBio = async (wtfBiosContracts, userAddress) => {
    for (network of Object.keys(wtfBiosContracts)) {
      const wtfBios = wtfBiosContracts[network];
      try {
        const bio = await wtfBios.bioForAddress(userAddress);
        if (bio) {
          return bio;
        } 
      }
      catch (err) {
        console.log(err);
        console.log("An error occurred when calling WTFBios. It is possible that " +
                    "the provider you are using does not support one of the networks used by WTF.");
      }
    }
    return '';
  }

  // See comment above getCreds().
  const getName = async (wtfBiosContracts, userAddress) => {
    for (network of Object.keys(wtfBiosContracts)) {
      const wtfBios = wtfBiosContracts[network];
      try {
        const name = await wtfBios.nameForAddress(userAddress);
        if (name) {
          return name;
        }
      }
      catch (err) {
        console.log(err);
        console.log("An error occurred when calling WTFBios. It is possible that " +
                    "the provider you are using does not support one of the networks used by WTF.");
      }
    }
    return '';
  }

  /**
   * Specify the URLs of the JSON RPC providers that wtf-lib will use for your project.
   * @param {object} rpcURLs An object specifying which provider will be used to access which blockchain network.
   *                         Accepts an indefinite number of endpoints. If only one provider is specified, wtf-lib
   *                         will use that provider for all networks it queries. Only the networks supported by 
   *                         WTF protocol will be used by wtf-lib.
   *                         Example: {'ethereum', 'https://endpoint.io', 'polygon': 'https://endpoint2.io'}
   */
  const setProviderURL = (rpcURLs) => {
    // Use single provider
    if (Object.keys(rpcURLs).length == 1) {
      try {
        const rpcURL = rpcURLs[Object.keys(rpcURLs)[0]];
        providers['default'] = new ethers.providers.JsonRpcProvider(rpcURL);
        useSingleProivder = true;
      }
      catch (err) {
        throw ConnectionFailedError();
      }
    }
    // Use multiple providers
    for (network of Object.keys(rpcURLs)) {
      const rpcURL = rpcURLs[network];
      try {
        providers[network] = new ethers.providers.JsonRpcProvider(rpcURL);
      }
      catch (err) {
        throw ConnectionFailedError(network);
      }
    }
  }

  /**
   * Tell this instance of wtf to only query a certain network. This is helpful if
   * your app only makes use of one network, and you do not want wtf to query every
   * chain supported by the protocol.
   * @param {string} network The only network you want this instance of wtf to use (e.g., 'ethereum').
   * @returns True if the specified network is supported, false otherwise.
   */
  const onlyUseThisNetwork = (network) => {
    const index = supportedNetworks.indexOf(network)
    if (index != -1) {
      useOneNetwork = network;
      return true;
    }
    return false;
  }

  /**
   * Get the credentials issued by a specific service that are associated
   * with a user's address.
   * @param {string} address User's crypto address
   * @param {string} service The platform that issued the credentials (e.g., 'google')
   * @returns The user's credentials (e.g., 'xyz@gmail.com')
   */
  const credentialsForAddress = async (address, service) => {
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
  const addressForCredentials = async (creds, service) => {
    const vjwts = getVerifyJWTs(service);
    const encodedCreds = Buffer.from(creds);
    return await getAddress(vjwts, encodedCreds);
  }

  /**
   * Get every registered user address on WTF for every supported network and service.
   * The response includes addresses with name and bio. These addresses are included
   * under the key 'nameAndBio' (i.e., returnValue[network]['nameAndBio']).
   * @return Dictionary of networks and user addresses with shape: 
   * {'network': {'service': ['0xabc...',], {'nameAndBio': ['0xabc...',],},},}
   */
  const getAllUserAddresses = async () => {
    let userAddresses = {};
    // Get addresses that have registered creds on a VerifyJWT
    for (network of Object.keys(contractAddresses[vjwtStr])) {
      const provider = getProvider(network);
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
    // Get addresses that have name and bio on WTF/Holonym
    for (network of Object.keys(contractAddresses[wtfBiosStr])) {
      const provider = getProvider(network);
      const wtfBiosAddr = contractAddresses[wtfBiosStr][network];
      const wtfBios = new ethers.Contract(wtfBiosAddr, wtfBiosABI, provider);
      try {
        const addresses = await wtfBios.getRegisteredAddresses();
        userAddresses[network]['nameAndBio'] = addresses;
      }
      catch (err) {
        console.log(err);
        console.log("An error occurred when calling WTFBios. It is possible that " +
                    "the provider you are using does not support one of the networks used by WTF.");
        userAddresses[network]['nameAndBio'] = [];
      }
    }
    return userAddresses;
  }

  /**
   * Get bio associated with user's address.
   * @param {string} address The user's crypto address
   * @returns User bio
   */
  const bioForAddress = async (address) => {
    const wtfBiosContracts = getWTFBiosContracts();
    // return await wtfBios.bioForAddress(address);
    return await getBio(wtfBiosContracts, address);
  }

  /**
   * Get name associated with user's address.
   * @param {string} address The user's crypto address
   * @returns User name
   */
  const nameForAddress = async (address) => {
    const wtfBiosContracts = getWTFBiosContracts();
    // return await wtfBios.nameForAddress(address);
    return await getName(wtfBiosContracts, address)
  }

  /**
   * Get the credentials, name, and bio associated with the specified address.
   * @param {string} address The user's crypto address
   * @returns An object containing networks, credentials, name, and bio. 
   *          Example: {'ethereum': {'creds': {'google': 'xyz@gmail.com',}, 'name': 'Greg', 'bio': 'Person'},}
   */
  const getHolo = async (address) => {
    const idAggregators = await getIdAggregators();
    let crossChainHolo = {};
    for (network of Object.keys(idAggregators)) {
      const idAggregator = idAggregators[network]
      try {
        const keywords = await idAggregator.getKeywords();
        const {0: creds, 1: name, 2: bio} = await idAggregator.getAllAccounts(address);
        const credsNameBio = {'creds': {}, 'name': name, 'bio': bio}
        for (const [i, cred] of creds.entries()) {
          const keyword = keywords[i];
          credsNameBio['creds'][keyword] = hexToString(cred);
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

  return {
    setProviderURL: setProviderURL,
    onlyUseThisNetwork: onlyUseThisNetwork,
    credentialsForAddress: credentialsForAddress,
    addressForCredentials: addressForCredentials,
    getAllUserAddresses: getAllUserAddresses,
    bioForAddress: bioForAddress,
    nameForAddress: nameForAddress,
    getHolo: getHolo
  }
  
}

module.exports = wtf();
