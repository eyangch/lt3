import sqlite3 from "sqlite3";

class DB{
    static db = new sqlite3.Database("./main.db");

    static init(){
        this.db.serialize(() => {
            this.db.run("CREATE TABLE IF NOT EXISTS users (name STRING PRIMARY KEY, lat REAL, lon REAL, drawing STRING, partner STRING, date STRING)");
            this.db.run("CREATE TABLE IF NOT EXISTS drawings (id STRING PRIMARY KEY, data BLOB, user STRING, read INTEGER, timestamp INTEGER)");
            console.log("initialized db");
        });
    }

    static async db_get(stmt, v){
        return new Promise((resolve, reject) => {
            this.db.get(stmt, v, (err, row) => {
                if(err) reject(err);
                resolve(row);
            });
        });
    }

    static async db_all(stmt, v){
        return new Promise((resolve, reject) => {
            this.db.all(stmt, v, (err, rows) => {
                if(err) reject(err);
                resolve(rows);
            });
        });
    }

    static async db_run(stmt, v){
        return new Promise((resolve, reject) => {
            this.db.run(stmt, v, (err) => {
                if(err) reject(err);
                resolve();
            });
        });
    }

    static async test(){
        await this.db_run("INSERT INTO users (name, lat, lon, drawing, partner, date) VALUES (?, ?, ?, ?, ?, ?)", ["angguo", 0, 0, "", "eyang", (new Date(2025, 7, 15)).toString()]);
        const res = await this.db_all("SELECT * FROM users", []);
        console.log(res);
    }

    static async get_user(name){
        const res = await this.db_get("SELECT * FROM users WHERE name = ?", [name]);
        return res;
    }

    static async set_user_pos(name, lat, lon){
        await this.db_run("UPDATE users SET lat = ?, lon = ? WHERE name = ?", [lat, lon, name]);
    }

    static async set_user_drawing(name, drawing){
        await this.db_run("UPDATE users SET drawing = ? WHERE name = ?", [drawing, name]);
    }

    static async get_drawings_for_user(name){
        const res = await this.db_all("SELECT * FROM drawings WHERE user = ? ORDER BY timestamp DESC", [name]);
        return res;
    }
    
    static async get_drawing(id){
        const res = await this.db_get("SELECT * FROM drawings WHERE id = ?", [id]);
        return res;
    }

    static async add_drawing(id, user){
        const unixTime = Math.floor(Date.now() / 1000);
        await this.db_run("INSERT INTO drawings (id, data, user, read, timestamp) VALUES (?, NULL, ?, 0, ?)", [id, user, unixTime]);
    }

    static async set_drawing_read(id, read){
        await this.db_run("UPDATE drawings SET read = ? WHERE id = ?", [read, id]);
    }

    static async update_drawing(id, data){
        const unixTime = Math.floor(Date.now() / 1000);
        await this.db_run("UPDATE drawings SET data = ?, read = 0, timestamp = ? WHERE id = ?", [data, unixTime, id]);
    }
}

DB.init();


//DB.test().then(() => DB.get_user("eyang").then((res) => console.log(res)));

export default DB;