import React, { useState, useEffect } from 'react';

import {Container, Row, Col, Button, CardTitle} from 'reactstrap';

function WalletConnectButton({ cuentaConectada }) {
  const [estaConectada, setEstaConectada] = useState(false);
  const [cuenta, setCuenta] = useState(null);  

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Acces a MetaMask
        const cuenta = await window.ethereum.request({ method: 'eth_requestAccounts' });
        cuentaConectada(cuenta[0]);
        setEstaConectada(true);
        setCuenta(cuenta[0]);        
      } catch (error) {
        console.error('Error al connectar a la wallet:', error);
      }
    } else {
      alert('Metamask no instal·lat');
    }
  };


  const disconnectWallet = () => {
    setEstaConectada(false);
    setCuenta(null);
    cuentaConectada(null);
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          {!estaConectada ? (
            <Button onClick={connectWallet}>Connectar Wallet</Button>
          ) : (           
            <><Button onClick={disconnectWallet}>Desconnectar Wallet</Button><CardTitle tag="h5">Connectat amb el compte: {cuenta}</CardTitle></>            
          )}
        </Col>      
        </Row>
    </Container> 
  );
}

export default WalletConnectButton;