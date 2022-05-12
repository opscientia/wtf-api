const ethers = require('ethers');
const Buffer = require('buffer/').Buffer;

const { hexToString } = require('wtfprotocol-helpers');
const { ConnectionFailedError, UnsupportedServiceError } = require('./errors');
const { logFailedContractCall } = require('./utils/utils')

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

  const getProvider = (network) => {
    if (useSingleProivder || !providers[network]) {
      return providers['default'];
    }
    return providers[network];
  }

  const getIdAggregators = () => {
    let idAggregators = {};
    for (network of Object.keys(contractAddresses[idAggStr])) {
      const provider = getProvider(network);
      const idAggregatorAddr = contractAddresses[idAggStr][network];
      if (idAggregatorAddr){
        idAggregators[network] = new ethers.Contract(idAggregatorAddr, idAggABI, provider);
      }
    }
    return idAggregators;
  }

  const getVerifyJWTs = (service) => {
    let vjwts = {}
    for (network of Object.keys(contractAddresses[vjwtStr])) {
      const provider = getProvider(network);
      const vjwtAddress = contractAddresses[vjwtStr][network][service];
      if (vjwtAddress) {
        vjwts[network] = new ethers.Contract(vjwtAddress, vjwtABI, provider);
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
      const provider = getProvider(network);
      const WTFBiosAddr = contractAddresses[wtfBiosStr][network];
      if (WTFBiosAddr){
        wtfBiosContracts[network] = new ethers.Contract(WTFBiosAddr, wtfBiosABI, provider);
      }
    }
    return wtfBiosContracts;
  }

  /**
   * @param contractFunction The contract function to invoke (e.g., `vjwt.credsForAddress`)
   * @param params Array of parameters passed to contractFunction
   * @param {string} contractName e.g., "VerifyJWT" or "WTFBios" 
   */
  const callContractFunction = async (contractFunction, params, contractName) => {
    try {
      let response;
      if (params && params.length > 0) {
        response = await contractFunction(...params);
      }
      else {
        response = await contractFunction();
      }
      return response;
    }
    catch (err) {
      logFailedContractCall(err, contractName)
    }
  }

  const callVerifyJWTFunction = async (contractFunction, params) => {
    return await callContractFunction(contractFunction, params, 'VerifyJWT')
  }

  const callWTFBiosFunction = async (contractFunction, params) => {
    return await callContractFunction(contractFunction, params, 'WTFBios')
  }

  /**
   * Searches all networks for a VerifyJWT with creds corresponding to the user's address.
   * Returns the first creds found. NOTE: Does not return multiple values when the user has
   * different creds on different chains.
   */
  const getCreds = async (vjwts, userAddress) => {
    for (network of Object.keys(vjwts)) {
      const vjwt = vjwts[network];
      const credsBytes = await callVerifyJWTFunction(vjwt.credsForAddress, [userAddress]);
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
      const address = await callVerifyJWTFunction(vjwt.addressForCreds, [encodedCreds]);
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
      const bio = await callWTFBiosFunction(wtfBios.bioForAddress, [userAddress])
      if (bio) {
        return bio
      }
    }
    return '';
  }

  // See comment above getCreds().
  const getName = async (wtfBiosContracts, userAddress) => {
    for (network of Object.keys(wtfBiosContracts)) {
      const wtfBios = wtfBiosContracts[network];
      const name = await callWTFBiosFunction(wtfBios.nameForAddress, [userAddress])
      if (name) {
        return name;
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

  const getContractABIs = () => { 
    return {
      VerifyJWT: vjwtABI,
      WTFBios: wtfBiosABI,
      IdentityAggregator: idAggABI 
    }
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
        let vjwt = null;
        if (vjwtAddr) {
          vjwt = new ethers.Contract(vjwtAddr, vjwtABI, provider);
        }
        else {
          console.log(`wtf-lib: no vjwt found for network "${network}" and service "${service}"`)
          continue;
        }
        const addresses = await callVerifyJWTFunction(vjwt.getRegisteredAddresses);
        userAddresses[network][service] = addresses;
      }
    }
    // Get addresses that have name and bio on WTF/Holonym
    const wtfBiosContracts = getWTFBiosContracts();
    for (network of Object.keys(wtfBiosContracts)) {
      const wtfBios = wtfBiosContracts[network];
      const addresses = await callWTFBiosFunction(wtfBios.getRegisteredAddresses)
      if (userAddresses[network]) {
        userAddresses[network]['nameAndBio'] = addresses;
      }
      else {
        userAddresses[network] = {'nameAndBio': addresses}
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
    return await getBio(wtfBiosContracts, address);
  }

  /**
   * Get name associated with user's address.
   * @param {string} address The user's crypto address
   * @returns User name
   */
  const nameForAddress = async (address) => {
    const wtfBiosContracts = getWTFBiosContracts();
    return await getName(wtfBiosContracts, address)
  }

  /**
   * Get the credentials, name, and bio associated with the specified address.
   * @param {string} address The user's crypto address
   * @returns An object containing credentials, name, and bio, organized by network. 
   *          Example: {'ethereum': {'google': 'xyz@gmail.com', 'name': 'Greg', 'bio': 'Person'},}
   */
  const getHolo = async (address) => {
    const idAggregators = await getIdAggregators();
    let crossChainHolo = {};
    for (network of Object.keys(idAggregators)) {
      const idAggregator = idAggregators[network]
      try { // Call idAggregator
        const keywords = await idAggregator.getKeywords();
        const {0: creds, 1: name, 2: bio} = await idAggregator.getAllAccounts(address);
        const holo = {'name': name, 'bio': bio}
        for (const [i, cred] of creds.entries()) {
          const keyword = keywords[i];
          holo[keyword] = hexToString(cred);
        }
        crossChainHolo[network] = holo;
      }
      catch (err) {
        logFailedContractCall(err, 'IdentityAggregator', network)
        crossChainHolo[network] = {};
      }
      try { // Call Proof of Humanity
        const pohAddr = '0x1dAD862095d40d43c2109370121cf087632874dB'
        const pohInterface = ["function isRegistered(address) external view returns (bool)"]
        const pohContract = new ethers.Contract(pohAddr, pohInterface, getProvider(network));
        crossChainHolo[network]['pohRegistered'] = await pohContract.isRegistered(address);
      }
      catch (err) {
        logFailedContractCall(err, 'ProofOfHumanity', network)
      }
      try { // Call ENS
        crossChainHolo[network]['ens'] = await getProvider(network).lookupAddress(address);
      }
      catch (err) {
        console.log(`Failed to retrieve ENS for ${address} on ${network}`)
      }
    }
    return crossChainHolo;
  }

  return {
    setProviderURL: setProviderURL,
    getContractAddresses: function() { return contractAddresses },
    getContractABIs: getContractABIs,
    credentialsForAddress: credentialsForAddress,
    addressForCredentials: addressForCredentials,
    getAllUserAddresses: getAllUserAddresses,
    bioForAddress: bioForAddress,
    nameForAddress: nameForAddress,
    getHolo: getHolo
  }
  
}

module.exports = wtf();
