import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/esm/Container';
import Row from 'react-bootstrap/esm/Row';
import Col from 'react-bootstrap/Col';

import UpdateKeyForm from './UpdateKeyForm';
import VendorManagementForm from './VendorManagementForm';

import { Accounts } from '../../localStorage/Accounts';

import { PasswordContext } from '../../contexts/PasswordContext';

import React, { useEffect, useState, useContext } from 'react';
import ContractManagement from './ContractManagement';
import Contracts from '../../localStorage/Contracts';


function ConfidentialSettings() {
    const [show, setShow] = useState(true);
    const [accounts, setAccounts] = useState([]);
    const [contracts, setContracts] = useState([]);
    
    const aesKey = useContext(PasswordContext);
    
    const addContract = async (address, name) => {
        const newContracts = Contracts.addContract(contracts, address, name);
        await Contracts.save(newContracts, aesKey);
        setContracts(newContracts);
    }

    const removeContract = async (address) => {
        const newContracts = Contracts.removeContract(contracts, address)
        await Contracts.save(newContracts, aesKey);
        setContracts(newContracts);
    }

    const updatePrivateKey = async (address, key) => {
        const newContracts = Contracts.updateKey(contracts, address, key);
        await Contracts.save(newContracts, aesKey);
        setContracts(newContracts);
    }

    const loadAccounts = async () => { 
        const acc = await Accounts.load(aesKey);
        if (acc !== null) setAccounts(acc);
    };

    useEffect(() => {
        if(aesKey !== null) {
            loadAccounts(); 
            Contracts.load(aesKey).then((con) => {
                if(con !== null) setContracts(con);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aesKey]);

    return (
        <div>
            {show
            ? <Alert variant="danger" onClose={() => setShow(false)} dismissible>
                <Alert.Heading>Careful! Announcements cost gas!</Alert.Heading>
                <p>Submitting the forms on this page will create a transaction to the Ethereum network from your connected wallet. <br/></p>
                You will be warned again when submitting the forms. 
              </Alert>
            : <></>}
            <h1>Confidential Settings</h1>
            Here you can configure your settings regarding confidential announcements. 
            <br />
            <hr />
            <ContractManagement contracts={contracts} addContract={addContract} removeContract={removeContract}/>
            <br />
            <hr />
            <Container>
                <Row>
                    <Col lg="5">
                        <VendorManagementForm accounts={accounts} contracts={contracts}/>
                    </Col>
                    <Col>
                        <div style={{height: '40%', 
                                    width: 1, 
                                    backgroundColor: '#FFFFFF', 
                                    position: 'absolute', 
                                    left: "50%"}}>
                        </div>
                    </Col>
                    <Col lg="5">
                        <UpdateKeyForm accounts={accounts} contracts={contracts} updateContractKey={updatePrivateKey}/>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
export default ConfidentialSettings;