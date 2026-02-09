// Echoing "tfview.count()" in the console will make you say "This is message [x]"
// Where x counts up by one after each message
let count = 0;

export function init(context) {
    context.log.info("Count script initialized");
}

export function run(context) {
    context.rcon.run(`say_team This is message ${++count}`);
}

export function close(context) {
    context.log.info("Count script closed");
}