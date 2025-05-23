import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CartillaTK from '../contratos/CartillaTK.json';

const cartillaContractAddress = process.env.REACT_APP_CARTILLATK; // Contracte de CartillaTK
const cartillaContractABI = CartillaTK.abi;

function CartillaPacient({ cuenta }) {
    const [cartillaContract, setCartillaContract] = useState(null);
    const [permisoBool, setPermisoBool] = useState(false);
    //const [selectedLotId, setSelectedLotId] = useState('');
    const [direccionContrato, setDireccionContrato] = useState('');
    const [cartillaPacient, setCartillaPacient] = useState('');
    const [vacunesPacient, setVacunesPacient] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const initializeContract = async () => {
            if (window.ethereum && cuenta) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();

                const cartillaTKContract = new ethers.Contract(cartillaContractAddress, cartillaContractABI, signer);
                setCartillaContract(cartillaTKContract);

                await fetchVacunesPacient(cartillaContract, cuenta);

            } else {
                setCartillaContract(null);
            }
        };

        initializeContract();
    }, [cuenta]);

    /*const fetchLotes = async (contract, account) => {
        try {
            if (contract && account) {
                const lotesEmpresa = await contract.getLotsEmpresa(account);
                console.log("Vacunas empresa: ", lotesEmpresa.idLot);
                setLotes(lotesEmpresa);
            }
        } catch (error) {
            console.error("Error obtenint lots:", error);
        }
    };*/

    const fetchVacunesPacient = async (contract, account) => {
        try {
            if (contract && account) {
                console.log("FetchVacunesPacient", account);
                const cartilla = await contract.getCartillaPacient(account);                
                setCartillaPacient(cartilla);
                console.log("Cartilla del pacient (idToken): ", cartillaPacient.idToken);

                const vacunesPacient = await contract.getDadesVacunesCartilla(cartillaPacient.idToken);
                setVacunesPacient(vacunesPacient);  
            }
        } catch (error) {
            console.error("Error obtenint Cartilla per el pacient:", error);
        }
    };

    const permisCartilla = async (event) => {
        /*if (!direccionContrato) {
            setMessage("Seleccioni un compte");
            return;
        }*/
        console.log("Llego a permisCartilla");
        const checked = event.target.checked;
        try {
            //setMessage("Donant permisos...");
            let tx;
            let missatge;
            if(checked) {
                tx = await cartillaContract.setPermisAdministrar(cartillaPacient.idToken);
                missatge = "Permisos concedits";                
            } else {
                tx = await cartillaContract.setNoPermisAdministrar(cartillaPacient.idToken);
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

    /*const cambioPermiso = (event) => {
        const nuevoValor = event.target.checked;
        setPermisoBool(nuevoValor);
    };*/

    return (
        <div>
            <h2>Vacunes pacient</h2>
            <div>
                <label htmlFor="direccionContrato">Dirección del Contrato Destino:</label>
                    <input
                      type="text"
                      id="direccionContrato"
                      value={direccionContrato}
                      onChange={cambiaContrato}
                      placeholder="Ej: 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
                    />
            </div>
            <div>
                <label>
                    <input
                    type="checkbox"
                    checked={permisoBool}
                    onChange={permisCartilla}
                    />
                </label>
            </div>
            {/*<button onClick={permisCartilla}>Permís registre vacuna</button>*/}

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