import logo from './logo.svg';
import { useState } from 'react';
import './App.css';
import WalletConnectButton from './components/Wallet';
import VacunaTK from './components/VacunaTK';
import LotTK from './components/LotTK';
import TransferirVacunaLote from './components/TransferirVacunaLote';
import { Routes, Route } from 'react-router-dom';

function App() {
  const [userAccount, setUserAccount] = useState(null);

  const handleConnect = (account) => {
    console.log("Llego al handle", account);    
    if(account != null) {      
      setUserAccount(account);      
    } else {
      setUserAccount(null);
    }    
  };
  
  return (
    <div className="App">
      <WalletConnectButton cuentaConectada={ handleConnect } />
      <Routes>        
        <Route path="/vacuna" element = { <VacunaTK cuenta={ userAccount } /> } />
        <Route path="/lot" element = { <LotTK cuenta={ userAccount } /> } />
        <Route path="/transferir-vacuna-lote" element = { <TransferirVacunaLote cuenta={ userAccount } /> } />
      </Routes>
    </div>
  );
}

export default App;
