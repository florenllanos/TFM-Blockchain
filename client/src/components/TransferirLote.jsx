import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LotTK from '../contratos/LotTK.json';

const lotContractAddress = process.env.REACT_APP_LOTTK; // Contracte de LotTK
const lotContractABI = LotTK.abi;

function TransferirLote({ cuenta }) {
    const [lotContract, setLotContract] = useState(null);
    const [lotes, setLotes] = useState([]);
    const [selectedLotId, setSelectedLotId] = useState('');
    const [direccionContrato, setDireccionContrato] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const initializeContract = async () => {
            if (window.ethereum && cuenta) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();

                const lotTKContract = new ethers.Contract(lotContractAddress, lotContractABI, signer);
                setLotContract(lotTKContract);

                await fetchLotes(lotTKContract, cuenta);

            } else {
                setLotContract(null);
            }
        };

        initializeContract();
    }, [cuenta]);

    const fetchLotes = async (contract, account) => {
        try {
            if (contract && account) {
                const lotesEmpresa = await contract.getLotsEmpresa(account);
                console.log("Vacunas empresa: ", lotesEmpresa.idLot);
                setLotes(lotesEmpresa);
            }
        } catch (error) {
            console.error("Error obtenint lots:", error);
        }
    };

    const transferirLot = async () => {
        if (!lotContract || !selectedLotId) {
            setMessage("Por favor, selecciona un lote.");
            return;
        }

        try {
            setMessage("Transfiriendo lote...");

            const tx = await lotContract.transferFrom(cuenta,direccionContrato,selectedLotId);
            await tx.wait();
            setMessage(`Lot ${selectedLotId} transferit amb èxit a ${direccionContrato} !`);
            console.log("Dirección origen ", cuenta);
            console.log("Dirección destino ", direccionContrato);
            console.log("Lote transferido ", selectedLotId);

            // Actualizar las listas después de la transferencia
            await fetchLotes(lotContract, cuenta);
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
            <h2>Transferir Lote</h2>
            <div>
                <label>Seleccionar Lote:</label>
                <select value={selectedLotId} onChange={(e) => setSelectedLotId(e.target.value)}>
                    <option value="">Selecciona un lote</option>
                    {lotes.map((lote, index) => (
                        <option key={index} value={lote.idToken}>
                            {lote.idLot}
                        </option>
                    ))}
                </select>
            </div>
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

            <button onClick={transferirLot}>Transferir Lot</button>

            {message && <p>{message}</p>}
        </div>
    );
}

export default TransferirLote;