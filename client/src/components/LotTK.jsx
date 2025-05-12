import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LotTK from '../contratos/LotTK.json'; // Importa el ABI.

const adresaContracte = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; // Adreça contracte.
const abiContracte = LotTK.abi;

function LotTKForm({ cuenta }) {
    const [idLot, setIdLot] = useState('');
    const [fabricant, setFabricant] = useState('');
    const [nomLot, setNomLot] = useState('');
    const [dataFabricacio, setDataFabricacio] = useState('');
    const [contract, setContract] = useState(null);
    const [message, setMessage] = useState('');
    const [lots, setLots] = useState([]); // Lots, para mostrar los que se van creando.
    //const [lotTancat, setLotTancat] = useState(false);

    useEffect(() => {
        const initializeContract = async () => {
            if (window.ethereum && cuenta) {
                console.log("Inici contracte");
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const newContract = new ethers.Contract(adresaContracte, abiContracte, signer);
                setContract(newContract);
                
                // Carregar les vacunes existents al carregar el component
                await fetchLotsEmpresa(newContract, cuenta);
            } else {
                console.log("Contracte null");
                setContract(null);
            }
        };

        initializeContract();
    }, [cuenta]);

    const fetchLotsEmpresa = async (contract, cuenta) => {
        try {
            if (contract && cuenta) {
                const lotsEmpresa = await contract.getLotsEmpresa(cuenta);                
                setLots(lotsEmpresa);
                console.log("Lot empresa ", lots.idLot);
            }
        } catch (error) {
            console.error("Error obtenint lots:", error);
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
            setMessage("Minting token...");            
            const tx = await contract.mint(cuenta, idLot, fabricant, nomLot, dataFabricacio);
            await tx.wait();
            setMessage("Token minted successfully!");
            // Limpiar el formulario
            setIdLot('');
            setFabricant('');
            setNomLot('');
            setDataFabricacio('');

            // Actualizamos el listado de lots justo después de crear uno.
            await fetchLotsEmpresa(contract, cuenta);

        } catch (error) {
            console.error('Error minting token:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div>
            <h2>Crear token de lot</h2>
            <form onSubmit={mintToken}>
                <div>
                    <label>ID Lot:</label>
                    <input type="text" value={idLot} onChange={(e) => setIdLot(e.target.value)} required />
                </div>
                <div>
                    <label>Fabricant:</label>
                    <input type="text" value={fabricant} onChange={(e) => setFabricant(e.target.value)} required />
                </div>
                <div>
                    <label>Nom lot:</label>
                    <input type="text" value={nomLot} onChange={(e) => setNomLot(e.target.value)} required />
                </div>
                <div>
                    <label>Fecha fabricació:</label>
                    <input type="date" value={dataFabricacio} onChange={(e) => setDataFabricacio(e.target.value)} required />
                </div>
                <button type="submit">Mint Token</button>
            </form>
            {message && <p>{message}</p>}

            {/* Taula de Lots */}
            <h2>Lots creats</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID Lot</th>
                        <th>Fabricant</th>
                        <th>Nom lot</th>
                        <th>Data fabricació</th>
                    </tr>
                </thead>
                <tbody>
                    {lots.map((lot, index) => (
                        <tr key={index}>
                            <td>{lot.idLot}</td>
                            <td>{lot.fabrican}</td>
                            <td>{lot.nomLot}</td>
                            <td>{lot.dataFabricacio}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default LotTKForm;