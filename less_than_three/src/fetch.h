#include <WiFiClient.h>
#include <ESP8266HTTPClient.h>

#include "display.h"

#define ID_STR "angguo"

struct {
    const int WIDTH = 96;
    const int HEIGHT = 64;
    int version = 0;
    uint32_t drawing_hash = 0;
    //const char* URL_version = "http://lt3.eyangch.me/api/version?id=" ID_STR;
    //const char* URL_download = "http://lt3.eyangch.me/api/download?id=" ID_STR;
    int get_int(const char *URL){
        WiFiClient client;
        HTTPClient http;
        http.begin(client, URL);
        int responseCode = http.GET();
        Serial.printf("Int Response Code: %d\n", responseCode);
        int resp = -1;
        if(responseCode){
            resp = atoi(http.getString().c_str());
        }
        http.end();
        return resp;
    }
    bool compare_version(const char *URL_version){
        int version = get_int(URL_version);
        bool ret = (version != this->version);
        this->version = version;
        return ret;
    }
    int download(const char *URL_download, uint8_t *results){
        WiFiClient client;
        HTTPClient http;
        http.begin(client, URL_download);
        int responseCode = http.GET();
        Serial.printf("Image Response Code: %d\n", responseCode);
        int res = 0;
        if(responseCode){
            const uint8_t *response_str = (uint8_t*)http.getString().c_str();
            memcpy(results, response_str, WIDTH * HEIGHT * 2);
            res = 1;
        }
        http.end();
        return res;
    }
    bool compare_version_drawing(){
        return compare_version("http://lt3.eyangch.me/api/version?id=" ID_STR);
    }
    int download_drawing(uint8_t *results){
        return download("http://lt3.eyangch.me/api/download?id=" ID_STR, results);
    }
    int download_miles(){
        return get_int("http://lt3.eyangch.me/api/get_distance?id=" ID_STR);
    }
    int download_days(){
        return get_int("http://lt3.eyangch.me/api/download_date?id=" ID_STR);
    }
    int download_globe(uint8_t *results){
        return download("http://lt3.eyangch.me/api/download_globe?id=" ID_STR, results);
    }
} fetch;