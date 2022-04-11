# wtf-lib
wtf-lib is a JavaScript library for interacting with the [WTF protocol](https://github.com/opscientia/DIDJWT).

The WTF protocol allows identities from various web services to be associated with crypto addresses. For example, I can use the protocol to associate my gmail address with my Ethereum address. Currently, a user can associate their various web identities with their address through [Holonym](https://holo.pizza/).

## Installation

    npm install wtf-lib

## Usage

    import wtf from 'wtf-lib';

(All of the below queries to WTF require the relevant users to be registered on WTF. One cannot use WTF to retrieve information about unregistered users.)

Note: Since the WTF protocol runs on multiple blockchain networks, most wtf functions require a `network` argument specifying which network you wish to query. For example, if you wish to query Ethereum, pass 'ethereum' as the `network` argument.

Get a user's identity associated with a particular service. In the following example, we query WTF smart contracts on `ethereum` for the `google` identity associated with `userAddress`.

    const userAddress = '0x1234567891234567891234567891234567891234';
    const gmail = await wtf.credentialsForAddress(userAddress, 'ethereum', 'google');

We can also get a user's crypto address from their web identity. Below, we get the user's Ethereum address.

    const userGmail = 'xyz@gmail.com';
    const address = await wtf.addressForCredentials('ethereum', userGmail, 'google');

We can get a Holonym user's name and bio.

    const userAddress = '0x1234567891234567891234567891234567891234';
    const name = await wtf.nameForAddress(userAddress, 'ethereum');
    const bio = await wtf.bioForAddress(userAddress, 'ethereum');

To get all info associated with a user's address, use `getHolo`. 

    const {'creds': creds, 'name': name, 'bio': bio} = await wtf.getHolo(userAddress, 'ethereum');

We might want to see which users are registered on WTF. Get an object containing all registered addresses on all networks with `getAllUserAddresses`.

    const addresses = await wtf.getAllUserAddresses();

Finally, it is recommended that projects using wtf-lib use their own JSON RPC providers to access blockchain networks. By default, wtf-lib uses ethers default providers, but these can be slow. Use `setProviderURL` to specify the http url of your provider. If you are testing with a local test blockchain, you might wish to set the provider URL to localhost:

    wtf.setProviderURL('http://localhost:8545')

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
