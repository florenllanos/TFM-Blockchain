import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CartillaTK from '../contratos/CartillaTK.json'; // Importa el ABI.

import {Container, Row, Col, Form, FormGroup, Label, Input, Button, Table, CardText} from 'reactstrap';

const adresaContracte = process.env.REACT_APP_CARTILLATK; // Adreça contracte.
const abiContracte = CartillaTK.abi;

function CartillaTKForm({ cuenta }) {    
    const [contract, setContract] = useState(null);
    const [message, setMessage] = useState('');
    const [direccionContrato, setDireccionContrato] = useState('');
    const [cipHash, setCipHash] = useState('');

    useEffect(() => {
        const initializeContract = async () => {
            if (window.ethereum && cuenta) {
                console.log("Inici contracte");
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const newContract = new ethers.Contract(adresaContracte, abiContracte, signer);
                setContract(newContract);

            } else {
                console.log("Contracte null");
                setContract(null);
            }
        };

        initializeContract();
    }, [cuenta]);

    const mintToken = async (e) => {        
        e.preventDefault();
        console.log("direccion contrato ", direccionContrato);
        if (!direccionContrato) {            
            setMessage("Ha de indicar el contracte de un pacient.");
            return;
        }

        try {
            setMessage("Generant cartilla");            
            const tx = await contract.mint(direccionContrato, cipHash);
            const res = await tx.wait();

            setMessage(`Cartilla creada i assignada a pacient: ${cipHash}`);
            // Neteja formulari.
            setDireccionContrato('');
            setCipHash('');

        } catch (error) {
            console.error('Error minting token:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    const cambiaContrato = (event) => {
        setDireccionContrato(event.target.value);
    };

    const cambiaCip = (event) => {
        setCipHash(event.target.value);
    };

    return (
        <Container className="mt-4">
            <Row>
                <Col md={{ size: 6, offset: 3 }}>
                    <h2><i className="bi bi-box-seam me-2"></i>Crear cartilla a pacient</h2>
                    <Form onSubmit={mintToken} className="p-4 border rounded shadow-sm">
                        <FormGroup>
                            <Label for="direccionContrato">Adreça contracte destí:</Label>
                            <Input
                                type="text"
                                id="direccionContrato"
                                value={direccionContrato}
                                onChange={cambiaContrato}
                                placeholder="Ej: 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="cipHash">CIP:</Label>
                            <Input
                                type="text"
                                id="cipHash"
                                value={cipHash}
                                onChange={cambiaCip}
                            />
                        </FormGroup>
                        <Button type="submit">Crear cartilla</Button>
                    </Form>
                    {message && <p>{message}</p>}
                </Col>
            </Row>

        </Container>

    );
}

export default CartillaTKForm;