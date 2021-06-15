import { CodeAction, CodeActionContext, CodeActionProvider, Range, TextDocument } from 'coc.nvim';

export class TlintCodeActionProvider implements CodeActionProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async provideCodeActions(document: TextDocument, range: Range, context: CodeActionContext) {
    const codeActions: CodeAction[] = [];

    let existsTlintDiagnostics = false;
    context.diagnostics.forEach((d) => {
      if (d.source === 'tighten-lint') {
        existsTlintDiagnostics = true;
      }
    });

    if (existsTlintDiagnostics) {
      const title = `Run: tighten-lint.autoFix`;
      const command = {
        title: '',
        command: 'tighten-lint.autoFix',
      };

      const action: CodeAction = {
        title,
        command,
      };

      codeActions.push(action);
    }

    return codeActions;
  }
}
