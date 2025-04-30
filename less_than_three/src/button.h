#include <Arduino.h>

struct Button {
    int pin;
    int value;
    void setup(int pin){
        this->pin = pin;
        pinMode(pin, INPUT_PULLUP);
    }
    int read(){
        int cur_value = !digitalRead(pin);
        int ret = 0;
        if(cur_value == 1 && value == 0){
            ret = 1;
        }
        value = cur_value;
        return ret;
    }
};