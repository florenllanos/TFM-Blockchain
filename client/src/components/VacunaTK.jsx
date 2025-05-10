import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VacunaTK from '../contratos/VacunaTK.json'; // Importa el ABI.

const adresaContracte = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0"; // Adreça contracte.
const abiContracte = VacunaTK.abi;

function VacunaTKForm({ cuenta }) {
    const [idVacuna, setIdVacuna] = useState('');
    const [termolabil, setTermolabil] = useState(false);
    const [tempConservacio, setTempConservacio] = useState(0);
    const [dataCaducitat, setDataCaducitat] = useState('');
    const [contract, setContract] = useState(null);
    const [message, setMessage] = useState('');
    const [vacunas, setVacunas] = useState([]); // Vacunas para mostrar las que se van creando.

    useEffect(() => {
        const initializeContract = async () => {
            if (window.ethereum && cuenta) {
                console.log("Inici contracte");
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const newContract = new ethers.Contract(adresaContracte, abiContracte, signer);
                setContract(newContract);
                
                // Carregar les vacunes existents al carregar el component
                await fetchVacunes(newContract, cuenta);
            } else {
                console.log("Contracte null");
                setContract(null);
            }
        };

        initializeContract();
    }, [cuenta]);

    const fetchVacunes = async (contract, cuenta) => {
        try {
            if (contract && cuenta) {
                const vacunesEmpresa = await contract.getVacunesEmpresa(cuenta);
                setVacunas(vacunesEmpresa);
            }
        } catch (error) {
            console.error("Error obtenint vacunes:", error);
        }
    };

    const mintToken = async (e) => {
        e.preventDefault();
        if (!cuenta) {
            console.log("Cuenta ", cuenta);
            setMessage("Por favor, conecta tu wallet.");
            return;
        }

        try {
            console.log("Cuenta ", cuenta);
            console.log("idVacuna ", idVacuna);
            console.log("termolabil ", termolabil);
            console.log("tempConservacio ", tempConservacio);
            console.log("dataCaducitat ", dataCaducitat);
            setMessage("Minting token...");            
            const tx = await contract.mint(cuenta, idVacuna, termolabil, tempConservacio, dataCaducitat);
            await tx.wait();
            setMessage("Token minted successfully!");
            // Limpiar el formulario
            setIdVacuna('');
            setTermolabil(false);
            setTempConservacio(0);
            setDataCaducitat('');

            // Actualizamos el listado de vacunas justo después de crear una.
            await fetchVacunes(contract, cuenta);

        } catch (error) {
            console.error('Error minting token:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div>
            <h2>Crear Token de Vacuna</h2>
            <form onSubmit={mintToken}>
                <div>
                    <label>ID Vacuna:</label>
                    <input type="text" value={idVacuna} onChange={(e) => setIdVacuna(e.target.value)} required />
                </div>
                <div>
                    <label>Termolábil:</label>
                    <select value={termolabil} onChange={(e) => setTermolabil(e.target.value === 'true')}>
                        <option value="false">No</option>
                        <option value="true">Sí</option>
                    </select>
                </div>
                <div>
                    <label>Temperatura Conservación:</label>
                    <input type="number" value={tempConservacio} onChange={(e) => setTempConservacio(parseInt(e.target.value))} required />
                </div>
                <div>
                    <label>Fecha Caducidad:</label>
                    <input type="date" value={dataCaducitat} onChange={(e) => setDataCaducitat(e.target.value)} required />
                </div>
                <button type="submit">Mint Token</button>
            </form>
            {message && <p>{message}</p>}

            {/* Tabla de Vacunas */}
            <h2>Vacunas Creadas</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID Vacuna</th>
                        <th>Termolábil</th>
                        <th>Temperatura Conservación</th>
                        <th>Fecha Caducidad</th>
                        <th>Asignada Lot</th>
                        <th>Administrada</th>
                    </tr>
                </thead>
                <tbody>
                    {vacunas.map((vacuna, index) => (
                        <tr key={index}>
                            <td>{vacuna.idVacuna}</td>
                            <td>{vacuna.termolabil ? 'Sí' : 'No'}</td>
                            <td>{vacuna.tempConservacio}</td>
                            <td>{vacuna.dataCaducitat}</td>
                            <td>{vacuna.asignadaLot ? 'Sí' : 'No'}</td>
                            <td>{vacuna.administrada ? 'Sí' : 'No'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default VacunaTKForm;