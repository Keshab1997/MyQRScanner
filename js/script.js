const html5QrCode = new Html5Qrcode("reader"); // ম্যানুয়াল ক্লাস
let currentCameraId = null;
let cameras = [];
let isScanning = false;

// ১. ক্যামেরা পারমিশন নেওয়া এবং লিস্ট বের করা
function initScanner() {
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            cameras = devices;
            
            // যদি একাধিক ক্যামেরা থাকে, বাটন দেখাবে। না হলে বাটন লুকাবে।
            if (cameras.length < 2) {
                document.getElementById('swap-camera-btn').classList.add('hidden');
            }

            // ডিফল্ট হিসেবে পেছনের ক্যামেরা (environment) খোঁজা
            // সাধারণত শেষের ক্যামেরাটি ব্যাক ক্যামেরা হয় মোবাইলে
            currentCameraId = cameras[cameras.length - 1].id;
            
            startScanning(currentCameraId);
        } else {
            alert("No cameras found.");
        }
    }).catch(err => {
        console.error("Camera permission error", err);
        alert("Camera permission required!");
    });
}

// ২. স্ক্যানিং শুরু করার ফাংশন
function startScanning(cameraId) {
    if (isScanning) return;

    html5QrCode.start(
        cameraId, 
        {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: window.innerWidth / window.innerHeight // ফুল স্ক্রিন রেশিও
        },
        (decodedText, decodedResult) => {
            onScanSuccess(decodedText);
        },
        (errorMessage) => {
            // স্ক্যানিং এরর ইগনোর করা ভালো
        }
    ).then(() => {
        isScanning = true;
    }).catch(err => {
        console.error("Failed to start scanning", err);
    });
}

// ৩. ক্যামেরা পরিবর্তন (Switch) করার ফাংশন
function switchCamera() {
    if (cameras.length < 2) return; // ক্যামেরা একটা হলে কাজ করবে না

    // বর্তমান ক্যামেরা বন্ধ করা
    html5QrCode.stop().then(() => {
        isScanning = false;
        
        // বর্তমান ক্যামেরার ইনডেক্স বের করা
        let currentIndex = cameras.findIndex(c => c.id === currentCameraId);
        
        // পরের ক্যামেরা সিলেক্ট করা (লুপ আকারে)
        let nextIndex = (currentIndex + 1) % cameras.length;
        currentCameraId = cameras[nextIndex].id;

        // নতুন ক্যামেরা দিয়ে আবার শুরু করা
        startScanning(currentCameraId);
    }).catch(err => {
        console.error("Failed to stop scanning", err);
    });
}

// ৪. সফল স্ক্যান হলে যা হবে
function onScanSuccess(decodedText) {
    // স্ক্যান থামানো
    html5QrCode.stop().then(() => {
        isScanning = false;
        showResult(decodedText);
    });
}

// ৫. রেজাল্ট দেখানো (UI Logic)
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
    } else {
        openBtn.href = "#";
        openBtn.classList.add("disabled");
        openBtn.innerHTML = '<i class="fa-solid fa-font"></i> Text Only';
    }
}

// ৬. আবার স্ক্যান শুরু (Close বাটনের জন্য)
function closeSheet() {
    document.getElementById("result-sheet").classList.remove("active");
    // একটু সময় নিয়ে আবার ক্যামেরা চালু করা
    setTimeout(() => {
        startScanning(currentCameraId);
    }, 500);
}

// ইউটিলিটি ফাংশন
function copyText() {
    const text = document.getElementById("scanned-text").innerText;
    navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById("btn-copy");
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        copyBtn.style.background = "#d4edda";
        copyBtn.style.color = "#155724";
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.background = "#e4e6eb";
            copyBtn.style.color = "#050505";
        }, 2000);
    });
}

function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// অ্যাপ চালু হলে ইনিশিয়ালাইজ হবে
document.addEventListener('DOMContentLoaded', initScanner);