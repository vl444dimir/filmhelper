const COLORS = [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8A5C',
    '#7C3AED', '#F472B6', '#34D399', '#FBBF24', '#60A5FA',
    '#FB923C', '#A78BFA', '#2DD4BF', '#F87171', '#4ADE80'
];

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('wheel-input');
    const addBtn = document.getElementById('wheel-add-btn');
    const list = document.getElementById('wheel-list');
    const count = document.getElementById('wheel-count');
    const clearBtn = document.getElementById('wheel-clear-btn');
    const canvas = document.getElementById('wheel-canvas');
    const spinBtn = document.getElementById('wheel-spin-btn');
    const resultBox = document.getElementById('wheel-result');
    const errorBox = document.getElementById('wheel-error');
    const modeBtns = document.querySelectorAll('.mode-btn');

    let options = [];
    let mode = 'single';
    let isSpinning = false;
    let currentAngle = 0;

    const ctx = canvas.getContext('2d');
    let canvasSize = 400;

    function setupCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height || 320);
        const dpr = window.devicePixelRatio || 1;
        canvasSize = size;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener('wheel-tab-shown', () => {
        setupCanvas();
        drawWheel();
    });

    const resizeObserver = new ResizeObserver(() => {
        setupCanvas();
        drawWheel();
    });
    resizeObserver.observe(canvas.parentElement);
    setTimeout(() => { setupCanvas(); drawWheel(); }, 50);

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mode = btn.dataset.mode;
            clearResult();
        });
    });

    addBtn.addEventListener('click', addOption);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') addOption(); });
    clearBtn.addEventListener('click', clearOptions);
    spinBtn.addEventListener('click', spin);

    function addOption() {
        const val = input.value.trim();
        if (!val) return;
        if (options.includes(val)) {
            showWheelError('Такой вариант уже есть');
            return;
        }
        options.push(val);
        input.value = '';
        renderList();
        drawWheel();
        clearResult();
        input.focus();
    }

    function removeOption(index) {
        options.splice(index, 1);
        renderList();
        drawWheel();
        clearResult();
    }

    function clearOptions() {
        options = [];
        renderList();
        drawWheel();
        clearResult();
    }

    function renderList() {
        list.innerHTML = '';
        options.forEach((opt, i) => {
            const li = document.createElement('li');
            li.innerHTML = `${opt} <button class="remove-option" data-index="${i}">✕</button>`;
            li.querySelector('.remove-option').addEventListener('click', () => removeOption(i));
            list.appendChild(li);
        });
        count.textContent = options.length;
        spinBtn.disabled = options.length < 2;
        clearBtn.classList.toggle('hidden', options.length === 0);
    }

    function drawWheel() {
        const w = canvasSize;
        const h = canvasSize;
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(cx, cy) - 10;

        ctx.clearRect(0, 0, w, h);

        if (options.length === 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Добавь варианты', cx, cy);
            return;
        }

        const arc = (Math.PI * 2) / options.length;

        options.forEach((opt, i) => {
            const startAngle = currentAngle + i * arc;
            const endAngle = startAngle + arc;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = COLORS[i % COLORS.length];
            ctx.fill();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(startAngle + arc / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 3;

            const textR = r * 0.65;
            const displayText = opt.length > 15 ? opt.slice(0, 14) + '…' : opt;
            ctx.fillText(displayText, textR, 0);
            ctx.restore();
        });

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function getWinner() {
        const arc = (Math.PI * 2) / options.length;
        const pointerAngle = -Math.PI / 2;
        const raw = pointerAngle - currentAngle;
        const normalized = ((raw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const index = Math.floor(normalized / arc);
        return Math.min(index, options.length - 1);
    }

    function spin() {
        if (isSpinning) return;
        if (options.length < 2) {
            showWheelError('Нужно хотя бы 2 варианта');
            return;
        }

        isSpinning = true;
        spinBtn.disabled = true;
        clearResult();
        hideWheelError();

        const spins = 5 + Math.random() * 5;
        const targetAngle = currentAngle + spins * Math.PI * 2 + Math.random() * Math.PI * 2;
        const startAngle = currentAngle;
        const duration = 4000 + Math.random() * 1000;
        const startTime = performance.now();

        function animate(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            currentAngle = startAngle + (targetAngle - startAngle) * eased;
            drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                currentAngle = targetAngle;
                isSpinning = false;
                spinBtn.disabled = false;
                onSpinEnd();
            }
        }

        requestAnimationFrame(animate);
    }

    function onSpinEnd() {
        const winnerIndex = getWinner();
        const winner = options[winnerIndex];

        if (mode === 'single') {
            showResult(winner);
        } else {
            showResult(winner, true);
            options.splice(winnerIndex, 1);
            renderList();
            drawWheel();

            if (options.length === 1) {
                showResult(options[0], false, 'Последний оставшийся');
                options = [];
                renderList();
                drawWheel();
            }
        }
    }

    function showResult(text, showLeft = false, note = '') {
        resultBox.classList.remove('hidden');
        resultBox.innerHTML = `
            <div class="winner-label">${note || (mode === 'single' ? 'Победитель' : 'Выбывает')}</div>
            <div class="winner-name">${text}</div>
            ${showLeft ? `<div class="winner-left">Осталось: ${options.length}</div>` : ''}
            ${note ? `<div class="winner-note">${note}</div>` : ''}
        `;
    }

    function clearResult() {
        resultBox.classList.add('hidden');
    }

    function showWheelError(msg) {
        errorBox.textContent = msg;
        errorBox.classList.remove('hidden');
    }

    function hideWheelError() {
        errorBox.classList.add('hidden');
    }
});
