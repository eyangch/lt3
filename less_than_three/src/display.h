#ifndef LT3_DISPLAY
#define LT3_DISPLAY

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1331.h>
#include <SPI.h>

#define sclk D5
#define mosi D7
#define cs   D2
#define rst  D3
#define dc   D1

#define	BLACK           0x0000
#define	BLUE            0x001F
#define	RED             0xF800
#define	GREEN           0x07E0
#define CYAN            0x07FF
#define MAGENTA         0xF81F
#define YELLOW          0xFFE0
#define WHITE           0xFFFF

struct {
    Adafruit_SSD1331 display = Adafruit_SSD1331(&SPI, cs, dc, rst);
    const char *SSID, *status;
    uint16_t buffer[64*96];
    bool connected = false;
    void begin(){
        display.begin();
    }
    void init_screen(){
        display.fillScreen(BLACK);
    }
    void set_wifi(const char* SSID, const char *status){
        this->SSID = SSID;
        this->status = status;
    }
    void display_wifi(){
        display.setCursor(0, 48);
        display.printf("%s:\n%s", status, SSID);
    }
    void start_screen(){
        display.setCursor(0,0);
        display.setTextSize(3);
        display.print("lt3\n");
        display.setTextSize(1);
        display.print("from eric\nto angela <3\n");
    }
    void draw_buffer(){
        display.startWrite();
        display.setAddrWindow(0, 0, 96, 64);
        display.writePixels(buffer, 64*96);
        display.endWrite();
    }
    void redraw(){
        init_screen();
        if(connected){
            draw_buffer();
        }else{
            start_screen();
        }
        display_wifi();
    }
} display;

#endif 