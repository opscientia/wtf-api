# wtf-lib
wtf-lib is a JavaScript library for interacting with the [WTF protocol](https://github.com/opscientia/DIDJWT).

The WTF protocol allows identities from various web services to be associated with crypto addresses. For example, I can use the protocol to associate my gmail address with my Ethereum address. Currently, a user can associate their various web identities with their address through [Holonym](https://holo.pizza/).

## Installation

    npm install wtf-lib

## Usage

    import wtf from 'wtf-lib';

(All of the below queries to WTF require the relevant users to be registered on WTF. One cannot use WTF to retrieve information about unregistered users.)

It is recommended that projects using wtf-lib use their own JSON RPC providers to access blockchain networks. By default, wtf-lib uses ethers default providers, but these can be slow. Use `setProviderURL` to specify the http url of each of your providers. You can specify different providers for different networks, or you can specify one network. If you specify multiple providers, wtf-lib will use each endpoint only for its specified network. If you specify only one provider, wtf-lib will query that provider for all networks supported by WTF protocol.

    // Tell wtf-lib to use separate providers for Ethereum and Polygon.
    wtf.setProviderURL({'ethereum', 'https://provider.io', 'polygon': 'https://otherprovider.io'})
    // Tell wtf-lib to use one provider for all networks.
    wtf.setProviderURL({'default': 'https://provider.io'})

Get a user's identity associated with a particular service. In the following example, we query WTF smart contracts for the `google` identity associated with `userAddress`.

    const userAddress = '0x1234567891234567891234567891234567891234';
    const gmail = await wtf.credentialsForAddress(userAddress, 'google');

We can also get a user's crypto address from their web identity. Below, we get the user's crypto address.

    const userGmail = 'xyz@gmail.com';
    const address = await wtf.addressForCredentials(userGmail, 'google');

We can get a Holonym user's name and bio.

    const userAddress = '0x1234567891234567891234567891234567891234';
    const name = await wtf.nameForAddress(userAddress);
    const bio = await wtf.bioForAddress(userAddress);

To get all info associated with a user's address, use `getHolo`. 

    const holo = await wtf.getHolo(userAddress);
    const userName = holo['ethereum']['name']
    const userOrcid = holo['ethereum']['orcid']

We might want to see which users are registered on WTF. Get an object containing all registered addresses on all networks with `getAllUserAddresses`.

    const addresses = await wtf.getAllUserAddresses();


## Contribute
To setup your environment to contribute, first clone this repository.

    git clone https://github.com/opscientia/wtf-api.git
    
Change directory into wtf-api.

    cd wtf-api

This package was developed with Node v16.14.2. If you are using nvm, run:

    nvm use

Install dependencies.

    npm install

Make sure everything works by running the tests.

    npm run test
