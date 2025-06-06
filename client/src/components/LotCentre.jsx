import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VacunaTK from '../contratos/VacunaTK.json';
import LotTK from '../contratos/LotTK.json';
import CartillaTK from '../contratos/CartillaTK.json';
import { padLeft32Zero } from '../utils/Utils.js';

import {Container, Row, Col, Form, FormGroup, Label, Input, Button, Table, CardText} from 'reactstrap';

const vacunaContractAddress = process.env.REACT_APP_VACUNATK; // Contracte de VacunaTK
const vacunaContractABI = VacunaTK.abi;

const lotContractAddress = process.env.REACT_APP_LOTTK; // Contracte de LotTK
const lotContractABI = LotTK.abi;

const cartillaContractAddress = process.env.REACT_APP_CARTILLATK // Contracte de CartillaTK.
const cartillaContractABI = CartillaTK.abi;

function LotCentre({ cuenta }) {
    console.log("Lot centre");
    const [vacunaContract, setVacunaContract] = useState(null);
    const [lotContract, setLotContract] = useState(null);
    const [vacunas, setVacunas] = useState([]);
    const [lotes, setLotes] = useState([]);
    const [selectedVacunaId, setSelectedVacunaId] = useState('');
    const [selectedLotId, setSelectedLotId] = useState('');
    const [lots, setLots] = useState([]);
    const [selectedVacunaToAdminister, setSelectedVacunaToAdminister] = useState('');
    const [idTokenPacient, setIdTokenPacient] = useState('');
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

                await fetchLotes(lotTKContract, cuenta);

            } else {
                setVacunaContract(null);
                setLotContract(null);
            }
        };

        initializeContracts();
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

    const fetchVacunesLote = async (idTokenLot) => {
        setSelectedLotId(idTokenLot);
        if (lotContract && cuenta) {
            try {
                console.log("Abans de getVacunesEmpresa2: ", idTokenLot);
                const vacunasData = await lotContract.getDadesVacunesLot(idTokenLot);
                setVacunas(vacunasData);
                console.log("Després de getVacunesEmpresa");
            } catch (err) {
                console.error("Error al obtener los recursos:", err);
                //setError(err.message || "No se pudieron obtener los recursos");
            }
        }
    };

    const handleVacunaSelection = (event) => {
        setSelectedVacunaToAdminister(event.target.value);
    };

    const handleIdTokenPacientChange = (event) => {
        setIdTokenPacient(event.target.value);
    };

    const administerVacuna = async () => {
        if (!selectedVacunaToAdminister) {
            setMessage("Por favor, selecciona una vacuna para administrar.");
            return;
        }

        if (!lotContract) {
            setMessage("El contrato de lote no está inicializado.");
            return;
        }

        try {
            setMessage("Administrando vacuna...");
            // idTokenPadre, adresaDest, contracteFill, idTokenFill, _dataIdTokenDesti
            console.log("Id token paciente ", padLeft32Zero(idTokenPacient, 16));
            const tx = await lotContract["safeTransferChild(uint256,address,address,uint256,bytes)"](
                selectedLotId, 
                cartillaContractAddress, 
                vacunaContractAddress, 
                selectedVacunaToAdminister,
                padLeft32Zero(idTokenPacient, 16)
            );
            await tx.wait();
            setMessage(`Vacuna ${selectedVacunaToAdminister} administrada exitosamente del lote ${selectedLotId}.`);
            // Actualizar la lista de vacunas después de la administración
            await fetchVacunesLote(selectedLotId);
            setSelectedVacunaToAdminister(''); // Limpiar la selección
        } catch (error) {
            console.error("Error al administrar la vacuna:", error);
            setMessage(`Error al administrar la vacuna: ${error.message}`);
        }
    };

    return (
        <Container className="mt-4">
            <Row>
                <Col md={{ size: 10, offset: 1 }}>
                    <h2><i className="bi bi-archive me-2"></i>Gestió de lots i vacunes</h2>
                    <Form className="p-4 border rounded shadow-sm mb-4">
                        <FormGroup>
                            <Label for="lotSelect">Seleccionar lot:</Label>
                            <Input
                                type="select"
                                id="lotSelect"
                                value={selectedLotId}
                                onChange={(e) => fetchVacunesLote(e.target.value)}
                            >
                                <option value="">Selecciona un lot</option>
                                {lotes.map((lote, index) => (
                                    <option key={index} value={lote.idToken}>
                                        {lote.idLot}
                                    </option>
                                ))}
                            </Input>
                        </FormGroup>
                    </Form>

                    <h3><i className="bi bi-capsule me-2"></i>Vacunes</h3>
                    {vacunas.length > 0 ? (
                        <Table hover responsive striped bordered className="shadow-sm">
                            <thead className="table-dark">
                                <tr>
                                    <th>Sel.</th>
                                    <th>ID token</th>
                                    <th>ID Vacuna</th>
                                    <th>Termolàbil</th>
                                    <th>Temp. Conservació</th>
                                    <th>Caducitat</th>
                                    <th>Assignada a Lote</th>
                                    <th>Administrada</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vacunas
                                    .filter(vacuna => vacuna.idVacunaToken != 0)
                                    .map((vacuna, index) => (
                                        <tr key={index}>
                                            <td>
                                                <Input
                                                    type="radio"
                                                    name="administerVacuna"
                                                    value={vacuna.idVacunaToken}
                                                    checked={selectedVacunaToAdminister === vacuna.idVacunaToken.toString()}
                                                    onChange={handleVacunaSelection}
                                                />
                                            </td>
                                            <td>{vacuna.idVacunaToken}</td>
                                            <td>{vacuna.vacuna.idVacuna}</td>
                                            <td>{vacuna.vacuna.termolabil ? "Sí" : "No"}</td>
                                            <td>{vacuna.vacuna.tempConservacio}</td>
                                            <td>{vacuna.vacuna.dataCaducitat}</td>
                                            <td>{vacuna.vacuna.asignadaLot ? "Sí" : "No"}</td>
                                            <td>{vacuna.vacuna.administrada ? "Sí" : "No"}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </Table>
                    ) : (
                        <p className="text-muted">No hi ha vacunes disponibles al lot seleccionat.</p>
                    )}

                    {vacunas.length > 0 && (
                        <Form className="p-4 border rounded shadow-sm mt-4">
                            <FormGroup>
                                <Label for="idTokenPacientInput">ID Token Pacient (per a `_dataIdTokenDesti`):</Label>
                                <Input
                                    type="text"
                                    id="idTokenPacientInput"
                                    value={idTokenPacient}
                                    onChange={handleIdTokenPacientChange}
                                    placeholder="Ej: 1 o 0x..."
                                />
                            </FormGroup>

                            <Button
                                onClick={administerVacuna}
                                disabled={!selectedVacunaToAdminister}
                            >
                                Administrar Vacuna Seleccionada
                            </Button>
                        </Form>
                    )}
                </Col>
            </Row>
        </Container>

    );
}

export default LotCentre;