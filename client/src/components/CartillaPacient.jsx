import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CartillaTK from '../contratos/CartillaTK.json';

import {Container, Row, Col, Form, FormGroup, Label, Input, Button, Table, CardText} from 'reactstrap';

const cartillaContractAddress = process.env.REACT_APP_CARTILLATK; // Contracte de CartillaTK
const cartillaContractABI = CartillaTK.abi;

function CartillaPacient({ cuenta }) {
    const [cartillaContract, setCartillaContract] = useState(null);
    const [permisoBool, setPermisoBool] = useState(false);    
    const [direccionContrato, setDireccionContrato] = useState('');
    const [cartillaPacient, setCartillaPacient] = useState('');
    const [vacunesPacient, setVacunesPacient] = useState([]);    
    const [message, setMessage] = useState('');    

    useEffect(() => {
        const initializeContract = async () => {
            console.log("Esto es lo primero que hago");
            if (window.ethereum && cuenta) {
                console.log("Esto es lo primero que hago cuando tengo la sign y la cuenta");
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();

                const cartillaTKContract = new ethers.Contract(cartillaContractAddress, cartillaContractABI, signer);
                setCartillaContract(cartillaTKContract);

                await fetchPermisCartillaPacient(cartillaTKContract, cuenta);
                await fetchVacunesPacient(cartillaTKContract, cuenta);

            } else {
                setCartillaContract(null);
            }
        };

        initializeContract();
    }, [cuenta]);

    const fetchVacunesPacient = async (contract, account) => {
        try {
            if (contract && account) {                
                const cartilla = await contract.getCartillaPacient(account);                
                setCartillaPacient(cartilla);                

                const vacunesPacient = await contract.getDadesVacunesCartilla(cartilla.idToken);
                setVacunesPacient(vacunesPacient);  
            }
        } catch (error) {
            console.error("Error obtenint Cartilla per el pacient:", error);
        }
    };

    const fetchPermisCartillaPacient = async (contract, account) => {
        try {
            console.log("Accedeixo a permis");
            if (contract && account) {
                console.log("Dintre permís");                
                const cartilla = await contract.getCartillaPacient(account);                
                setPermisoBool(cartilla.permisAdministrar);
                console.log("Permis ", cartilla.permisAdministrar);                
            }
        } catch (error) {
            console.error("Error obtenint l'estat de la cartilla:", error);
        }
    };

    const permisCartilla = async (event) => {
        const checked = event.target.checked;
        try {
            let tx;
            let missatge;            
            tx = await cartillaContract.setPermisAdministrar(cuenta, checked);
            if(checked) {
                missatge = "Permisos concedits";                
            } else {
                missatge = "Permisos no concedits";
            }
            
            await tx.wait();
            setMessage(missatge);
            setPermisoBool(checked);

        } catch (error) {            
            setMessage(`Error: ${error.message}`);
        }
    };

  return (
    <Container className="mt-4">
      <Row>
        <Col md={{ size: 8, offset: 2 }}>
          <Form className="p-4 border rounded shadow-sm">
            <FormGroup check className="mb-3">
              <Label check>
                <Input
                  type="checkbox"
                  id="permisoBool"
                  checked={permisoBool}
                  onChange={permisCartilla}
                  className="me-2"
                />
                Permís per la cartilla
              </Label>
            </FormGroup>
    
            {message && <p>{message}</p>}
          </Form>
        </Col>
      </Row>
    
      <Row className="mt-5">
        <Col md={{ size: 10, offset: 1 }}>
          <h2>
            <i className="bi bi-shield-fill me-2"></i>Vacunes administrades
          </h2>
    
          {vacunesPacient.length > 0 ? (
            <Table hover responsive striped bordered className="mt-3 shadow-sm">
              <thead className="table-dark">
                <tr>
                  <th>Contracte vacuna</th>
                  <th>Id vacuna Token</th>
                  <th>Id Vacuna</th>
                  <th>Termolàbil</th>
                  <th>Temp. conservació</th>
                  <th>Data Caducidad</th>
                </tr>
              </thead>
              <tbody>
                {vacunesPacient.map((vacuna, index) => (
                  <tr key={index}>
                    <td>{vacuna.contracteVacuna}</td>
                    <td>{vacuna.idVacunaToken}</td>
                    <td>{vacuna.vacuna.idVacuna}</td>
                    <td>{vacuna.vacuna.termolabil ? 'Sí' : 'No'}</td>
                    <td>{vacuna.vacuna.tempConservacio}</td>
                    <td>{vacuna.vacuna.dataCaducitat}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <CardText className="text-muted">No hi ha vacunes administrades.</CardText>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default CartillaPacient;