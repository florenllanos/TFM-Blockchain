import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VacunaTK from '../contratos/VacunaTK.json'; // Importa el ABI.

import {Container, Row, Col, Form, FormGroup, Label, Input, Button, Table, CardText} from 'reactstrap';

const adresaContracte = process.env.REACT_APP_VACUNATK; // Adreça contracte.
const abiContracte = VacunaTK.abi;

function VacunaTKForm({ cuenta }) {
    const [idVacuna, setIdVacuna] = useState('');
    const [termolabil, setTermolabil] = useState(false);
    const [tempConservacio, setTempConservacio] = useState(0);
    const [dataCaducitat, setDataCaducitat] = useState('');
    const [contract, setContract] = useState(null);
    const [message, setMessage] = useState('');
    const [vacunas, setVacunas] = useState([]); // Vacunes para mostrar las que es van creant.

    useEffect(() => {
        const initializeContract = async () => {
            if (window.ethereum && cuenta) {
                console.log("Inici contracte");
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const newContract = new ethers.Contract(adresaContracte, abiContracte, signer);
                setContract(newContract);
                
                // Carregar les vacunes existents al carregar el component
                await fetchVacunes(newContract, cuenta);
            } else {
                console.log("Contracte null");
                setContract(null);
            }
        };

        initializeContract();
    }, [cuenta]);

    const fetchVacunes = async (contract, cuenta) => {
        try {
            if (contract && cuenta) {
                const vacunesEmpresa = await contract.getVacunesEmpresa(cuenta);
                setVacunas(vacunesEmpresa);
            }
        } catch (error) {
            console.error("Error obtenint vacunes:", error);
        }
    };

    const mintToken = async (e) => {
        e.preventDefault();
        if (!cuenta) {            
            setMessage("Per favor, connecta el teu wallet.");
            return;
        }

        try {
            setMessage("Registrant vacuna");            
            const tx = await contract.mint(cuenta, idVacuna, termolabil, tempConservacio, dataCaducitat);
            await tx.wait();
            setMessage("Vacuna registrada amb èxit!");
            // Neteja el formulari
            setIdVacuna('');
            setTermolabil(false);
            setTempConservacio(0);
            setDataCaducitat('');

            // Actualitza llistat de vacunes just després de crear una.
            await fetchVacunes(contract, cuenta);

        } catch (error) {
            console.error('Error registrant vacuna:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <Container className="mt-4">
            <Row>
                <Col md={{ size: 6, offset: 3 }}>
                    <h2><i className="bi bi-box-seam me-2"></i>Crear token de vacuna</h2>
                    <Form onSubmit={mintToken} className="p-4 border rounded shadow-sm">
                        <FormGroup>
                            <Label for="idVacuna">ID Vacuna:</Label>
                            <Input
                                type="text"
                                id="idVacuna"
                                value={idVacuna}
                                onChange={(e) => setIdVacuna(e.target.value)}
                                required
                                placeholder="Ej: VAC001"
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="termolabil">Termolàbil:</Label>
                            <Input
                                type="select"
                                id="termolabil"
                                value={termolabil}
                                onChange={(e) => setTermolabil(e.target.value === 'true')}
                            >
                                <option value="false">No</option>
                                <option value="true">Si</option>
                            </Input>
                        </FormGroup>
                        <FormGroup>
                            <Label for="tempConservacio">Temperatura Conservació (°C):</Label>
                            <Input
                                type="number"
                                id="tempConservacio"
                                value={tempConservacio}
                                onChange={(e) => setTempConservacio(e.target.value)}
                                required
                                placeholder="Ej: -70"
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="dataCaducitat">Data Caducitat:</Label>
                            <Input
                                type="date"
                                id="dataCaducitat"
                                value={dataCaducitat}
                                onChange={(e) => setDataCaducitat(e.target.value)}
                                required
                            />
                        </FormGroup>
                        <Button type="submit">Crear vacuna</Button>
                    </Form>
                    {message && <p>{message}</p>}
                </Col>
            </Row>

            <Row className="mt-5">
                <Col>
                    <h2><i className="bi bi-list-task me-2"></i>Vacunes generades (no asignades a lot)</h2>
                    {vacunas.filter(vacuna => !vacuna.asignadaLot).length > 0 ? (
                        <Table hover responsive striped bordered className="mt-3 shadow-sm">
                            <thead className="table-dark">
                                <tr>
                                    <th>ID Vacuna</th>
                                    <th>Termolàbil</th>
                                    <th>Temp. Conservació (°C)</th>
                                    <th>Data caducitat</th>
                                    <th>Administrada</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vacunas
                                    .filter(vacuna => !vacuna.asignadaLot)
                                    .map((vacuna, index) => (
                                        <tr key={index}>
                                            <td>{vacuna.idVacuna}</td>
                                            <td>{vacuna.termolabil ? 'Sí' : 'No'}</td>
                                            <td>{vacuna.tempConservacio}</td>
                                            <td>{vacuna.dataCaducitat}</td>
                                            <td>{vacuna.administrada ? 'Sí' : 'No'}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </Table>
                    ): <CardText>No hi ha vacunes</CardText>}
                </Col>
            </Row>
        </Container>
    );
}

export default VacunaTKForm;