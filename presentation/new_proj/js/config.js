// OpenAI GPT-3.5 pricing configuration
const PRICING = {
    // GPT-3.5 costs $0.0015 per 1K input tokens and $0.002 per 1K output tokens
    USD_PER_1K_INPUT_TOKENS: 0.0015,
    USD_PER_1K_OUTPUT_TOKENS: 0.002,
    USD_TO_PHP: 56,               // Conversion rate: 1 USD = 56 PHP
    TOKENS_PER_WORD: 1.3,         // Average tokens per word (OpenAI's estimate)
    MARKUP: 20,                   // 20x markup
    
    // Calculate cost for input tokens
    getInputCost: function(words) {
        const estimatedTokens = words * this.TOKENS_PER_WORD;
        const costInUSD = (estimatedTokens / 1000) * this.USD_PER_1K_INPUT_TOKENS;
        const costInPHP = costInUSD * this.USD_TO_PHP;
        return costInPHP * this.MARKUP;
    },
    
    // Calculate cost for output tokens
    getOutputCost: function(words) {
        const estimatedTokens = words * this.TOKENS_PER_WORD;
        const costInUSD = (estimatedTokens / 1000) * this.USD_PER_1K_OUTPUT_TOKENS;
        const costInPHP = costInUSD * this.USD_TO_PHP;
        return costInPHP * this.MARKUP;
    },

    // Helper to estimate tokens for display
    estimateTokens: function(words) {
        return Math.ceil(words * this.TOKENS_PER_WORD);
    }
};

// Base API Configuration
const API_CONFIG = {
    model: 'gpt-3.5-turbo',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 1.0,
    frequency_penalty: 0,
    presence_penalty: 0,
    key: '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'
};

// Create global PrintVendoConfig object
window.PrintVendoConfig = {
    // Expose pricing configuration
    PRICING: PRICING,
    
    // Get current inserted amount
    getInsertedAmount: function() {
        const amount = parseFloat(localStorage.getItem('insertedAmount') || '0');
        return Number.isNaN(amount) ? 0 : amount;
    },

    // Set required amount for current operation
    setRequiredAmount: function(amount) {
        // Round up to nearest peso
        const roundedAmount = Math.ceil(amount);
        localStorage.setItem('requiredAmount', roundedAmount.toString());
    },

    // Get required amount
    getRequiredAmount: function() {
        const amount = parseFloat(localStorage.getItem('requiredAmount') || '0');
        return Number.isNaN(amount) ? 0 : amount;
    },

    // Add coins (simulating vending machine signal)
    addCoins: function(amount) {
        const current = this.getInsertedAmount();
        const newAmount = current + amount;
        localStorage.setItem('insertedAmount', newAmount.toString());
        return newAmount;
    },

    // Check if enough coins inserted
    hasEnoughCoins: function() {
        return this.getInsertedAmount() >= this.getRequiredAmount();
    },

    // Reset coin state
    resetCoins: function() {
        localStorage.setItem('insertedAmount', '0');
        localStorage.setItem('requiredAmount', '0');
    },

    // Calculate total cost based on token pricing
    calculatePromptCost: function(inputWords, outputWords) {
        const inputCost = PRICING.getInputCost(inputWords);
        const outputCost = PRICING.getOutputCost(outputWords);
        return Math.ceil(inputCost + outputCost); // Round up to nearest peso
    },

    // Store generated content for printing
    storeForPrinting: function(content, type) {
        const fileId = Date.now().toString();
        const files = JSON.parse(localStorage.getItem('printFiles') || '{}');
        files[fileId] = {
            id: fileId,
            type: type,
            content: content,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        localStorage.setItem('printFiles', JSON.stringify(files));
        return fileId;
    },

    // Get API configuration
    getApiConfig: function() {
        return API_CONFIG;
    }
};
