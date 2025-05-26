import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CartillaTK from '../contratos/CartillaTK.json';

const cartillaContractAddress = process.env.REACT_APP_CARTILLATK; // Contracte de CartillaTK
const cartillaContractABI = CartillaTK.abi;

function CartillaPacient({ cuenta }) {
    const [cartillaContract, setCartillaContract] = useState(null);
    const [permisoBool, setPermisoBool] = useState(false);    
    const [direccionContrato, setDireccionContrato] = useState('');
    const [cartillaPacient, setCartillaPacient] = useState('');
    const [vacunesPacient, setVacunesPacient] = useState([]);
    //const [permisCartillaPacient, setPermisCartillaPacient] = useState(false);
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
                console.log("FetchVacunesPacient", account);
                const cartilla = await contract.getCartillaPacient(account);                
                setCartillaPacient(cartilla);
                console.log("Cartilla del pacient (idToken): ", cartilla.idToken);

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
        /*if (!direccionContrato) {
            setMessage("Seleccioni un compte");
            return;
        }*/
        console.log("Llego a permisCartilla");
        const checked = event.target.checked;
        console.log("Miro si es checked");
        try {
            //setMessage("Donant permisos...");
            let tx;
            let missatge;
            console.log("Dentro del try del checked ", );
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
            console.error("Error al transferir el lote:", error);
            setMessage(`Error: ${error.message}`);
        }
    };

    const cambiaContrato = (event) => {
        setDireccionContrato(event.target.value);
    };

    return (
        <div>
            <div>
                <label>
                    <input
                    type="checkbox"
                    id="permisoBool"
                    checked={permisoBool}
                    onChange={permisCartilla}
                    />
                </label>
            </div>            

            {message && <p>{message}</p>}

            {/* Taula de vacunes per al pacient */}
            <h2>Vacunes administrades</h2>
            <table>
                <thead>
                    <tr>
                        <th>Constracte Vacuna</th>
                        <th>Id Vacuna</th>
                        <th>Id Token Vacuna</th>
                        <th>Id Vacuna</th>
                        <th>Termolabil</th>
                        <th>Temp conservació</th>
                        <th>Data caducitat</th>
                        <th>Asignada lot</th>
                        <th>Administrada</th>
                    </tr>
                </thead>
                <tbody>
                    {vacunesPacient.map((vacuna, index) => (
                        <tr key={index}>
                            <td>{vacuna.contracteVacuna}</td>
                            <td>{vacuna.idVacunaToken}</td>
                            <td>{vacuna.vacuna.idToken}</td>
                            <td>{vacuna.vacuna.idVacuna}</td>
                            <td>{vacuna.vacuna.termolabil}</td>
                            <td>{vacuna.vacuna.tempConservacio}</td>
                            <td>{vacuna.vacuna.dataCaducitat}</td>
                            <td>{vacuna.vacuna.asignadaLot}</td>
                            <td>{vacuna.vacuna.administrada}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default CartillaPacient;