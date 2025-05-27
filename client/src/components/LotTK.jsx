import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LotTK from '../contratos/LotTK.json'; // Importa el ABI.

import {Container, Row, Col, Form, FormGroup, Label, Input, Button, Table, CardText} from 'reactstrap';

const adresaContracte = process.env.REACT_APP_LOTTK;
const abiContracte = LotTK.abi;

function LotTKForm({ cuenta }) {
    const [idLot, setIdLot] = useState('');
    const [fabricant, setFabricant] = useState('');
    const [nomLot, setNomLot] = useState('');
    const [dataFabricacio, setDataFabricacio] = useState('');
    const [contract, setContract] = useState(null);
    const [message, setMessage] = useState('');
    const [lots, setLots] = useState([]); // Lots, per mostrar els que es van creant.

    useEffect(() => {
        const initializeContract = async () => {
            if (window.ethereum && cuenta) {
                console.log("Inici contracte");
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const newContract = new ethers.Contract(adresaContracte, abiContracte, signer);
                setContract(newContract);
                
                // Carregar les vacunes existents al carregar el component
                await fetchLotsEmpresa(newContract, cuenta);
            } else {
                console.log("Contracte null");
                setContract(null);
            }
        };

        initializeContract();
    }, [cuenta]);

    const fetchLotsEmpresa = async (contract, cuenta) => {
        try {
            if (contract && cuenta) {
                const lotsEmpresa = await contract.getLotsEmpresa(cuenta);                
                setLots(lotsEmpresa);                
            }
        } catch (error) {
            console.error("Error obtenint lots:", error);
        }
    };

    const mintToken = async (e) => {
        e.preventDefault();
        if (!cuenta) {            
            setMessage("Per favor, connecta el teu wallet.");
            return;
        }

        try {
            setMessage("Creant lot");            
            const tx = await contract.mint(cuenta, idLot, fabricant, nomLot, dataFabricacio);
            await tx.wait();
            setMessage("Lot creat amb èxit!");
            // Neteja formulari
            setIdLot('');
            setFabricant('');
            setNomLot('');
            setDataFabricacio('');
            
            await fetchLotsEmpresa(contract, cuenta);

        } catch (error) {
            console.error('Error creant el lot:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <Container className="mt-4">
            <Row>
                <Col md={{ size: 6, offset: 3 }}>
                    <h2><i className="bi bi-box-seam me-2"></i>Crear token de lot</h2>
                    <Form onSubmit={mintToken} className="p-4 border rounded shadow-sm">
                        <FormGroup>
                            <Label for="idLot">ID Lot:</Label>
                            <Input
                                type="text"
                                id="idLot"
                                value={idLot}
                                onChange={(e) => setIdLot(e.target.value)}
                                required
                                placeholder="Ej: LOT001"
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="fabricant">Fabricant:</Label>
                            <Input
                                type="text"
                                id="fabricant"
                                value={fabricant}
                                onChange={(e) => setFabricant(e.target.value)}
                                required                                
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="nomLot">Nom lot:</Label>
                            <Input
                                type="text"
                                id="nomLot"
                                value={nomLot}
                                onChange={(e) => setNomLot(e.target.value)}
                                required                                
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="dataFabricacio">Data fabricació:</Label>
                            <Input
                                type="date"
                                id="dataFabricacio"
                                value={dataFabricacio}
                                onChange={(e) => setDataFabricacio(e.target.value)}
                                required
                            />
                        </FormGroup>
                        <Button type="submit">Crear lot</Button>
                    </Form>
                    {message && <p>{message}</p>}
                </Col>
            </Row>

            <Row className="mt-5">
                <Col>
                    <h2><i className="bi bi-list-task me-2"></i>Lots generats</h2>
                    {lots.length > 0 ? (                    
                        <Table hover responsive striped bordered className="mt-3 shadow-sm">
                            <thead className="table-dark">
                                <tr>
                                    <th>ID Lot</th>
                                    <th>Fabricant</th>
                                    <th>Nom lot</th>
                                    <th>Data fabricació</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lots.map((lot, index) => (
                                    <tr key={index}>
                                        <td>{lot.idLot}</td>
                                        <td>{lot.fabricant}</td>
                                        <td>{lot.nomLot}</td>
                                        <td>{lot.dataFabricacio}</td>
                                     </tr>
                                ))}  
                            </tbody>
                        </Table>
                    ) : <CardText>No hi ha lots</CardText>}
                    </Col>
             </Row>
        </Container>
    );
}

export default LotTKForm;