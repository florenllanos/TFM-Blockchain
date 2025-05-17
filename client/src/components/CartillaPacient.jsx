import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CartillaTK from '../contratos/CartillaTK.json';

const lotContractAddress = process.env.REACT_APP_CARTILLATK; // Contracte de CartillaTK
const lotContractABI = CartillaTK.abi;

function CartillaPacient({ cuenta }) {
    const [cartillaContract, setCartillaContract] = useState(null);
    const [permisoBool, setPermisoBool] = useState("false");
    //const [selectedLotId, setSelectedLotId] = useState('');
    const [direccionContrato, setDireccionContrato] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const initializeContract = async () => {
            if (window.ethereum && cuenta) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();

                const cartillaTKContract = new ethers.Contract(cartillaContractAddress, cartillaContractABI, signer);
                setLotContract(cartillaTKContract);

                //await fetchLotes(lotTKContract, cuenta);

            } else {
                setLotContract(null);
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

    const permisCartilla = async () => {
        /*if (!direccionContrato) {
            setMessage("Seleccioni un compte");
            return;
        }*/

        try {
            //setMessage("Donant permisos...");

            const tx = await cartillaContract.setApprovalForAll(direccionContrato,permisoBool);
            await tx.wait();
            setMessage('Permisos concedits');

            // Actualizar las listas después de la transferencia
            //await fetchLotes(lotContract, cuenta);
        } catch (error) {
            console.error("Error al transferir el lote:", error);
            setMessage(`Error: ${error.message}`);
        }
    };

    const cambiaContrato = (event) => {
        setDireccionContrato(event.target.value);
    };

    const cambioPermiso = (event) => {
        const nuevoValor = event.target.checked;
        setPermisoBool(nuevoValor);
  };

    return (
        <div>
            <h2>Permiso enfermera</h2>
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
                    onChange={cambioPermiso}
                    />
                </label>
            </div>
            <button onClick={permisVacunesLot}>Transferir Lot</button>

            {message && <p>{message}</p>}
        </div>
    );
}

export default CartillaPacient;