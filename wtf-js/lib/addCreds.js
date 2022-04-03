const ethers = require('ethers');

const search64 = require('../../whoisthis.wtf-frontend/src/searchForPlaintextInBase64.js');

const vjwtABI = require('./contracts/VerifyJWT.json');


const consoleLogThis = (param) => {
  console.log()
  console.log()
  console.log(param)
  console.log()
  console.log()
}




const sha256FromString = x => ethers.utils.sha256(ethers.utils.toUtf8Bytes(x))
const sandwichIDWithBreadFromContract = async (id, contract) => {
  let sandwich = (await contract.bottomBread()) + Buffer.from(id).toString('hex') + (await contract.topBread());
  sandwich = sandwich.replaceAll('0x', '');
  return sandwich
}

// Connect to the network
// let provider = ethers.getDefaultProvider("http://localhost:8545");
const provider = new ethers.providers.JsonRpcProvider();

// const vjwt = props.web2service ? new ethers.Contract(contractAddresses[props.web2service], vjwtABI, signer) : null;

const vjwtOrcid = "0x5fbdb2315678afecb367f032d93f642f64180aa3";


async function credentialsForAddress(address, network, service) {
  network = "http://localhost:8545";
  
  // TODO: use `service` to lookup contract in IdentityAggregator instead of hardcoding it.
  // From ethers docs: We connect to the Contract using a Provider, so we will only
  //                   have read-only access to the Contract
  // const vjwtOrcid = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; // VerifyJWT addr
  const vjwt = new ethers.Contract(vjwtOrcid, vjwtABI, provider);

  creds = await vjwt.credsForAddress(address);
  return creds;
}



const acc = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const wallet = new ethers.Wallet(privateKey, provider);

// const tx = signer.sendTransaction({
//   to: vjwtOrcid,
//   data: something,
//   value: ethers.utils.parseEther("2.0")
// });
// let vjwt = new ethers.Contract(vjwtOrcid, vjwtABI, provider);
// Create a new instance of the Contract with a Signer, which allows update methods
// let contractWithSigner = vjwt.connect(wallet);
// ... OR ...
let contractWithSigner = new ethers.Contract(vjwtOrcid, vjwtABI, wallet)

const addCreds = async () => {
  // Set up context to call commitJWTProof() and verifyMe()
  const idToken = 'eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A';
  const correctID = '0000-0002-2308-9517';
  const [headerRaw, payloadRaw, signatureRaw] = idToken.split('.');
  const signature = Buffer.from(signatureRaw, 'base64url');
  const message = headerRaw + '.' + payloadRaw;
  const payloadIdx = Buffer.from(headerRaw).length + 1; //Buffer.from('.').length == 1
  const sandwich = await sandwichIDWithBreadFromContract(correctID, contractWithSigner);
  const [startIdx, endIdx] = search64.searchForPlainTextInBase64(Buffer.from(sandwich, 'hex').toString(), payloadRaw);
  const hashedMessage = sha256FromString(message);

  consoleLogThis("Made it to line 81")

  const proof = ethers.utils.sha256(await contractWithSigner.XOR(hashedMessage, wallet.address, {gasLimit:100500}));

  consoleLogThis("Made it to line 85")

  // Call contract
  let tx = await contractWithSigner.commitJWTProof(proof);
  console.log(tx.hash);
  // The operation is NOT complete yet; we must wait until it is mined
  await tx.wait();

  consoleLogThis("Made it to line 93")

  tx = await contractWithSigner.verifyMe(ethers.BigNumber.from(signature), message, payloadIdx, startIdx, endIdx, '0x'+sandwich, {gasLimit:100500});

  consoleLogThis("Made it to line 97")

  // The operation is NOT complete yet; we must wait until it is mined
  await tx.wait();
  return tx;
}

addCreds()

// let tx = credentialsForAddress(acc);
// tx.then(function(result) {
//   console.log(tx)
// })


// exports.printMsg = function() {
//     console.log("This is a message from the demo package");
// }
