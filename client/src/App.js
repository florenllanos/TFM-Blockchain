import logo from './logo.svg';
import { useState } from 'react';
import './App.css';
import WalletConnectButton from './components/Wallet';
import VacunaTK from './components/VacunaTK';

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
      <VacunaTK cuenta={ userAccount } />
    </div>
  );
}

export default App;
