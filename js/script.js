// ভেরিয়েবল
const html5QrCode = new Html5Qrcode("reader");
let currentCameraId = null;
let cameras = [];
let isScanning = false;
let isFlashOn = false;

// ১. ইনিশিয়ালাইজেশন
function initScanner() {
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            cameras = devices;
            
            // ক্যামেরা একাধিক থাকলে সুইচ বাটন দেখাবে
            if (cameras.length > 1) {
                document.getElementById('swap-camera-btn').classList.remove('hidden');
            }

            // পেছনের ক্যামেরা সিলেক্ট করা
            currentCameraId = cameras[cameras.length - 1].id;
            
            startScanning(currentCameraId);
        } else {
            alert("No cameras found.");
        }
    }).catch(err => {
        console.error("Camera Error:", err);
        alert("Camera permission denied.");
    });
}

// ২. স্ক্যানিং শুরু
function startScanning(cameraId) {
    html5QrCode.start(
        cameraId, 
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
            onScanSuccess(decodedText);
        },
        (errorMessage) => {
            // Error ignore
        }
    ).then(() => {
        isScanning = true;
        
        // ক্যামেরা চালু হওয়ার পর ফ্ল্যাশ চেক করা
        checkFlashSupport();
        
    }).catch(err => {
        console.error("Start failed", err);
    });
}

// ৩. ফ্ল্যাশ সাপোর্ট আছে কিনা চেক করা
function checkFlashSupport() {
    const flashBtn = document.getElementById('flash-btn');
    
    // ল্যাপটপে সাধারণত ফ্ল্যাশ থাকে না, তাই চেক করে বাটন দেখাতে হবে
    html5QrCode.getRunningTrackCameraCapabilities().then(capabilities => {
        if (capabilities.torchFeature().isSupported()) {
            flashBtn.classList.remove('hidden'); // ফ্ল্যাশ থাকলে বাটন দেখাবে
        } else {
            flashBtn.classList.add('hidden'); // না থাকলে লুকিয়ে রাখবে
        }
    }).catch(err => {
        // পুরনো ডিভাইসের জন্য বিকল্প চেক
        const track = html5QrCode.getRunningTrack();
        if (track) {
            const imageCapture = new ImageCapture(track);
            imageCapture.getPhotoCapabilities().then(capabilities => {
                if (capabilities.fillLightMode && capabilities.fillLightMode.includes('flash')) {
                   flashBtn.classList.remove('hidden');
                }
            }).catch(e => console.log('No flash capabilities found'));
        }
    });
}

// ৪. ফ্ল্যাশ অন/অফ ফাংশন
function toggleFlash() {
    if (!isScanning) return;

    isFlashOn = !isFlashOn;
    const flashBtn = document.getElementById('flash-btn');

    html5QrCode.applyVideoConstraints({
        advanced: [{ torch: isFlashOn }]
    })
    .then(() => {
        if (isFlashOn) {
            flashBtn.classList.add('flash-active');
            flashBtn.innerHTML = '<i class="fa-solid fa-bolt-lightning"></i>';
        } else {
            flashBtn.classList.remove('flash-active');
            flashBtn.innerHTML = '<i class="fa-solid fa-bolt"></i>';
        }
    })
    .catch(err => {
        console.error("Flash toggle error", err);
        isFlashOn = !isFlashOn; // রিভার্স
    });
}

// ৫. ক্যামেরা সুইচ
function switchCamera() {
    if (cameras.length < 2) return;

    html5QrCode.stop().then(() => {
        isScanning = false;
        
        // ফ্ল্যাশ বন্ধ করা
        isFlashOn = false;
        document.getElementById('flash-btn').classList.remove('flash-active');

        let currentIndex = cameras.findIndex(c => c.id === currentCameraId);
        let nextIndex = (currentIndex + 1) % cameras.length;
        currentCameraId = cameras[nextIndex].id;

        startScanning(currentCameraId);
    }).catch(err => {
        console.error("Stop failed", err);
    });
}

// ৬. স্ক্যান সফল হলে
function onScanSuccess(decodedText) {
    html5QrCode.stop().then(() => {
        isScanning = false;
        showResult(decodedText);
    }).catch(err => {
        console.error("Failed to stop", err);
    });
}

// ৭. রেজাল্ট দেখানো
function showResult(text) {
    const sheet = document.getElementById("result-sheet");
    const scannedTextElement = document.getElementById("scanned-text");
    const openBtn = document.getElementById("btn-open");

    scannedTextElement.innerText = text;
    sheet.classList.add("active");

    if (isValidURL(text)) {
        openBtn.href = text;
        openBtn.classList.remove("disabled");
        openBtn.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i> Open Link';
        openBtn.style.pointerEvents = "auto";
    } else {
        openBtn.href = "#";
        openBtn.classList.add("disabled");
        openBtn.innerHTML = '<i class="fa-solid fa-font"></i> Text Only';
        openBtn.style.pointerEvents = "none";
    }
}

function closeSheet() {
    document.getElementById("result-sheet").classList.remove("active");
    setTimeout(() => {
        startScanning(currentCameraId);
    }, 500);
}

// ৮. কপি ফাংশন
function copyText() {
    const text = document.getElementById("scanned-text").innerText;
    navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById("btn-copy");
        const originalContent = copyBtn.innerHTML;
        
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        copyBtn.style.background = "#28a745";
        copyBtn.style.borderColor = "#28a745";

        setTimeout(() => {
            copyBtn.innerHTML = originalContent;
            copyBtn.style.background = "#333";
            copyBtn.style.borderColor = "#444";
        }, 2000);
    });
}

function isValidURL(string) {
    try { new URL(string); return true; } catch (_) { return false; }
}

// অ্যাপ স্টার্ট
document.addEventListener('DOMContentLoaded', initScanner);

// PWA Install Logic (Safe Check)
const installBtn = document.getElementById('installAppBtn');
let deferredPrompt;

if (installBtn) {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
    });

    installBtn.addEventListener('click', () => {
        installBtn.style.display = 'none';
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt = null;
        }
    });
}