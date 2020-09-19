import vscode, { workspace, window } from 'vscode';

export const getPathOfRoot = (path: string): string => {
	const rootPath = vscode.Uri.file(workspace.rootPath as string);
	return vscode.Uri.joinPath(rootPath, path).path;
};
