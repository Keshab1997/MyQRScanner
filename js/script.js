let html5QrcodeScanner;

function onScanSuccess(decodedText, decodedResult) {
    // ১. সফলভাবে স্ক্যান হলে কনসোলে দেখানো
    console.log(`Code matched = ${decodedText}`, decodedResult);

    // ২. স্ক্যানিং সাময়িকভাবে বন্ধ করা (যাতে বারবার স্ক্যান না হয়)
    html5QrcodeScanner.pause();

    // ৩. রেজাল্ট Bottom Sheet-এ দেখানো
    const sheet = document.getElementById("result-sheet");
    const scannedTextElement = document.getElementById("scanned-text");
    const openBtn = document.getElementById("btn-open");

    scannedTextElement.innerText = decodedText;
    sheet.classList.add("active"); // পপ-আপ উপরে উঠবে

    // ৪. যদি এটি একটি লিংক হয়, তবে Open বাটন সচল করা
    if (isValidURL(decodedText)) {
        openBtn.href = decodedText;
        openBtn.classList.remove("disabled");
        openBtn.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i> Open Link';
    } else {
        openBtn.href = "#";
        openBtn.classList.add("disabled");
        openBtn.innerHTML = '<i class="fa-solid fa-font"></i> Text Only';
    }
}

function onScanFailure(error) {
    // স্ক্যান না হলে বা এরর হলে এখানে আসবে (আমরা ইগনোর করছি)
}

// স্ক্যানার সেটআপ
function startScanner() {
    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0 
        },
        /* verbose= */ false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

// স্ক্যানার আবার চালু করা (Close বাটনে ক্লিক করলে)
function closeSheet() {
    const sheet = document.getElementById("result-sheet");
    sheet.classList.remove("active");
    
    // ১ সেকেন্ড পর আবার স্ক্যান শুরু করবে
    setTimeout(() => {
        html5QrcodeScanner.resume();
    }, 500);
}

// টেক্সট কপি করার ফাংশন
function copyText() {
    const text = document.getElementById("scanned-text").innerText;
    navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById("btn-copy");
        const originalText = copyBtn.innerHTML;
        
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        copyBtn.style.background = "#d4edda";
        copyBtn.style.color = "#155724";
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = "#e4e6eb";
            copyBtn.style.color = "#050505";
        }, 2000);
    });
}

// URL চেক করার ফাংশন
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// পেজ লোড হলে স্ক্যানার চালু হবে
document.addEventListener('DOMContentLoaded', startScanner);