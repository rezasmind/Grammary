chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'openRouterRequest') {
        handleOpenRouterRequest(request, sendResponse);
        return true; // Keep the message channel open for the async response
    }
});

async function handleOpenRouterRequest(request, sendResponse) {
    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            throw new Error('کلید API یافت نشد. لطفاً ابتدا کلید API را در تنظیمات وارد کنید.');
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://github.com/rezasmind/Grammary',
                'X-Title': 'Grammary Chrome Extension'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat:free',
                messages: [
                    {
                        role: 'system',
                        content: request.systemPrompt || 'You are a helpful assistant.'
                    },
                    {
                        role: 'user',
                        content: request.prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `خطای HTTP: ${response.status}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
            throw new Error('پاسخی از API دریافت نشد');
        }

        sendResponse(data.choices[0].message.content);
    } catch (error) {
        console.error('Error in OpenRouter request:', error);
        sendResponse({ error: error.message });
    }
}

async function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['openRouterApiKey'], (result) => {
            resolve(result.openRouterApiKey);
        });
    });
} 