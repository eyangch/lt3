import { useState, useRef, useEffect } from 'react';

import './App.css'
import Canvas from "./Canvas.tsx";
import Login from "./Login.tsx";
import { api_url } from "../config.ts";

function App() {

    const [id, setId] = useState(localStorage.getItem("id"));
    const idRef = useRef(id);

    const [is_auth, setIs_auth] = useState(false);
    const [read, setRead] = useState("");

    useEffect(() => {
        idRef.current = id;
    }, [id]);

    async function check_auth(id){
        const response = await fetch(`${api_url}/api/version?id=${id}`);
        const text = await response.text();
        console.log(text);
        if(text === 'forbidden :('){
            setIs_auth(false);
        }else{
            setIs_auth(true);
        }
    }

    function log_out(){
        setIs_auth(false);
        setId(undefined);
        localStorage.removeItem("id");
    }

    check_auth(id);

    async function get_read(){
        const response = await fetch(`${api_url}/api/read_receipt?id=${idRef.current}`);
        const json = await response.json();
        console.log(json);
        setRead(String(json));
    }

    useEffect(() => {
        const intervalId = setInterval(get_read, 1000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        console.log(read);
    }, [read]);

    return (
        <>
            <div className="py-4">
                <h3 className="text-3xl sm:text-5xl text-black">
                    Less Than Three &lt;3
                </h3>
            </div>
            <div className={`${is_auth ? "" : "hidden"}`}>
                <Canvas id={id} />
                <div className="mt-2 text-black text-2xl">Read: {read === "true" ? "✅❤️" : read === "false" ? "❌🥺" : ""}</div>
                <button onClick={log_out} className="mt-2 bg-white text-black">Log Out</button>
            </div>
            <div className={`${!is_auth ? "" : "hidden"}`}><Login setId={setId} /></div>
        </>
    );
}

export default App;
