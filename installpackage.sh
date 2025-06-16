#!/sh/bash

# This script  uninstalls the existing extension
code --uninstall-extension mondricode-agent-0.0.4.vsix
if [ $? -ne 0 ]; then
    echo "Failed to uninstall the existing extension. Continuing with installation."
fi

# Removes the existing package file if it exists
rm mondricode-agent-0.0.4.vsix
if [ $? -ne 0 ]; then
    echo "Failed to remove the existing package file. Continuing with installation."
fi

# Packages the extension into a .vsix file
vsce package
if [ $? -ne 0 ]; then
    echo "Failed to package the extension. Please check the vsce command."
    exit 1
fi

# installs it.
code --install-extension mondricode-agent-0.0.4.vsix
if [ $? -ne 0 ]; then
    echo "Failed to install the extension. Please check the code command."
    exit 1
fi