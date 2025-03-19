// Store Machine ID in session storage
document.getElementById('machineIdForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const machineId = document.getElementById('machineId').value;
    sessionStorage.setItem('machineId', machineId);
    
    // Show main content
    document.getElementById('machineIdForm').closest('.row').classList.add('d-none');
    document.getElementById('mainContent').classList.remove('d-none');
});

// Check for existing Machine ID on page load
window.addEventListener('load', function() {
    const machineId = sessionStorage.getItem('machineId');
    if (machineId) {
        document.getElementById('machineId').value = machineId;
        document.getElementById('machineIdForm').closest('.row').classList.add('d-none');
        document.getElementById('mainContent').classList.remove('d-none');
    }
});
