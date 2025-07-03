// Placeholder for IDE logic
console.log("IDE Script Loaded"); 

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const fileListElement = document.getElementById('file-list');
    const editorContainer = document.getElementById('editor-container');
    const runButton = document.getElementById('run-button');
    const resetButton = document.getElementById('reset-button');
    const webPreviewArea = document.getElementById('web-preview-area');
    const previewFrame = webPreviewArea.querySelector('iframe');
    const terminalLogOutputElement = document.getElementById('terminal-log-output');
    const tabBarElement = document.getElementById('tab-bar');

    // --- Menu Bar Elements ---
    const menuRun = document.getElementById('menu-run');
    const menuFileTrigger = document.getElementById('menu-file-trigger');
    const fileResetCurrent = document.getElementById('file-reset-current');
    const fileResetAll = document.getElementById('file-reset-all'); // Get the new menu item
    const menuViewTrigger = document.getElementById('menu-view-trigger');
    const viewToggleSidebar = document.getElementById('view-toggle-sidebar');
    const menuHelpTrigger = document.getElementById('menu-help-trigger');
    const helpAbout = document.getElementById('help-about');
    const fileSidebar = document.getElementById('file-sidebar'); // For toggling view
    const menuEditTrigger = document.getElementById('menu-edit-trigger'); // Added
    const editUndo = document.getElementById('edit-undo'); // Added
    const editRedo = document.getElementById('edit-redo'); // Added
    const viewToggleThemeItem = document.getElementById('view-toggle-theme'); // New menu item

    // --- File Input Elements (for Open File/Folder) ---
    const fileOpenItem = document.getElementById('file-open-file');
    const folderOpenItem = document.getElementById('file-open-folder');
    const fileInputSingle = document.getElementById('file-input-single');
    const fileInputFolder = document.getElementById('file-input-folder');
    const newFileMenuItem = document.getElementById('file-new-file');
    const saveFileMenuItem = document.getElementById('file-save-file'); // New menu item for Save
    const closeFileMenuItem = document.getElementById('file-close-file'); // New menu item

    // --- Application State ---
    // Store the absolute original files that the IDE starts with
    const originalDefaultFiles = Object.freeze(JSON.parse(JSON.stringify({
        'hello.py': {
            content: `# Welcome to Python!
# Try changing the message below and click Run.
print("Hello, Python World!")
print("This output goes to the console.")`,
            language: 'python',
            type: 'python'
        },
        'fireworks 2/index.html': {
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fireworks Name Demo</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1 id="title">Fireworks Name Celebration!</h1>
        <div id="instructions">
            Enter your name and click the button to start your personalized fireworks!
        </div>
        <button id="startButton">Launch My Fireworks!</button>
        <div id="countdown" class="hidden"></div>
        <div id="message" class="hidden"></div>
        <div id="fireworks-container"></div>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
            language: 'xml', 
            type: 'web'
        },
        'fireworks 2/style.css': {
            content: `* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Arial Rounded MT Bold', 'Arial', sans-serif;
}

body {
    background-color: #121212;
    color: #ffffff;
    height: 100vh;
    overflow: hidden;
}

.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
    padding: 20px;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: #ff6b6b;
    text-shadow: 0 0 10px #ff6b6b;
}

#instructions {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    color: #4ecdc4;
    max-width: 80%;
}

button {
    background-color: #ff6b6b;
    color: white;
    border: none;
    border-radius: 50px;
    padding: 12px 30px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 0 15px rgba(255, 107, 107, 0.5);
}

button:hover {
    background-color: #ff8e8e;
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(255, 107, 107, 0.7);
}

.hidden {
    display: none;
}

#countdown {
    font-size: 6rem;
    font-weight: bold;
    color: #ffbe0b;
    text-shadow: 0 0 20px #ffbe0b;
    animation: pulse 1s infinite alternate;
}

#message {
    font-size: 2.5rem;
    line-height: 1.4;
    max-width: 80%;
    margin: 0 auto;
    word-wrap: break-word;
    animation: rainbow 5s infinite;
    position: relative; /* To ensure it can stack above fireworks if any */
    z-index: 2; /* Higher than fireworks-container */
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }
    100% {
        transform: scale(1.1);
    }
}

@keyframes rainbow {
    0% { color: #ff595e; }
    14% { color: #ffca3a; }
    28% { color: #8ac926; }
    42% { color: #1982c4; }
    57% { color: #6a4c93; }
    71% { color: #f15bb5; }
    85% { color: #00bbf9; }
    100% { color: #ff595e; }
}

#fireworks-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* So it doesn't interfere with underlying content if any */
    z-index: 1; /* Behind message but above background */
    overflow: hidden;
}

.firework {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transform-origin: center;
    animation: explode 1s forwards;
}

@keyframes explode {
    0% {
        transform: scale(0);
        opacity: 1;
    }
    100% {
        transform: scale(20);
        opacity: 0;
    }
}

.particle {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    animation: fly 1s forwards;
}

@keyframes fly {
    0% {
        transform: translate(0, 0);
        opacity: 1;
    }
    100% {
        transform: translate(var(--tx), var(--ty));
        opacity: 0;
    }
}`,
            language: 'css',
            type: 'web'
        },
        'fireworks 2/script.js': {
            content: `// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const startButton = document.getElementById('startButton');
    const countdownElement = document.getElementById('countdown');
    const messageElement = document.getElementById('message');
    const instructionsElement = document.getElementById('instructions');
    const titleElement = document.getElementById('title');
    const fireworksContainer = document.getElementById('fireworks-container');
    
    // Start button click handler
    startButton.addEventListener('click', function() {
        // Get the student's name
        const name = prompt('What is your name?');
        
        // Continue only if a name was entered
        if (name && name.trim() !== '') {
            // Hide instructions and button
            if(startButton) startButton.classList.add('hidden');
            if(instructionsElement) instructionsElement.classList.add('hidden');
            if(titleElement) titleElement.classList.add('hidden');
            
            // Show countdown
            if(countdownElement) countdownElement.classList.remove('hidden');
            
            // Start countdown
            startCountdown(name);
        }
    });
    
    // Function to handle the countdown and show fireworks
    function startCountdown(name) {
        let count = 3;
        
        if(countdownElement) countdownElement.textContent = count;
        
        const countdownInterval = setInterval(function() {
            count--;
            
            if (count > 0) {
                if(countdownElement) countdownElement.textContent = count;
            } else {
                clearInterval(countdownInterval);
                
                if(countdownElement) countdownElement.textContent = '💥 BOOM 💥';
                
                setTimeout(function() {
                    if(countdownElement) countdownElement.classList.add('hidden');
                    
                    if(messageElement) {
                        messageElement.innerHTML = \`🎆🎇 You're amazing, \${name}! 🎇🎆\`;
                        messageElement.classList.remove('hidden');
                    }
                    
                    createFireworks();
                    
                    setTimeout(function() {
                        if(startButton) startButton.classList.remove('hidden');
                        if(instructionsElement) instructionsElement.classList.remove('hidden');
                        if(titleElement) titleElement.classList.remove('hidden');
                        if(messageElement) messageElement.classList.add('hidden');
                        clearFireworks();
                    }, 10000); // Reset after 10 seconds
                }, 1500);
            }
        }, 1000);
    }
    
    // Function to create fireworks
    function createFireworks() {
        for (let i = 0; i < 30; i++) { // Increased for better spread
            setTimeout(function() {
                createSingleFirework();
            }, i * 200); // Stagger fireworks
        }
    }
    
    // Function to create a single firework
    function createSingleFirework() {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.2;
        
        const firework = document.createElement('div');
        firework.classList.add('firework');
        firework.style.left = \`\${x}px\`;
        firework.style.top = \`\${y}px\`;
        
        const colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#f15bb5', '#00bbf9'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        firework.style.backgroundColor = color;
        
        if(fireworksContainer) fireworksContainer.appendChild(firework);
        
        createParticles(x, y, color);
        
        setTimeout(function() {
            firework.remove();
        }, 1000);
    }
    
    // Function to create particles for a firework
    function createParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = \`\${x}px\`;
            particle.style.top = \`\${y}px\`;
            particle.style.backgroundColor = color;
            
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', \`\${tx}px\`);
            particle.style.setProperty('--ty', \`\${ty}px\`);
            
            if(fireworksContainer) fireworksContainer.appendChild(particle);
            
            setTimeout(function() {
                particle.remove();
            }, 1000);
        }
    }
    
    // Function to clear all fireworks and particles
    function clearFireworks() {
        if(fireworksContainer) fireworksContainer.innerHTML = '';
    }
});`,
            language: 'javascript',
            type: 'web'
        }
    })));

    // Current working set of files (initially a copy of defaults, can be expanded by opening files)
    let files = JSON.parse(JSON.stringify(originalDefaultFiles));
    // For "Reset Current File", stores the initial state of a file AT THE POINT IT WAS LOADED (either default or from disk)
    let initialFileStates = JSON.parse(JSON.stringify(originalDefaultFiles));

    let activeFile = null; // This will now represent the filename in the active tab
    let openTabs = []; // Array of filenames for open tabs
    let editor = null; // To hold the CodeMirror instance
    let pyodide = null; // To hold the Pyodide instance

    // --- Theme Management ---
    const lightCodeMirrorTheme = 'neo'; // Or 'default' or any other light theme you prefer
    const darkCodeMirrorTheme = 'material-darker';
    let currentTheme = 'light'; // Default to light

    function applyTheme(theme) {
        currentTheme = theme;
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme'); // Just in case
            if (editor) editor.setOption("theme", darkCodeMirrorTheme);
            localStorage.setItem('ideTheme', 'dark');
            console.log("Switched to Dark Theme");
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme'); // Add a light-theme class for explicitness if needed
            if (editor) editor.setOption("theme", lightCodeMirrorTheme);
            localStorage.setItem('ideTheme', 'light');
            console.log("Switched to Light Theme");
        }
        if (editor) editor.refresh(); // Refresh editor after theme change
    }

    function toggleTheme() {
        applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    }

    function loadSavedTheme() {
        const savedTheme = localStorage.getItem('ideTheme');
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            applyTheme('dark'); // Default to dark if nothing saved, or choose 'light'
        }
    }

    // --- Initialize CodeMirror ---
    function initializeEditor() {
        editor = CodeMirror(editorContainer, {
            lineNumbers: true,
            mode: 'xml', // Default mode
            theme: 'material-darker',
            tabSize: 2,
            lineWrapping: true,
            autofocus: true,
            // Addons can be included here if needed (e.g., autoCloseBrackets)
        });
        // Refresh editor size when it's first created
        setTimeout(() => editor.refresh(), 1);

         // Save content changes back to our 'files' object
         editor.on('change', () => {
            if (activeFile) {
                files[activeFile].content = editor.getValue();
            }
        });
    }

    // --- Populate File List (Sidebar) ---
    function populateFileList() {
        fileListElement.innerHTML = ''; // Clear existing list
        Object.keys(files).forEach(filename => {
            const li = document.createElement('li');
            li.textContent = filename;
            li.dataset.filename = filename;
            // When a file in the sidebar is clicked, open it in a tab
            li.addEventListener('click', () => openFileInTab(filename));
            fileListElement.appendChild(li);
        });
        // Highlight active file in sidebar (will be refined later)
        updateSidebarActiveHighlight();
    }

    // --- Populate Tab Bar ---
    function populateTabBar() {
        tabBarElement.innerHTML = ''; // Clear existing tabs
        openTabs.forEach(filename => {
            if (!files[filename]) {
                console.warn(`File ${filename} is in openTabs but not in files object. Skipping tab.`);
                return;
            }
            const tab = document.createElement('div');
            tab.className = 'tab-item';
            tab.dataset.filename = filename;
            tab.textContent = filename.split('/').pop(); // Show only the file name, not full path in tab

            if (filename === activeFile) {
                tab.classList.add('active');
            }

            // Close button for the tab
            const closeBtn = document.createElement('button');
            closeBtn.className = 'tab-close-btn';
            closeBtn.innerHTML = '&times;'; // x symbol
            closeBtn.title = `Close ${filename}`;
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent tab click event when close button is clicked
                closeTab(filename);
            });

            tab.appendChild(closeBtn);
            tab.addEventListener('click', () => switchToTab(filename));
            tabBarElement.appendChild(tab);
        });
        updateSidebarActiveHighlight(); // Keep sidebar highlight in sync
    }

    // --- Open File in Tab ---
    function openFileInTab(filename) {
        if (!files[filename]) {
            console.error(`Cannot open ${filename} in tab: File not found in 'files' object.`);
            return;
        }
        if (!openTabs.includes(filename)) {
            openTabs.push(filename); // Add to open tabs if not already there
        }
        switchToTab(filename); // Switch to it (this will also update editor and populate tab bar)
    }

    // --- Switch to Tab (and load file content) ---
    function switchToTab(filename) {
        if (!files[filename]) {
            console.error(`Cannot switch to ${filename}: File not found.`);
            // Potentially remove from openTabs if it refers to a non-existent file
            const tabIndex = openTabs.indexOf(filename);
            if (tabIndex > -1) openTabs.splice(tabIndex, 1);
            populateTabBar(); // Re-render tabs
            return;
        }

        activeFile = filename;
        editor.setValue(files[filename].content);
        editor.setOption('mode', files[filename].language);
        
        console.log(`Switched to tab/file: ${filename}`);
        populateTabBar(); // Re-render tabs to show active state
        updateEditorAndOutputVisibility(); // Update visibility of preview/console
        
        setTimeout(() => editor.refresh(), 1); // Refresh editor
    }

    // --- Close Tab ---
    function closeTab(filenameToClose) {
        const index = openTabs.indexOf(filenameToClose);
        if (index > -1) {
            openTabs.splice(index, 1);
            console.log(`Closed tab: ${filenameToClose}`);

            if (activeFile === filenameToClose) { // If the closed tab was active
                if (openTabs.length > 0) {
                    // Switch to the new last tab, or the first one if it was the first
                    switchToTab(openTabs[Math.max(0, index -1)]); 
                } else {
                    activeFile = null;
                    editor.setValue('// All tabs closed. Open a file from the sidebar or File menu.');
                    editor.setOption('mode', 'text/plain');
                    webPreviewArea.style.display = 'none';
                    terminalLogOutputElement.style.display = 'none';
                }
            }
            populateTabBar(); // Re-render the tab bar
        } else {
            console.warn(`Attempted to close tab for ${filenameToClose}, but it was not found in openTabs.`);
        }
    }
    
    // --- Helper to update editor and output visibility based on active file type ---
    function updateEditorAndOutputVisibility() {
        if (!activeFile || !files[activeFile]) {
            webPreviewArea.style.display = 'none';
            terminalLogOutputElement.style.display = 'none';
            return;
        }
        const fileType = files[activeFile].type;
        
        if (fileType === 'web') {
            webPreviewArea.style.display = 'flex';
        } else if (fileType === 'python') {
            webPreviewArea.style.display = 'none';
            terminalLogOutputElement.textContent = `// Python console ready for: ${activeFile}. Output will appear here.`;
        } else {
            webPreviewArea.style.display = 'none';
            terminalLogOutputElement.textContent = `// ${activeFile} is a ${fileType} file. No preview. Content in editor.`;
        }
    }

    // --- Helper to highlight active file in sidebar ---
    function updateSidebarActiveHighlight() {
        document.querySelectorAll('#file-list li').forEach(li => {
            li.classList.toggle('active', li.dataset.filename === activeFile && openTabs.includes(activeFile));
        });
    }

    // --- Helper to get project prefix from a file path ---
    function getProjectPrefix(filePath) {
        if (!filePath) return '';
        const lastSlash = filePath.lastIndexOf('/');
        if (lastSlash === -1) return ''; // No prefix, it's a root file
        return filePath.substring(0, lastSlash + 1); // Include the slash
    }

    // --- Build HTML for Project Preview ---
    function buildProjectPreviewHtml(projectPrefix) {
        // Ensure projectPrefix ends with a slash if it's not empty, and handle root case
        let prefix = projectPrefix;
        if (prefix && !prefix.endsWith('/')) {
            prefix += '/';
        }
        if (prefix === '/') prefix = ''; // Handle case where prefix might become just "/"

        const htmlFileToLoad = prefix + 'index.html';
        const cssFileToLoad = prefix + 'style.css';
        const jsFileToLoad = prefix + 'script.js';

        const htmlContent = files[htmlFileToLoad]?.content || `<!-- ${htmlFileToLoad} not found. Active file might not be part of a standard project structure. -->`;
        const cssContent = files[cssFileToLoad]?.content || '';
        const jsContent = files[jsFileToLoad]?.content || '';

        let finalHtml = htmlContent;

        // Crude removal of existing relative links/scripts to prevent conflicts
        // This assumes simple, common structures. Might need refinement for complex HTML.
        finalHtml = finalHtml.replace(/<link\s+[^>]*href\s*=\s*["'](style\.css)["'][^>]*>/gi, '');
        finalHtml = finalHtml.replace(/<script\s+[^>]*src\s*=\s*["'](script\.js)["'][^>]*><\/script>/gi, '');

        // Inject CSS
        if (cssContent) {
            if (finalHtml.includes('</head>')) {
                finalHtml = finalHtml.replace('</head>', `<style>\n${cssContent}\n</style>\n</head>`);
            } else {
                finalHtml = `<style>\n${cssContent}\n</style>\n` + finalHtml;
            }
        }

        // Inject JS
        if (jsContent) {
            if (finalHtml.includes('</body>')) {
                finalHtml = finalHtml.replace('</body>', `<script>\n${jsContent}\n</script>\n</body>`);
            } else {
                finalHtml += `\n<script>\n${jsContent}\n</script>`;
            }
        }
        return finalHtml;
    }

    // --- Run Code ---
    function runCode() {
        if (!activeFile) {
            alert("No active file to run.");
            return;
        }

        // Ensure latest content from editor is in our 'files' store for the active file
        if (files[activeFile] && editor) {
            files[activeFile].content = editor.getValue();
        }

        const fileType = files[activeFile]?.type;
        console.log(`Running ${activeFile} (type: ${fileType})`);

        // Hide/show relevant output panes based on new layout
        updateEditorAndOutputVisibility(); // This function now handles this

        if (fileType === 'web') {
            // webPreviewArea should already be visible via updateEditorAndOutputVisibility()
            const projectPrefix = getProjectPrefix(activeFile);
            const previewHtml = buildProjectPreviewHtml(projectPrefix);
            if (previewFrame) {
                previewFrame.srcdoc = previewHtml; 
            } else {
                console.error("Preview iframe not found!");
            }
        } else if (fileType === 'python') {
            // terminalLogOutputElement should be visible.
            // The actual Python execution is triggered by the runButton's primary event listener
            // if pyodide is loaded, it calls runPythonCode.
            // This part just ensures the console is primed.
            if (files[activeFile]) {
                // runPythonCode(files[activeFile].content); // No, runButton does this to avoid double run
                 terminalLogOutputElement.textContent = `Python console ready for file: ${activeFile}. Click Run to execute with Pyodide.`;
            } else {
                terminalLogOutputElement.textContent = '// No active Python file content to run.';
            }
        } else if (fileType === 'ftai' || fileType === 'text') {
            console.log(`No direct run action for ${fileType} file: ${activeFile}. Content is in editor.`);
            // Potentially show content in console for text files?
            // terminalLogOutputElement.style.display = 'block';
            // terminalLogOutputElement.textContent = files[activeFile]?.content || 'No content for this file type.';
        } else {
            console.warn(`Unknown file type or no run action defined for: ${activeFile}`);
        }
    }

    // --- Reset Code ---
    function resetCode() {
        if (!activeFile || !initialFileStates[activeFile]) return;

        // Restore content from the original definition FOR THAT FILE
        files[activeFile].content = initialFileStates[activeFile].content;
        editor.setValue(files[activeFile].content);
        console.log(`Reset ${activeFile} to its loaded state.`);
        // Optionally, re-run the code after reset? For now, just reset editor.
        // if (files[activeFile].type === 'web') {
        //     runCode(); // Re-render preview after reset
        // }
    }

    // --- Pyodide Setup (Placeholder) ---
    async function loadPyodideAndPackages() {
        // Dynamically load Pyodide script
        if (!window.loadPyodide) {
            terminalLogOutputElement.textContent = "Loading Pyodide runtime...";
             const pyodideScript = document.createElement('script');
             pyodideScript.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js"; // Use a specific recent version
             document.body.appendChild(pyodideScript);
             await new Promise(resolve => pyodideScript.onload = resolve);
        }

        if (!pyodide) {
             terminalLogOutputElement.textContent = "Initializing Pyodide (this may take a moment)...";
             pyodide = await window.loadPyodide();
            // Capture print statements to the new terminal log output
            pyodide.setStdout({ batched: (msg) => {
                terminalLogOutputElement.textContent += msg + "\n";
            }});
            pyodide.setStderr({ batched: (msg) => {
                terminalLogOutputElement.textContent += "Error: " + msg + "\n";
            }});
             terminalLogOutputElement.textContent = "Pyodide loaded successfully. Ready to run Python.\n---";
        }
        return pyodide;
    }

     async function runPythonCode(code) {
         if (!pyodide) {
             terminalLogOutputElement.textContent = "Loading Pyodide...\n";
             try {
                 await loadPyodideAndPackages();
             } catch (error) {
                 console.error("Failed to load Pyodide:", error);
                 terminalLogOutputElement.textContent += "\nFailed to load Pyodide. Check console.";
                 return;
             }
         }

         terminalLogOutputElement.textContent = "Running Python code...\n---\n"; // Clear previous output for Python run

         try {
             await pyodide.runPythonAsync(code);
             // terminalLogOutputElement.textContent is appended to by pyodide.setStdout directly
             terminalLogOutputElement.textContent += "\n---\nExecution finished.";
         } catch (error) {
             console.error("Python execution error:", error);
             terminalLogOutputElement.textContent += `\n---\nError: ${error.message}`;
         }
         // DO NOT add unrelated logic here
     }


    // --- Event Listeners ---
    runButton.addEventListener('click', () => {
         if (activeFile && files[activeFile].type === 'python') {
             runPythonCode(editor.getValue());
         } else {
            runCode();
         }
    });
    resetButton.addEventListener('click', resetCode);

    // --- Menu Functionality ---
    function setupMenuActions() {
        // Direct Run action
        menuRun.addEventListener('click', () => {
            if (activeFile && files[activeFile].type === 'python') {
                runPythonCode(editor.getValue());
            } else {
                runCode();
            }
        });

        // File -> Reset Current
        fileResetCurrent.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent # link navigation
            resetCode();
            closeAllDropdowns();
        });

        // File -> Reset All Files
        fileResetAll.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to reset all files and clear any opened files? This will revert to the original sample files.")) {
                files = JSON.parse(JSON.stringify(originalDefaultFiles));
                initialFileStates = JSON.parse(JSON.stringify(originalDefaultFiles));
                populateFileList(); // This will become populateTabs() later
                if (Object.keys(files).length > 0) {
                    openFileInTab(Object.keys(files)[0]); // Open the first default file in a tab
                }
                if (previewFrame) previewFrame.srcdoc = '<!-- Preview cleared -->';
                terminalLogOutputElement.textContent = '// Console cleared';
                console.log("Reset all files to original defaults.");
            }
            closeAllDropdowns();
        });

        // View -> Toggle Sidebar
        viewToggleSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            fileSidebar.style.display = (fileSidebar.style.display === 'none') ? 'block' : 'none';
            // We might need to tell CodeMirror to refresh if the layout changes significantly
            setTimeout(() => editor.refresh(), 50); 
            closeAllDropdowns();
        });

        // Help -> About
        helpAbout.addEventListener('click', (e) => {
            e.preventDefault();
            alert('FolkTech Mini IDE v0.1\nCreated for educational purposes.\nHappy Coding!');
            closeAllDropdowns();
        });

        // Edit -> Undo
        editUndo.addEventListener('click', (e) => {
            e.preventDefault();
            if (editor) editor.undo();
            closeAllDropdowns();
        });

        // Edit -> Redo
        editRedo.addEventListener('click', (e) => {
            e.preventDefault();
            if (editor) editor.redo();
            closeAllDropdowns();
        });

        // View -> Toggle Theme
        viewToggleThemeItem.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
            closeAllDropdowns();
        });

        // Dropdown toggle logic
        [menuFileTrigger, menuEditTrigger, menuViewTrigger, menuHelpTrigger].forEach(trigger => {
            const dropdown = trigger.querySelector('.dropdown-content');
            if (dropdown) {
                trigger.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent click from closing it immediately
                    // Close other dropdowns before opening this one
                    closeAllDropdowns(dropdown); 
                    dropdown.classList.toggle('show');
                });
            }
        });

        // Close dropdowns if clicking outside
        window.addEventListener('click', (event) => {
            if (!event.target.matches('.menu-item') && !event.target.closest('.menu-item')) {
                closeAllDropdowns();
            }
        });

        // File -> Open File
        fileOpenItem.addEventListener('click', (e) => {
            e.preventDefault();
            fileInputSingle.click(); // Trigger hidden file input
            closeAllDropdowns();
        });

        // File -> Open Folder
        folderOpenItem.addEventListener('click', (e) => {
            e.preventDefault();
            fileInputFolder.click(); // Trigger hidden folder input
            closeAllDropdowns();
        });

        // File -> New File
        newFileMenuItem.addEventListener('click', (e) => {
            e.preventDefault();
            handleNewFile();
            closeAllDropdowns();
        });

        // File -> Save File
        saveFileMenuItem.addEventListener('click', (e) => {
            e.preventDefault();
            handleSaveFile();
            closeAllDropdowns();
        });

        // File -> Close File
        closeFileMenuItem.addEventListener('click', (e) => {
            e.preventDefault();
            if (activeFile) {
                closeTab(activeFile);
            }
            closeAllDropdowns();
        });
    }

    function closeAllDropdowns(exceptThisOne = null) {
        document.querySelectorAll('.dropdown-content').forEach(dropdown => {
            if (dropdown !== exceptThisOne) {
                dropdown.classList.remove('show');
            }
        });
    }

    // --- Utility to guess language from filename ---
    function getLanguageMode(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        switch (extension) {
            case 'html': case 'htm': return 'xml'; // or 'htmlmixed' if using mixed mode addon
            case 'css': return 'css';
            case 'js': return 'javascript';
            case 'py': return 'python';
            case 'md': case 'markdown': case 'ftai': return 'markdown';
            case 'json': return 'application/json';
            case 'xml': return 'xml';
            case 'txt': return 'text/plain';
            default: return 'null'; // CodeMirror's plain text mode
        }
    }

    // --- Handle Single File Open ---
    function handleFileOpen(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const filename = file.name;
            const language = getLanguageMode(filename);
            let fileType = 'web'; // Default, can be refined
            if (language === 'python') fileType = 'python';
            else if (language === 'markdown') fileType = 'ftai'; // Assuming .ftai uses markdown mode

            // Add to our in-memory store
            // Note: This doesn't save to initialFiles, so reset won't work on opened files
            // unless we explicitly add logic for that.
            files[filename] = { content, language, type: fileType };
            initialFileStates[filename] = { content, language, type: fileType }; // Also add to initial for reset

            populateFileList(); // Refresh sidebar
            openFileInTab(filename); // Switch to the new file
            console.log(`Opened file: ${filename}`);
        };
        reader.onerror = (e) => {
            console.error("Error reading file:", e);
            alert("Error reading file.");
        };
        reader.readAsText(file);
        event.target.value = null; // Reset input so change event fires again for same file
    }

    // --- Handle Folder Open ---
    function handleFolderOpen(event) {
        const selectedFiles = event.target.files;
        if (!selectedFiles || selectedFiles.length === 0) {
            console.log("handleFolderOpen: No files selected in folder or folder appears empty to the browser.");
            alert("No files were found in the selected folder, or the folder couldn't be accessed. Please ensure the folder contains readable files.");
            event.target.value = null; // Reset input
            return;
        }

        console.log(`handleFolderOpen: Folder selected. Number of file entries provided by browser: ${selectedFiles.length}`);

        let firstFileFullName = null; // Store the full name of the first file to be potentially opened
        let filesLoadedCount = 0;
        const totalFilesToProcess = selectedFiles.length;
        const newlyLoadedFileNames = []; // Keep track of files loaded in this operation

        // Optional: Clear existing files if you want "Open Folder" to replace current workspace
        // files = {};
        // initialFiles = {}; 
        // console.log("handleFolderOpen: Cleared existing workspace files.");

        Array.from(selectedFiles).forEach(file => {
            const reader = new FileReader();
            // file.webkitRelativePath includes the path within the selected folder if available.
            const filename = file.webkitRelativePath || file.name;
            
            console.log(`handleFolderOpen: Attempting to read file: '${filename}' (Size: ${file.size} bytes, Type: ${file.type})`);

            reader.onload = (e) => {
                const content = e.target.result;
                const language = getLanguageMode(filename);
                let fileType = 'web'; // Default type
                if (language === 'python') fileType = 'python';
                else if (language === 'markdown') fileType = 'ftai'; // Assuming .ftai uses markdown mode

                files[filename] = { content, language, type: fileType };
                initialFileStates[filename] = { content, language, type: fileType }; // Also add to initial for reset
                newlyLoadedFileNames.push(filename);

                console.log(`handleFolderOpen: Successfully read and stored: '${filename}'`);

                if (!firstFileFullName) {
                    firstFileFullName = filename;
                }
                filesLoadedCount++;

                if (filesLoadedCount === totalFilesToProcess) {
                    populateFileList(); // Update the sidebar with all files (old and new)
                    if (firstFileFullName && files[firstFileFullName]) {
                        openFileInTab(firstFileFullName);
                    }
                    console.log(`handleFolderOpen: Finished loading ${filesLoadedCount} files from folder.`);
                    alert(`Loaded ${newlyLoadedFileNames.length} files from the selected folder: \n${newlyLoadedFileNames.join('\n')}`);
                }
            };
            reader.onerror = (err) => {
                console.error(`handleFolderOpen: Error reading file '${filename}':`, err);
                filesLoadedCount++; // Still count it as processed to not hang indefinitely
                if (filesLoadedCount === totalFilesToProcess) {
                    populateFileList();
                    let fileToSwitchTo = null;
                    if (firstFileFullName && files[firstFileFullName]) { // If the intended first file loaded
                        fileToSwitchTo = firstFileFullName;
                    } else if (newlyLoadedFileNames.length > 0 && files[newlyLoadedFileNames[0]]) { // Or the first successfully loaded new file
                        fileToSwitchTo = newlyLoadedFileNames[0];
                    } else if (Object.keys(files).length > 0) { // Or any file if no new ones loaded
                        fileToSwitchTo = Object.keys(files)[0];
                    }
                    if(fileToSwitchTo) openFileInTab(fileToSwitchTo);
                    alert(`Finished processing folder. Some files may have failed to load. ${newlyLoadedFileNames.length} files were loaded successfully.`);
                }
            };
            reader.readAsText(file);
        });
        event.target.value = null; // Reset input so change event fires again for same folder
    }

    // --- Handle New File Creation ---
    function handleNewFile() {
        let newFilename = prompt("Enter filename (e.g., myCode.js, page.html, notes.txt):", "untitled.txt");
        if (!newFilename) {
            console.log("New file creation cancelled.");
            return;
        }

        // Basic validation: check for empty and duplicates
        if (newFilename.trim() === "") {
            alert("Filename cannot be empty.");
            return;
        }
        if (files[newFilename]) {
            alert(`File "${newFilename}" already exists. Please choose a different name.`);
            return;
        }

        const language = getLanguageMode(newFilename);
        let fileType = 'web'; // Default, could be 'text' or inferred
        if (language === 'python') fileType = 'python';
        else if (language === 'markdown') fileType = 'ftai';
        else if (language === 'null' || language === 'text/plain') fileType = 'text'; // For .txt or unknown

        files[newFilename] = { content: "", language, type: fileType };
        initialFileStates[newFilename] = { content: "", language, type: fileType }; // For reset

        populateFileList();    // Update the sidebar
        openFileInTab(newFilename); // Open the new file in a tab
        console.log(`Created and opened new file: ${newFilename}`);
    }

    // --- Handle File Save ---
    function handleSaveFile() {
        if (!activeFile || !files[activeFile]) {
            alert("No active file to save, or file content is missing.");
            return;
        }

        const filenameToSave = activeFile.split('/').pop(); // Use just the filename, not the full path for download
        const contentToSave = files[activeFile].content;
        const mimeType = files[activeFile].language === 'xml' ? 'text/html' :
                         files[activeFile].language === 'css' ? 'text/css' :
                         files[activeFile].language === 'javascript' ? 'application/javascript' :
                         files[activeFile].language === 'python' ? 'text/x-python' :
                         files[activeFile].language === 'markdown' ? 'text/markdown' :
                         'text/plain';

        const blob = new Blob([contentToSave], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filenameToSave;
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href); // Clean up

        console.log(`Attempted to save file: ${filenameToSave}`);
        // Note: We don't get direct feedback if the user actually saved or cancelled the dialog.
    }

    // --- Initial Setup ---
    initializeEditor();
    populateFileList();
    setupMenuActions(); // Initialize menu actions
    loadSavedTheme(); // Load theme on startup

    // --- Event Listeners for File Inputs ---
    fileInputSingle.addEventListener('change', handleFileOpen);
    fileInputFolder.addEventListener('change', handleFolderOpen);

    // Select and display the first file by default
    if (Object.keys(files).length > 0) {
        openFileInTab(Object.keys(files)[0]);
    } else {
        console.error("No files defined.")
         editor.setValue("// No files found!");
    }

     // Pre-load pyodide silently in the background? Or wait for first Python run?
     // loadPyodideAndPackages(); // Optional: load on page load

});

// Ensure CodeMirror measures itself correctly after initial layout
window.addEventListener('load', () => {
    if (editor) {
        editor.refresh();
    }
}); 