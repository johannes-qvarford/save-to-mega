import arrayBufferToBuffer from 'arraybuffer-to-buffer';
import { login, Mega } from './mega';
import { initializeDirectoryPicker } from './directory-picker';
import { extension } from 'mime-types';

let mega: Mega | null = null

export async function load(email: string, password: string, root: string, errorHandler: (s: string) => void) {

    console.log("Logging in...")
    const mega = await login({ email, password });

    console.log("Initializing directory picker...") 
    const picker = initializeDirectoryPicker(mega.directoryTreeStartingAt(root), root)
    let count = 0;
    picker.addUrlToSaveCallback(async (url, directory) => {
        try {
            count++
            errorHandler("Starting to save " + count)
            const { contentType, buffer } = await downloadBuffer(url)
            await mega.uploadFile({ filename: extractFilenameFromUrl(url, contentType), directory: directory, content: buffer })
            errorHandler("Successful saving for " + count)
        } catch (error) {
            console.log(error)
            errorHandler((error as any as Error).toString())
            throw error
        }
    })
    console.log("Hello again!");
}

async function downloadBuffer(url: string): Promise<{ buffer: Buffer, contentType: string | null }> {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const content = arrayBufferToBuffer(arrayBuffer) as Buffer
    const contentType = response.headers.get("Content-Type")
    return { buffer: content, contentType };
}

function extractFilenameFromUrl(url: string, contentType: string | null): string {
    const filename = new URL(url).pathname.split('/').pop();
    if (!filename) {
        if (contentType == null) {
            throw new Error(`Cannot determine the extension of the ${contentType} type.`)
        }
        const full = url.replaceAll(/[^a-z0-9]/ig, "")
        const noExtension = full.length < 30 ? full : full.substring(full.length - 30)
        const ext = extension(contentType)
        if (!ext) {
            throw new Error(`Cannot determine the extension of the ${contentType} type.`)
        }
        return `${noExtension}.${ext}`
    }
    return filename;
}
