class GrammaryMenu {
    constructor() {
        this.menu = null;
        this.toneSelector = null;
        this.selectedText = '';
        this.isInput = false;
        this.init();
    }

    init() {
        this.createMenu();
        this.lastSelection = '';
        
        // Listen for selection changes
        document.addEventListener('selectionchange', () => {
            // Use requestAnimationFrame to wait for selection to be complete
            requestAnimationFrame(() => this.handleSelection());
        });
        
        // Handle document clicks for menu hiding
        document.addEventListener('mousedown', (e) => {
            if (this.menu && 
                !this.menu.contains(e.target) && 
                !window.getSelection().toString().trim()) {
                this.hideMenu();
            }
        });

        // Prevent menu from closing when clicking inside it
        this.menu.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        // Handle scroll and resize events
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (this.menu.style.display === 'block') {
                clearTimeout(scrollTimeout);
                // Hide immediately during scroll
                this.menu.style.opacity = '0';
                this.menu.style.transform = 'translateY(10px)';
                
                scrollTimeout = setTimeout(() => {
                    this.handleSelection();
                }, 150);
            }
        }, { passive: true });

        window.addEventListener('resize', () => {
            if (this.menu.style.display === 'block') {
                this.handleSelection();
            }
        }, { passive: true });
    }

    createMenu() {
        this.menu = document.createElement('div');
        this.menu.className = 'grammary-floating-menu';
        
        // Create button group
        this.buttonGroup = document.createElement('div');
        this.buttonGroup.className = 'button-group';
        this.menu.appendChild(this.buttonGroup);

        // Create tone selector
        this.toneSelector = document.createElement('div');
        this.toneSelector.className = 'grammary-tone-selector';
        const tones = ['رسمی', 'دوستانه', 'علمی', 'خلاقانه'];
        tones.forEach(tone => {
            const button = document.createElement('button');
            button.textContent = tone;
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!button.disabled) {
                    this.handleToneSelection(tone);
                }
            });
            this.toneSelector.appendChild(button);
        });
        this.menu.appendChild(this.toneSelector);
        
        // Add to document
        document.body.appendChild(this.menu);
    }

    async handleSelection() {
        let selectedText = '';
        let rect;
        
        // Get the active element and selection
        const target = document.activeElement;
        const selection = window.getSelection();
        
        // Check if we're in an input/textarea/contenteditable
        this.isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || 
                       target.getAttribute('contenteditable') === 'true';

        if (this.isInput) {
            // Handle input/textarea selection
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                const start = target.selectionStart;
                const end = target.selectionEnd;
                
                if (typeof target.value !== 'undefined' && start !== end) {
                    selectedText = target.value.substring(start, end);
                    
                    // Create a temporary span to measure the text position
                    const span = document.createElement('span');
                    span.style.font = window.getComputedStyle(target).font;
                    span.style.position = 'absolute';
                    span.style.visibility = 'hidden';
                    span.textContent = target.value.substring(0, start);
                    document.body.appendChild(span);
                    
                    const inputRect = target.getBoundingClientRect();
                    const textWidth = span.offsetWidth;
                    const lineHeight = parseInt(window.getComputedStyle(target).lineHeight) || 20;
                    
                    // Calculate the position based on input's position and text measurements
                    rect = {
                        left: inputRect.left + Math.min(textWidth, inputRect.width - 20),
                        top: inputRect.top,
                        bottom: inputRect.top + lineHeight,
                        width: 0,
                        height: lineHeight
                    };
                    
                    document.body.removeChild(span);
                }
            } else if (selection.rangeCount > 0) {
                // Handle contenteditable selection
                selectedText = selection.toString().trim();
                rect = selection.getRangeAt(0).getBoundingClientRect();
            }
        } else {
            // Handle regular DOM selection
            selectedText = selection.toString().trim();
            
            if (selection.rangeCount > 0) {
                rect = selection.getRangeAt(0).getBoundingClientRect();
            }
        }

        // Only proceed if there's actually selected text and we have valid coordinates
        // and the selection has changed
        if (selectedText && 
            rect && 
            (rect.width > 0 || rect.height > 0) && 
            selectedText !== this.lastSelection) {
            
            this.selectedText = selectedText;
            this.lastSelection = selectedText;
            this.showMenu(rect);
        } else if (!selectedText) {
            // Clear last selection when text is deselected
            this.lastSelection = '';
        }
    }

    showMenu(rect) {
        // Clear previous buttons but keep structure
        this.buttonGroup.innerHTML = '';
        this.toneSelector.style.display = 'none';

        // Add appropriate buttons
        if (this.isInput) {
            this.addButton(this.buttonGroup, '🔍 بررسی گرامر', () => this.fixGrammar());
            this.addButton(this.buttonGroup, '✍️ اصلاح نگارش', () => this.fixWriting());
            this.addButton(this.buttonGroup, '🎭 تغییر لحن', () => this.showToneSelector());
        } else {
            this.addButton(this.buttonGroup, '🔄 ترجمه به فارسی', () => this.translate());
            this.addButton(this.buttonGroup, '📝 خلاصه‌سازی', () => this.summarize());
        }

        // First set display block but keep it invisible
        this.menu.style.display = 'block';
        this.menu.style.opacity = '0';
        this.menu.style.transform = 'translateY(10px)';

        // Get dimensions
        const menuRect = this.menu.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        // Calculate position relative to the selection
        let top = rect.bottom + scrollY;
        let left = rect.left + scrollX - (menuRect.width / 2) + (rect.width / 2);

        // Check if menu would go off screen
        if (rect.bottom + menuRect.height > viewportHeight) {
            // Show above selection if not enough space below
            top = rect.top + scrollY - menuRect.height;
        }

        // Ensure menu stays within horizontal bounds
        left = Math.max(scrollX + 10, Math.min(left, scrollX + viewportWidth - menuRect.width - 10));

        // Apply position
        this.menu.style.top = `${top}px`;
        this.menu.style.left = `${left}px`;
        
        // Force a reflow before adding the visible class
        this.menu.offsetHeight;
        
        // Make menu visible with animation
        requestAnimationFrame(() => {
            this.menu.style.opacity = '1';
            this.menu.style.transform = 'translateY(0)';
        });
    }

    hideMenu() {
        if (this.menu) {
            // Start fade out animation
            this.menu.style.opacity = '0';
            this.menu.style.transform = 'translateY(10px)';
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                this.menu.style.display = 'none';
                if (this.toneSelector) {
                    this.toneSelector.style.display = 'none';
                }
            }, 200); // Match the transition duration from CSS
        }
    }

    showToneSelector() {
        // Toggle tone selector
        const isVisible = this.toneSelector.style.display === 'block';
        this.toneSelector.style.display = isVisible ? 'none' : 'block';
        
        // Position the tone selector relative to the last button
        if (!isVisible) {
            const lastButton = this.buttonGroup.lastElementChild;
            if (lastButton) {
                const buttonRect = lastButton.getBoundingClientRect();
                const menuRect = this.menu.getBoundingClientRect();
                
                this.toneSelector.style.top = '100%';
                this.toneSelector.style.right = '0';
            }
        }
    }

    addButton(container, text, onClick) {
        const button = document.createElement('button');
        button.innerHTML = text;
        button.type = 'button'; // Explicitly set button type
        
        // Improved click handling
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Hide tone selector if it's visible
            if (this.toneSelector && this.toneSelector.style.display === 'block') {
                this.toneSelector.style.display = 'none';
            }
            
            // Prevent multiple clicks
            if (!button.disabled) {
                const resetLoading = this.setLoading(button);
                
                try {
                    // Execute the callback
                    await Promise.resolve(onClick());
                } catch (error) {
                    console.error('Button click error:', error);
                    alert('خطا در اجرای عملیات');
                } finally {
                    resetLoading();
                }
            }
        });

        container.appendChild(button);
        return button;
    }

    setLoading(button) {
        const originalText = button.innerHTML;
        const loader = document.createElement('span');
        loader.className = 'grammary-loading';
        button.innerHTML = '';
        button.appendChild(loader);
        button.disabled = true;
        return () => {
            button.innerHTML = originalText;
            button.disabled = false;
        };
    }

    async callOpenRouter(prompt, systemPrompt = '') {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'openRouterRequest',
                prompt,
                systemPrompt
            });
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            return response;
        } catch (error) {
            console.error('Error calling OpenRouter:', error);
            throw error;
        }
    }

    async translate() {
        try {
            const response = await this.callOpenRouter(
                `Translate the following text to Persian. Only show the translation without any explanations or additional text: "${this.selectedText}"`,
                'You are a helpful translator. Translate the given text to Persian accurately and only return the translation without any explanations or additional text.'
            );
            this.showInlineResult(response, 'ترجمه');
        } catch (error) {
            alert('خطا در ترجمه متن: ' + error.message);
        }
    }

    async summarize() {
        try {
            const response = await this.callOpenRouter(
                `Create a concise summary of this text in Persian. Only show the summary without any explanations or additional text: "${this.selectedText}"`,
                'You are a helpful summarizer. Create a concise summary in Persian. Only return the summary without any explanations or additional text.'
            );
            this.showInlineResult(response, 'خلاصه');
        } catch (error) {
            alert('خطا در خلاصه‌سازی متن: ' + error.message);
        }
    }

    showInlineResult(text, type) {
        // Get the selection and its range
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Create result container
        const container = document.createElement('div');
        container.className = 'grammary-inline-result';
        
        // Create the original text element
        const originalText = document.createElement('div');
        originalText.className = 'original-text';
        originalText.textContent = this.selectedText;
        
        // Create the result text element
        const resultText = document.createElement('div');
        resultText.className = 'result-text';
        resultText.textContent = text;

        // Create header with type and close button
        const header = document.createElement('div');
        header.className = 'result-header';
        
        const typeLabel = document.createElement('span');
        typeLabel.textContent = type;
        header.appendChild(typeLabel);

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.className = 'close-button';
        closeButton.onclick = () => container.remove();
        header.appendChild(closeButton);

        // Assemble the container
        container.appendChild(header);
        container.appendChild(originalText);
        container.appendChild(resultText);

        // Style the container
        const style = document.createElement('style');
        style.textContent = `
            .grammary-inline-result {
                position: relative;
                margin: 1em 0;
                padding: 1em;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                direction: rtl;
                max-width: 800px;
                font-family: system-ui, -apple-system, sans-serif;
            }
            .grammary-inline-result .result-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5em;
                padding-bottom: 0.5em;
                border-bottom: 1px solid #eee;
                font-weight: bold;
                color: #666;
            }
            .grammary-inline-result .close-button {
                background: none;
                border: none;
                color: #999;
                font-size: 1.5em;
                cursor: pointer;
                padding: 0 0.3em;
            }
            .grammary-inline-result .close-button:hover {
                color: #666;
            }
            .grammary-inline-result .original-text {
                color: #666;
                margin-bottom: 0.5em;
                padding: 0.5em;
                background: #f8f8f8;
                border-radius: 4px;
            }
            .grammary-inline-result .result-text {
                color: #333;
                padding: 0.5em;
            }
        `;
        document.head.appendChild(style);

        // Insert after the selected text's containing element
        let targetElement = range.commonAncestorContainer;
        while (targetElement && targetElement.nodeType !== Node.ELEMENT_NODE) {
            targetElement = targetElement.parentNode;
        }
        
        if (targetElement) {
            // If the target is an inline element, find its block parent
            while (targetElement && 
                   window.getComputedStyle(targetElement).display === 'inline') {
                targetElement = targetElement.parentNode;
            }
            
            if (targetElement === document.body) {
                // If we reached the body, wrap the result in a div
                const wrapper = document.createElement('div');
                wrapper.style.margin = '1em';
                wrapper.appendChild(container);
                targetElement.insertBefore(wrapper, targetElement.firstChild);
            } else {
                targetElement.insertAdjacentElement('afterend', container);
            }
        }
    }

    async fixGrammar() {
        try {
            const isPersian = /[\u0600-\u06FF]/.test(this.selectedText);
            const prompt = isPersian ? 
                `Fix the grammar of this Persian text, maintaining Persian language: "${this.selectedText}"` :
                `Fix the grammar of this English text, maintaining English language: "${this.selectedText}"`;
            const systemPrompt = isPersian ?
                'You are a Persian language expert. Fix any grammatical errors in the text. Only return the corrected Persian text without any explanations.' :
                'You are an English language expert. Fix any grammatical errors in the text. Only return the corrected English text without any explanations.';

            const response = await this.callOpenRouter(prompt, systemPrompt);
            this.applyInputChange(response);
        } catch (error) {
            alert('خطا در اصلاح گرامر: ' + error.message);
        }
    }

    async fixWriting() {
        try {
            const isPersian = /[\u0600-\u06FF]/.test(this.selectedText);
            const prompt = isPersian ?
                `Improve the writing style of this Persian text, maintaining Persian language: "${this.selectedText}"` :
                `Improve the writing style of this English text, maintaining English language: "${this.selectedText}"`;
            const systemPrompt = isPersian ?
                'You are a Persian writing expert. Improve the writing style while maintaining Persian language. Only return the improved text without any explanations.' :
                'You are an English writing expert. Improve the writing style while maintaining English language. Only return the improved text without any explanations.';

            const response = await this.callOpenRouter(prompt, systemPrompt);
            this.applyInputChange(response);
        } catch (error) {
            alert('خطا در بهبود نگارش: ' + error.message);
        }
    }

    async handleToneSelection(tone) {
        try {
            const isPersian = /[\u0600-\u06FF]/.test(this.selectedText);
            const prompt = isPersian ?
                `Rewrite this Persian text in a ${tone} tone, maintaining Persian language: "${this.selectedText}"` :
                `Rewrite this English text in a ${tone} tone, maintaining English language: "${this.selectedText}"`;
            const systemPrompt = isPersian ?
                `You are a Persian writing expert. Rewrite the text in a ${tone} tone while maintaining Persian language. Only return the rewritten text without any explanations.` :
                `You are an English writing expert. Rewrite the text in a ${tone} tone while maintaining English language. Only return the rewritten text without any explanations.`;

            const response = await this.callOpenRouter(prompt, systemPrompt);
            this.applyInputChange(response);
        } catch (error) {
            alert('خطا در تغییر لحن: ' + error.message);
        }
    }

    applyInputChange(text) {
        const target = document.activeElement;
        if (!target) return;

        try {
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const currentValue = target.value;
                const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
                
                // Method 1: Direct value setting
                target.value = newValue;
                
                // Method 2: Using native setter
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeInputValueSetter.call(target, newValue);
                
                // Method 3: Using setAttribute
                target.setAttribute('value', newValue);
                
                // Method 4: Using data binding if available
                if (target._valueTracker) {
                    target._valueTracker.setValue(currentValue);
                }
                
                // Dispatch all possible events
                const events = [
                    new Event('input', { bubbles: true, cancelable: true }),
                    new Event('change', { bubbles: true, cancelable: true }),
                    new InputEvent('input', { bubbles: true, cancelable: true }),
                    new InputEvent('change', { bubbles: true, cancelable: true }),
                    new KeyboardEvent('input', { bubbles: true, cancelable: true }),
                    new KeyboardEvent('change', { bubbles: true, cancelable: true })
                ];
                
                events.forEach(event => target.dispatchEvent(event));
                
                // Force update through DOM manipulation
                const parent = target.parentNode;
                const sibling = target.nextSibling;
                parent.removeChild(target);
                
                // Force a reflow
                void target.offsetHeight;
                
                parent.insertBefore(target, sibling);
                
                // Reset selection
                target.setSelectionRange(start + text.length, start + text.length);
                
                // Force focus
                target.blur();
                target.focus();
                
                // Double check and retry if needed
                if (target.value !== newValue) {
                    setTimeout(() => {
                        target.value = newValue;
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                    }, 0);
                }
            } else if (target.getAttribute('contenteditable') === 'true') {
                const selection = window.getSelection();
                if (!selection.rangeCount) return;
                
                const range = selection.getRangeAt(0);
                
                // Clear existing content
                range.deleteContents();
                
                // Create and insert new content
                const textNode = document.createTextNode(text);
                range.insertNode(textNode);
                
                // Clean up and normalize
                target.normalize();
                
                // Update selection
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(range);
                
                // Force contenteditable update
                target.dispatchEvent(new Event('input', { bubbles: true }));
                target.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Force redraw
                const html = target.innerHTML;
                target.innerHTML = html;
            }
        } catch (error) {
            console.error('Error in applyInputChange:', error);
            // Last resort fallback
            try {
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                    target.value = text;
                    target.dispatchEvent(new Event('input', { bubbles: true }));
                } else if (target.getAttribute('contenteditable') === 'true') {
                    target.textContent = text;
                    target.dispatchEvent(new Event('input', { bubbles: true }));
                }
            } catch (fallbackError) {
                console.error('Fallback input change failed:', fallbackError);
            }
        }
    }
}

// Initialize the menu
new GrammaryMenu(); 