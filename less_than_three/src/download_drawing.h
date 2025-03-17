#include <WifiClient.h>
#include <ESP8266HTTPClient.h>

#include "display.h"

struct {
    const int WIDTH = 96;
    const int HEIGHT = 64;
    int version = 0;
    uint32_t drawing_hash = 0;
    const char* URL_version = "http://143.198.128.202/api/version?id=test";
    const char* URL_download = "http://143.198.128.202/api/download?id=test";
    uint32_t hash_combine(uint32_t lhs, uint32_t rhs){
        lhs ^= rhs + 0x9e3779b9 + (lhs << 6) + (lhs >> 2);
        return lhs;
    }
    bool compare_version(){
        WiFiClient client;
        HTTPClient http;
        http.begin(client, URL_version);
        int responseCode = http.GET();
        Serial.printf("Response Code: %d\n", responseCode);
        int version = this->version;
        if(responseCode){
            version = atoi(http.getString().c_str());
        }
        http.end();
        bool ret = (version != this->version);
        this->version = version;
        return ret;
    }
    int download(uint8_t *results){
        WiFiClient client;
        HTTPClient http;
        http.begin(client, URL_download);
        int responseCode = http.GET();
        Serial.printf("Response Code: %d\n", responseCode);
        bool diff = 0;
        if(responseCode){
            const uint8_t *response_str = (uint8_t*)http.getString().c_str();
            for(int i = 0; i < WIDTH * HEIGHT * 2; i++){
                diff |= (response_str[i] != results[i]);
            }
            memcpy(results, response_str, WIDTH * HEIGHT * 2);
        }
        http.end();
        return diff;
    }
} download_drawing;