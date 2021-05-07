# coc-tighten-lint

[tlint](https://github.com/tighten/tlint) (Tighten linter for Laravel) extension for coc.nvim.

<img width="780" alt="coc-tighten-lint-demo" src="https://user-images.githubusercontent.com/188642/117405138-10d68d80-af46-11eb-92f8-8af825546a9a.gif">

## Install

**vim-plug**:

```vim
Plug 'yaegassy/coc-curlylint', {'do': 'yarn install --frozen-lockfile'}
```

**CocInstall**:

> TODO

## Features

- Linter by `tlint lint`
- CodeAction (autoFix) by `tlint format`
- Built-in installer
- Supports `tlint.json` configuration file

## Detect tool: tlint

1. `tighten-lint.toolPath` setting
1. `vender/bin/lint` (project)
1. builtin (Installation commands are also provided)
   - Mac/Linux: ~/.config/coc/extensions/coc-tighten-lint-data/tlint/vendor/bin/tlint
   - Windows: ~/AppData/Local/coc/extensions/coc-tighten-lint-data/tlint/vendor/bin/tlint

## Bult-in install

```vim
:CocComannd tighten-lint.install
```

## Activation Events

- `"onLanguage:php"`
- `"onLanguage:blade"`

## Configuration options

- `tighten-lint.enable`: Enable coc-tighten-lint extension, default: `true`
- `tighten-lint.toolPath`: The path to the tlint (Absolute path), default: `""`
- `tighten-lint.lintOnOpen`: Lint file on opening, default: `true`
- `tighten-lint.lintOnChange`: Lint file on change, default: `true`
- `tighten-lint.lintOnSave`: Lint file on save, default: `true`
- `tighten-lint.defaultSeverity`: Severity of violations, valid option `"error", "warning", "info", "hint"`, default: `"error"`
- `tighten-lint.severities`: Source to severity mappings, default: `{}`
- `tighten-lint.only`: Policies to include, default: `[]`

### Example Configuration ("coc-settings.json" or ".vim/coc-settings.json")

```jsonc
{
  // ...snip
  "tighten-lint.defaultSeverity": "warning",
  "tighten-lint.only": [
      "AlphabeticalImports",
      "NoInlineVarDocs",
      "ImportFacades"
  ],
  "tighten-lint.severities": {
      "NoInlineVarDocs": "info"
  },
  // ...snip
}
```

### tlint.json configuration file

If you wish to use a [configuration file](https://github.com/tighten/tlint#configuration) you should place the `tlint.json` file in the root of your project folder in the required format e.g.

**example: tslint.json**

```json
{
    "preset": "laravel",
    "disabled": ["NoInlineVarDocs"],
    "excluded": ["tests/"]
}
```

## Commands

- `tighten-lint.install`: Install tlint

## Code Actions

- `Run: tighten-lint.autFix`

## Thanks

- [tighten/tlint](https://github.com/tighten/tlint)
- [d9705996/vscode-tighten-lint](https://github.com/d9705996/vscode-tighten-lint)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
