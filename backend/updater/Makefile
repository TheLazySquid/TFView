updater:
ifeq (,$(wildcard dist))
	mkdir dist
endif

ifeq ($(OS),Windows_NT)
ifeq (,$(wildcard app.res))
	windres app.rc -O coff -o app.res
endif
	g++ -o ../dist/unpacked/updater main.cpp app.res
else
	g++ -o ../dist/unpacked/updater main.cpp
endif