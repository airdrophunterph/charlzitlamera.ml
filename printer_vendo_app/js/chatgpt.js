// Display User ID and credits
document.addEventListener('DOMContentLoaded', function() {
    updateCoinDisplay();
    // Initially disable generate button
    document.getElementById('generateBtn').disabled = true;
});

// Update coin display in navbar
function updateCoinDisplay() {
    const required = window.PrintVendoConfig.getRequiredAmount();
    const inserted = window.PrintVendoConfig.getInsertedAmount();
    const remaining = Math.max(0, required - inserted);
    
    document.getElementById('machineIdDisplay').textContent = 
        `Required: ₱${required.toFixed(2)} | Inserted: ₱${inserted.toFixed(2)} | Remaining: ₱${remaining.toFixed(2)}`;
}

// Calculate cost button handler
document.getElementById('calculateCostBtn').addEventListener('click', function() {
    const promptType = document.getElementById('promptType').value;
    const promptText = document.getElementById('promptText').value;

    if (!promptType || !promptText.trim()) {
        Swal.fire({
            icon: 'warning',
            title: 'Missing Information',
            text: 'Please select a document type and enter your prompt first.',
            background: '#1e1e1e',
            color: '#ffffff'
        });
        return;
    }

    // Extract requested word count if specified
    const wordCountMatch = promptText.match(/(\d+)\s*words?/i);
    const requestedWords = wordCountMatch ? parseInt(wordCountMatch[1]) : 0;

    // Calculate input words and estimate output
    const inputWords = promptText.split(/\s+/).length;
    const estimatedOutputWords = requestedWords || (inputWords * 3); // Use requested count or estimate 3x input
    
    // Get pricing constants and estimate tokens
    const pricing = window.PrintVendoConfig.PRICING;
    const inputTokens = pricing.estimateTokens(inputWords);
    const outputTokens = pricing.estimateTokens(estimatedOutputWords);
    
    // Calculate total cost with markup
    const totalCost = window.PrintVendoConfig.calculatePromptCost(inputWords, estimatedOutputWords);

    // Reset coin state and set new required amount
    window.PrintVendoConfig.resetCoins();
    window.PrintVendoConfig.setRequiredAmount(totalCost);
    updateCoinDisplay();

    // Show cost details
    const costDisplay = document.getElementById('costDisplay');
    const costDetails = document.getElementById('costDetails');
    costDetails.innerHTML = `
        <ul class="list-unstyled mb-0">
            <li><strong>Input:</strong> ${inputWords} words (≈${inputTokens} tokens)</li>
            <li><strong>Output:</strong> ${estimatedOutputWords} words (≈${outputTokens} tokens)</li>
            <li><strong>Total Cost:</strong> ₱${totalCost.toFixed(2)}</li>
        </ul>
    `;
    costDisplay.style.display = 'block';
    
    // Disable generate button until payment complete
    document.getElementById('generateBtn').disabled = true;
});

// Insert coins button handler
document.getElementById('insertCoinsBtn').addEventListener('click', function() {
    // For testing: Show coin slot interface
    Swal.fire({
        title: 'Insert Coins',
        html: `
            <div class="text-start">
                <p>Please insert coins into the vending machine.</p>
                <p>Required: ₱${window.PrintVendoConfig.getRequiredAmount().toFixed(2)}</p>
                <p>Inserted: ₱${window.PrintVendoConfig.getInsertedAmount().toFixed(2)}</p>
                <hr>
                <p class="text-muted">For testing: Press 'i' to simulate coin insertion</p>
            </div>
        `,
        icon: 'info',
        background: '#1e1e1e',
        color: '#ffffff',
        showConfirmButton: false,
        showCloseButton: true
    });
});

// Simulate coin insertion from vending machine
// This would be replaced by actual signals from the machine
function simulateVendingSignal(amount) {
    const inserted = window.PrintVendoConfig.addCoins(amount);
    updateCoinDisplay();
    
    // Update cost display if visible
    const costDisplay = document.getElementById('costDisplay');
    if (costDisplay.style.display !== 'none') {
        const costDetails = document.getElementById('costDetails');
        const currentHTML = costDetails.innerHTML;
        const insertedTotal = window.PrintVendoConfig.getInsertedAmount();
        
        // Add new insertion to the display
        const insertedHtml = `
            <div class="alert alert-success mt-2">
                <strong>Inserted: ₱${amount.toFixed(2)}</strong><br>
                Total Inserted: ₱${insertedTotal.toFixed(2)}
            </div>
        `;
        
        // Insert after the last list item
        const lastLi = costDetails.querySelector('ul li:last-child');
        if (lastLi) {
            lastLi.insertAdjacentHTML('afterend', insertedHtml);
        }
    }
    
    // Check if we've reached the required amount
    if (window.PrintVendoConfig.hasEnoughCoins()) {
        document.getElementById('generateBtn').disabled = false;
        Swal.fire({
            icon: 'success',
            title: 'Payment Complete',
            text: 'You can now generate your content!',
            background: '#1e1e1e',
            color: '#ffffff'
        });
    }
}

// Handle coin insertion key press (for testing)
document.addEventListener('keypress', function(e) {
    if (e.key === 'i') {
        const amount = parseFloat(prompt('Insert coins (in pesos):', '1'));
        if (!isNaN(amount) && amount > 0) {
            simulateVendingSignal(amount);
        }
    }
});

// Handle form submission
document.getElementById('promptForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const promptType = document.getElementById('promptType').value;
    const promptText = document.getElementById('promptText').value;
    const generateBtn = document.getElementById('generateBtn');
    const printBtn = document.getElementById('printBtn');
    const contentDiv = document.getElementById('generatedContent');
    const editableContent = document.getElementById('editableContent');
    const apiConfig = window.PrintVendoConfig.getApiConfig();

    // Check if enough coins inserted
    if (!window.PrintVendoConfig.hasEnoughCoins()) {
        Swal.fire({
            icon: 'warning',
            title: 'Insufficient Payment',
            html: `
                <div class="text-start">
                    <p>Please insert more coins:</p>
                    <ul>
                        <li>Required: ₱${window.PrintVendoConfig.getRequiredAmount().toFixed(2)}</li>
                        <li>Inserted: ₱${window.PrintVendoConfig.getInsertedAmount().toFixed(2)}</li>
                        <li>Remaining: ₱${(window.PrintVendoConfig.getRequiredAmount() - window.PrintVendoConfig.getInsertedAmount()).toFixed(2)}</li>
                    </ul>
                </div>
            `,
            background: '#1e1e1e',
            color: '#ffffff'
        });
        return;
    }

    // Disable generate button and show loading
    generateBtn.disabled = true;
    const loadingSwal = Swal.fire({
        title: 'Generating Content',
        html: 'Please wait while we process your request...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // Prepare system message based on document type
        let systemMessage = "You are a professional document writer. ";
        let userMessage = "";
        
        switch (promptType) {
            case 'essay':
                systemMessage += "Create academic essays with proper structure, citations, and formal language.";
                userMessage = `Write an academic essay about: ${promptText}. Include introduction, body paragraphs with supporting evidence, and a conclusion.`;
                break;
            case 'letter':
                systemMessage += "Write formal business letters following standard formatting.";
                userMessage = `Write a formal letter regarding: ${promptText}. Include proper date, addresses, salutation, body, and closing.`;
                break;
            case 'report':
                systemMessage += "Generate detailed professional reports with clear sections and analysis.";
                userMessage = `Create a detailed report about: ${promptText}. Include executive summary, findings, analysis, and recommendations.`;
                break;
            case 'custom':
                systemMessage += "Generate professional documents following user specifications.";
                userMessage = promptText;
                break;
        }

        // Make API call using chat completions format
        const response = await fetch(apiConfig.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiConfig.key}`
            },
            body: JSON.stringify({
                model: apiConfig.model,
                messages: [
                    {
                        role: "system",
                        content: systemMessage
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                temperature: apiConfig.temperature,
                max_tokens: apiConfig.max_tokens,
                top_p: apiConfig.top_p,
                frequency_penalty: apiConfig.frequency_penalty,
                presence_penalty: apiConfig.presence_penalty
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const generatedText = data.choices[0].message.content;
        
        // Store content for printing
        const fileId = window.PrintVendoConfig.storeForPrinting(generatedText, promptType);

        // Reset coin state after successful generation
        window.PrintVendoConfig.resetCoins();
        updateCoinDisplay();

        // Hide cost display
        document.getElementById('costDisplay').style.display = 'none';

        // Display generated content
        editableContent.innerHTML = generatedText.replace(/\n/g, '<br>');
        contentDiv.classList.remove('d-none');
        printBtn.classList.remove('d-none');
        
        // Close loading dialog
        loadingSwal.close();

        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Content Generated!',
            html: `
                <div class="text-start">
                    <p>Content has been generated successfully.</p>
                    <ul>
                        <li>Document Type: ${promptType}</li>
                        <li>File ID: ${fileId}</li>
                    </ul>
                    <p>You can now edit the content before printing.</p>
                </div>
            `,
            background: '#1e1e1e',
            color: '#ffffff'
        });

    } catch (error) {
        console.error('Error:', error);
        loadingSwal.close();
        
        Swal.fire({
            icon: 'error',
            title: 'Generation Failed',
            text: error.message || 'Failed to generate content. Please try again.',
            background: '#1e1e1e',
            color: '#ffffff'
        });

        // Reset coin state on error
        window.PrintVendoConfig.resetCoins();
        updateCoinDisplay();
    } finally {
        generateBtn.disabled = false;
    }
});

// Handle print button click
document.getElementById('printBtn').addEventListener('click', async function() {
    const userId = sessionStorage.getItem('machineId') || 'TEST_USER';
    const userConfig = window.PrintVendoConfig.getUserConfig(userId);
    const content = document.getElementById('editableContent').innerHTML;
    const colorMode = document.querySelector('input[name="colorMode"]:checked').value;
    const forceBW = colorMode === 'bw';

    // Calculate pages (rough estimate based on content length)
    const contentLength = content.replace(/<[^>]*>/g, '').length;
    const charsPerPage = 3000; // Approximate characters per page
    const totalPages = Math.ceil(contentLength / charsPerPage);
    
    // Calculate cost using user-specific pricing
    const costPerPage = forceBW ? userConfig.pricePerPageBW : userConfig.pricePerPageColor;
    const totalCost = totalPages * costPerPage;

    // Generate unique file ID
    const fileId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    // Store generated content with user-specific info
    const files = JSON.parse(localStorage.getItem('printFiles') || '{}');
    files[fileId] = {
        id: fileId,
        userId: userId,
        type: 'generated',
        content: content,
        totalPages: totalPages,
        blackAndWhitePages: forceBW ? totalPages : 0,
        coloredPages: forceBW ? 0 : totalPages,
        totalCost: totalCost,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    localStorage.setItem('printFiles', JSON.stringify(files));

    // Show print confirmation with user-specific pricing
    const result = await Swal.fire({
        icon: 'success',
        title: 'Ready to Print',
        html: `
            <div class="text-start">
                <p><strong>Document Details:</strong></p>
                <ul>
                    <li>User ID: ${userId}</li>
                    <li>Total Pages: ${totalPages}</li>
                    <li>Print Mode: ${colorMode === 'bw' ? 'Black & White' : 'Color'}</li>
                    <li>Cost per Page: ₱${costPerPage}</li>
                    <li>Total Cost: ₱${totalCost}</li>
                </ul>
                <p>Please insert ₱${totalCost} into the coin slot to print.</p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Insert Coins',
        cancelButtonText: 'Cancel',
        customClass: {
            container: 'dark-mode'
        },
        background: '#1e1e1e',
        color: '#ffffff'
    });

    if (result.isConfirmed) {
        // Update file status
        files[fileId].status = 'printing';
        localStorage.setItem('printFiles', JSON.stringify(files));

        // Show printing progress
        const printingSwal = Swal.fire({
            title: 'Printing in Progress',
            html: `
                <div class="text-center">
                    <p>Your document is being printed...</p>
                    <p>User ID: ${userId}</p>
                    <p>File ID: ${fileId}</p>
                    <p>Please wait and collect your document from the printer.</p>
                </div>
            `,
            timer: 3000,
            timerProgressBar: true,
            allowOutsideClick: false,
            background: '#1e1e1e',
            color: '#ffffff',
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // After printing completes
        printingSwal.then(() => {
            // Update file status
            files[fileId].status = 'completed';
            localStorage.setItem('printFiles', JSON.stringify(files));

            // Reset form
            document.getElementById('promptForm').reset();
            document.getElementById('generatedContent').classList.add('d-none');
            document.getElementById('printBtn').classList.add('d-none');
        });
    }
});
