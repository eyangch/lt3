import { useState } from 'react';

import './App.css'
import Canvas from "./Canvas.tsx";
import Login from "./Login.tsx";

function App() {

    const [id, setId] = useState(localStorage.getItem("id"));
    const [is_auth, setIs_auth] = useState(false);

    async function check_auth(id){
        const response = await fetch(`/api/version?id=${id}`);
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

    return (
        <>
            <div className="py-4">
                <h3 className="text-3xl sm:text-5xl text-black">
                    Less Than Three &lt;3
                </h3>
            </div>
            <div className={`${is_auth ? "" : "hidden"}`}>
                <Canvas />
                <button onClick={log_out} className="mt-2 bg-white text-black">Log Out</button>
            </div>
            <div className={`${!is_auth ? "" : "hidden"}`}><Login setId={setId} /></div>
        </>
    );
}

export default App;
