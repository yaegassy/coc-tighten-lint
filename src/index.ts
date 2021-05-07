import {
  commands,
  DocumentSelector,
  ExtensionContext,
  languages,
  OutputChannel,
  TextEdit,
  window,
  workspace,
} from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import which from 'which';

import { tlintInstall } from './installer';
import { LintEngine } from './lint';
import { doFormat, fullDocumentRange } from './format';
import { TlintCodeActionProvider } from './action';

export async function activate(context: ExtensionContext): Promise<void> {
  const extensionConfig = workspace.getConfiguration('tighten-lint');
  const isEnable = extensionConfig.get<boolean>('enable', true);
  if (!isEnable) return;

  const extensionStoragePath = context.storagePath;
  if (!fs.existsSync(extensionStoragePath)) {
    fs.mkdirSync(extensionStoragePath);
  }

  const outputChannel = window.createOutputChannel('tighten-lint');

  context.subscriptions.push(
    commands.registerCommand('tighten-lint.install', async () => {
      await installWrapper(context, outputChannel);
    })
  );

  // 1. tightenLint.toolPath
  let toolPath = extensionConfig.get('toolPath', '');
  if (!toolPath) {
    if (fs.existsSync(path.join(workspace.root, 'vendor', 'bin', 'tlint'))) {
      // 2. Project's "tlint"
      toolPath = path.join(workspace.root, 'vendor', 'bin', 'tlint');
    } else if (fs.existsSync(path.join(context.storagePath, 'tlint', 'vendor', 'bin', 'tlint'))) {
      // 3. builtin "tlint"
      toolPath = path.join(context.storagePath, 'tlint', 'vendor', 'bin', 'tlint');
    }
  }

  // Install "tlint" if it does not exist.
  if (!toolPath) {
    await installWrapper(context, outputChannel);
    if (fs.existsSync(path.join(context.storagePath, 'tlint', 'vendor', 'bin', 'tlint'))) {
      toolPath = path.join(context.storagePath, 'tlint', 'vendor', 'bin', 'tlint');
    } else {
      return;
    }
  }

  const { subscriptions } = context;
  const engine = new LintEngine(toolPath, outputChannel);

  const onOpen = extensionConfig.get<boolean>('lintOnOpen');
  if (onOpen) {
    workspace.documents.map(async (doc) => {
      await engine.lint(doc.textDocument);
    });

    workspace.onDidOpenTextDocument(
      async (e) => {
        await engine.lint(e);
      },
      null,
      subscriptions
    );
  }

  const onChange = extensionConfig.get<boolean>('lintOnChange');
  if (onChange) {
    workspace.onDidChangeTextDocument(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (_e) => {
        const doc = await workspace.document;
        await engine.lint(doc.textDocument);
      },
      null,
      subscriptions
    );
  }

  const onSave = extensionConfig.get<boolean>('lintOnSave');
  if (onSave) {
    workspace.onDidSaveTextDocument(
      async (e) => {
        await engine.lint(e);
      },
      null,
      subscriptions
    );
  }

  context.subscriptions.push(
    commands.registerCommand(
      'tighten-lint.autoFix',
      async () => {
        const doc = await workspace.document;

        const code = await doFormat(toolPath, context, outputChannel, doc.textDocument, undefined);
        const edits = [TextEdit.replace(fullDocumentRange(doc.textDocument), code)];
        if (edits) {
          await doc.applyEdits(edits);
        }
      },
      null,
      true
    )
  );

  const languageSelector: DocumentSelector = [
    { language: 'php', scheme: 'file' },
    { language: 'blade', scheme: 'file' },
  ];
  const actionProvider = new TlintCodeActionProvider();
  context.subscriptions.push(languages.registerCodeActionProvider(languageSelector, actionProvider, 'tighten-lint'));
}

async function installWrapper(context: ExtensionContext, outputChannel: OutputChannel) {
  const msg = 'Install/Upgrade "tlint"?';
  context.workspaceState;

  let ret = 0;
  ret = await window.showQuickpick(['Yes', 'Cancel'], msg);
  if (ret === 0) {
    try {
      // composer command check
      const existsComposerCommandPath = await whichCmd('composer');
      if (!existsComposerCommandPath) {
        window.showErrorMessage('"composer" command not found');
        return;
      }

      // install
      await tlintInstall(context, outputChannel);
    } catch (e) {
      return;
    }
  } else {
    return;
  }
}

async function whichCmd(cmd: string): Promise<string> {
  try {
    return which.sync(cmd);
  } catch (error) {
    return '';
  }
}
