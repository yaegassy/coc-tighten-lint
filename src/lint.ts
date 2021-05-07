import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  languages,
  OutputChannel,
  Position,
  Range,
  TextDocument,
  Uri,
  workspace,
  WorkspaceConfiguration,
} from 'coc.nvim';

import cp from 'child_process';

interface TlintDiagnostics {
  errors: TlintDiagnosticsError[];
}

interface TlintDiagnosticsError {
  line: number;
  message: string;
  source: string;
}

export class LintEngine {
  private collection: DiagnosticCollection;
  private toolPath: string;
  private outputChannel: OutputChannel;
  private extensionConfig: WorkspaceConfiguration;

  constructor(toolPath: string, outputChannel: OutputChannel) {
    this.collection = languages.createDiagnosticCollection('tighten-lint');
    this.toolPath = toolPath;
    this.outputChannel = outputChannel;

    const extensionConfig = workspace.getConfiguration('tighten-lint');
    this.extensionConfig = extensionConfig;
  }

  public async lint(textDocument: TextDocument): Promise<void> {
    if (textDocument.languageId !== 'php' && textDocument.languageId !== 'blade') return;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const filePath = Uri.parse(textDocument.uri).fsPath;
    const args: string[] = [];
    const cwd = Uri.file(workspace.root).fsPath;
    // Use shell
    const opts = { cwd, shell: true };

    args.push(this.toolPath);
    args.push('lint');
    args.push('--json');
    args.push(this.getIncludedPolicies());

    this.outputChannel.appendLine(`${'#'.repeat(10)} tighten-lint lint\n`);
    this.outputChannel.appendLine(`Cwd: ${opts.cwd}`);
    this.outputChannel.appendLine(`Run: php ${args.join(' ')} ${filePath}`);
    this.outputChannel.appendLine(`Args: ${args.join(' ')}`);
    this.outputChannel.appendLine(`File: ${filePath}`);

    this.collection.clear();

    return new Promise(function (resolve) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      cp.execFile('php', [...args, filePath], opts, function (error, stdout) {
        if (error) {
          self.outputChannel.appendLine(`ERROR: ${error.message}`);
          return;
        }

        self.outputChannel.appendLine(`STDOUT: ${stdout}`);
        self.collection.set(textDocument.uri, self.getDiagnostics(stdout));
        resolve();
      });
    });
  }

  private getDiagnostics(decoded: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    if (!this.IsJsonString(decoded)) {
      return diagnostics;
    }

    const tlintDiagnostics: TlintDiagnostics = JSON.parse(decoded);

    tlintDiagnostics.errors.forEach((element) => {
      diagnostics.push(
        Diagnostic.create(
          Range.create(Position.create(element.line - 1, 0), Position.create(element.line - 1, Number.MAX_VALUE)),
          `${element.message} (${element.source})`,
          this.getSeverity(element.source)
        )
      );
    });

    return diagnostics;
  }

  private getSeverity(source: string): DiagnosticSeverity {
    const severity = this.extensionConfig.severities.hasOwnProperty(source)
      ? this.extensionConfig.severities[source]
      : this.extensionConfig.defaultSeverity;

    switch (severity) {
      case 'hint':
        return DiagnosticSeverity.Hint;
      case 'info':
        return DiagnosticSeverity.Information;
      case 'warning':
        return DiagnosticSeverity.Warning;
      default:
        return DiagnosticSeverity.Error;
    }
  }

  private getIncludedPolicies(): string {
    const policies: string[] = [];
    const configPolicy = this.extensionConfig.get('only', []);

    configPolicy.forEach((policy) => {
      policies.push('--only');
      policies.push(policy);
    });
    return policies.join(' ');
  }

  private IsJsonString(str: string): boolean {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
}
