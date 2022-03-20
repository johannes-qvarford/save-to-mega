let instance: DirectoryPicker | null = null;

export type UrlToSaveCallback = (url: string, directory: string) => Promise<void>;

export interface DirectoryPicker {
    destroy(): void;
    addUrlToSaveCallback(callback: UrlToSaveCallback): void;
}

export interface DirectoryTree {
    name: string | null;
    children?: Array<DirectoryTree>
}

export function initializeDirectoryPicker(tree: DirectoryTree, rootPath: string | null) {
    console.log(tree)
    if (instance) {
        instance.destroy()
    }
    instance = new DirectoryPickerImpl(tree, rootPath);
    return instance;
}

class DirectoryPickerImpl implements DirectoryPicker {
    callbacks: Array<UrlToSaveCallback> = [];
    recentDirectories: Set<string> = new Set();

    constructor(tree: DirectoryTree, rootPath: string | null) {
        this.addDirectoryTreeToMenu(tree, rootPath || "")
        browser.menus.onClicked.addListener(this.onMenuItemClick.bind(this))
    }

    addUrlToSaveCallback(callback: UrlToSaveCallback): void {
        this.callbacks.push(callback)
    }

    destroy() {
        browser.menus.removeAll()
    }

    private onMenuItemClick(clickData: browser.menus.OnClickData, tab: browser.tabs.Tab) {
        this.tryAsync(async () => {
            const id = clickData.menuItemId
            const directory = this.isDirectoryTreeId(id) ? this.extractDirectoryFromDirectoryTreeId(id) :
                this.isRecentDirectoryId(id) ? this.extractDirectoryFromRecentDirectoryId(id) : null

            if (directory) {
                this.addRecentDirectory(directory)
                if (clickData.srcUrl) {
                    await this.callAllCallbacks(clickData.srcUrl, directory)
                }
            }
        })
    }

    private addDirectoryTreeToMenu(tree: DirectoryTree, directory: string, parentId?: string) {
        const id = this.directoryTreeId(directory)
        const currentDirectoryId = `${id}/.`
        browser.menus.create({
            id,
            parentId,
            title: tree.name ?? undefined,
            contexts: ["image", "audio", "video"]
        }, () => console.log(id, "Created!"))
        
        
        if (tree.children) {

            if (tree.children.length > 0) {
                browser.menus.create({
                    id: currentDirectoryId,
                    parentId: id,
                    title: ".",
                    contexts: ["image", "audio", "video"]
                }, () => console.log(currentDirectoryId, "Created!"))
            }

            tree.children.sort((a, b) => (a?.name ?? "") < (b?.name ?? "") ? -1 : 1)
            tree.children.forEach(child => {
                const newDirectory = directory ? `${directory}/${child.name}` : child.name
                if (!newDirectory) {
                    throw new Error("Cannot handle trees with missing names.")
                }
                this.addDirectoryTreeToMenu(child, newDirectory, id)
            });
        }
    }

    private addRecentDirectory(directory: string) {
        if (this.recentDirectories.has(directory)) {
            return;
        }
        browser.menus.create({
            id: this.recentDirectoryId(directory),
            title: directory + " (Recent)",
            contexts: ["image", "audio", "video"]
        }, () => console.log(this.recentDirectoryId(directory), "Created!"))
        this.recentDirectories.add(directory)
    }

    private async callAllCallbacks(url: string, directory: string): Promise<void> {
        const promises = this.callbacks.map(c => {
            c(url, directory)
        })
        await Promise.all(promises)
    }

    private directoryTreeId(directory: string) {
        return "directory-tree" + directory
    }

    private isDirectoryTreeId(id: number | string): id is string {
        return (""+id).startsWith("directory-tree")
    }

    private extractDirectoryFromDirectoryTreeId(directoryTreeId: string) {
        return directoryTreeId.substring("directory-tree".length)
    }

    private recentDirectoryId(directory: string) {
        return "recent-" + directory
    }

    private isRecentDirectoryId(id: number | string): id is string {
        return (""+id).startsWith("recent-")
    }

    private extractDirectoryFromRecentDirectoryId(recentDirectoryId: string): string {
        return recentDirectoryId.substring("recent-".length)
    }

    private tryAsync(callback: () => Promise<void>) {
        try {
            callback()
        } catch (error) {
            console.log(error)
        }
    }
}