import express from "express";
import { Buffer } from "node:buffer";
import cors from "cors";
import { createCanvas, loadImage } from "canvas";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "200mb", extended: true }));
app.use(cors());

let drawings = {
    "angguo": null,
    "eyang": null
};
let coords = {
    "angguo": [0, 0],
    "eyang": [0, 0],
};
let end_date = {
    "test": new Date(2025, 9, 1),
    "angguo": new Date(2025, 9, 1),
    "eyang": new Date(2025, 9, 1)
}
let versions = {
    "test": 0,
    "angguo": 0,
    "eyang": 0
};

let partners = {
    "angguo": "eyang",
    "eyang": "angguo",
};

app.get("/api/earth.png", async (req, res) => {
    res.status(200);
    res.sendFile("./earth.png", { root: __dirname });
});

app.get("/api/set_end_date", async (req, res) => {
    const id = req.query.id as string;
    const year = req.query.year;
    const month = req.query.month;
    const day = req.query.day;
    if((id in end_date) && year && month && day){
        end_date[id] = new Date(year, month, day);
        res.status(200);
        res.send("OK");
    }else{
        res.status(200);
        res.send("NOT OK");
    }
});

app.get("/api/download", async (req, res) => {
    const id = req.query.id as string;
    if(!(id in partners)){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const partner_id = partners[id];
    res.status(200);
    res.send(drawings[partner_id]);
});

app.get("/api/download_self", async (req, res) => {
    const id = req.query.id as string;
    if(!(id in drawings)){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    res.status(200);
    res.send(drawings[id]);
});

app.get("/api/download_date", async (req, res) => {
    const id = req.query.id as string;
    if(!(id in end_date)){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const now = Date.now();
    const t_diff = Math.floor((end_date[id] - now) / (1000 * 60 * 60 * 24));
    res.status(200);
    res.send(t_diff.toString());
});

async function get_coords(ip){
    const resp = await fetch(`http://ip-api.com/json/${ip}`);
    const resp_json = await resp.json();
    return [resp_json.lat, resp_json.lon];
}

app.get("/api/get_distance", async (req, res) => {
    function distance(lat1, lon1, lat2, lon2) {
        const r = 3963.1; // mi
        const p = Math.PI / 180;
        
        const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2
                        + Math.cos(lat1 * p) * Math.cos(lat2 * p) *
                        (1 - Math.cos((lon2 - lon1) * p)) / 2;
        
        return 2 * r * Math.asin(Math.sqrt(a));
    }
    const id = req.query.id as string;
    if(!(id in versions)){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
    const cur_coord = await get_coords(ip);
    coords[id] = cur_coord;
    // if(id == "angguo"){
    //     coords[id] = [1, 103];
    // }
    const partner_id = partners[id];
    const partner_coord = coords[partner_id];
    const dist = Math.round(distance(cur_coord[0], cur_coord[1], partner_coord[0], partner_coord[1]));
    res.status(200);
    res.send(dist.toString());
});

app.get("/api/download_globe", async (req, res) => {

    async function cvt_coord_longitude(lon){
        return (Math.floor(lon / 12) + 33) % 30;
    }
    async function cvt_coord_latitude(lat){
        return Math.sin((lat+8) * Math.PI / 180) * 16;
    }
    const id = req.query.id as string;
    if(!(id in coords)){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const longitude1 = coords[id][1];
    const latitude1 = coords[id][0];

    const partner_id = partners[id];
    const longitude2 = coords[partner_id][1];
    const latitude2 = coords[partner_id][0];

    const canvas = createCanvas(96, 64)
    const ctx = canvas.getContext('2d');
    const earth_img = await loadImage("earth.png");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const long1_idx = await cvt_coord_longitude(longitude1);
    const lat1_pix = await cvt_coord_latitude(latitude1);

    const long2_idx = await cvt_coord_longitude(longitude2);
    const lat2_pix = await cvt_coord_latitude(latitude2);


    ctx.fillStyle = "red";
    ctx.drawImage(earth_img, (long1_idx % 5) * 32, Math.floor(long1_idx / 5)*32, 32, 32, 8, 20, 32, 32);
    ctx.fillRect(24, 36 - lat1_pix, 3, 3);
    ctx.drawImage(earth_img, (long2_idx % 5) * 32, Math.floor(long2_idx / 5)*32, 32, 32, 56, 20, 32, 32);
    ctx.fillRect(72, 36 - lat2_pix, 3, 3);

    const image_data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let image_data_16 = new Uint8Array(canvas.width * canvas.height * 2);
    for(let i = 0; i < canvas.width * canvas.height; i++){
        let red = image_data[4*i+0]; // RRRRR (5)
        let green = image_data[4*i+1]; // GGGGGG (6)
        let blue = image_data[4*i+2]; // BBBBB (5)
        let pixel = ((red & 0xF8) << 8) | ((green & 0xFC) << 3) | (blue >> 3);
        //let pixel = green | (red << 6) | (blue << 11);
        let pixel_1 = (pixel & 0xFF00) >> 8;
        let pixel_2 = pixel & 0xFF;
        image_data_16[2*i] = pixel_2;
        image_data_16[2*i+1] = pixel_1;
    }
    const resp = Buffer.from(image_data_16);

    res.status(200);
    res.send(resp);
    //res.send(`<img src='${canvas.toDataURL()}'/>`);
});

app.get("/api/version", async (req, res) => {
    const id = req.query.id as string;
    if(!(id in versions)){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const partner_id = partners[id];
    res.status(200);
    res.send(versions[partner_id].toString());
});

app.post("/api/upload", async (req, res) => {
    const id = req.body.id;
    const b64 = req.body.b64;
    drawings[id] = Buffer.from(b64, "base64");
    if(!(id in versions) || versions[id] > 100000){
        versions[id] = 0;
    }
    versions[id]++;
    res.status(200);
    res.send("cool");
});

app.listen(PORT, () => {
    console.log(`Serving lt3 backend on port ${PORT}`);
});
