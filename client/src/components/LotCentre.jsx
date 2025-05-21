import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VacunaTK from '../contratos/VacunaTK.json';
import LotTK from '../contratos/LotTK.json';

const vacunaContractAddress = process.env.REACT_APP_VACUNATK; // Contracte de VacunaTK
const vacunaContractABI = VacunaTK.abi;

const lotContractAddress = process.env.REACT_APP_LOTTK; // Contracte de LotTK
const lotContractABI = LotTK.abi;

function LotCentre({ cuenta }) {
    console.log("Lot centre");
    const [vacunaContract, setVacunaContract] = useState(null);
    const [lotContract, setLotContract] = useState(null);
    const [vacunas, setVacunas] = useState([]);
    const [lotes, setLotes] = useState([]);
    const [selectedVacunaId, setSelectedVacunaId] = useState('');
    const [selectedLotId, setSelectedLotId] = useState('');
    const [lots, setLots] = useState([]);
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

                //await fetchVacunas(vacunaTKContract, cuenta);
                //await fetchLotes(lotTKContract, cuenta);
                //await fetchVacunesAprovades(lotTKContract, vacunaTKContract, cuenta);
                //console.log("Després vacunes aprovades");
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
                        {vacunas.map((vacuna, index) => (
                            <tr key={index}>
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
        </div>
    );
}

export default LotCentre;