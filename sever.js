// ประกาศตัวแปรกราฟทั้งหมดไว้ด้านบน เพื่อให้เข้าถึงได้จากทุกฟังก์ชัน
let dashChart;
let rtChart;
let histChart;

// ==========================================
// 1. ระบบ Navigation (เปลี่ยนหน้า)
// ==========================================
function showSection(sectionId) {
    // ซ่อนทุก Section
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => sec.classList.add('hidden'));

    // แสดง Section ที่เลือก
    const activeSection = document.getElementById(sectionId);
    if(activeSection) {
        activeSection.classList.remove('hidden');
    }

    // แก้ปัญหากราฟลีบแบน/ไม่โหลด โดยบังคับกราฟ Resize ตัวเองเมื่อเปลี่ยนหน้า
    if (sectionId === 'dashboard' && dashChart) {
        dashChart.resize();
    } else if (sectionId === 'realtime' && rtChart) {
        rtChart.resize();
    } else if (sectionId === 'history' && histChart) {
        histChart.resize();
    }
}

// ==========================================
// 2. ตั้งค่ากราฟ Chart.js
// ==========================================

// --- กราฟ 1: หน้า Dashboard (แบบข้อมูลคงที่/ย้อนหลัง) ---
const dashCtx = document.getElementById('dashboardChart').getContext('2d');
dashChart = new Chart(dashCtx, {
    type: 'bar',
    data: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        datasets: [{
            label: 'การใช้พลังงาน (kWh)',
            data: [2.5, 1.2, 5.8, 8.4, 6.2, 7.1],
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
        }]
    },
    options: { responsive: true }
});

// --- กราฟ 2: หน้า Real-time ---
const rtCtx = document.getElementById('realtimeChart').getContext('2d');
const initialData = {
    labels: Array.from({length: 20}, (_, i) => ''),
    datasets: [{
        label: 'แรงดันไฟฟ้า (Voltage)',
        data: Array.from({length: 20}, () => 220), // เริ่มที่ 220V
        borderColor: 'rgb(234, 179, 8)', // สีเหลือง
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(234, 179, 8, 0.1)'
    }]
};

rtChart = new Chart(rtCtx, {
    type: 'line',
    data: initialData,
    options: {
        responsive: true,
        animation: false, // ปิด animation เพื่อไม่ให้กระตุกตอนอัปเดตแบบ Real-time
        scales: {
            y: {
                min: 210,
                max: 230
            }
        }
    }
});

// --- กราฟ 3: หน้า History (กราฟที่เพิ่มมาใหม่) ---
const histCtx = document.getElementById('historyChart').getContext('2d');
histChart = new Chart(histCtx, {
    type: 'line',
    data: {
        labels: ['มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.'],
        datasets: [{
            label: 'ค่าไฟฟ้า (บาท)',
            data: [1250, 1800, 2100, 1950, 1750, 1600],
            borderColor: 'rgb(239, 68, 68)', // สีแดง
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3, // ทำให้เส้นโค้งมน
            fill: true
        }]
    },
    options: { responsive: true }
});


// ==========================================
// 3. จำลองการรับข้อมูล Real-time (ทุก 2 วินาที)
// ==========================================
setInterval(() => {
    // สุ่มค่า Voltage ระหว่าง 218 - 222
    const currentV = (220 + (Math.random() * 4 - 2)).toFixed(1);
    // สุ่มค่า Current(A) 
    const currentA = (5.0 + (Math.random() * 1.5 - 0.5)).toFixed(1);
    // คำนวณ Power (kW) = (V * A) / 1000
    const currentkW = ((currentV * currentA) / 1000).toFixed(2);

    // อัปเดตตัวเลขหน้า Dashboard
    document.getElementById('currentVoltage').innerText = currentV;
    document.getElementById('currentAmps').innerText = currentA;
    document.getElementById('currentPower').innerText = currentkW;

    // ตรวจจับ Alarm ถ้าไฟตก/ไฟเกิน (จำลอง)
    if(currentV < 215) console.warn("Under Voltage Warning!");

    // อัปเดตกราฟ Real-time
    const now = new Date();
    const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    
    // เอาข้อมูลเก่าสุดออก (shift) และใส่ข้อมูลใหม่ (push)
    rtChart.data.labels.shift();
    rtChart.data.labels.push(timeLabel);
    
    rtChart.data.datasets[0].data.shift();
    rtChart.data.datasets[0].data.push(currentV);
    
    rtChart.update();

}, 2000); // 2000ms = 2 วินาที

// ==========================================
// 4. ฟังก์ชันคำนวณค่าไฟ
// ==========================================
function calculateCost() {
    const units = parseFloat(document.getElementById('unitsInput').value);
    const rate = parseFloat(document.getElementById('rateInput').value);
    
    if(!isNaN(units) && !isNaN(rate)) {
        const total = (units * rate).toFixed(2);
        document.getElementById('estimatedCost').innerText = `${total} ฿`;
    } else {
        alert("กรุณากรอกตัวเลขให้ถูกต้อง");
    }
}

// ==========================================
// 5. ฟังก์ชันส่งออกข้อมูล (Export)
// ==========================================
function exportData() {
    // ในสถานการณ์จริง ตรงนี้จะเรียกใช้ Library อย่าง SheetJS สำหรับ Excel หรือ jsPDF สำหรับ PDF
    alert("ระบบกำลังเตรียมไฟล์ส่งออกเป็น Excel / PDF...\n(ฟังก์ชันนี้พร้อมสำหรับการเชื่อมต่อกับ Backend / Library แล้ว)");
}