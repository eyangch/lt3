// Creates an server on AP at 192.168.1.88 that allows for changing connected WiFi

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

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
        WiFi.begin(SSID, PASS);
        Serial.printf("Connecting to %s\n", SSID);
        display.set_wifi(SSID, "Connecting to");
        display.redraw();
        while (WiFi.status() == WL_IDLE_STATUS || WiFi.status() == WL_DISCONNECTED){
            delay(500);
            Serial.print(".");
        }
        Serial.println();
        Serial.printf("Status: %d, IP: %s\n", WiFi.status(), WiFi.localIP().toString().c_str());

        display.set_wifi(SSID, get_string_status());
        display.redraw();

        display.connected = true;
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