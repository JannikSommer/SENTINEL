import Web3 from "web3";

import { CONTACT_ABI, CONTACT_ADDRESS, VENDOR_CONTRACT_ABI, PRIVATE_CONTRACT_ABI } from "../../config.js";

export class web3Gateway {

    /**
     * @type {Web3} Static web3 instance for the application.
     */
    static web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');

    /**
     * @type {Web3.eth.Contract}  Contract object of the Announcement Service.
     */
    static announcementService = new this.web3.eth.Contract(CONTACT_ABI, CONTACT_ADDRESS);

    /**
     * @type {[Object]} Array of event subscriptions.
     */
    static subscriptions = [];

    /**
     * @type {[Object]} Array of new security advisory events.
     */
    static newSecurityAdvisoryEvents = [];

    /**
     * @type {[Object]} Array of updated security advisory events.
     */
    static updatedSecurityAdvisoryEvents = [];

    /**
     * @type {[Object]} Array of private security advisory events.
     */
    static privateSecurityAdvisoryEvents = [];

    /**
     * Clear all subscriptions made to announcement service and private contracts.
     */
    static async clearSubscriptions() {
        this.web3.eth.clearSubscriptions();
        this.subscriptions = []; //perhaps need to be popped instead
        this.newSecurityAdvisoryEvents = [];
        this.updatedSecurityAdvisoryEvents = [];
        this.privateSecurityAdvisoryEvents = [];
    }

    /**
     * Subscribe to new security advisory events on the Announcement Service. 
     */
    static async subscribeNewSecurityAdvisories() {
        const sub = this.announcementService.events.NewSecurityAdvisory({
            fromBlock: 0
        }, async function (error, event) {
            if (error)
                throw error;
            const newEvent = {
                type: "new",
                event: event, 
                cid: event.returnValues.documentLocation,
                tx: await this.web3.eth.getTransaction(event.transactionHash), 
                block: await this.web3eth.getBlock(event.blockNumber),
                advisory: {} // will be set later
            };
            this.newSecurityAdvisoryEvents.push(newEvent);
            await this.subscribeToSecurityAdvisoryUpdates(event.returnValues.advisoryIdentifier);
        });
        this.subscriptions.push(sub);
    }

    /**
     * Subscribe to updated security advisory events on the Announcement Service.
     * @param {*} advisoryIdentifier Identifier from the NewSecurityAdvisory event to subscribe to updates for.
     */
    static async subscribeToSecurityAdvisoryUpdates(advisoryIdentifier) {
        const sub = this.announcementService.events.UpdatedSecurityAdvisory({
            // eslint-disable-next-line
            topics: [ , this.web3.utils.soliditySha3({type: 'string', value: advisoryIdentifier})],
            fromBlock: 0
        }, async function (error, event) {
            if (error) 
                throw error;
            const newEvent = {
                type: "update",
                event: event,
                cid: event.returnValues.documentLocation,
                tx: await this.web3.eth.getTransaction(event.transactionHash),
                block: await this.web3.eth.getBlock(event.blockNumber),
                advisory: {} // will be set later
            };
            this.updatedSecurityAdvisoryEvents.push(newEvent);
        });
        this.subscriptions.push(sub);
    }

    /** 
     * Subscribe to private security advisory events on a private contract.
     */
    static async subscribeToPrivateSecurityAdvisories(address) {
        let contract = new this.web3.eth.Contract(PRIVATE_CONTRACT_ABI, address);
        const sub = contract.events.Announcement({
            fromBlock: 0
        }, async function (error, event) {
            if (error)
                throw error;
            const newEvent = {
                type: "private",
                event: event,
                cid: event.returnValues.location,
                tx: await this.web3.eth.getTransaction(event.transactionHash), 
                block: await this.web3.eth.getBlock(event.blockNumber), 
                advisory: {} // will be set later
            };
            this.privateSecurityAdvisoryEvents.push(newEvent);
        });
        this.subscriptions.push(sub);
    }

    /**
     * Make a transaction to a vendor smart contract to announce a new security advisory.
     * @param {Object} sender Sender object of the transaction.
     * @param {Object} recipient Recipient object of the transaction (should be a vendor contract)
     * @param {Object} payload Data to be sent in the transaction.
     * @param {number} gas Gas limit for the transaction (default: 6721975).
     */
    static async announcePublicSecurityAdvisory(sender, recipient, payload, gas = 6721975) {
        const contract = new this.web3.eth.Contract(VENDOR_CONTRACT_ABI, recipient.address);
        const config = {
            from: sender.address,
            to: recipient.address,
            gas: gas,
            data: contract.methods.announceNewAdvisory(
                    payload.vulnerabilityCount,
                    payload.productIds,
                    payload.fileLocation)
                .encodeABI()
        }
        this.web3.eth.accounts.signTransaction(config, sender.key).then((signedTx) => {
            const tx = this.web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
            tx.on('receipt', (receipt) => {
                return receipt;
            });
            tx.on('error', (error) => {
                console.log(error);
                throw error;
            });
        });
    }

    /**
     * Make a transaction to a vendor smart contract to announce an update to a security advisory.
     * @param {Object} sender Sender object of the transaction.
     * @param {Object} recipient Recipient object of the transaction (should be a vendor contract)
     * @param {Object} payload Data to be sent in the transaction.
     * @param {number} gas Gas limit for the transaction (default: 6721975).
     */
    static async announcePublicSecurityAdvisoryUpdate(sender, recipient, payload, gas = 6721975) { 
        const contract = new this.web3.eth.Contract(VENDOR_CONTRACT_ABI, recipient.address);
        const config = {   
            from: sender.address,
            to: recipient.address,
            gas: gas,
            data: contract.methods.announceUpdatedAdvisory(
                    payload.advisoryId, 
                    payload.vulnerabilityIds, 
                    payload.productIds,  
                    payload.fileLocation)
                .encodeABI()
        }
        this.web3.eth.accounts.signTransaction(config, sender.key).then((signedTx) => {
            const tx = this.web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
            tx.on('receipt', (receipt) => {
                return receipt;
            });
            tx.on('error', (error) => {
                console.log(error);
                throw error;
            });
        });
    }

    /**
     * Make a transaction to a "private" contract to announce a confidential security advisory.
     * All Web3 related functions are handled in this function by the static web3 instance.
     * @param {Object} sender Sender object of the transaction.
     * @param {Object} recipient Recipient object of the transaction (should be a vendor contract)
     * @param {Object} payload Data to be sent in the transaction.
     * @param {number} gas Gas limit for the transaction (default: 6721975).
     */
    static async announcePrivateSecurityAdvisory(sender, recipient, payload, gas = 6721975) {
        const contract = new this.web3.eth.Contract(PRIVATE_CONTRACT_ABI, recipient.address);
        const config = {
            from: sender.address,
            to: recipient.address,
            gas: 6721975,   
            data: contract.methods.announce(
                    payload.fileLocation,
                    this.web3.utils.bytesToHex(new Uint8Array(payload.fileHash)),
                    this.web3.utils.bytesToHex(new Uint8Array(payload.wrappedKey)),
                    this.web3.utils.bytesToHex(payload.iv))
                .encodeABI()
        }
        this.web3.eth.accounts.signTransaction(config, sender.key).then((signedTx) => {
            const tx = this.web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
            tx.on('receipt', (receipt) => {
                return receipt;
            });
            tx.on('error', (error) => {
                console.log(error);
                throw error;
            });
        });
    }



}