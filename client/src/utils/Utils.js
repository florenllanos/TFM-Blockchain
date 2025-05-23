import { ethers } from 'ethers';

/* "Genera" a 32 posicions (0 a l'esquerra) el número de lot.
*/
export const padLeft32Zero = (valor, longitud) => {
    let numHex = ethers.toBeHex(valor);
    const longDesitjada = longitud * 2;
    const paddingLong = longDesitjada - (numHex.length - 2);
    const padding = "0".repeat(Math.max(0, paddingLong));
    const paddedHexString = "0x" + padding + numHex.slice(2);
    return paddedHexString;
}