import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';

import { useRef, useState } from 'react';

import { SUPPORTED_STORAGE_PUBLIC } from '../../storage/config';
import { uploadToIpfs } from '../../storage/IpfsUpload';
import Web3Gateway from '../../models/web3/web3Gateway';

import AcceptModal from './AcceptModal';
import ErrorModal from './ErrorModal';
import SuccessModal from './SuccessModal';

function NewAdvisoryForm({ accounts, ipfs }) {
    const selectedAccount = useRef();
    const productIds = useRef([]);
    const vulnerabilityCount = useRef(0);
    const [address, setAddress] = useState("");
    const [file, setFile] = useState("");
    const [storageSystem, setStorageSystem] = useState("");
    const [accept, setAccept] = useState(false);
    const [transaction, setTransaction] = useState("");
    const [error, setError] = useState("");

    const [showWarning, setShowWarning] = useState(false);
    const dismissWarning = () => setShowWarning(false);

    const [showTransaction, setShowTransaction] = useState(false);
    const dismissTransaction = () => setShowTransaction(false);

    const [showError, setShowError] = useState(false);
    const dismissError = () => setShowError(false);

    const selectAccount = (value) => {
        if (value === "Select an account") {
            selectedAccount.current= {name: "", wallet: "", key: ""};
            return; 
        }
        selectedAccount.current = JSON.parse(value);
    }

    const handleFileChosen = (chosenFile) => {
        const fileReader = new FileReader();
        fileReader.readAsText(chosenFile);
        fileReader.onloadend = () => {setFile(fileReader.result);};
    }

    const parseCSAF = async () => {
        productIds.current = []; // reset before parsing
        let csaf = await JSON.parse(file);
        vulnerabilityCount.current = csaf.vulnerabilities.length;
        for await (const branch of csaf.product_tree.branches) {
            await visitBranch(branch);
        }
        if (productIds.current.length === 0) {
            throw new Error("No product IDs found in CSAF file.");
        }
        if (vulnerabilityCount.current === 0) {
            throw new Error("No vulnerabilities found in CSAF file.");
        }
    }

    const visitBranch = async (branch) => {
        if (branch.hasOwnProperty("branches")) {
            for await (const subBranch of branch.branches) {
                await visitBranch(subBranch);
            }
        } else {
            if (branch.category === "product_version") {
                productIds.current.push(branch.product.product_id);
            }
        }
    }

    const announce = async () => {
        if (!accept) {
            return;
        };
        dismissWarning();
        try {
            let fileLocation;
            switch (storageSystem) {
                case "IPFS":
                    fileLocation = await uploadToIpfs(ipfs, file);
                    break;  // continue with announcement
                case "Arweave":
                    throw new Error("Arweave not supported yet.");
                default:
                    throw new Error("No storage system selected.");
            }
            await parseCSAF();
            let res = await new Web3Gateway().announcePublicSecurityAdvisory(
                {
                    address: selectedAccount.current.wallet, 
                    key: selectedAccount.current.key
                },
                {address: address},
                {
                    vulnerabilityCount: vulnerabilityCount.current,
                    productIds: productIds.current.join(","),
                    fileLocation: storageSystem.toLowerCase().concat("/", fileLocation)
                }
            );
            setTransaction(res);
            setShowTransaction(true);
        } catch (err) {
            setError(err);
            setShowError(true);
        }
    }

    return (
        <div>
            <h3>Announce new security advisory</h3>
            <br />
            <AcceptModal state={showWarning} dismiss={dismissWarning} announce={announce}></AcceptModal>
            <ErrorModal state={showError} dismiss={dismissError} error={error}></ErrorModal>
            <SuccessModal state={showTransaction} dismiss={dismissTransaction} tx={transaction}></SuccessModal>
            <Form>
                <Form.Group className='mb-3' controlId='newAccount'>
                    <Form.Select onChange={(e) => selectAccount(e.currentTarget.value)}>
                        <option>Select an account</option>
                        {accounts.map((account, index) => 
                            <option key={index} value={JSON.stringify(account)}>{account.name}</option>
                        )}
                    </Form.Select>
                    <Form.Text className='text-muted'>Select account for transaction</Form.Text>
                </Form.Group>

                <Form.Group className='mb-3' controlId='newVulnVendorContract'>
                    <FloatingLabel className='mb-3' controlId='newVulnVenCon' label="Vendor smart contract address">
                        <Form.Control value={address} onChange={(e) => setAddress(e.target.value)}></Form.Control>
                        <Form.Text className='text-muted'>Address of smart contract used to initiate announcement from</Form.Text>
                    </FloatingLabel>
                </Form.Group>

                <Form.Group className='mb-3' controlId='newVulnIPFS'>
                    <Form.Label>CSAF File</Form.Label>
                    <Form.Control className='mb-3' type='file' accept='.json' onChange={e => handleFileChosen(e.target.files[0])}/>
                </Form.Group>

                <Form.Group className='mb-3' controlId='newStorageSystem'>
                    <Form.Select onChange={(e) => setStorageSystem(e.currentTarget.value)}>
                        <option>Select an storage system</option>
                        {SUPPORTED_STORAGE_PUBLIC.map((system, index) => 
                            <option key={index} value={system}>{system}</option>
                        )}
                    </Form.Select>
                    <Form.Text className='text-muted'>Select storage system for CSAF</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="newVulnCheck">
                    <Form.Check type="checkbox" value={accept} onChange={(e) => setAccept(e.target.value)}
                        label="I accept to the consequences of creating a transaction!" />
                </Form.Group>
                <Button variant="primary" type="button" onClick={() => setShowWarning(true)}>
                    Announce
                </Button>
            </Form>
        </div>
    )
}
export default NewAdvisoryForm;