import express from "express";
import { Buffer } from "node:buffer";
import cors from "cors";

const app = express();
const PORT = 80;

app.use(express.json({ limit: "200mb", extended: true }));
app.use(cors());

let drawings = {};
let versions = {"test": 0};

app.get("/api/download", async (req, res) => {
    let id = req.query.id as string;
    if(!(id in drawings)){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    res.status(200);
    res.send(drawings[id]);
});

app.get("/api/version", async (req, res) => {
    let id = req.query.id as string;
    if(!(id in versions)){
        res.status(403);
        res.send("forbidden :(");
        return;
    }
    res.status(200);
    res.send(versions[id].toString());
});

app.post("/api/upload", async (req, res) => {
    let id = req.body.id;
    let b64 = req.body.b64;
    drawings[id] = Buffer.from(b64, "base64");
    if(!(id in versions) || versions[id] > 2){
        versions[id] = 0;
    }
    versions[id]++;
    res.status(200);
    res.send("cool");
});

app.listen(PORT, () => {
    console.log(`Serving lt3 backend on port ${PORT}`);
});
