// Display Machine ID and load configuration
document.addEventListener('DOMContentLoaded', function() {
    const machineId = sessionStorage.getItem('machineId');
    if (!machineId) {
        window.location.href = '../index.html';
        return;
    }
    document.getElementById('machineIdDisplay').textContent = `Machine ID: ${machineId}`;
});

// Default pricing
const PRICE_BW = 3;  // Price per black & white page
const PRICE_COLOR = 5;  // Price per colored page

// Function to check if an image data contains color
function isColored(imageData) {
    const data = imageData.data;
    const threshold = 15; // Reduced threshold to be more sensitive to subtle colors
    const colorPixelThreshold = 0.005; // Reduced to 0.5% to detect smaller colored areas
    let coloredPixels = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate grayscale value using luminosity method
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        
        // More sensitive color detection
        if (Math.abs(r - gray) > threshold ||
            Math.abs(g - gray) > threshold ||
            Math.abs(b - gray) > threshold ||
            // Add additional check for warm colors (like the doorway)
            (r > g + threshold && r > b + threshold)) { // Detect reddish/orange tones
            coloredPixels++;
        }
    }

    // If we detect even a small amount of color, consider it a color page
    return (coloredPixels / totalPixels) > colorPixelThreshold;
}

// Function to convert image data to grayscale
function convertToGrayscale(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(
            0.2989 * data[i] +     // Red
            0.5870 * data[i + 1] + // Green
            0.1140 * data[i + 2]   // Blue
        );
        data[i] = gray;     // Red
        data[i + 1] = gray; // Green
        data[i + 2] = gray; // Blue
        // Alpha channel (data[i + 3]) remains unchanged
    }
    return imageData;
}

// Function to analyze and process PDF pages
async function analyzePDF(file, forceBW = false) {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let blackAndWhitePages = 0;
        let coloredPages = 0;
        const processedPages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.5 }); // Downscale for performance
            const canvas = document.getElementById('pdfCanvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');

            // Render page to canvas
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // Get image data
            let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const isColorPage = isColored(imageData);

            // Convert to grayscale if needed
            if (forceBW || !isColorPage) {
                imageData = convertToGrayscale(imageData);
                context.putImageData(imageData, 0, 0);
                blackAndWhitePages++;
            } else {
                coloredPages++;
            }

            // Store processed page
            processedPages.push({
                pageNum: i,
                isColor: !forceBW && isColorPage,
                imageData: canvas.toDataURL('image/jpeg', 0.8)
            });
        }

        return {
            blackAndWhitePages,
            coloredPages,
            totalPages: pdf.numPages,
            processedPages,
            totalCost: forceBW ? 
                (pdf.numPages * PRICE_BW) : 
                ((blackAndWhitePages * PRICE_BW) + (coloredPages * PRICE_COLOR))
        };
    } catch (error) {
        console.error('Error analyzing PDF:', error);
        throw error;
    }
}

// Function to analyze DOC/DOCX files
async function analyzeDocument(file, forceBW = false) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;

        // Create a temporary div to count pages
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.style.width = '8.5in';
        tempDiv.style.height = '11in';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        // Estimate pages based on content height
        const contentHeight = tempDiv.scrollHeight;
        const pageHeight = 11 * 96; // 11 inches at 96 DPI
        const totalPages = Math.ceil(contentHeight / pageHeight);

        document.body.removeChild(tempDiv);

        // If color mode is selected (not forceBW), treat all pages as color
        return {
            blackAndWhitePages: forceBW ? totalPages : 0,
            coloredPages: forceBW ? 0 : totalPages,
            totalPages: totalPages,
            content: html,
            totalCost: forceBW ? (totalPages * PRICE_BW) : (totalPages * PRICE_COLOR)
        };
    } catch (error) {
        console.error('Error analyzing document:', error);
        throw error;
    }
}

// Function to analyze TXT files
async function analyzeTXT(file, forceBW = false) {
    try {
        const text = await file.text();
        const linesPerPage = 50; // Approximate lines per page
        const lines = text.split('\n').length;
        const totalPages = Math.ceil(lines / linesPerPage);

        // If color mode is selected (not forceBW), treat all pages as color
        return {
            blackAndWhitePages: forceBW ? totalPages : 0,
            coloredPages: forceBW ? 0 : totalPages,
            totalPages: totalPages,
            content: text,
            totalCost: forceBW ? (totalPages * PRICE_BW) : (totalPages * PRICE_COLOR)
        };
    } catch (error) {
        console.error('Error analyzing text file:', error);
        throw error;
    }
}

// Generate unique file ID
function generateFileId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Store uploaded file
function storeFile(machineId, file, fileId, pageInfo, printMode) {
    const files = JSON.parse(localStorage.getItem('printFiles') || '{}');
    files[fileId] = {
        id: fileId,
        machineId: machineId,
        name: file.name,
        size: file.size,
        type: file.type,
        printMode: printMode,
        blackAndWhitePages: pageInfo.blackAndWhitePages,
        coloredPages: pageInfo.coloredPages,
        totalPages: pageInfo.totalPages,
        totalCost: pageInfo.totalCost,
        processedPages: pageInfo.processedPages || null,
        content: pageInfo.content || null,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    localStorage.setItem('printFiles', JSON.stringify(files));
}

// Handle file upload
document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const machineId = sessionStorage.getItem('machineId');
    const file = document.getElementById('fileUpload').files[0];
    const printMode = document.querySelector('input[name="colorMode"]:checked').value;
    const forceBW = printMode === 'bw';
    
    if (!file) {
        Swal.fire({
            icon: 'error',
            title: 'No File Selected',
            text: 'Please select a file to upload.'
        });
        return;
    }

    // Show loading spinner
    const loadingSwal = Swal.fire({
        title: 'Processing Document',
        html: 'Please wait while we analyze your document...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        let pageInfo;
        const fileType = file.name.split('.').pop().toLowerCase();

        // Process different file types
        switch (fileType) {
            case 'pdf':
                pageInfo = await analyzePDF(file, forceBW);
                break;
            case 'doc':
            case 'docx':
                pageInfo = await analyzeDocument(file, forceBW);
                break;
            case 'txt':
                pageInfo = await analyzeTXT(file, forceBW);
                break;
            default:
                throw new Error('Unsupported file type');
        }

        // Generate file ID and store file info
        const fileId = generateFileId();
        storeFile(machineId, file, fileId, pageInfo, printMode);

        // Close loading spinner
        loadingSwal.close();

        // Show success message with print confirmation
        const result = await Swal.fire({
            icon: 'success',
            title: 'File processed successfully!',
            html: `
                <div class="text-start">
                    <p><strong>Document Details:</strong></p>
                    <ul>
                        <li>File Type: ${fileType.toUpperCase()}</li>
                        <li>Print Mode: ${printMode === 'bw' ? 'Black & White' : 'Color'}</li>
                        <li>Total Pages: ${pageInfo.totalPages}</li>
                        <li>Black & White Pages: ${pageInfo.blackAndWhitePages}</li>
                        <li>Colored Pages: ${forceBW ? 0 : pageInfo.coloredPages}</li>
                        <li>Total Cost: ₱${pageInfo.totalCost}</li>
                    </ul>
                    <p>Please insert ₱${pageInfo.totalCost} into the coin slot to print.</p>
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
            const files = JSON.parse(localStorage.getItem('printFiles') || '{}');
            if (files[fileId]) {
                files[fileId].status = 'printing';
                localStorage.setItem('printFiles', JSON.stringify(files));
            }

            // Show printing progress
            const printingSwal = Swal.fire({
                title: 'Printing in Progress',
                html: `
                    <div class="text-center">
                        <p>Your document is being printed...</p>
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
                if (files[fileId]) {
                    files[fileId].status = 'completed';
                    localStorage.setItem('printFiles', JSON.stringify(files));
                }

                // Reset form
                document.getElementById('uploadForm').reset();
            });
        }
    } catch (error) {
        console.error('Error:', error);
        loadingSwal.close();
        
        Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: 'Failed to process the file. Please try again.',
            background: '#1e1e1e',
            color: '#ffffff'
        });
    }
});
