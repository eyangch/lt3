import express from "express";
import { Buffer } from "node:buffer";
import cors from "cors";
import { createCanvas, loadImage, ImageData } from "canvas";
import DB from "./db.ts";
import crypto from "node:crypto";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "200mb", extended: true }));
app.use(cors());

let versions = {};

app.get("/api/earth.png", async (req, res) => {
    res.status(200);
    res.sendFile("./earth.png", { root: __dirname });
});

app.get("/api/download", async (req, res) => {
    const id = req.query.id as string;
    const user = await DB.get_user(id);
    if(!user){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const partner = await DB.get_user(user.partner);
    const drawing = await DB.get_drawing(partner.drawing);
    if(drawing){
        await DB.set_drawing_read(drawing.id, 1);
        res.status(200);
        res.send(drawing.data);
    }else{
        res.status(200);
        res.send("");
    }
});

app.get("/api/read_receipt", async (req, res) => {
    const id = req.query.id as string;
    const user = await DB.get_user(id);
    if(!user){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const drawing = await DB.get_drawing(user.drawing);
    if(drawing){
        res.status(200);
        res.send(!!drawing.read);
    }else{
        res.status(200);
        res.send("");
    }
});

app.get("/api/download_self", async (req, res) => {
    const id = req.query.id as string;
    const user = await DB.get_user(id);
    if(!user){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const drawing = await DB.get_drawing(user.drawing);
    if(drawing){
        res.status(200);
        res.send(drawing.data);
    }else{
        res.status(200);
        res.send("");
    }
});

app.get("/api/download_date", async (req, res) => {
    const id = req.query.id as string;
    const user = await DB.get_user(id);
    if(!user){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const now = Date.now();
    const e_date = Date.parse(user.date);
    const t_diff = Math.floor((e_date - now) / (1000 * 60 * 60 * 24));
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
    const user = await DB.get_user(id);
    if(!user){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
    const cur_coord = await get_coords(ip);
    await DB.set_user_pos(user.name, cur_coord[0], cur_coord[1]);
    const partner = await DB.get_user(user.partner);
    const partner_coord = [partner.lat, partner.lon];
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
    const user = await DB.get_user(id);
    if(!user){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const longitude1 = user.lon;
    const latitude1 = user.lat;

    const partner = await DB.get_user(user.partner);
    const longitude2 = partner.lon;
    const latitude2 = partner.lat;

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
    const user = await DB.get_user(id);
    if(!user){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const partner = await DB.get_user(user.partner);
    const partner_id = partner.name;
    if(!(partner_id in versions)) versions[partner_id] = 0;
    res.status(200);
    res.send(versions[partner_id].toString());
});

function generate_random_id(){
    return crypto.randomBytes(16).toString("hex");
}

app.post("/api/optional_clear", async (req, res) => {
    const id = req.body.id;
    const user = await DB.get_user(id);
    if(!user){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    if(!user.drawing){
        user.drawing = generate_random_id();
        await DB.set_user_drawing(id, user.drawing);
        await DB.add_drawing(user.drawing, user.name);
    }else{
        const drawing = await DB.get_drawing(user.drawing);
        if(drawing.read){
            user.drawing = generate_random_id();
            await DB.set_user_drawing(id, user.drawing);
            await DB.add_drawing(user.drawing, user.name);
        }
    }
    res.status(200);
    res.send("cool");
})

app.post("/api/upload", async (req, res) => {
    const id = req.body.id;
    const b64 = req.body.b64;
    const user = await DB.get_user(id);
    if(!user){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    if(!user.drawing){
        user.drawing = generate_random_id();
        await DB.set_user_drawing(id, user.drawing);
        await DB.add_drawing(user.drawing, user.name);
    }
    await DB.update_drawing(user.drawing, Buffer.from(b64, "base64"));
    if(!(id in versions) || versions[id] > 100000){
        versions[id] = 0;
    }
    versions[id]++;
    await DB.set_drawing_read(user.drawing, 0);
    res.status(200);
    res.send("cool");
});

app.get("/api/get_image_ids", async (req, res) => {
    const id = req.query.id as string;
    const user = await DB.get_user(id);
    if(!user){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const drawings = await DB.get_drawings_for_user(user.name);
    const image_ids = drawings.map((d) => d.id);
    res.status(200);
    res.send(image_ids);
});

app.get("/api/get_partner_image_ids", async (req, res) => {
    const id = req.query.id as string;
    const user = await DB.get_user(id);
    if(!user){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    const partner = await DB.get_user(user.partner);
    const drawings = await DB.get_drawings_for_two(user.name, partner.name);
    const image_ids = drawings.map((d) => d.id);
    res.status(200);
    res.send(image_ids);
});

app.get("/api/get_image", async (req, res) => {
    const id = req.query.id as string;
    const drawing = await DB.get_drawing(id);
    if(!drawing){
        res.status(404);
        res.send("not found :(");
        return;
    }
    const canvas = createCanvas(96, 64);
    const ctx = canvas.getContext('2d');
    const image_data = new Uint8Array(drawing.data);
    const fetched_image_data = new Uint8ClampedArray(4*canvas.width*canvas.height);
    for(let i = 0; i < image_data.length; i++){
        let pixel_2 = image_data[2*i];
        let pixel_1 = image_data[2*i+1];
        let pixel = (pixel_1 << 8) | pixel_2;
        let red = (pixel >> 11) & 0b11111;
        let green = (pixel >> 5) & 0b111111;
        let blue = pixel & 0b11111;

        fetched_image_data[4*i+0] = red << 3 | 0b111;
        fetched_image_data[4*i+1] = green << 2 | 0b11;
        fetched_image_data[4*i+2] = blue << 3 | 0b111;
        fetched_image_data[4*i+3] = 255;
    }
    ctx.putImageData(new ImageData(fetched_image_data, canvas.width), 0, 0);
    const image = canvas.toBuffer("image/png");
    res.status(200);
    res.setHeader('Content-Type', 'image/png');
    res.send(image);
});

app.get("/api/get_image_author_time", async (req, res) => {
    const id = req.query.id as string;
    const drawing = await DB.get_drawing(id);
    if(!drawing){
        res.status(404);
        res.send("not found :(");
        return;
    }
    res.status(200);
    res.send({
        author: drawing.user,
        time: drawing.timestamp
    });
});

app.listen(PORT, () => {
    console.log(`Serving lt3 backend on port ${PORT}`);
});
