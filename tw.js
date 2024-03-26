const chokidar = require("chokidar");
const { exec: childProcessExec } = require("child_process");

// Define the directories to watch
const watchDirs = ["./wwwroot", "./Views"];
const ignore = ["Tailwind.css", "lib"]

// Function to check if a file is a JS, CSHTML, or CSS file (excluding Tailwind.css)
function isWatchedFile(path) {
  const ext = path.split(".").pop().toLowerCase();
  return ([".js", ".cshtml", ".css"].includes(ext) && !path.endsWith("Tailwind.css"));
}

// Queue for pending build requests
const buildQueue = [];

// Function to execute Tailwind build command (replace with your actual command)
function buildTailwind() {
  if (buildQueue.length == 0) return; // Early exit if no build requests

  const nextBuild = buildQueue.shift();
  exec("npx tailwindcss -i ./wwwroot/css/site.css -o ./wwwroot/css/Tailwind.css", (error, stdout, stderr) => {
    if (error) {
      console.error("Error executing Tailwind CSS build command:", error);
    } else {
      console.log("Tailwind CSS build completed successfully.");
    }
    if (nextBuild) nextBuild();
  });
}

const watcher = chokidar.watch(watchDirs, {
    ignored: isWatchedFile, // Apply the filter function directly
    ignoreInitial: true,    // Ignore events for files present at initialization
    persistent: true,
  });

// Schedule build on change events
watcher.on("add", (filePath) => addToBuildQueue(filePath));
watcher.on("change", (filePath) => addToBuildQueue(filePath));
setInterval(()=>{
    if(buildQueue.length>0) buildTailwind();
},500);

// Function to add build request to the queue
function addToBuildQueue(filePath) {
  if (buildQueue.length < 1 && !ignore.some(item => filePath.includes(item))) {
      console.log("Added to build queue:", filePath);
      buildQueue.push(buildTailwind);
    } else {
      console.log("Skipping build request for:", filePath);
    }
  }

console.log(
  "Watching for changes in JS, CSHTML, and CSS files (excluding Tailwind.css) in ./wwwroot and ./View directories..."
);

// Update exec function to set the flag before and after execution
function exec(command, callback) {
  callback = callback || function () {}; // Ensure callback is defined
  // Set the flag before execution
  buildTailwind.isRunning = true;
  childProcessExec(command, (error, stdout, stderr) => {
    // Set the flag back to false after execution
    buildTailwind.isRunning = false;
    callback(error, stdout, stderr);
  });
}

// Add a property to track ongoing build
buildTailwind.isRunning = false;
