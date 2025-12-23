// ভেরিয়েবল ডিক্লারেশন
const html5QrCode = new Html5Qrcode("reader"); // ম্যানুয়াল স্ক্যানার ক্লাস
let currentCameraId = null; // বর্তমান ক্যামেরার আইডি
let cameras = []; // সব ক্যামেরার লিস্ট
let isScanning = false; // স্ক্যানার চলছে কিনা চেক করার জন্য

// ১. পেজ লোড হলে ক্যামেরা পারমিশন নেওয়া এবং লিস্ট তৈরি করা
function initScanner() {
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            cameras = devices;
            
            // যদি মোবাইলে ১টি ক্যামেরা থাকে, তাহলে সুইচ বাটন লুকিয়ে ফেলা হবে
            if (cameras.length < 2) {
                const switchBtn = document.getElementById('swap-camera-btn');
                if(switchBtn) switchBtn.classList.add('hidden');
            }

            // ডিফল্ট হিসেবে পেছনের ক্যামেরা (Back Camera) সিলেক্ট করা
            // সাধারণত লিস্টের শেষের ক্যামেরাটি মেইন ক্যামেরা হয়
            currentCameraId = cameras[cameras.length - 1].id;
            
            // স্ক্যানিং শুরু করা
            startScanning(currentCameraId);
        } else {
            alert("No cameras found on this device.");
        }
    }).catch(err => {
        console.error("Camera Error:", err);
        alert("Camera permission is required to scan QR codes.");
    });
}

// ২. স্ক্যানিং শুরু করার ফাংশন (ন্যাচারাল ভিউ)
function startScanning(cameraId) {
    // যদি আগে থেকেই স্ক্যানার চালু থাকে, তবে নতুন করে অন করার দরকার নেই
    // তবে ক্যামেরা সুইচের সময় আমরা স্টপ করে আবার স্টার্ট করি
    
    html5QrCode.start(
        cameraId, 
        {
            fps: 10,    // প্রতি সেকেন্ডে ১০ বার স্ক্যান করবে
            qrbox: { width: 250, height: 250 } // স্ক্যানিং বক্সের সাইজ
            
            // ❌ aspectRatio লাইনটি এখানে ডিলিট করা হয়েছে।
            // এর ফলেই ক্যামেরা আর জুম হবে না, ন্যাচারাল দেখাবে।
        },
        (decodedText, decodedResult) => {
            // QR কোড পাওয়া গেলে
            onScanSuccess(decodedText);
        },
        (errorMessage) => {
            // স্ক্যানিং এরর (যেমন ফ্রেম রিড করতে না পারা) - আমরা ইগনোর করব
        }
    ).then(() => {
        isScanning = true;
        console.log("Camera started");
    }).catch(err => {
        console.error("Failed to start camera", err);
    });
}

// ৩. ক্যামেরা পরিবর্তন (Switch Camera) করার ফাংশন
function switchCamera() {
    if (cameras.length < 2) return; // ক্যামেরা ১টা হলে কাজ করবে না

    // বর্তমান ক্যামেরা বন্ধ করা
    html5QrCode.stop().then(() => {
        isScanning = false;
        
        // বর্তমান ক্যামেরার ইনডেক্স খুঁজে বের করা
        let currentIndex = cameras.findIndex(c => c.id === currentCameraId);
        
        // পরের ক্যামেরা সিলেক্ট করা (চক্রাকারে ঘুরবে)
        let nextIndex = (currentIndex + 1) % cameras.length;
        currentCameraId = cameras[nextIndex].id;

        // নতুন ক্যামেরা চালু করা
        startScanning(currentCameraId);
    }).catch(err => {
        console.error("Failed to stop camera for switching", err);
    });
}

// ৪. স্ক্যান সফল হলে যা হবে
function onScanSuccess(decodedText) {
    // সফল হলে ক্যামেরা বন্ধ করে দেওয়া (ব্যাটারি বাঁচানোর জন্য)
    html5QrCode.stop().then(() => {
        isScanning = false;
        showResult(decodedText); // রেজাল্ট দেখানো
    }).catch(err => {
        console.error("Failed to stop scanning", err);
    });
}

// ৫. রেজাল্ট পপ-আপ (Bottom Sheet) দেখানো
function showResult(text) {
    const sheet = document.getElementById("result-sheet");
    const scannedTextElement = document.getElementById("scanned-text");
    const openBtn = document.getElementById("btn-open");

    // টেক্সট সেট করা
    scannedTextElement.innerText = text;
    sheet.classList.add("active"); // শিট উপরে তোলা

    // লিংক ভ্যালিডেশন চেক করা
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

// ৬. "Scan Again" বাটনে ক্লিক করলে
function closeSheet() {
    const sheet = document.getElementById("result-sheet");
    sheet.classList.remove("active");
    
    // পপ-আপ নামার পর ক্যামেরা আবার চালু হবে
    setTimeout(() => {
        startScanning(currentCameraId);
    }, 500);
}

// ৭. টেক্সট কপি করার ফাংশন
function copyText() {
    const text = document.getElementById("scanned-text").innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById("btn-copy");
        const originalHTML = copyBtn.innerHTML;
        
        // বাটনের স্টাইল চেঞ্জ করা (Copied দেখানোর জন্য)
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        copyBtn.style.background = "#d4edda"; // হালকা সবুজ
        copyBtn.style.color = "#155724";      // গাঢ় সবুজ
        
        // ২ সেকেন্ড পর আবার আগের অবস্থায় ফিরে আসা
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.background = "#e9ecef";
            copyBtn.style.color = "#212529";
        }, 2000);
    }).catch(err => {
        console.error("Failed to copy text", err);
    });
}

// ৮. URL ভ্যালিড কিনা চেক করার ফাংশন
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// পেজ পুরোপুরি লোড হলে অ্যাপ চালু হবে
document.addEventListener('DOMContentLoaded', initScanner);