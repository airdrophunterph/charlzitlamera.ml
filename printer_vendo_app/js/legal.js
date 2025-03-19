// Display Machine ID
document.addEventListener('DOMContentLoaded', function() {
    const machineId = sessionStorage.getItem('machineId');
    if (!machineId) {
        window.location.href = '../index.html';
        return;
    }
    document.getElementById('machineIdDisplay').textContent = `Machine ID: ${machineId}`;
});

// Template field definitions
const documentFields = {
    'affidavit-loss': [
        { id: 'fullName', label: 'Full Name', type: 'text' },
        { id: 'address', label: 'Complete Address', type: 'text' },
        { id: 'itemLost', label: 'Item Lost', type: 'text' },
        { id: 'dateOfLoss', label: 'Date of Loss', type: 'date' },
        { id: 'circumstances', label: 'Circumstances of Loss', type: 'textarea' }
    ],
    'special-power': [
        { id: 'principalName', label: 'Principal Name', type: 'text' },
        { id: 'attorneyName', label: 'Attorney-in-Fact Name', type: 'text' },
        { id: 'powers', label: 'Powers Granted', type: 'textarea' },
        { id: 'validUntil', label: 'Valid Until', type: 'date' }
    ],
    'quit-claim': [
        { id: 'releasorName', label: 'Releasor Name', type: 'text' },
        { id: 'releaseeName', label: 'Releasee Name', type: 'text' },
        { id: 'propertyDescription', label: 'Property Description', type: 'textarea' },
        { id: 'consideration', label: 'Consideration Amount', type: 'number' }
    ],
    'lease-agreement': [
        { id: 'lessorName', label: 'Lessor Name', type: 'text' },
        { id: 'lesseeName', label: 'Lessee Name', type: 'text' },
        { id: 'propertyAddress', label: 'Property Address', type: 'text' },
        { id: 'monthlyRent', label: 'Monthly Rent', type: 'number' },
        { id: 'leaseTerm', label: 'Lease Term (months)', type: 'number' },
        { id: 'startDate', label: 'Start Date', type: 'date' }
    ]
};

// Generate form fields based on selected document
document.getElementById('documentType').addEventListener('change', function() {
    const selectedType = this.value;
    const dynamicFields = document.getElementById('dynamicFields');
    const previewSection = document.getElementById('previewSection');
    const printBtn = document.getElementById('printBtn');
    
    dynamicFields.innerHTML = '';
    previewSection.classList.add('d-none');
    printBtn.classList.add('d-none');
    
    if (!selectedType) return;
    
    const fields = documentFields[selectedType];
    fields.forEach(field => {
        const div = document.createElement('div');
        div.className = 'mb-3';
        
        const label = document.createElement('label');
        label.className = 'form-label';
        label.htmlFor = field.id;
        label.textContent = field.label;
        
        let input;
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
        } else {
            input = document.createElement('input');
            input.type = field.type;
        }
        
        input.className = 'form-control';
        input.id = field.id;
        input.name = field.id;
        input.required = true;
        
        div.appendChild(label);
        div.appendChild(input);
        dynamicFields.appendChild(div);
    });
});

// Handle form submission
document.getElementById('legalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const documentType = document.getElementById('documentType').value;
    const fields = documentFields[documentType];
    const values = {};
    
    fields.forEach(field => {
        values[field.id] = document.getElementById(field.id).value;
    });
    
    // Show loading spinner
    document.getElementById('loadingSpinner').style.display = 'block';
    
    // Simulate document generation
    setTimeout(() => {
        document.getElementById('loadingSpinner').style.display = 'none';
        
        // Show preview
        const previewSection = document.getElementById('previewSection');
        const documentPreview = document.getElementById('documentPreview');
        const printBtn = document.getElementById('printBtn');
        
        previewSection.classList.remove('d-none');
        printBtn.classList.remove('d-none');
        
        // Generate preview based on document type
        let preview = '';
        switch(documentType) {
            case 'affidavit-loss':
                preview = generateAffidavitPreview(values);
                break;
            case 'special-power':
                preview = generatePowerOfAttorneyPreview(values);
                break;
            case 'quit-claim':
                preview = generateQuitClaimPreview(values);
                break;
            case 'lease-agreement':
                preview = generateLeasePreview(values);
                break;
        }
        
        documentPreview.innerHTML = preview;
    }, 1500);
});

// Preview generators
function generateAffidavitPreview(values) {
    return `
        <div class="p-3">
            <h4 class="text-center mb-4">AFFIDAVIT OF LOSS</h4>
            <p>I, ${values.fullName}, of legal age, residing at ${values.address}, after being duly sworn in accordance with law, hereby depose and say:</p>
            <p>That I lost my ${values.itemLost} on ${values.dateOfLoss} under the following circumstances:</p>
            <p>${values.circumstances}</p>
            <div class="mt-5">
                <p>IN WITNESS WHEREOF, I have hereunto set my hand this ____ day of ______, 2024 at ________.</p>
                <div class="mt-5">
                    <p>_______________________</p>
                    <p>Affiant</p>
                </div>
            </div>
        </div>
    `;
}

function generatePowerOfAttorneyPreview(values) {
    return `
        <div class="p-3">
            <h4 class="text-center mb-4">SPECIAL POWER OF ATTORNEY</h4>
            <p>KNOW ALL MEN BY THESE PRESENTS:</p>
            <p>I, ${values.principalName}, hereby name, constitute and appoint ${values.attorneyName} to be my true and lawful attorney-in-fact for me and in my name, place and stead, to:</p>
            <p>${values.powers}</p>
            <p>This Special Power of Attorney shall be valid until ${values.validUntil}.</p>
            <div class="mt-5">
                <p>IN WITNESS WHEREOF, I have hereunto set my hand this ____ day of ______, 2024.</p>
                <div class="mt-5">
                    <p>_______________________</p>
                    <p>Principal</p>
                </div>
            </div>
        </div>
    `;
}

function generateQuitClaimPreview(values) {
    return `
        <div class="p-3">
            <h4 class="text-center mb-4">QUIT CLAIM DEED</h4>
            <p>THIS DEED made between ${values.releasorName} ("Releasor") and ${values.releaseeName} ("Releasee").</p>
            <p>WITNESSETH, that the Releasor, for and in consideration of the sum of ${values.consideration}, releases and forever quits claim to the Releasee all right, title, interest and claim in the following described property:</p>
            <p>${values.propertyDescription}</p>
            <div class="mt-5">
                <p>IN WITNESS WHEREOF, the Releasor has executed this deed on this ____ day of ______, 2024.</p>
                <div class="mt-5">
                    <p>_______________________</p>
                    <p>Releasor</p>
                </div>
            </div>
        </div>
    `;
}

function generateLeasePreview(values) {
    return `
        <div class="p-3">
            <h4 class="text-center mb-4">LEASE AGREEMENT</h4>
            <p>THIS LEASE AGREEMENT made between ${values.lessorName} ("Lessor") and ${values.lesseeName} ("Lessee").</p>
            <p>WITNESSETH:</p>
            <p>1. The Lessor hereby leases to the Lessee the property located at ${values.propertyAddress}.</p>
            <p>2. The term of this lease shall be ${values.leaseTerm} months beginning on ${values.startDate}.</p>
            <p>3. The Lessee shall pay to the Lessor the sum of ${values.monthlyRent} per month as rent.</p>
            <div class="mt-5">
                <div class="row">
                    <div class="col-6">
                        <p>_______________________</p>
                        <p>Lessor</p>
                    </div>
                    <div class="col-6">
                        <p>_______________________</p>
                        <p>Lessee</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Handle print button
document.getElementById('printBtn').addEventListener('click', function() {
    const colorMode = document.querySelector('input[name="colorMode"]:checked').value;
    const content = document.getElementById('documentPreview').innerText;
    
    // Mock cost calculation
    const pages = Math.ceil(content.length / 500);
    const cost = colorMode === 'color' ? pages * 15 : pages * 5;
    
    alert(`Document ready for printing!\n\nEstimated pages: ${pages}\nEstimated cost: ₱${cost}\n\nPlease insert ₱${cost} into the coin slot to print.`);
});
