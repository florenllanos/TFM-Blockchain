import React, { useState } from 'react';

function WalletConnectButton() {
  const [estaConectada, setEstaConectada] = useState(false);
  const [cuenta, setCuenta] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Acces a MetaMask
        const cuenta = await window.ethereum.request({ method: 'eth_requestAccounts' });
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