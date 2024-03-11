import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { Web3Storage } from "web3.storage";
import { createEthereumContract } from "../Utils/Constants";

import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

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

function Create() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [formFilled, setFormFilled] = useState();
    const navigate = useNavigate();

    useEffect(() => {
        async function Check() {
            const transactionContract = await createEthereumContract();
            const cid = await transactionContract.getCid_DonorAcc(localStorage.getItem("address"));
            if (cid) {
                setFormFilled(true);
            }
            else {
                setFormFilled(false);
            }
        }
        Check();
    }, [])


    // function getAccessToken() {
    //     return process.env.WEB3STORAGE_TOKEN
    // }

    // function makeStorageClient() {
    //     return new Web3Storage({ token: getAccessToken() })
    // }

    async function handleSubmit(event) {
        event.preventDefault();
        const address = localStorage.getItem("address");
        const data = {
            name: name,
            email: email,
            address: address
        }

        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
        const files = [new File([blob], 'info.json')]
        console.log("Files:", files);

        try {
            if (window.ethereum) {
                //Adding user details into IPFS
                // const client = makeStorageClient();
                const cid = await client.add(blob);
                console.log("CID is", cid);

                //Adding cid to Blockchain
                const transactionsContract = await createEthereumContract();
                const transactionHash = await transactionsContract.setCid_DonorAcc(address, cid.path);
                await transactionHash.wait();
                console.log("Transaction has:", transactionHash.hash);
                window.localStorage.setItem("trx_hash", transactionHash.hash);
                navigate("/User");
            }
            else {
                console.log("NO WALLET FOUND");
            }
        } catch (error) {
            console.log("Error is:", error);
        }
    }

    function handleClick(event) {
        event.preventDefault();
        navigate("/User");
    }

    const formView = (
        <>
            <div className="modal_container_2">
                <strong>Create Account</strong>
                <form className="formStyle" onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Name*:</label>
                        <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Email*:</label>
                        <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form_submit">
                        <input className="cntr" type="submit" />
                    </div>
                </form>
            </div>
        </>
    )

    const filledView = (
        <>
            <div className="modal_wrapper_3" />
            <div className="modal_container_3">
                <p>You have already filled this form so, you can't fill it anymore</p>
                <div className="cntr">
                    <button onClick={handleClick}>Okay</button>
                </div>
            </div>
        </>
    );

    return (
        <>
            {formFilled ? filledView : formView}
        </>
    )
}

export default Create;