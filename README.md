# install
```bash
npm install -g @vscode/vsce
npm run compile
vsce package
code --install-extension "C:\sviluppo\git_repo\VSCodeExtensions\fwitd\fwitd-0.0.1.vsix"
# Ctrl+Shift+P → Reload Window
```

# fwitd README

this extension checks the function declarations for FW-components

## Features

1. register a diagnostics collection
1. watch HTML files
1. parse fw-* attributes
1. check JS files for matching methods

## Requirements

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

## Release Notes

### 1.0.0

Initial release
