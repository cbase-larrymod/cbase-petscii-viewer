// Minimal `vscode` stub so the extension-host modules can be required in plain Node.
//
// out/viewKeys.js imports vscode at module scope, so it cannot be required without this. Only
// what is touched during module load is stubbed — nothing else, so a test that strays into
// untested territory fails loudly rather than silently doing nothing.

const Module = require('module');

let installed = false;

function install() {
    if (installed) { return; }
    installed = true;
    const orig = Module._load;
    const noop = () => {};
    const stub = {
        commands: { registerCommand: () => ({ dispose: noop }), executeCommand: noop },
        window: {},
        workspace: {},
        Uri: {},
    };
    Module._load = function (request, parent, isMain) {
        if (request === 'vscode') { return stub; }
        return orig.apply(this, arguments);
    };
}

module.exports = { install };
