export function init(context) {
    // Whenever "hello, [name]!" appears in the console this will fire
    context.watchConsole(/hello (\w+)!/g, (data) => {
        context.log.info("Hello,", data[1]);
    });
}