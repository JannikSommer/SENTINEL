import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Row from 'react-bootstrap/esm/Row';
import Col from 'react-bootstrap/Col';

import { useRef, useState } from 'react';

import { PRIVATE_CONTRACT_ABI } from '../../config';
import Web3 from 'web3';

import AcceptModal from '../announcement/AcceptModal';
import ErrorModal from '../announcement/ErrorModal';
import SuccessModal from '../announcement/SuccessModal';


function VendorManagementForm({accounts}) {
    const selectedAccount = useRef();
    const [address, setAddress] = useState("");
    const [publicKey, setPublicKey] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [vendorAddress, setVendorAddress] = useState("");
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

    const setKey = () => {
        if (!accept) {
            return;
        };
        dismissWarning();
        try {  
            var web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');
            const contract = new web3.eth.Contract(PRIVATE_CONTRACT_ABI, address);
            web3.eth.accounts.signTransaction({
                from: selectedAccount.current.wallet,
                to: address,
                gas: 6721975,   
                data: contract.methods.setPublicKey(
                    web3.utils.utf8ToHex(publicKey) // TODO: We might be able to optimize by converting to binary first. https://stackoverflow.com/questions/11402329/what-is-the-effect-of-encoding-an-image-in-base64
                ).encodeABI()
            }, selectedAccount.current.key).then((signedTx) => {
                const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
                sentTx.on("receipt", receipt => {
                    setTransaction(receipt);
                    setShowTransaction(true);
                });
                sentTx.on("error", err => {
                    setError(err);
                    setShowError(true);
                });
            }).catch((err) => {
                setError(err);
                setShowError(true);
             })
        } catch (err) {
            setError(err);
            setShowError(true);
        }
    }

    return (
        <div>
            <h3>Manage Vendor Whitelist</h3>
            <br />
            <AcceptModal state={showWarning} dismiss={dismissWarning} announce={setKey}></AcceptModal>
            <ErrorModal state={showError} dismiss={dismissError} error={error}></ErrorModal>
            <SuccessModal state={showTransaction} dismiss={dismissTransaction} tx={transaction}></SuccessModal>
            <Form>
                <Form.Group className='mb-3' controlId='manageVendorAccount'>
                    <Form.Select onChange={(e) => selectAccount(e.currentTarget.value)}>
                        <option>Select an account</option>
                        {accounts.map((account, index) => 
                            <option key={index} value={JSON.stringify(account)}>{account.name}</option>
                        )}
                    </Form.Select>
                    <Form.Text className='text-muted'>Select account for the transaction</Form.Text>
                </Form.Group>

                <Form.Group className='mb-3' controlId='manageVendorPrivateContract'>
                    <FloatingLabel className='mb-3' controlId='manageVendorPrivateContractLabel' label="Smart contract address">
                        <Form.Control value={address} onChange={(e) => setAddress(e.target.value)}></Form.Control>
                        <Form.Text className='text-muted'>Address of confidential smart contract</Form.Text>
                    </FloatingLabel>
                </Form.Group>

                <Form.Group className='mb-3' controlId='manageVendorAddress'>
                    <FloatingLabel className='mb-3' controlId='manageVendorAddressLabel' label="Vendor Address">
                        <Form.Control value={publicKey} onChange={(e) => setVendorAddress(e.target.value)}></Form.Control>
                        <Form.Text className='text-muted'>The address of the vendor to add/remove from the whitelist</Form.Text>
                    </FloatingLabel>
                </Form.Group>

                <Form.Group className="mb-3" controlId="updateKeyCheck">
                    <Form.Check type="checkbox" value={accept} onChange={(e) => setAccept(e.target.value)}
                        label="I accept the consequences of creating a transaction!" />
                </Form.Group>
                    <Row>
                        <Col lg="2">
                            <Button variant="success" type="button" onClick={() => setShowWarning(true)}>  {/* TODO: Disable if values form is not filled correctly*/}
                                Add
                            </Button>
                        </Col>
                        <Col lg="2">
                            <Button variant="danger" type="button">
                                Remove
                            </Button>
                        </Col>
                    </Row>
            </Form>
        </div>
    )
}
export default VendorManagementForm;