dirpicker:
ifeq (,$(wildcard dist))
	mkdir dist
endif

ifeq ($(OS),Windows_NT)
ifeq (,$(wildcard app.res))
	windres app.rc -O coff -o app.res
endif
	g++ -o ./dist/dirpicker main.cpp nfd-ext/src/nfd_win.cpp -I nfd-ext/src/include app.res -lole32 -luuid -lshell32
else
	g++ -o ./dist/dirpicker main.cpp nfd-ext/src/nfd_gtk.cpp -I nfd-ext/src/include $(shell pkg-config --cflags --libs gtk+-3.0)
endif