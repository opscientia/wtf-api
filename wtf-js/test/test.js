const { expect } = require('chai');

const wtf = require('../lib/index');


describe('wtf-js', function () {

  // TODO: before(run startIntegration.js) // update startIntegration to take creds and addresses
  //       Make startIntegration.js a self-contained script/module

  describe('credentialsForAddress', function () {
    it('Should return correct credentials (orcid)', async function () {
      const creds = await wtf.credentialsForAddress('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 'ethereum', 'orcid');
      expect(creds).to.equal('0000-0002-2308-9517');
    });
    
    it('Should return correct credentials (google)', async function () {
      const creds = await wtf.credentialsForAddress('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 'ethereum', 'google');
      expect(creds).to.equal('nanaknihal@gmail.com');
    });
  });

  describe('addressForCredentials', function () {
    it('Should return correct address (orcid)', async function () {
      const address = await wtf.addressForCredentials('ethereum', 'nanaknihal@gmail.com', 'google');
      expect(address.toString().toLowerCase()).to.equal('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
    });

    it('Should return correct address (google)', async function () {
      const address = await wtf.addressForCredentials('ethereum', '0000-0002-2308-9517', 'orcid');
      expect(address.toString().toLowerCase()).to.equal('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
    });
  });
  
  describe('getAllUserAddresses', function () {
    it('Should return an array of addresses', async function () {
      const addresses = await wtf.getAllUserAddresses();
      expect(addresses).to.be.an('object').that.has.all.keys('ethereum');
      expect(addresses['ethereum']).to.be.an('object').that.has.keys('orcid', 'google');
      expect(addresses['ethereum']['orcid']).to.be.an('array').that.has.members(['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']);
      expect(addresses['ethereum']['google']).to.be.an('array').that.has.members(['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']);
    });
  });
});

