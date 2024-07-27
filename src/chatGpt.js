
export async function call_tts(text) {
    let response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + ENV.OPEN_AI_KEY
        },
        body: JSON.stringify({
            "model": "tts-1",
            "input": text,
            "voice": "onyx",
            "response_format": "opus"
        })
    });

    if (response.ok) {
        const blob = await response.blob();
        return blob;
    } else {
        throw new Error("Error in tts call: " + JSON.stringify(await response.json()));
    }
} export async function call_gpt(system_prompt, message_history) {
    let messages = [{
        "role": "system",
        "content": system_prompt
    }];
    let history = message_history.map(m => ({
        "role": "user",
        "content": m
    }));
    messages.push(...history);

    let response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + ENV.OPEN_AI_KEY
        },
        body: JSON.stringify({
            "model": "gpt-3.5-turbo",
            "max_tokens": 40,
            "messages": messages
        })
    }).then(res => res.json())
        .then(json => json.choices[0].message.content)
        .catch(err => console.log("error from open API call: " + err));

    return response;
}

