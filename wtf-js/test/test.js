const { expect } = require('chai');

const wtf = require('../lib/index');


describe('wtf-js', function () {

  // TODO: before(run startIntegration.js) // update startIntegration to take creds and addresses
  //       Make startIntegration.js a self-contained script

  describe('credentialsForAddress', function () {
    it('Should return credentials', async function () {
      const creds = await wtf.credentialsForAddress('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 'ethereum', 'google');
      expect(creds).to.equal('nanaknihal@gmail.com');
    });
  });

  describe('credentialsForAddress', function () {
    it('Should return credentials', async function () {
      const creds = await wtf.addressForCredentials('ethereum', 'nanaknihal@gmail.com', 'google');
      expect(creds.toString().toLowerCase()).to.equal('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
    });
  });
});

