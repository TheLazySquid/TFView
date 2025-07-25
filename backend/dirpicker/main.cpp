#include <nfd.h>
#include <iostream>

int main(int argc, char *argv[]) {
    NFD_Init();

    nfdpickfolderu8args_t args = { 0 };
    if(argc > 0) args.defaultPath = argv[1];
    nfdu8char_t *outPath = nullptr;
    nfdresult_t result = NFD_PickFolderU8_With(&outPath, &args);
    
    if(result == NFD_OKAY) {
        std::cout << outPath;
        NFD_FreePathU8(outPath);
    }
    
    NFD_Quit();
}