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
    int screen = 0;

    int distance_miles, days_left;
    char tmp[64];

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
    void center_text(const char *buf, int x, int y){
        int16_t x1, y1;
        uint16_t w, h;
        display.getTextBounds(buf, 0, y, &x1, &y1, &w, &h); //calc width of new string
        display.setCursor(x - w / 2, y);
        display.print(buf);
    }
    void incrementScreen(){
        screen = (screen + 1) % 4;
    }
    void redraw(){
        init_screen();
        if(screen == 0){
            start_screen();
            display_wifi();
        }else if(screen == 1){
            draw_buffer();
            display.setCursor(0, 0);
            display.setTextSize(1);
            display.print("Drawing");
            if(!connected){
                display.print("(No WiFi)");
            }
        }else if(screen == 2){
            draw_buffer();
            display.setTextSize(1);
            center_text("Pookie is", 48, 0);
            snprintf(tmp, 64, "%d mi away", distance_miles);
            center_text(tmp, 48, 8);
        }else if(screen == 3){
            display.setTextSize(1);
            center_text("only", 48, 0);
            display.setTextSize(4);
            snprintf(tmp, 64, "%d", days_left);
            center_text(tmp, 48, 18);
            display.setTextSize(1);
            center_text("days left!!", 48, 56);
        }
    }
} display;

#endif 