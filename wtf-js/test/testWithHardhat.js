/**
 * This test script contains all tests that depend on a running
 * local Hardhat test blockchain.
 * These tests should be run with the WTF_USE_TEST_CONTRACT_ADDRESSES
 * environment variable set to true so that the "test" contract addresses
 * in contractAddresses.json are used. These addresses point to the 
 * contracts on the local Hardhat blockchain. These tests do not test 
 * the contracts on non-local mainnets/testnets.
 */

const { expect } = require('chai');
const { ethers } = require('ethers');

const wtf = require('../lib/index');
const {
  UnsupportedServiceError,
} = require('../lib/errors');


// TODO: Test ENS, PoH, BrightID

describe('wtf-js tests with Hardhat node', function () {

  before(function () {
    this.userAddress = '0x3fB3913a3452c20c2dA220Bd4D2635765b934c67';
    this.orcid = '0000-0002-2308-9517';
    this.gmail = 'nanaknihal@gmail.com';
    [this.name, this.bio] = ['Greg', 'Business person'];

    wtf.setProviderURL({'default': 'http://localhost:8545'})
  });

  describe('credentialsForAddress', function () {
    it('Should return correct credentials (orcid)', async function () {
      const creds = await wtf.credentialsForAddress(this.userAddress, 'orcid');
      expect(creds).to.equal(this.orcid);
    });
    
    it('Should return correct credentials (google)', async function () {
      const creds = await wtf.credentialsForAddress(this.userAddress, 'google');
      expect(creds).to.equal(this.gmail);
    });

    it("Should throw UnsupportedServiceError when service=='randoService'", async function () {
      try {
        await wtf.credentialsForAddress(this.userAddress, 'randoService')
      }
      catch (err) {
        expect(err.message).to.equal(UnsupportedServiceError('randoService').message)
      }
    });

    it("Should return empty string when querying for unfound credentials", async function () {
      const badAddress = '0x1234567891234567891234567891234567891234'
      const resp = await wtf.credentialsForAddress(badAddress, 'orcid')
      expect(resp).to.equal('');
    });
  });

  describe('addressForCredentials', function () {
    it('Should return correct address (google)', async function () {
      const address = await wtf.addressForCredentials(this.gmail, 'google');
      expect(address).to.equal(this.userAddress);
    });

    it('Should return correct address (orcid)', async function () {
      const address = await wtf.addressForCredentials('0000-0002-2308-9517', 'orcid');
      expect(address).to.equal(this.userAddress);
    });

    it("Should throw UnsupportedServiceError when service=='randoService'", async function () {
      try {
        await wtf.addressForCredentials(this.gmail, 'randoService')
      }
      catch (err) {
        expect(err.message).to.equal(UnsupportedServiceError('randoService').message)
      }
    });

    it("Should throw AddressNotFoundError when querying for an address not registered on Holonym", async function () {
      const badCredentials = '123abc'
      try {
        await wtf.addressForCredentials(badCredentials, 'orcid')
      }
      catch (err) {
        expect(err.message).to.equal(AddressNotFoundError('orcid', badCredentials).message)
      }
    });
  });
  
  describe('getAllUserAddresses', function () {
    it('Should return an array of addresses', async function () {
      const addresses = await wtf.getAllUserAddresses();
      expect(addresses).to.be.an('object').that.has.all.keys('ethereum');
      expect(addresses['ethereum']).to.be.an('object').that.has.keys('orcid', 'google', 'nameAndBio');
      expect(addresses['ethereum']['orcid']).to.be.an('array').that.has.members([this.userAddress]);
      expect(addresses['ethereum']['google']).to.be.an('array').that.has.members([this.userAddress]);
    });
  });

  describe('bioForAddress', function () {
    it('Should return correct bio for registered address', async function () {
      const bio = await wtf.bioForAddress(this.userAddress);
      expect(bio).to.equal(this.bio);
    });

    it('Should return no bio for unregistered address', async function () {
      const bio = await wtf.bioForAddress('0x1234567891234567891234567891234567891234');
      expect(bio).to.equal('');
    });
  });

  describe('nameForAddress', function () {
    it('Should return no name for unregistered address', async function () {
      const name = await wtf.nameForAddress(this.userAddress);
      expect(name).to.equal(this.name);
    });

    it('Should return no name for unregistered address', async function () {
      const name = await wtf.nameForAddress('0x1234567891234567891234567891234567891234', 'ethereum');
      expect(name).to.equal('');
    });
  });

  describe('getHolo', function () {
    it('Should return correct creds, name, and bio for registered address', async function () {
      const crossChainHolo = await wtf.getHolo(this.userAddress);
      const holo = crossChainHolo['ethereum'];
      expect(holo).to.be.an('object');
      expect(holo['orcid']).to.equal(this.orcid);
      expect(holo['google']).to.equal(this.gmail);
      expect(holo['name']).to.equal(this.name);
      expect(holo['bio']).to.equal(this.bio);
    });
  });
});
