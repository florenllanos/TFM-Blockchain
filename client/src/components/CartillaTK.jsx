import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CartillaTK from '../contratos/CartillaTK.json'; // Importa el ABI.

const adresaContracte = process.env.REACT_APP_CARTILLATK; // Adreça contracte.
const abiContracte = CartillaTK.abi;

function CartillaTKForm({ cuenta }) {
    const [idCartilla, setIdCartilla] = useState('');
    const [contract, setContract] = useState(null);
    const [message, setMessage] = useState('');
    const [direccionContrato, setDireccionContrato] = useState('');
    const [cipHash, setCipHash] = useState('');

    useEffect(() => {
        const initializeContract = async () => {
            if (window.ethereum && cuenta) {
                console.log("Inici contracte");
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const newContract = new ethers.Contract(adresaContracte, abiContracte, signer);
                setContract(newContract);
                
                // Carregar les vacunes existents al carregar el component
                //await fetchVacunes(newContract, cuenta);
            } else {
                console.log("Contracte null");
                setContract(null);
            }
        };

        initializeContract();
    }, [cuenta]);

    /*const fetchVacunes = async (contract, cuenta) => {
        try {
            if (contract && cuenta) {
                const vacunesEmpresa = await contract.getVacunesEmpresa(cuenta);
                setVacunas(vacunesEmpresa);
            }
        } catch (error) {
            console.error("Error obtenint vacunes:", error);
        }
    };*/

    const mintToken = async (e) => {
        console.log("Hemos hecho submit del formulario");
        e.preventDefault();
        if (!direccionContrato) {
            console.log("direccionContrato ", direccionContrato);
            setMessage("Ha de indicar el contracte de un pacient.");
            return;
        }

        try {
            setMessage("Minting token...");            
            const tx = await contract.mint(direccionContrato, cipHash);
            await tx.wait();            
            setMessage("Token minted successfully!! ");
            // Limpiar el formulario
            setDireccionContrato('');
            setCipHash('');

            // Actualizamos el listado de vacunas justo después de crear una.
            //await fetchVacunes(contract, cuenta);

        } catch (error) {
            console.error('Error minting token:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    const cambiaContrato = (event) => {
        setDireccionContrato(event.target.value);
    };

    const cambiaCip = (event) => {
        setCipHash(event.target.value);
    };

    return (
        <div>
            <h2>Creat cartilla a pacient</h2>
            <form onSubmit={mintToken}>
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
                    <label htmlFor="cipHash">CIP:</label>
                        <input
                        type="text"
                        id="cipHash"
                        value={cipHash}
                        onChange={cambiaCip}
                        />
                </div>
                <button type="submit">Mint Token</button>
            </form>
            {message && <p>{message}</p>}            
        </div>
    );
}

export default CartillaTKForm;