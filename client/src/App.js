import logo from './logo.svg';
import { useState } from 'react';
import './App.css';
import WalletConnectButton from './components/Wallet';
import VacunaTK from './components/VacunaTK';
import LotTK from './components/LotTK';
import TransferirVacunaLote from './components/TransferirVacunaLote';
import TransferirLote from './components/TransferirLote';
import PermisInfermera from './components/PermisInfermera';
import CartillaTK from './components/CartillaTK';
import CartillaPacient from './components/CartillaPacient';
import LotCentre from './components/LotCentre';
import { Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Capcelera from './components/Capcelera';

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
      <Capcelera />
      <WalletConnectButton cuentaConectada={ handleConnect } />    
      
      <Routes>        
        <Route path="/" element = { <VacunaTK cuenta={ userAccount } /> } />
        <Route path="/lot" element = { <LotTK cuenta={ userAccount } /> } />
        <Route path="/transferir-vacuna-lot" element = { <TransferirVacunaLote cuenta={ userAccount } /> } />
        <Route path="/transferir-lot" element = { <TransferirLote cuenta={ userAccount } /> } />
        <Route path="/permis-infermera" element = { <PermisInfermera cuenta={ userAccount } /> } />
        <Route path="/cartilla" element = { <CartillaTK cuenta={ userAccount } /> } />
        <Route path="/cartilla-pacient" element = { <CartillaPacient cuenta={ userAccount } /> } />
        <Route path="/lot-centre" element = { <LotCentre cuenta={ userAccount } /> } />
      </Routes>      
    </div>
    
  );
  
}

export default App;
