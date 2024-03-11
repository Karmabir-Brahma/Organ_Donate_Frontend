import { useState, useEffect } from "react";
import { createEthereumContract } from "../Utils/Constants";
import { useNavigate } from "react-router-dom";
import { SodiumPlus, X25519PublicKey, X25519SecretKey } from "sodium-plus";
import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';
import { BASE_URL } from "../Helper/BaseURL";
import axios from "axios";

const projectId = '2PKl9646Eki8bAgSFg97ZsbvbiA';
const projectSecret = 'eeea96e39915097c927f22f19aad633c';
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    apiPath: '/api/v0',
    headers: {
        authorization: auth,
    }
});

function Admin() {
    const [admin, setAdmin] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [authKeys, setAuthKeys] = useState(false);
    const [authPubK, setAuthPubK] = useState("");
    const [authSecK, setAuthSecK] = useState("");

    const [authName, setAuthName] = useState("");
    const [authEmail, setAuthEmail] = useState("");
    const [authWalletAddress, setAuthWalletAddress] = useState("");
    const [position, setPosition] = useState("");

    const navigate = useNavigate();
    useEffect(() => {
        const adminCheck = async () => {
            const adminCheck = localStorage.getItem("address");
            console.log(adminCheck);
            const transactionContract = await createEthereumContract();
            const adminAddress = await transactionContract.checkAdmin();
            if (adminCheck.toLowerCase() === adminAddress.toLowerCase())
                setAdmin(true);
            else
                navigate("/Error");
        }
        adminCheck();
        const authKeys = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/getAuthKeys`);
                console.log("RESP", res.data);
                if (res.data === 404)
                    setAuthKeys(true)
                else if (res.data !== 404) {
                    console.log("Auth keys found");
                    const bufferP = Buffer.from(res.data.publicKey);
                    const bufferS = Buffer.from(res.data.privateKey);

                    const pubK = new X25519PublicKey(bufferP);
                    const secK = new X25519SecretKey(bufferS);
                    setAuthPubK(pubK);
                    setAuthSecK(secK);
                }
                else
                    console.log("Internal Server Error");
            } catch (error) {
                console.log("Error msg", error.message);
            }
        }
        authKeys();
    }, []);

    async function addAuthorizer() {
        setShowForm(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const data = {
            name: authName,
            email: authEmail,
            address: authWalletAddress,
            position: position
        }

        const blob = new Blob([JSON.stringify(data)], { type: "application/json" })

        try {
            if (window.ethereum) {
                const cid = await client.add(blob);
                console.log("CID", cid);

                const transactionContract = await createEthereumContract();
                const transactionHash = await transactionContract.setCid_AuthAcc(authWalletAddress, cid.path);
                await transactionHash.wait();
                console.log("Trx hash", transactionHash);
                setAuthName("");
                setAuthEmail("");
                setPosition("");
                setAuthWalletAddress("");
            }
            else {
                console.log("No Wallet Detected");
            }
        } catch (error) {
            console.log("Error is:", error);
        }
    }

    const formCreate = (
        <>
            <div className="modal_container_2">
                <strong>Add Authorizer</strong>
                <form className="formStyle" onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Name*:</label>
                        <input type="text" className="form-control" value={authName} onChange={(e) => setAuthName(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Email*:</label>
                        <input type="email" className="form-control" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Position*:</label>
                        <input type="text" className="form-control" value={position} onChange={(e) => setPosition(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Wallet Address*:</label>
                        <input type="text" className="form-control" value={authWalletAddress} onChange={(e) => setAuthWalletAddress(e.target.value)} required />
                    </div>
                    <div className="form_submit">
                        <input className="cntr" type="submit" />
                    </div>
                </form>
            </div>
        </>
    );

    const genAuthKeys = async () => {
        const sodium = await SodiumPlus.auto();
        const keypair = await sodium.crypto_box_keypair();
        const privateKeyObj = await sodium.crypto_box_secretkey(keypair);
        const publicKeyObj = await sodium.crypto_box_publickey(keypair);
        const privateKey = privateKeyObj.buffer;
        const publicKey = publicKeyObj.buffer;

        try {
            const res = await axios.post(`${BASE_URL}/uploadAuthKeys`, {
                publicKey,
                privateKey
            });
            if (res.data !== 500) {
                const bufferP = Buffer.from(res.data.publicKey);
                const bufferS = Buffer.from(res.data.privateKey);

                const pubK = new X25519PublicKey(bufferP);
                const secK = new X25519SecretKey(bufferS);
                setAuthPubK(pubK);
                setAuthSecK(secK);
                setAuthKeys(false);
            }
            else
                console.log("Internal Server Error");
        } catch (error) {
            console.log("Error msg", error.message);
        }

        try {
            const res = await axios.post(`${BASE_URL}/uploadAuthPubKey`, {
                publicKey
            })
            if (res.data !== 500)
                console.log("Data", res.data);
            else
                console.log("Internal Server Error");
        } catch (error) {
            console.log("Error", error.message);
        }

    }

    function showAuthKeys() {
        console.log("Public Key of Authorizers", authPubK.toString('hex'));
        console.log("Private Keys of Authorzer", authSecK.toString('hex'));
    }

    return (
        <div style={{ textAlign: "center" }}>
            <h1>Admin Page</h1>
            {admin && (
                <>
                    <button className="bttn" onClick={addAuthorizer}>Add New Authorizer</button>
                    {authKeys ? (<button className="bttn" style={{ marginLeft: '5px' }} onClick={genAuthKeys}>Generate Authorizer Keys</button>) : (<button className="bttn" style={{ marginLeft: '5px' }} onClick={showAuthKeys}>Show Authorizer Keys</button>)}
                    {showForm && formCreate}
                </>
            )}
        </div>
    );
}

export default Admin;