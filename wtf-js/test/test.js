const { expect } = require('chai');
const { ethers } = require('ethers');

const wtf = require('../lib/index');
const { 
  UnsupportedNetworkError,
  UnsupportedServiceError,
  CredentialsNotFoundError,
  AddressNotFoundError
} = require('../lib/errors');


/**
 * NOTE: These tests currently rely on startIntegration.js from DIDJWT.
 *       The script must be running in order for these tests to pass.
 */

describe('wtf-js', function () {

  before(function () {
    this.userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    this.orcid = '0000-0002-2308-9517';
    this.gmail = 'nanaknihal@gmail.com';
    [this.name, this.bio] = ['Greg', 'Business person'];

    wtf.setProviderURL('http://localhost:8545')
  });

  describe('credentialsForAddress', function () {
    it('Should return correct credentials (orcid)', async function () {
      const creds = await wtf.credentialsForAddress(this.userAddress, 'ethereum', 'orcid');
      expect(creds).to.equal(this.orcid);
    });
    
    it('Should return correct credentials (google)', async function () {
      const creds = await wtf.credentialsForAddress(this.userAddress, 'ethereum', 'google');
      expect(creds).to.equal(this.gmail);
    });

    it("Should throw UnsupportedNetworkError when network=='bitcoin'", async function () {
      // TODO: Replace with chai's expect().to.throw()
      try {
        await wtf.credentialsForAddress(this.userAddress, 'bitcoin', 'google')
      }
      catch (err) {
        expect(err.message).to.equal(UnsupportedNetworkError('bitcoin').message)
      }
    });

    it("Should throw UnsupportedServiceError when service=='randoService'", async function () {
      try {
        await wtf.credentialsForAddress(this.userAddress, 'ethereum', 'randoService')
      }
      catch (err) {
        expect(err.message).to.equal(UnsupportedServiceError('ethereum', 'randoService').message)
      }
    });

    it("Should throw CredentialsNotFoundError when querying for unfound credentials", async function () {
      const badAddress = '0x1234567891234567891234567891234567891234'
      try {
        await wtf.credentialsForAddress(badAddress, 'ethereum', 'orcid')
      }
      catch (err) {
        expect(err.message).to.equal(CredentialsNotFoundError('ethereum', 'orcid', badAddress).message)
      }
    });
  });

  describe('addressForCredentials', function () {
    it('Should return correct address (google)', async function () {
      const address = await wtf.addressForCredentials('ethereum', this.gmail, 'google');
      expect(address).to.equal(this.userAddress);
    });

    it('Should return correct address (orcid)', async function () {
      const address = await wtf.addressForCredentials('ethereum', '0000-0002-2308-9517', 'orcid');
      expect(address).to.equal(this.userAddress);
    });

    it("Should throw UnsupportedNetworkError when network=='bitcoin'", async function () {
      // TODO: Replace with chai's expect().to.throw()
      try {
        await wtf.addressForCredentials('bitcoin', this.gmail, 'google')
      }
      catch (err) {
        expect(err.message).to.equal(UnsupportedNetworkError('bitcoin').message)
      }
    });

    it("Should throw UnsupportedServiceError when service=='randoService'", async function () {
      try {
        await wtf.addressForCredentials('ethereum', this.gmail, 'randoService')
      }
      catch (err) {
        expect(err.message).to.equal(UnsupportedServiceError('ethereum', 'randoService').message)
      }
    });

    it("Should throw CredentialsNotFoundError when querying for unfound credentials", async function () {
      const badCredentials = '123abc'
      try {
        await wtf.addressForCredentials('ethereum', badCredentials, 'orcid')
      }
      catch (err) {
        expect(err.message).to.equal(AddressNotFoundError('ethereum', 'orcid', badCredentials).message)
      }
    });
  });
  
  describe('getAllUserAddresses', function () {
    it('Should return an array of addresses', async function () {
      const addresses = await wtf.getAllUserAddresses();
      expect(addresses).to.be.an('object').that.has.all.keys('ethereum');
      expect(addresses['ethereum']).to.be.an('object').that.has.keys('orcid', 'google');
      expect(addresses['ethereum']['orcid']).to.be.an('array').that.has.members([this.userAddress]);
      expect(addresses['ethereum']['google']).to.be.an('array').that.has.members([this.userAddress]);
    });
  });

  describe('bioForAddress', function () {
    it('Should return no bio for unregistered address', async function () {
      const bio = await wtf.bioForAddress('0x1234567891234567891234567891234567891234', 'ethereum');
      expect(bio).to.equal('');
    });
  });

  describe('nameForAddress', function () {
    it('Should return no name for unregistered address', async function () {
      const name = await wtf.nameForAddress('0x1234567891234567891234567891234567891234', 'ethereum');
      expect(name).to.equal('');
    });
  });

  describe('getAllAccounts', function () {
    it('Should return correct creds, name, and bio for registered address', async function () {
      const credsNameBio = await wtf.getAllAccounts('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'ethereum');
      expect(credsNameBio['creds']).to.be.an('array').that.includes.members([this.orcid, this.gmail]);
      expect(credsNameBio['name']).to.equal(this.name);
      expect(credsNameBio['bio']).to.equal(this.bio);
    });
  });
});
