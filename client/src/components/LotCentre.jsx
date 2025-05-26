import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VacunaTK from '../contratos/VacunaTK.json';
import LotTK from '../contratos/LotTK.json';
import CartillaTK from '../contratos/CartillaTK.json';
import { padLeft32Zero } from '../utils/Utils.js';

const vacunaContractAddress = process.env.REACT_APP_VACUNATK; // Contracte de VacunaTK
const vacunaContractABI = VacunaTK.abi;

const lotContractAddress = process.env.REACT_APP_LOTTK; // Contracte de LotTK
const lotContractABI = LotTK.abi;

const cartillaContractAddress = process.env.REACT_APP_CARTILLATK // Contracte de CartillaTK.
const cartillaContractABI = CartillaTK.abi;

function LotCentre({ cuenta }) {
    console.log("Lot centre");
    const [vacunaContract, setVacunaContract] = useState(null);
    const [lotContract, setLotContract] = useState(null);
    const [vacunas, setVacunas] = useState([]);
    const [lotes, setLotes] = useState([]);
    const [selectedVacunaId, setSelectedVacunaId] = useState('');
    const [selectedLotId, setSelectedLotId] = useState('');
    const [lots, setLots] = useState([]);
    const [selectedVacunaToAdminister, setSelectedVacunaToAdminister] = useState('');
    const [idTokenPacient, setIdTokenPacient] = useState('');
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

                await fetchLotes(lotTKContract, cuenta);

            } else {
                setVacunaContract(null);
                setLotContract(null);
            }
        };

        initializeContracts();
    }, [cuenta]);

    const fetchLotes = async (contract, account) => {
        try {
            if (contract && account) {
                const lotesEmpresa = await contract.getLotsEmpresa(account);
                setLotes(lotesEmpresa);
            }
        } catch (error) {
            console.error("Error obtenint lots:", error);
        }
    };

    const fetchVacunesLote = async (idTokenLot) => {
        setSelectedLotId(idTokenLot);
        if (lotContract && cuenta) {
            try {
                console.log("Abans de getVacunesEmpresa2: ", idTokenLot);
                const vacunasData = await lotContract.getDadesVacunesLot(idTokenLot);
                setVacunas(vacunasData);
                console.log("Després de getVacunesEmpresa");
            } catch (err) {
                console.error("Error al obtener los recursos:", err);
                //setError(err.message || "No se pudieron obtener los recursos");
            }
        }
    };

    const handleVacunaSelection = (event) => {
        setSelectedVacunaToAdminister(event.target.value);
    };

    const handleIdTokenPacientChange = (event) => {
        setIdTokenPacient(event.target.value);
    };

    const administerVacuna = async () => {
        if (!selectedVacunaToAdminister) {
            setMessage("Por favor, selecciona una vacuna para administrar.");
            return;
        }

        if (!lotContract) {
            setMessage("El contrato de lote no está inicializado.");
            return;
        }

        try { //TODO: acabar transferencia de vacuna.
            setMessage("Administrando vacuna...");
            // idTokenPadre, adresaDest, contracteFill, idTokenFill, _dataIdTokenDesti
            console.log("Id token paciente ", padLeft32Zero(idTokenPacient, 16));
            const tx = await lotContract["safeTransferChild(uint256,address,address,uint256,bytes)"](
                selectedLotId, 
                cartillaContractAddress, 
                vacunaContractAddress, 
                selectedVacunaToAdminister,
                padLeft32Zero(idTokenPacient, 16)
            );
            await tx.wait();
            setMessage(`Vacuna ${selectedVacunaToAdminister} administrada exitosamente del lote ${selectedLotId}.`);
            // Actualizar la lista de vacunas después de la administración
            await fetchVacunesLote(selectedLotId);
            setSelectedVacunaToAdminister(''); // Limpiar la selección
        } catch (error) {
            console.error("Error al administrar la vacuna:", error);
            setMessage(`Error al administrar la vacuna: ${error.message}`);
        }
    };

    return (
        <div>
           {/* Tabla de Lotes */}
            <h2>Lots</h2>
            <div>
                <label>Seleccionar Lote:</label>
                <select value={selectedLotId} onChange={(e) => fetchVacunesLote(e.target.value)}>
                    <option value="">Selecciona un lote</option>
                    {lotes.map((lote, index) => (
                        <option key={index} value={lote.idToken}>
                            {lote.idLot}
                        </option>
                    ))}
                </select>
            </div>
            {/* Tabla de Vacunas */}
            <h3>Vacunas</h3>
            {vacunas.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Sel. vacuna</th>
                            <th>ID token Vacuna</th>
                            <th>ID Vacuna</th>
                            <th>Termolábil</th>
                            <th>Temp. Conservación</th>
                            <th>Fecha Caducidad</th>
                            <th>Asignada a Lote</th>
                            <th>Administrada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vacunas
                        .filter(vacuna => vacuna.idVacunaToken != 0)
                        .map((vacuna, index) => (
                            <tr key={index}>
                                <td>
                                    <input
                                        type="radio"
                                        name="administerVacuna"
                                        value={vacuna.idVacunaToken}
                                        checked={selectedVacunaToAdminister === vacuna.idVacunaToken.toString()}
                                        onChange={handleVacunaSelection}
                                    />
                                </td>
                                <td>{vacuna.idVacunaToken}</td>
                                <td>{vacuna.vacuna.idVacuna}</td>
                                <td>{vacuna.vacuna.termolabil ? "Sí" : "No"}</td>
                                <td>{vacuna.vacuna.tempConservacio}</td>
                                <td>{vacuna.vacuna.dataCaducitat}</td>
                                <td>{vacuna.vacuna.asignadaLot ? "Sí" : "No"}</td>
                                <td>{vacuna.vacuna.administrada ? "Sí" : "No"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No hi ha vacunes disponibles al lot</p>
            )}

            {vacunas.length > 0 && ( // només si hi ha vacunes
                <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                    <label htmlFor="idTokenPacientInput">ID Token Paciente (para _dataIdTokenDesti):</label>
                    <input
                        type="text"
                        id="idTokenPacientInput"
                        value={idTokenPacient}
                        onChange={handleIdTokenPacientChange}
                        placeholder="Ej: 1 o 0x..."
                        style={{ marginLeft: '5px' }}
                    />
                </div>
            )}

            {vacunas.length > 0 && (
                <button onClick={administerVacuna} disabled={!selectedVacunaToAdminister}>
                    Administrar Vacuna Seleccionada
                </button>
            )}
        </div>
    );
}

export default LotCentre;