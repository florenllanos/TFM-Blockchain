import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LotTK from '../contratos/LotTK.json';

import {Container, Row, Col, Form, FormGroup, Label, Input, Button, Table, CardText} from 'reactstrap';

const lotContractAddress = process.env.REACT_APP_LOTTK; // Contracte de LotTK
const lotContractABI = LotTK.abi;

function TransferirLote({ cuenta }) {
    const [lotContract, setLotContract] = useState(null);
    const [lotes, setLotes] = useState([]);
    const [selectedLotId, setSelectedLotId] = useState('');
    const [direccionContrato, setDireccionContrato] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const initializeContract = async () => {
            if (window.ethereum && cuenta) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();

                const lotTKContract = new ethers.Contract(lotContractAddress, lotContractABI, signer);
                setLotContract(lotTKContract);

                await fetchLotes(lotTKContract, cuenta);

            } else {
                setLotContract(null);
            }
        };

        initializeContract();
    }, [cuenta]);

    const fetchLotes = async (contract, account) => {
        try {
            if (contract && account) {
                const lotesEmpresa = await contract.getLotsEmpresa(account);                
                setLotes(lotesEmpresa);
            }
        } catch (error) {
            console.error("Error obtenint lots:", error);
        }
    };

    const transferirLot = async () => {
        if (!lotContract || !selectedLotId) {
            setMessage("Per favor, seleccioni un lot.");
            return;
        }

        try {
            setMessage("Transferint lot");

            const tx = await lotContract.transferFrom(cuenta,direccionContrato,selectedLotId);
            await tx.wait();
            setMessage(`Lot ${selectedLotId} transferit amb èxit a ${direccionContrato} !`);
            
            await fetchLotes(lotContract, cuenta);
        } catch (error) {
            console.error("Error al transferir el lot:", error);
            setMessage(`Error: ${error.message}`);
        }
    };

    const cambiaContrato = (event) => {
        setDireccionContrato(event.target.value);
    };

    return (
        <Container className="mt-4">
    <Row className="mt-5">
        <Col md={{ size: 8, offset: 2 }}>
            <h2>
                <i className="bi bi-list-task me-2"></i>Transferir Lot
            </h2>

            <Form className="p-4 border rounded shadow-sm mt-3">
                <FormGroup>
                    <Label for="selectLot">Seleccionar lot:</Label>
                    <Input
                        type="select"
                        id="selectLot"
                        value={selectedLotId}
                        onChange={(e) => setSelectedLotId(e.target.value)}
                    >
                        <option value="">Selecciona un lote</option>
                        {lotes.map((lote) => (
                            <option key={lote.idToken} value={lote.idToken}>
                                {lote.idLot}
                            </option>
                        ))}
                    </Input>
                </FormGroup>

                <FormGroup>
                    <Label for="direccionContrato">Adreça del contracte destí:</Label>
                    <Input
                        type="text"
                        id="direccionContrato"
                        value={direccionContrato}
                        onChange={cambiaContrato}
                        placeholder="Ej: 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
                    />
                </FormGroup>

                <div className="text-center mt-4">
                    <Button onClick={transferirLot} disabled={!selectedLotId || !direccionContrato}>
                        Transferir Lot
                    </Button>
                </div>

                {message && <p className="mt-3 text-info">{message}</p>}
            </Form>
        </Col>
    </Row>
</Container>
    );
}

export default TransferirLote;