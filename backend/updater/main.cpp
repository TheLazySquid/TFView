#include <cstdlib>
#include <filesystem>
#include <iostream>
#include <chrono>
#include <thread>

using namespace std::filesystem;

// Most of the updating is actually handled by the main process
// The updater just gets called at the end to swap in the new executable
int main() {
    std::cout << "Updating TFView..." << std::endl;

    path oldPath, newPath;
    #ifdef _WIN32
    oldPath = current_path() / "tfview.exe";
    newPath = current_path() / "tfview_new.exe";
    #else
    oldPath = current_path() / "tfview";
    newPath = current_path() / "tfview_new";
    #endif

    // Double check the new executable exists
    if(!exists(newPath)) {
        std::cerr << "New executable not found at " << newPath << std::endl;
        return 1;
    }

    // Remove the old executable if needed
    if(exists(oldPath)) {
        int retryCount = 0;

        // Try for 10 seconds every 500ms since the old executable is
        // probably going to take a second to properly fully close
        while(true) {
            try {
                remove(oldPath);
                break;
            } catch (const filesystem_error& e) {
                retryCount++;
                if(retryCount > 20) {
                    std::cerr << "Error removing old executable: " << e.what() << std::endl;
                    return 1;
                }

                // Sleep 500ms and try again
                std::this_thread::sleep_for(std::chrono::milliseconds(500));
            }
        }
    }

    // Replace the old with the new
    try {
        rename(newPath, oldPath);
    } catch (const filesystem_error& e) {
        std::cerr << "Error replacing executable: " << e.what() << std::endl;
        return 1;
    }

    // Run the new executable detached
    #ifdef _WIN32
    system("start tfview.exe");
    #else
    system("chmod +x tfview");
    system("./tfview &");
    #endif
    
    return 0;
}