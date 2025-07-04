import { useRef, useState, useCallback, React, useEffect } from "react";
import { Buffer } from "buffer";
import { api_url } from "../config";

import CanvasSelector from "./CanvasSelector.tsx";

interface CanvasProps {
    id: string
}

const Canvas : React.FC<CanvasProps> = ({ id }) => {
    let dragging = useRef(false);
    let color = useRef("#FFFFFF");
    let canvasRef = useRef(null);
    const idRef = useRef(id);

    useEffect(() => {
        idRef.current = id;
        console.log("canvas", id);
    }, [id]);

    async function clearCanvas(){
        let context = canvasRef.current.getContext('2d', { alpha: false });

        context.fillStyle = "black";
        context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        console.log("opt clear", idRef.current)
        const response = await fetch(`${api_url}/api/optional_clear`, {
            method: "POST",
            body: JSON.stringify({
                id: idRef.current,
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });
    }

    async function downloadCanvas(){
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        console.log("download", idRef.current);
        const response = await fetch(`${api_url}/api/download_self?id=${idRef.current}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const blob = await response.blob();
        const blob_arr = new Uint8Array(await blob.arrayBuffer());
        let fetched_image_data = new Uint8ClampedArray(4*canvas.width*canvas.height);
        console.log(blob_arr);
        for(let i = 0; i < canvas.width * canvas.height; i++){
            let pixel_2 = blob_arr[2*i];
            let pixel_1 = blob_arr[2*i+1];
            let pixel = (pixel_1 << 8) | pixel_2;

            let red = (pixel >> 11) & 0b11111;
            let green = (pixel >> 5) & 0b111111;
            let blue = pixel & 0b11111;

            fetched_image_data[4*i+0] = red << 3 | 0b111;
            fetched_image_data[4*i+1] = green << 2 | 0b11;
            fetched_image_data[4*i+2] = blue << 3 | 0b111;
            fetched_image_data[4*i+3] = 255;
        }
        let fetched_image_data_2 = new ImageData(fetched_image_data, canvas.width);
        context.putImageData(fetched_image_data_2, 0, 0);
    }

    const canvasCallbackRef = useCallback(async (canvas) => {
        canvasRef.current = canvas;
        if(canvas === null) return;
        let context = canvas.getContext('2d', { alpha: false });
        context.imageSmoothingEnabled = false;
        let radius = 1;

        canvas.width = 96;
        canvas.height = 64;

        context.fillStyle = "black";
        context.fillRect(0, 0, canvas.width, canvas.height);

        console.log(api_url);

        downloadCanvas();

        function getMousePosition(e){
            var mouseX = e.offsetX * canvas.width / canvas.clientWidth | 0;
            var mouseY = e.offsetY * canvas.height / canvas.clientHeight | 0;
            return {x: mouseX, y: mouseY};
        }

        function putPoint(e){
            e.preventDefault();
            e.stopPropagation();
            if (getMousePosition(e).x !== 0 && dragging.current) {
                context.strokeStyle = color.current;
                context.fillStyle = color.current;
                console.log();
                context.lineTo(getMousePosition(e).x, getMousePosition(e).y);
                context.lineWidth = radius * 2;
                context.stroke();
                context.beginPath();
                context.arc(getMousePosition(e).x, getMousePosition(e).y, radius, 0, Math.PI * 2);
                context.fill();
                context.beginPath();
                context.moveTo(getMousePosition(e).x, getMousePosition(e).y);
            }
        };
        
        var engage = function (e) {
            dragging.current = true;
            putPoint(e);
        };
        var disengage = async function () {
            if(dragging.current){
                dragging.current = false;
                context.beginPath();
                const image_data = context.getImageData(0, 0, canvas.width, canvas.height).data;
                let image_data_16 = new Uint8Array(canvas.width * canvas.height * 2);
                for(let i = 0; i < canvas.width * canvas.height; i++){
                    let red = image_data[4*i+0]; // RRRRR (5)
                    let green = image_data[4*i+1]; // GGGGGG (6)
                    let blue = image_data[4*i+2]; // BBBBB (5)
                    let pixel = ((red & 0xF8) << 8) | ((green & 0xFC) << 3) | (blue >> 3);
                    let pixel_1 = pixel >> 8;
                    let pixel_2 = pixel & 0xFF;
                    image_data_16[2*i] = pixel_2;
                    image_data_16[2*i+1] = pixel_1;
                }
                console.log(image_data_16);
                let b64 = Buffer.from(image_data_16).toString('base64');
                console.log("upload", idRef.current);
                const response = await fetch(`${api_url}/api/upload`, {
                    method: "POST",
                    body: JSON.stringify({
                        id: idRef.current,
                        b64: b64,
                    }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
            }
        };
        
        canvas.addEventListener('mousedown', engage);
        canvas.addEventListener('mousemove', putPoint);
        canvas.addEventListener('mouseup', disengage);
        document.addEventListener('mouseup', disengage);
        canvas.addEventListener('contextmenu', disengage);
        
        canvas.addEventListener('touchstart', function (e){
            var touch = e.touches[0];
            var mouseEvent = new MouseEvent("mousedown", {
                clientX: touch.pageX,
                clientY: touch.pageY
            });
            canvas.dispatchEvent(mouseEvent);
        }, false);
        canvas.addEventListener("touchmove", function (e){
            e.preventDefault();
            e.stopPropagation();
            var touch = e.touches[0];
            var mouseEvent = new MouseEvent("mousemove", {
                clientX: touch.pageX,
                clientY: touch.pageY
            });
            canvas.dispatchEvent(mouseEvent);
        }, false);
        canvas.addEventListener('touchend', disengage, false);

        dragging.current = false;
    }, [id]);

    useEffect(() => {
        downloadCanvas();
    }, [id]);
    
    return (
        <>
            <div className="flex flex-row justify-center w-full">
                <div className="space-y-2 flex flex-col">
                    <div><CanvasSelector color={color} clearFunction={clearCanvas}/></div>
                    
                    <canvas 
                        className="w-64 sm:w-128 content-center"
                        ref={canvasCallbackRef}
                        style={ {imageRendering: "pixelated"} }/>
                </div>
            </div>
        </>
    );
};

export default Canvas;