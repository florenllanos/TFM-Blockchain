import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VacunaTK from '../contratos/VacunaTK.json';
import LotTK from '../contratos/LotTK.json';
import { padLeft32Zero } from '../utils/Utils.js';

const vacunaContractAddress = process.env.REACT_APP_VACUNATK; // Contracte de VacunaTK
const vacunaContractABI = VacunaTK.abi;

const lotContractAddress = process.env.REACT_APP_LOTTK; // Contracte de LotTK
const lotContractABI = LotTK.abi;

function TransferirVacunaLote({ cuenta }) {
    const [vacunaContract, setVacunaContract] = useState(null);
    const [lotContract, setLotContract] = useState(null);
    const [vacunas, setVacunas] = useState([]);
    const [lotes, setLotes] = useState([]);
    const [selectedVacunaId, setSelectedVacunaId] = useState('');
    const [selectedLotId, setSelectedLotId] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const initializeContracts = async () => {
            if (window.ethereum && cuenta) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();

                const vacunaTKContract = new ethers.Contract(vacunaContractAddress, vacunaContractABI, signer);
                setVacunaContract(vacunaTKContract);

                const lotTKContract = new ethers.Contract(lotContractAddress, lotContractABI, signer);
                setLotContract(lotTKContract);

                await fetchVacunas(vacunaTKContract, cuenta);
                await fetchLotes(lotTKContract, cuenta);

            } else {
                setVacunaContract(null);
                setLotContract(null);
            }
        };

        initializeContracts();
    }, [cuenta]);

    const fetchVacunas = async (contract, account) => {
        try {
            if (contract && account) {
                const vacunasEmpresa = await contract.getVacunesEmpresa(account);
                console.log("Vacunas empresa: ", vacunasEmpresa.idToken);
                setVacunas(vacunasEmpresa);
            }
        } catch (error) {
            console.error("Error obtenint vacunes:", error);
        }
    };

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


    const transferirVacuna = async () => {
        /*if (!vacunaContract || !lotContract || !selectedVacunaId || !selectedLotId) {
            setMessage("Por favor, selecciona una vacuna y un lote.");
            return;
        }*/

        try {
            setMessage("Transfiriendo vacuna...");
            const tx = await vacunaContract["safeTransferFrom(address,address,uint256,bytes)"](
                cuenta,
                lotContractAddress,
                selectedVacunaId,
                padLeft32Zero(selectedLotId, 16)
            );
            await tx.wait();
            setMessage(`Vacuna ${selectedVacunaId} transferida al Lote ${selectedLotId} con éxito!`);

            // Actualizar las listas después de la transferencia
            await fetchVacunas(vacunaContract, cuenta);
            await fetchLotes(lotContract, cuenta);
        } catch (error) {
            console.error("Error al transferir la vacuna:", error);
            setMessage(`Error: ${error.message}`);
        }
    };

    /* "Genera" a 32 posicions (0 a l'esquerra) el número de lot.
    */
    /*const padLeft32Zero = (valor, longitud) => {
        let numHex = ethers.toBeHex(valor);
        const longDesitjada = longitud * 2;
        const paddingLong = longDesitjada - (numHex.length - 2);
        const padding = "0".repeat(Math.max(0, paddingLong));
        const paddedHexString = "0x" + padding + numHex.slice(2);

        return paddedHexString;
    }*/

    return (
        <div>
            <h2>Transferir Vacuna a Lote</h2>

            <div>
                <label>Seleccionar Vacuna:</label>
                <select value={selectedVacunaId} onChange={(e) => setSelectedVacunaId(e.target.value)}>
                    <option value="">Selecciona una vacuna</option>
                    {vacunas.map((vacuna, index) => (                        
                        <option key={index} value={vacuna.idToken}>
                            {vacuna.idVacuna}
                        </option>
                    ))}
                </select>
            </div>

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

            <button onClick={transferirVacuna}>Transferir Vacuna</button>

            {message && <p>{message}</p>}
        </div>
    );
}

export default TransferirVacunaLote;