import abi from "./ContractAbi.json"
import { ethers } from "ethers";
//0xBC73daf94A1d404509431C046b11992CaB069c9f
export const contractAddress = "0x9ba047e1528846b89eb5a4295a7fe8780da0448a";
export const contractABI = abi.abi;
export async function createEthereumContract() {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner();
        const transactionsContract = new ethers.Contract(contractAddress, contractABI, signer);
        return transactionsContract;
    } catch (error) {
        console.log("Error", error.message);
    }
}
