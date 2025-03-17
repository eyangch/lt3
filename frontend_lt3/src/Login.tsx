import { useRef, useState, useCallback, React } from "react";

interface LoginProps{
    setId: Object;
}

const Login : React.FC<LoginProps> = ({ setId }) => {
    
    function attemptLogin(formData){
        setId(formData.get("id"));
        localStorage.setItem(
            "id",
            formData.get("id")
        );
    }

    return (
        <>
            <div className="">
                <form action={attemptLogin}>
                    <input name="id" className="bg-white border-2 rounded-sm border-black mb-2 text-center text-black" /><br/>
                    <button type="submit" className="bg-white text-black">Login</button>
                </form>
            </div>
        </>
    )
};

export default Login;