import React, { useState, useEffect } from 'react';

function WalletConnectButton({ cuentaConectada }) {
  const [estaConectada, setEstaConectada] = useState(false);
  const [cuenta, setCuenta] = useState(null);
  console.log("Dentro de WalletConnectButton");

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Acces a MetaMask
        const cuenta = await window.ethereum.request({ method: 'eth_requestAccounts' });
        cuentaConectada(cuenta[0]);
        console.log("Cuenta conectada; ", cuentaConectada);
        setEstaConectada(true);
        setCuenta(cuenta[0]);
        console.log('Connectat:', cuenta[0]);
      } catch (error) {
        console.error('Error al conenctar a la wallet:', error);
      }
    } else {
      alert('Metamask no instal·lat');
    }
  };


  const disconnectWallet = () => {
    setEstaConectada(false);
    setCuenta(null);
    cuentaConectada(null);
    console.log("Cuenta conectada; ", cuentaConectada);
    console.log('Wallet desconectada');
  };

  return (
    <div>
      {!estaConectada ? (
        <button onClick={connectWallet}>Connectar Wallet</button>
      ) : (
        <div>
          <p>Conectado con la cuenta: {cuenta}</p>
          <button onClick={disconnectWallet}>Desconnectar Wallet</button>
        </div>
      )}
    </div>
  );
}

export default WalletConnectButton;