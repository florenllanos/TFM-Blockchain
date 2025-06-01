import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VacunaTK from '../contratos/VacunaTK.json';
import LotTK from '../contratos/LotTK.json';
import { padLeft32Zero } from '../utils/Utils.js';

import {Container, Row, Col, Form, FormGroup, Label, Input, Button, Table, CardText, Alert} from 'reactstrap';

const vacunaContractAddress = process.env.REACT_APP_VACUNATK; // Contracte de VacunaTK
const vacunaContractABI = VacunaTK.abi;

const lotContractAddress = process.env.REACT_APP_LOTTK; // Contracte de LotTK
const lotContractABI = LotTK.abi;

function TransferirVacunaLote({ cuenta }) {
    const [vacunaContract, setVacunaContract] = useState(null);
    const [lotContract, setLotContract] = useState(null);
    const [vacunas, setVacunas] = useState([]);
    const [lotes, setLotes] = useState([]);
    const [selectedVacunaId, setSelectedVacunaId] = useState('');
    const [selectedLotId, setSelectedLotId] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const initializeContracts = async () => {
            if (window.ethereum && cuenta) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();

                const vacunaTKContract = new ethers.Contract(vacunaContractAddress, vacunaContractABI, signer);
                setVacunaContract(vacunaTKContract);

                const lotTKContract = new ethers.Contract(lotContractAddress, lotContractABI, signer);
                setLotContract(lotTKContract);

                await fetchVacunas(vacunaTKContract, cuenta);
                await fetchLotes(lotTKContract, cuenta);

            } else {
                setVacunaContract(null);
                setLotContract(null);
            }
        };

        initializeContracts();
    }, [cuenta]);

    const fetchVacunas = async (contract, account) => {
        try {
            if (contract && account) {
                const vacunasEmpresa = await contract.getVacunesEmpresa(account);
                setVacunas(vacunasEmpresa);
            }            
        } catch (error) {
            console.error("Error obtenint vacunes:", error);
        }
    };

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

    const handleLotSelect = (event) => {
        setSelectedLotId(event.target.value);
    };

    const transferirVacuna = async () => {
        try {
            setMessage("Transferint vacuna");
            const tx = await vacunaContract["safeTransferFrom(address,address,uint256,bytes)"](
                cuenta,
                lotContractAddress,
                selectedVacunaId,
                padLeft32Zero(selectedLotId, 16)
            );
            await tx.wait();
            setMessage(`Vacuna ${selectedVacunaId} transferida al lot ${selectedLotId} `);
            
            await fetchVacunas(vacunaContract, cuenta);
            await fetchLotes(lotContract, cuenta);
        } catch (error) {
            console.error("Error al transferir la vacuna:", error);
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <Container className="mt-4">
    <Row className="mt-5">
        <Col md={{ size: 10, offset: 1 }}>
            <h2><i className="bi bi-list-task me-2"></i>Seleccionar lot de destí</h2>
            {lotes.length > 0 ? (
                <Table hover responsive striped bordered className="mt-3 shadow-sm">
                    <thead className="table-dark">
                        <tr>
                            <th>Seleccionar</th>
                            <th>Id lot</th>
                            <th>Id token lot</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lotes.map((lote, index) => (
                            <tr key={index}>
                                <td>
                                    <Input
                                        type="radio"
                                        name="selectedLotRadio"
                                        value={lote.idToken ? lote.idToken.toString() : ''}
                                        checked={selectedLotId === (lote.idToken ? lote.idToken.toString() : '')}
                                        onChange={handleLotSelect}
                                    />
                                </td>
                                <td>{lote.idLot}</td>
                                <td>{lote.idToken}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                <CardText>No hi ha lots disponibles.</CardText>
            )}
        </Col>
    </Row>

    <Row className="mt-4">
        <Col md={{ size: 10, offset: 1 }}>
            <Form className="p-4 border rounded shadow-sm">
                <FormGroup>
                    <Label for="vacunaSelect">Seleccionar vacuna:</Label>
                    <Input
                        type="select"
                        id="vacunaSelect"
                        value={selectedVacunaId}
                        onChange={(e) => setSelectedVacunaId(e.target.value)}
                    >
                        <option value="">Selecciona una vacuna</option>
                        {vacunas
                            .filter(vacuna => !vacuna.asignadaLot)
                            .map((vacuna, index) => (
                                <option key={index} value={vacuna.idToken}>
                                    {vacuna.idVacuna}
                                </option>
                            ))}
                    </Input>
                </FormGroup>

                {message && <p className="text-info">{message}</p>}

                <Button onClick={transferirVacuna} disabled={!selectedVacunaId || !selectedLotId}>
                    Transferir vacuna
                </Button>
            </Form>
        </Col>
    </Row>
</Container>
    );

}

export default TransferirVacunaLote;