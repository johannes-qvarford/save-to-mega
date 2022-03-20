import { sendSubmissionEvent } from "./event"
import { load } from "./load"

function registerField(name: string) {
    const onChange = (e: Event) => {
        window.localStorage.setItem(name, (e.target as unknown as any).value)
    }
    const email = document.getElementById(name)
    if (!email || !(email instanceof HTMLInputElement)) {
        throw new Error("Could not find " + name + " element!")
    }
    email.value = localStorage.getItem(name) ?? ""
    email.addEventListener('change', onChange)
}

async function init() {
    console.log("init start")
    registerField('root')
    registerField('email')
    registerField('password')
    

    const errorElement = document.getElementById("error")
    if (!errorElement || !(errorElement instanceof HTMLParagraphElement)) {
        throw new Error("Could not find error element!")
    }
    
    const submit = document.getElementById("submit")
    if (!submit) {
        throw new Error("Could not find submit element")
    }
    const onSubmit = async (e: Event) => {
        const email = localStorage.getItem("email") ?? ""
        const password = localStorage.getItem("password") ?? ""
        const root = localStorage.getItem("root") ?? ""
        try {
            sendSubmissionEvent({ email, password, root })
        } catch (error) {
            console.log("Failed to login with the extension", error)
            errorElement.innerText = error + ""
        }
        
    }
    submit.addEventListener('click', onSubmit)
}

async function tryInit() {
    try {
        console.log("tryInit")
        await init()
    } catch (e) {
        console.log("Failed to load the extension", e)
    }
}

tryInit()