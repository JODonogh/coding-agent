const { registerPanelCommand } = require('./extension/extension');

function activate(context) {
    registerPanelCommand(context);
}

module.exports = { activate };