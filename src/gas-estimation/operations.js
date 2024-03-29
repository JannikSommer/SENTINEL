import Web3 from "web3";
import fs from "fs";
import { exit } from "process";

if (process.argv[2] == "--help" || process.argv[2] == "-h") {
    console.log("Usage: node deployments.js [local|testnet] [private key] [alchemy api key]");
    exit(0);
}

if (process.argv.length < 3) {
    console.log("Please specify either 'local' or 'testnet' as the first argument.");
    exit(1);
}

if (process.argv[2] == "testnet" && process.argv.length < 4) {
    console.log("Please specify a private key for a valid address and an Alchemy API key for the testnet.");
    exit(1);
}

const ITERATIONS = 10;

const AS_ABI = JSON.parse(fs.readFileSync("../../build/contracts/AnnouncementService.json")).abi;
const AS_BYTECODE = JSON.parse(fs.readFileSync("../../build/contracts/AnnouncementService.json")).bytecode;

const IIS_ABI = JSON.parse(fs.readFileSync("../../build/contracts/IdentifierIssuerService.json")).abi;
const IIS_BYTECODE = JSON.parse(fs.readFileSync("../../build/contracts/IdentifierIssuerService.json")).bytecode;

const VENDOR_CONTRACT_ABI = JSON.parse(fs.readFileSync("../../build/contracts/Vendor.json")).abi;
const VENDOR_BYTECODE = JSON.parse(fs.readFileSync("../../build/contracts/Vendor.json")).bytecode;

const PRIVATE_CONTRACT_ABI = JSON.parse(fs.readFileSync("../../build/contracts/Private.json")).abi;
const PRIVATE_BYTECODE = JSON.parse(fs.readFileSync("../../build/contracts/Private.json")).bytecode;

let web3;
let account;
try {
    if (process.argv[2] == "local") {
        web3 = new Web3("ws://127.0.0.1:7545");
        account = web3.eth.accounts.privateKeyToAccount(process.argv[3]);
        web3.eth.accounts.wallet.add(account);
    } else if (process.argv[2] == "testnet") {
        web3 = new Web3('wss://eth-sepolia.g.alchemy.com/v2/' + process.argv[4]);
        account = web3.eth.accounts.privateKeyToAccount(process.argv[3]);
        web3.eth.accounts.wallet.add(account);
    }
} catch (e) {
    console.log("Error: " + e);
    exit(1);
}


const as = await new web3.eth.Contract(AS_ABI).deploy({data: AS_BYTECODE}).send({from: account.address, gas: 5000000});
const iis = await new web3.eth.Contract(IIS_ABI).deploy({data: IIS_BYTECODE}).send({from: account.address, gas: 5000000});

const vendor = await new web3.eth.Contract(VENDOR_CONTRACT_ABI).deploy({
    data: VENDOR_BYTECODE, 
    arguments: ["SommerSoftware Inc.", as.options.address, iis.options.address]})
    .send({from: account.address, gas: 5000000});

const privateContract = await new web3.eth.Contract(PRIVATE_CONTRACT_ABI).deploy({data: PRIVATE_BYTECODE}).send({from: account.address, gas: 5000000});

let results = [];
console.log("Starting " + ITERATIONS + " iterations for each operation...");

// announceNewAdvisory
results.push(await estimate("new-announcement", 
    vendor.methods.announceNewAdvisory(
        1,
        "CSAFPID-0001,CSAFPID-0002,CSAFPID-0003,CSAFPID-0004,CSAFPID-0005,CSAFPID-0006",
        "ipfs/QmPQuXq1JuipvhLKdDz84eSM3tLbESjDAKeAHNzScjZz7Y")
    )
);

// announceUpdatedAdvisory
results.push(await estimate("update-announcement", 
    vendor.methods.announceUpdatedAdvisory(
        "SNTL-A-1-1",
        "SNTL-V-1-1", 
        "CSAFPID-0001,CSAFPID-0002,CSAFPID-0003,CSAFPID-0004,CSAFPID-0005,CSAFPID-0006", 
        "ipfs/QmPQuXq1JuipvhLKdDz84eSM3tLbESjDAKeAHNzScjZz7Y")
    )
);

// updatePublicKey
let key = "MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEA3bL3tVT7arVVj2ZGl8cAPvDisChrLhIw84fGbESfjYz6UQ95MwuFjwJrcEYoSkKa5Mm7MfzdFo+xVl/PKUpvf8i2BKpq+uo+QqfhqIxZALXDvLVPbqx50z/VecuioSJM8a+l6rarZjpMf8TVofOokQzVvRQhMMyQvhmSV4Hsub7PvfQ4gyNHZ3pvua41ehHLplA95XHNDZMrDPjqXfEZeGfaXIocSTtS6F7axYF9/2BzH+c2OqFNOQvJaJtjfxiSTV7NgWcaU4dBhhy7QeqoW4t7lqfzmGtPHgdJ8gT3v1fyQtr5g7QS9WwExwQFgYGMIi2q5X1IsNir73eaXUVlnA5+Ik72kuFPe+r9EF3dxcu0CGBx4qTRp6fCQe5cjnPM1vD1ocCh7+w0hdef3dRPA3mgVYDX6oDPQZ09WmCZkR41QzDk8tT2ed5meSn514y1o8wXVigNXwV26Q4urzsUHae4CsO8EaTrmECoQQZuIu42CT/Sguj6NMIW/EZfIp8hAgMBAAE=";
results.push(await estimate("set-public-key", privateContract.methods.setPublicKey(new Uint8Array(Buffer.from(key, "base64")))));

await privateContract.methods.addVendor(account.address).send({from: account.address, gas: 5000000});

// privateAnnouncement
results.push(await estimate("private-announcement", 
    await privateContract.methods.announce(
        "QmPQuXq1JuipvhLKdDz84eSM3tLbESjDAKeAHNzScjZz7Y", 
        "0x58b7749e644f77e468284825f100915d9c1f5e21ff351bed7ff18302fd4c1660",
        "0x159b8af26a66665444f3ce0960cf0f1c42b67735dc8d313ddd1fdf5ca2802acef61faee26daf4e42f12403aa382a0c453901e6ce1985752e1ea4cb8321205f24fdd64433626fa77a1867e64fd670f3ffd8b597ba1c5381388fd2305f07abaf27e3d1eff70f31e954ef1279c21ff5b24233c9b8b0e4c052880b67e53378600ca928297644d1379fa98926c7b9b6a7c2696d109249201fc3b525b24c2556f170746ac75a9b365e13c32e5d3003962152d045358f6e5126828eb3d89c6041378bd263b6a85ce6b8ed397d84bad15864c43ac39a12895f120959286d533cae3cfa969a75f98ea7c8d1028f07a4a862a44a2a27061b236705007e9ad49b5637a5b3f449c2c48fa07d175f70fee254abf1491a054d4ae244f287ccb182bf9e58111ce738515c1dfdb0b27da67a58cd9eee2e326deb084704a8f7481225d9f53dc16f4377b4a1a7b2ecff35e2864eea0a2addccb3c720bd9e4bf127d19db7a521dd2ee3ba7f5dfdd85ae826996cfb07444242d618f630dd92815a7915a2fa97a7368037",
        "0xae1a1df2e4e54657eae7c438")
    )
);

// removeVendor
results.push(await estimate("remove-vendor", 
    await privateContract.methods.removeVendor(account.address), 
    account.address,
    false)
);

await privateContract.methods.removeVendor(account.address).send({from: account.address, gas: 5000000});

// addVendor
results.push(await estimate("add-vendor", 
    await privateContract.methods.addVendor(account.address), 
    account.address, 
    false)
);
async function estimate(operationname, method, sender = account.address, sendTx = true) {
    let estimates = []
    for await (const _ of new Array(ITERATIONS)) {
        try {
            estimates.push(await method.estimateGas({from: sender}));
            if (!sendTx)
                continue;
            await method.send({from: sender, gas: 5000000});
        } catch (e) {
            console.log(e);
        }
    }
    return {
        operation: operationname,
        estimates: estimates
    };
}

console.log(JSON.stringify(results, null, 4));
exit(0);