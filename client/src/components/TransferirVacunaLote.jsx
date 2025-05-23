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
                console.log("vacuna sin asignar a lot ", vacunasEmpresa.filter(vacuna => !vacuna.asignadaLot));
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

    const handleLotSelectionChange = (event) => {
        setSelectedLotId(event.target.value);
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

    return (
        <div>
            <h2>Transferir Vacuna a Lote</h2>
            {/*<div>
                <label>Seleccionar Lote:</label>
                <select value={selectedLotId} onChange={(e) => setSelectedLotId(e.target.value)}>
                    <option value="">Selecciona un lote</option>
                    {lotes.map((lote, index) => (
                        <option key={index} value={lote.idToken}>
                            {lote.idLot}
                        </option>
                    ))}
                </select>
            </div>*/}

            <div style={{ marginTop: '20px' }}>
                <h4>Seleccionar Lote de Destino:</h4>
                {lotes.length > 0 ? (
                    <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Seleccionar</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>ID Lote (Nombre/Etiqueta)</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>ID Token del Lote</th>
                                {/* Puedes añadir más columnas con detalles del lote si es necesario */}
                            </tr>
                        </thead>
                        <tbody>
                            {lotes.map((lote) => (
                                // Asumiendo que cada 'lote' tiene 'idToken' como valor único y 'idLot' como display
                                <tr key={lote.idToken ? lote.idToken.toString() : lote.idLot.toString()}>
                                    <td style={{ padding: '8px' }}>
                                        <input
                                            type="radio"
                                            name="selectedLotRadio" // Nombre común para agrupar los radio buttons
                                            value={lote.idToken ? lote.idToken.toString() : ''}
                                            checked={selectedLotId === (lote.idToken ? lote.idToken.toString() : '')}
                                            onChange={handleLotSelectionChange}
                                        />
                                    </td>
                                    <td style={{ padding: '8px' }}>{lote.idLot ? lote.idLot.toString() : 'N/A'}</td>
                                    <td style={{ padding: '8px' }}>{lote.idToken ? lote.idToken.toString() : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No hay lotes disponibles o se están cargando. Asegúrate que tu cuenta tiene lotes asociados.</p>
                )}
            </div>

            <div>
                <label>Seleccionar Vacuna:</label>
                <select value={selectedVacunaId} onChange={(e) => setSelectedVacunaId(e.target.value)}>
                    <option value="">Selecciona una vacuna</option>
                    {vacunas
                        .filter(vacuna => !vacuna.asignadaLot)
                        .map((vacuna, index) => (                        
                        <option key={index} value={vacuna.idToken}>
                            {vacuna.idVacuna}
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