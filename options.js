document.addEventListener('DOMContentLoaded', () => {
    // Load saved API key
    chrome.storage.sync.get(['openRouterApiKey'], (result) => {
        if (result.openRouterApiKey) {
            document.getElementById('apiKey').value = result.openRouterApiKey;
        }
    });

    // Save API key
    document.getElementById('save').addEventListener('click', () => {
        const apiKey = document.getElementById('apiKey').value;
        const status = document.getElementById('status');

        if (!apiKey) {
            status.textContent = 'لطفاً کلید API را وارد کنید';
            status.className = 'status error';
            return;
        }

        chrome.storage.sync.set({ openRouterApiKey: apiKey }, () => {
            status.textContent = 'تنظیمات با موفقیت ذخیره شد';
            status.className = 'status success';
            setTimeout(() => {
                status.className = 'status';
            }, 3000);
        });
    });
}); 