import { ExtensionContext, OutputChannel, window } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import rimraf from 'rimraf';
import child_process from 'child_process';
import util from 'util';

import { TLINT_VERSION } from './constant';

const exec = util.promisify(child_process.exec);

export async function tlintInstall(context: ExtensionContext, outputChannel: OutputChannel): Promise<void> {
  const tlintDir = path.join(context.storagePath, 'tlint');

  const statusItem = window.createStatusBarItem(0, { progress: true });
  statusItem.text = `Install tlint...`;
  statusItem.show();

  const installCmd =
    `composer init -n --name tlint/tlint --working-dir ${tlintDir} && ` +
    `composer require tightenco/tlint:${TLINT_VERSION} --working-dir ${tlintDir}`;

  // Re-create the directory
  rimraf.sync(tlintDir);
  if (!fs.existsSync(tlintDir)) {
    fs.mkdirSync(tlintDir);
  }

  try {
    window.showMessage(`Install tlint...`);
    outputChannel.appendLine(`Install tlint...`);
    await exec(installCmd);
    statusItem.hide();
    window.showMessage(`tlint: installed!`);
    outputChannel.appendLine(`tlint: installed!`);
  } catch (error) {
    statusItem.hide();
    window.showErrorMessage(`tlint: install failed. | ${error}`);
    outputChannel.appendLine(`tlint: install failed. | ${error}`);
    throw new Error();
  }
}
