#include <Arduino.h>
#include <stdio.h>
#include <string.h>

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

#include "connect_wifi.h"
#include "display.h"
#include "fetch.h"
#include "button.h"

#define BTN1 D4
#define BTN2 D6

char SSID[100] = "lt3";
char PASS[100] = "lt_three";

Button btn1, btn2;

void setup() {
    Serial.begin(9600);

    display.begin();
    display.set_wifi(SSID, connect_wifi.get_string_status());
    display.redraw();

    btn1.setup(BTN1);
    btn2.setup(BTN2);

    WiFi.mode(WIFI_AP_STA);

    connect_wifi.setup_server(SSID, PASS);

    connect_wifi.mountFS();
    connect_wifi.loadWiFi(SSID, PASS);
}

unsigned long last_displayed = 0;
unsigned long debug_displayed = 0;

void fetch_drawing(int force){
    if(millis() - last_displayed > 1000 && connect_wifi.get_status() == WL_CONNECTED){
        //Serial.println("Getting Version");
        if(fetch.compare_version_drawing() || force){
            //Serial.println("Downloading Image");
            if(fetch.download_drawing((uint8_t*)display.buffer)){
                Serial.println("Updated Image");
                display.redraw();
            }
            Serial.println("Finished Processing Image");
        }
        last_displayed = millis();
    }
}

void fetch_globe(){
    if(millis() - last_displayed > 100000 && connect_wifi.get_status() == WL_CONNECTED){
        display.distance_miles = fetch.download_miles();
        if(fetch.download_globe((uint8_t*)display.buffer)){
            Serial.println("Updated Globe");
            display.redraw();
        }
        Serial.println("Finished Processing Globe");
        last_displayed = millis();
    }
}

void fetch_days_left(){
    if(millis() - last_displayed > 100000 && connect_wifi.get_status() == WL_CONNECTED){
        display.days_left = fetch.download_days();
        display.redraw();
        Serial.println("Finished Processing Days Left");
        last_displayed = millis();
    }
}

void loop() {
    connect_wifi.process_server();
    if(display.screen == 1){
        fetch_drawing(0);
    }else if(display.screen == 2){
        fetch_globe();
    }else if(display.screen == 3){
        fetch_days_left();
    }
    if(btn2.read()){
        last_displayed = millis()-1000000;
        display.incrementScreen();
        if(display.screen == 0){
            display.redraw();
        }else if(display.screen == 1){
            fetch_drawing(1);
        }else if(display.screen == 2){
            fetch_globe();
        }else if(display.screen == 3){
            fetch_days_left();
        }
    }
    // Serial.printf("BTN1: %d, BTN2: %d\n\n", digitalRead(BTN1), digitalRead(BTN2));
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
    delay(50);
}