import { subscribeToSubmissionEvents } from "./event";
import { load } from "./load";

console.log("Hello!", "Here I am!")

try {
    subscribeToSubmissionEvents((event) => {
        console.log("Handling an event!")
        load(event.email, event.password, event.root, console.log.bind(console))
    })
} catch (error) {
    console.log(error)
}
