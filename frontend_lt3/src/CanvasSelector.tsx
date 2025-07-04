import { useRef, useState, useCallback, React } from "react";
import { Buffer } from "buffer";
import './CanvasSelector.css';

import paintBrushURL from './assets/image.png';
import trashCanURL from './assets/trash.png';
import eraserURL from './assets/eraser.png';

interface ItemProps{
    color: Object;
    color2: Object;
    setColor: Object;
    itemColor: string;
    reactItemColor: string;
    isTrash?: boolean;
}

const Item : React.FC<ItemProps> = ({ color, color2, setColor, itemColor, reactItemColor, isTrash }) => {
    function clickColor(){
        color.current = itemColor;
        setColor(itemColor);
    }

    console.log(color2 + " " + itemColor);

    return (
        <>
            <div className={`aspect-square w-6 sm:w-12 ${reactItemColor} rounded-md sm:rounded-xl ${(color2 === itemColor) ? "border-3" : "border-2"} border-black`} onClick={clickColor}>
                {
                    isTrash ? <img className="p-0.5 sm:p-2" src={eraserURL}/> : <img className="p-0.5 sm:p-2" src={paintBrushURL}/>
                }
            </div>
        </>
    )
};

interface ClearItemProps{
    clearFunction: () => void;
}

const ClearItem : React.FC<ClearItemProps> = ({ clearFunction }) => {
    return (
        <>
            <div className={`aspect-square w-6 sm:w-12 bg-white hover:bg-slate-200 rounded-md sm:rounded-xl border-1 sm:border-2 ml-auto border-black`} onClick={clearFunction}>
                <img className="p-0.5 sm:p-2" src={trashCanURL}/>
            </div>
        </>
    )
};

interface CanvasSelectorProps{
    color: Object;
    clearFunction: () => void;
}

const CanvasSelector : React.FC<CanvasSelectorProps> = ({ color, clearFunction }) => {
    let [color2, setColor] = useState(color.current);
    return (
        <>
            <div className="flex space-x-2">
                <Item color={color} color2={color2} setColor={setColor} itemColor="#FFFFFF" reactItemColor="bg-white hover:bg-neutral-200"/>
                <Item color={color} color2={color2} setColor={setColor} itemColor="#FF0000" reactItemColor="bg-red-500 hover:bg-red-400"/>
                <Item color={color} color2={color2} setColor={setColor} itemColor="#FFFF00" reactItemColor="bg-yellow-300 hover:bg-yellow-200"/>
                <Item color={color} color2={color2} setColor={setColor} itemColor="#00FF00" reactItemColor="bg-green-500 hover:bg-green-400"/>
                <Item color={color} color2={color2} setColor={setColor} itemColor="#00FFFF" reactItemColor="bg-cyan-500 hover:bg-cyan-400"/>
                <Item color={color} color2={color2} setColor={setColor} itemColor="#0000FF" reactItemColor="bg-blue-500 hover:bg-blue-400"/>
                <Item color={color} color2={color2} setColor={setColor} itemColor="#FF00FF" reactItemColor="bg-pink-400 hover:bg-pink-300"/>
                <Item color={color} color2={color2} setColor={setColor} itemColor="#000000" reactItemColor="bg-slate-300 hover:bg-slate-200" isTrash/>
                <ClearItem clearFunction={clearFunction}/>
            </div>
        </>
    )
};

export default CanvasSelector;