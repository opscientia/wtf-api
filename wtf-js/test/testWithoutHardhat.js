/**
 * This test script contains all tests that DO NOT depend on a running
 * local Hardhat test blockchain.
 * These tests should be run with the WTF_USE_TEST_CONTRACT_ADDRESSES
 * environment variable set to "true" so that the "production" contract 
 * addresses in contractAddresses.json are used.
 */

const { expect } = require('chai');
const { ethers } = require('ethers');

const wtf = require('../lib/index');


describe('wtf-js tests without Hardhat node', function () {

  describe('getContractAddresses', function () {
    it('Should return object with correct keys and shape', async function () {
      const contractAddresses = await wtf.getContractAddresses();
      expect(contractAddresses).to.be.an('object').with.all.keys(["IdentityAggregator", "VerifyJWT", "WTFBios"]);
      expect(contractAddresses["IdentityAggregator"]).to.be.an('object').with.keys(["gnosis", "mumbai"]);
      expect(contractAddresses["WTFBios"]).to.be.an('object').with.keys(["gnosis", "mumbai"]);
      expect(contractAddresses["VerifyJWT"]).to.be.an('object').with.keys(["gnosis", "mumbai"]);
      expect(contractAddresses["VerifyJWT"]["gnosis"]).to.be.an('object').with.keys(["orcid", "google", "twitter", "github", "discord"]);
    });

    it('Should have the right addresses', async function () {
      const contractAddresses = await wtf.getContractAddresses();
      expect(contractAddresses["IdentityAggregator"]["gnosis"]).to.equal("0x4278b0B8aC44dc61579d5Ec3F01D8EA44873b079");
      expect(contractAddresses["WTFBios"]["gnosis"]).to.equal("0x99708c7c7d4895cFF1C81d0Ff96152b5AEcc3E78");
      expect(contractAddresses["VerifyJWT"]["gnosis"]["orcid"]).to.equal("0x4D39C84712C9A13f4d348050E82A2Eeb45DB5e29")
      expect(contractAddresses["VerifyJWT"]["gnosis"]["google"]).to.equal("0xC334b3465790bC77299D42635B25D77E3e46A78b")
      expect(contractAddresses["VerifyJWT"]["gnosis"]["twitter"]).to.equal("0x97A2FAf052058b86a52A07F730EF8a16aD9aFcFB")
      expect(contractAddresses["VerifyJWT"]["gnosis"]["github"]).to.equal("0x6029BD948942c7b355149087c47462c66Ea147ba")
      expect(contractAddresses["VerifyJWT"]["gnosis"]["discord"]).to.equal("0xca6d00d3f78AD5a9B386824227BBe442c84344EA")
    });
  });

  describe('getContractABIs', function () {
    it('Should return object with correct keys and shape', async function () {
      const wtf = require('../lib/index');
      const contractABIs = await wtf.getContractABIs();
      expect(contractABIs).to.be.an('object').with.all.keys(["VerifyJWT", "WTFBios", "IdentityAggregator"]);
      // Look for a sample of functions in these contracts. If these functions aren't here, something is probably wrong
      expect(contractABIs["VerifyJWT"]).to.be.an("array").that.includes('function verifyJWT(bytes,string) returns (bool)');
      expect(contractABIs["WTFBios"]).to.be.an("array").that.includes('function setNameAndBio(string,string)');
      expect(contractABIs["IdentityAggregator"]).to.be.an("array").that.includes('function getAllAccounts(address) view returns (bytes[], string, string)');
    });
  });
});
