// Creates an server on AP at 192.168.1.88 that allows for changing connected WiFi

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

#include <FS.h>
#include <LittleFS.h>

#include "display.h"

ESP8266WebServer server(80);

struct {
    const char *setWifiHTML = 
        "<html>"
        "   <head>"
        "       <title>lt3 WiFi</title>"
        "   </head>"
        "   <body>"
        "       <form method='POST' action='/'><h4>Connect to network:</h4>"
        "       <input type='text' placeholder='network ssid' name='ssid'/>"
        "       <br /><input type='password' placeholder='password' name='pass'/>"
        "       <br /><input type='submit' value='Connect'/></form>"
        "   </body>"
        "</html>"
    ;
    bool fsMounted = false;

    void mountFS(){
        if(LittleFS.begin()){
            fsMounted = true;
        }
    }

    bool readFile(const char *fname, char *contents){
        if(!fsMounted) return false;
        if(!LittleFS.exists(fname)){
            Serial.printf("File %s does not exist\n", fname);
            return false;
        }
        File file = LittleFS.open(fname, "r");
        if(!file){
            Serial.printf("Failed to open %s to write\n", fname);
            return false;
        }
        strncpy(contents, file.readString().c_str(), 99);
        Serial.printf("Read %s from %s\n", contents, fname);
        file.close();
        return true;
    }

    bool writeFile(const char *fname, const char *contents){
        if(!fsMounted) return false;
        File file = LittleFS.open(fname, "w");
        if(!file){
            Serial.printf("Failed to open %s to write\n", fname);
            return false;
        }
        if(!file.print(contents)){
            Serial.printf("Failed while writing to %s with contents %s\n", fname, contents);
            file.close();
            return false;
        }
        file.close();
        return true;
    }

    void loadWiFi(char *SSID, char *PASS){
        if(readFile("/ssid.txt", SSID) && readFile("/pass.txt", PASS)){
            connectWiFi(SSID, PASS);
        }
    }

    void saveWiFi(const char *SSID, const char *PASS){
        writeFile("/ssid.txt", SSID);
        writeFile("/pass.txt", PASS);
    }

    int get_status(){
        return WiFi.status();
    }

    char* get_string_status(){
        if(get_status() == WL_CONNECTED){
            return (char*)"Connected";
        }
        return (char*)"Not connected";
    }

    void connectWiFi(const char *SSID, const char *PASS){
        WiFi.disconnect(true);
        delay(2000);
        WiFi.begin(SSID, PASS);
        Serial.printf("Connecting to %s\n", SSID);
        display.set_wifi(SSID, "Connecting to");
        display.redraw();
        int tries = 0;
        while (WiFi.status() != WL_CONNECTED && tries < 30){
            delay(500);
            Serial.printf("%d", WiFi.status());
            tries++;
        }
        Serial.println();
        delay(500);
        Serial.printf("Status: %d, IP: %s\n", WiFi.status(), WiFi.localIP().toString().c_str());

        display.set_wifi(SSID, get_string_status());
        display.redraw();

        display.connected = (WiFi.status() == WL_CONNECTED);
    }

    void setup_server(char *SSID, char *PASS){
        Serial.println("Setting AP");
        WiFi.softAPConfig(
            IPAddress(192, 168, 1, 88),
            IPAddress(192, 168, 1, 1),
            IPAddress(255, 255, 255, 0)
        );
        WiFi.softAP(SSID, PASS);

        server.on("/", [this, SSID, PASS](){
            if(server.method() == HTTP_POST){
                for(uint8_t i = 0; i < server.args(); i++){
                    if(server.argName(i) == "ssid"){
                        strncpy(SSID, server.arg(i).c_str(), 99);
                    }
                    if(server.argName(i) == "pass"){
                        strncpy(PASS, server.arg(i).c_str(), 99);
                    }
                }
                Serial.printf("Set Wifi: %s %s\n", SSID, PASS);
                connectWiFi(SSID, PASS);
                if(WiFi.status() == WL_CONNECTED){
                    saveWiFi(SSID, PASS);
                }
            }
            server.send(200, "text/html", setWifiHTML);
        });
        server.begin();
        Serial.println("Started HTTP Server");
    }

    void process_server(){
        server.handleClient();
    }
} connect_wifi;