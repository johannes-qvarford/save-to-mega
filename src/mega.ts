import {Storage, MutableFile, File} from 'megajs'

export interface DirectoryTree {
    name: string | null;
    children?: Array<DirectoryTree>
}

export interface Mega {
    uploadFile(opts: { filename: string, directory: string, content: ArrayBuffer }): Promise<void>;
    directoryTreeStartingAt(directory: string): DirectoryTree
}

export interface Credentials {
    email: string;
    password: string;
}

export async function login(credentials: Credentials): Promise<Mega> {
    const storage = await new Storage({
        email: credentials.email,
        password: credentials.password
    }).ready;
    return new MegaImpl(storage);
}

class MegaImpl implements Mega {
    private storage: Storage;

    constructor(storage: Storage) {
        this.storage = storage;
    }

    async uploadFile(opts: { filename: string; directory: string; content: Buffer; }): Promise<void> {
        // The library exports the MutableFile Typescript type, but not actual class so we can't use instanceof. This is good enough.
        const directoryEntry = this.findDirectory(opts.directory, this.storage.root) as MutableFile
        if (!directoryEntry.upload) {
            throw new Error(`Expected the provided directory ${opts.directory} to be mutable, but wasn't`)
        }
        const writable = directoryEntry.upload({ name: opts.filename, size: opts.content.length }, opts.content)
        return await (writable as any).complete
    }

    directoryTreeStartingAt(directory: string | null): DirectoryTree {
        return this.culledNonDirectoriesInTree(this.findDirectory(directory, this.storage.root))
    }

    private findDirectory(path: string | null, root: File): File {
        if (!path) {
            return root;
        }
        const segments = path.split("/")
        return segments.reduce((acc, cur, i, arr) => {
            if (!acc.children) {
                throw new Error(`Directory tree is broken, ${acc} doesn't have any children.`)
            }
            const potentialChild = acc.children.find(d => d.name == cur)
            if (!potentialChild) {
                throw new Error(`Directory tree is broken, ${acc} does not have a child named ${cur}`)
            }
            return potentialChild
        }, root as File);
    }

    private culledNonDirectoriesInTree(file: File): DirectoryTree {
        if (file?.children) {
            return {
                name: file.name,
                children: file.children.filter(cc => cc.directory).map(this.culledNonDirectoriesInTree.bind(this))
            }
        }
        return {
            name: file.name,
            children: file.children
        }
    }
}