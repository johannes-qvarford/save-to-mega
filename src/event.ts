
export interface SubmissionEvent {
    email: string;
    password: string;
    root: string;
}

export type SubmissionEventListener = (event: SubmissionEvent) => void;

export function subscribeToSubmissionEvents(listener: SubmissionEventListener) {
    browser.runtime.onMessage.addListener((arg: any) => {
        listener(arg)
    })
}

export function sendSubmissionEvent(event: SubmissionEvent) {
    browser.runtime.sendMessage(event)
}

function openPort() {
    return browser.runtime.connect({name: "submission"});
}