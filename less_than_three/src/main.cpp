#include <Arduino.h>
#include <stdio.h>
#include <string.h>

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

#include "connect_wifi.h"
#include "display.h"
#include "download_drawing.h"

char SSID[100] = "lt3";
char PASS[100] = "lt_three";

void setup() {
    Serial.begin(9600);

    display.begin();
    display.set_wifi(SSID, connect_wifi.get_string_status());
    display.redraw();

    WiFi.mode(WIFI_AP_STA);

    connect_wifi.setup_server(SSID, PASS);
}

unsigned long last_displayed = 0;
unsigned long debug_displayed = 0;

void loop() {
    connect_wifi.process_server();
    if(millis() - last_displayed > 1000 && connect_wifi.get_status() == WL_CONNECTED){
        Serial.println("Getting Version");
        if(download_drawing.compare_version()){
            Serial.println("Downloading Image");
            if(download_drawing.download((uint8_t*)display.buffer)){
                Serial.println("Updated Image");
                display.redraw();
            }
            Serial.println("Finished Processing Image");
        }
        last_displayed = millis();
    }
    if(millis() - debug_displayed > 10000){
        int memory_free = ESP.getFreeHeap();
        int fragmentation = ESP.getHeapFragmentation();
        Serial.printf("Memory Info: %d free heap, %d fragmentation\n", memory_free, fragmentation);
        unsigned long seconds = millis()/1000;
        unsigned long minutes = seconds / 60;
        unsigned long hours = minutes / 60;
        unsigned long days = hours / 24;
        Serial.printf("Uptime: %ld days/%ld hours/%ld minutes/%ld seconds\n", days, hours%24, minutes%60, seconds%60);
        debug_displayed = millis();
    }
    delay(500);
}