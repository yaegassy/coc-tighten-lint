import { ExtensionContext, OutputChannel, Range, TextDocument, Uri, window, workspace } from 'coc.nvim';

import cp from 'child_process';
import fs from 'fs';
import path from 'path';
import tmp from 'tmp';

export async function doFormat(
  toolPath: string,
  context: ExtensionContext,
  outputChannel: OutputChannel,
  document: TextDocument,
  range?: Range
): Promise<string> {
  if (document.languageId !== 'php' && document.languageId !== 'blade') {
    throw 'tighten-lint.format cannot run, not a support filetype';
  }

  const fileName = Uri.parse(document.uri).fsPath;
  const text = document.getText(range);

  const args: string[] = [];
  const opts = { cwd: path.dirname(fileName) };

  args.push(toolPath);
  args.push('format');

  const tmpFile = tmp.fileSync();
  fs.writeFileSync(tmpFile.name, text);

  // ---- Output the command to be executed to channel log. ----
  outputChannel.appendLine(`${'#'.repeat(10)} tighten-lint format\n`);
  outputChannel.appendLine(`Cwd: ${opts.cwd}`);
  outputChannel.appendLine(`Run: php ${args.join(' ')} ${tmpFile.name}\n`);

  return new Promise(function (resolve) {
    cp.execFile('php', [...args, tmpFile.name], opts, function (err) {
      if (err) {
        tmpFile.removeCallback();

        if (err.code === 'ENOENT') {
          window.showErrorMessage('Unable to find the tighten-lint tool.');
          throw err;
        }

        window.showErrorMessage('There was an error while running tighten-lint.');
        throw err;
      }

      const text = fs.readFileSync(tmpFile.name, 'utf-8');
      tmpFile.removeCallback();

      resolve(text);
    });
  });
}

export function fullDocumentRange(document: TextDocument): Range {
  const lastLineId = document.lineCount - 1;
  const doc = workspace.getDocument(document.uri);

  return Range.create({ character: 0, line: 0 }, { character: doc.getline(lastLineId).length, line: lastLineId });
}
