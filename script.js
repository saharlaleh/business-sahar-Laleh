const card = document.getElementById('flipCard');
const toast = document.getElementById('toast');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ================= پس‌زمینه ذرات نور متحرک (کانواس) =================
(function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const palette = ['#00d4ff', '#00ffcc', '#4d7fff'];
    let particles = [];
    let width, height, dpr;
    let animId = null;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        createParticles();
    }

    function createParticles() {
        const density = width < 620 ? 14000 : 9000;
        const count = Math.min(110, Math.round((width * height) / density));
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 1.8 + 0.6,
            vx: (Math.random() - 0.5) * 0.18,
            vy: (Math.random() - 0.5) * 0.18,
            color: palette[Math.floor(Math.random() * palette.length)],
            baseAlpha: Math.random() * 0.5 + 0.3,
            twinkleSpeed: Math.random() * 0.015 + 0.005,
            twinklePhase: Math.random() * Math.PI * 2
        }));
    }

    function step(time) {
        ctx.clearRect(0, 0, width, height);

        // خطوط ظریف اتصال بین ذرات نزدیک به هم (حس شبکه/کلود)
        const linkDist = width < 620 ? 90 : 130;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i], b = particles[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < linkDist) {
                    ctx.strokeStyle = `rgba(0, 212, 255, ${0.12 * (1 - dist / linkDist)})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        // ذرات نورانی با افکت درخشش و چشمک‌زدن ملایم
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -10) p.x = width + 10;
            if (p.x > width + 10) p.x = -10;
            if (p.y < -10) p.y = height + 10;
            if (p.y > height + 10) p.y = -10;

            const alpha = p.baseAlpha + Math.sin(time * p.twinkleSpeed + p.twinklePhase) * 0.25;
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
            glow.addColorStop(0, hexToRgba(p.color, Math.max(alpha, 0) * 0.9));
            glow.addColorStop(1, hexToRgba(p.color, 0));
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = hexToRgba(p.color, Math.max(alpha, 0.15));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }

        animId = requestAnimationFrame(step);
    }

    function hexToRgba(hex, alpha) {
        const n = parseInt(hex.slice(1), 16);
        const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    resize();
    window.addEventListener('resize', resize);

    if (prefersReducedMotion) {
        // برای کاربرانی که حرکت کمتر می‌خواهند، فقط یک فریم ثابت رسم می‌شود
        step(0);
    } else {
        animId = requestAnimationFrame(step);
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            if (animId) cancelAnimationFrame(animId);
        } else if (!prefersReducedMotion) {
            animId = requestAnimationFrame(step);
        }
    });
})();

// همه‌ی چرخش‌ها (چه فلیپ، چه تیلت موس) از یک منبع واحد کنترل می‌شوند
// تا با هم تداخل نداشته باشند.
let isFlipped = false;

function applyTransform(tiltX, tiltY) {
    const baseY = isFlipped ? 180 : 0;
    card.style.transform = `rotateX(${tiltX}deg) rotateY(${baseY + tiltY}deg)`;
}

// چرخش کارت به صورت سه‌بعدی با کلیک
card.addEventListener('click', function () {
    isFlipped = !isFlipped;
    card.classList.remove('tilting'); // برگرد به ترنزیشن نرم و کامل فلیپ
    applyTransform(0, 0);
});

applyTransform(0, 0);

// افکت تیلت سه‌بعدی هنگام حرکت موس (فقط دسکتاپ و فقط روی روی کارت)
if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    const container = document.querySelector('.card-container');

    container.addEventListener('mousemove', function (e) {
        if (isFlipped) return;

        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        const tiltX = (-y * 10).toFixed(2);
        const tiltY = (x * 10).toFixed(2);

        card.classList.add('tilting');
        applyTransform(tiltX, tiltY);
    });

    container.addEventListener('mouseleave', function () {
        card.classList.remove('tilting');
        applyTransform(0, 0);
    });
}

// کپی اطلاعات تماس با یک کلیک + پیام تأیید
let toastTimeout;
document.querySelectorAll('.copyable').forEach(function (el) {
    el.addEventListener('click', function (e) {
        e.stopPropagation();
        const value = el.getAttribute('data-copy');
        if (!value) return;

        navigator.clipboard.writeText(value).then(function () {
            showToast(value + ' copied');
        }).catch(function () {
            showToast('Could not copy — long-press to select');
        });
    });
});

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
        toast.classList.remove('show');
    }, 1800);
}

// تولید بارکد QR واقعی روی پشت کارت — اسکن آن مخاطب را مستقیم ذخیره می‌کند
const qrContainer = document.getElementById('qrcode');
const qrLargeContainer = document.getElementById('qrcodeLarge');
const qrModal = document.getElementById('qrModal');

if (qrContainer && typeof QRCode !== 'undefined') {
    const vCard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Baghal Laleh;Sahar;;;',
        'FN:Sahar Baghal Laleh',
        'TITLE:Cloud & DevOps Specialist',
        'TEL;TYPE=CELL:+989331745058',
        'EMAIL:saharilaleh84@gmail.com',
        'URL:https://instagram.com/Sahar_Laleh_',
        'END:VCARD'
    ].join('\n');

    new QRCode(qrContainer, {
        text: vCard,
        width: 200,
        height: 200,
        colorDark: '#03060a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });

    new QRCode(qrLargeContainer, {
        text: vCard,
        width: 520,
        height: 520,
        colorDark: '#03060a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });

    // کلیک روی بارکد کوچک = باز شدن نسخه‌ی بزرگ برای اسکن راحت‌تر
    const qrWrap = document.querySelector('.qr-code-wrap');
    qrWrap.addEventListener('click', function (e) {
        e.stopPropagation();
        qrModal.classList.add('show');
    });

    // کلیک روی هر جای مودال (به‌جز خود بارکد) = بستن
    qrModal.addEventListener('click', function () {
        qrModal.classList.remove('show');
    });
}