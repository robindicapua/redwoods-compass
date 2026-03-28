// --- Configuration ---
const QUESTIONS_FILE_URL = './src/redwoods_compass_questions_v0.6.json';

// --- State ---
let questions = [];
let answers = {};
let skippedCats = new Set();
let showSub = false;
let activeTip = null;
let visibleQuestions = new Set();
let grouped = {};
let animatedFollowUps = new Set(); // tracks follow-ups that have already played their intro animation

// --- DOM Elements ---
const toggleSubEl = document.getElementById('toggleSub');
const categoriesContainer = document.getElementById('categoriesContainer');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const tooltipEl = document.getElementById('tooltip');
const tooltipTextEl = document.getElementById('tooltipText');

// --- Icons (Lucide) ---
const InfoIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`;
const ChevronDownIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>`;

// --- Initialize ---
async function init() {
    try {
        const res = await fetch(QUESTIONS_FILE_URL);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const parsedData = await res.json();
        
        parseQuestions(parsedData);
        updateVisibleQuestions();
        render(); // render initial categories
    } catch (e) {
        console.error('Failed to load questions JSON:', e);
        categoriesContainer.innerHTML = `<div class="text-[#f28b82] p-4 border border-[#f28b82] rounded bg-[#f28b82]/10 mb-4"> Failed to load questions. Make sure you are running a local server to avoid CORS issues. Ensure that the questions file is located at '${QUESTIONS_FILE_URL}'.<br><br>Error: ${e.message}</div>`;
    }

    // Event Listeners for global elements
    toggleSubEl.addEventListener('change', (e) => {
        showSub = e.target.checked;
        render();
    });

    exportCsvBtn.addEventListener('click', exportCSV);

    // Document click to close tooltip if clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.info-tip-icon') && !e.target.closest('#tooltip')) {
            setActiveTip(null);
        }
    });

    window.addEventListener('scroll', () => {
        if (activeTip) updateTooltipPosition();
    }, { passive: true });
    
    window.addEventListener('resize', () => {
        if (activeTip) updateTooltipPosition();
    }, { passive: true });
}

function parseQuestions(parsedData) {
    let questionArray = [];
    
    // Check if the data matches the new nested structure
    const isNestedStructure = Array.isArray(parsedData) && parsedData.length > 0 && 'Questions' in parsedData[0];

    if (isNestedStructure) {
        // New nested structure
        parsedData.forEach((category) => {
            const categoryName = category.Category || 'Other';
            const categoryDesc = category.CategoryDescription || '';

            if (Array.isArray(category.Questions)) {
                // Map each question in the category to our internal format
                const categoryQuestions = category.Questions.map((q, idx) => ({
                    id: q.id || `${categoryName.replace(/\s+/g, '-')}-q${idx}`,
                    category: categoryName,
                    subcategory: q.Subcategory || '',
                    question: q.Question || '',
                    description: q.Description || '',
                    infotip: q.Infotip || '',
                    categoryDescription: categoryDesc,
                    showIf: q.showIf,
                    weight: q.weight ?? 1,
                }));

                questionArray.push(...categoryQuestions);
            }
        });
    } else {
        // Fall back to the old flat structure for backward compatibility
        questionArray = parsedData.map((q, i) => ({
            id: q.id || `q${i}`,
            category: q.Category ?? 'Other',
            subcategory: q.Subcategory ?? '',
            question: q.Question ?? '',
            description: q.Description ?? '',
            infotip: q.Infotip ?? '',
            categoryDescription: q.CategoryDescription ?? '',
            showIf: q.showIf,
            weight: q.weight ?? 1,
        }));
    }

    questions = questionArray;

    // Grouping
    grouped = {};
    questions.forEach((q) => {
        if (!grouped[q.category]) {
            grouped[q.category] = { subs: {}, desc: q.categoryDescription || '' };
        }
        grouped[q.category].desc = grouped[q.category].desc || q.categoryDescription || '';
        const subs = grouped[q.category].subs;
        subs[q.subcategory] = subs[q.subcategory] || [];
        subs[q.subcategory].push(q);
    });

    if (questions.length > 0) {
        exportCsvBtn.removeAttribute('disabled');
    }
}

function updateVisibleQuestions() {
    const visible = new Set();

    // Start with questions that are unconditional (no showIf)
    questions.forEach(q => {
        if (!q.showIf) {
            visible.add(q.id);
        }
    });

    // Then check conditional questions
    questions.forEach(q => {
        if (q.showIf) {
            const parentId = q.showIf.questionId;
            const requiredAnswer = q.showIf.equals;
            const parentAnswer = answers[parentId];

            if (parentAnswer === requiredAnswer) {
                visible.add(q.id);
            } else if (answers[q.id]) {
                // Clear answers for questions that become hidden
                delete answers[q.id];
            }
        }
    });

    // When a follow-up goes hidden, reset its animation state so it re-animates next time it appears
    animatedFollowUps.forEach(id => {
        if (!visible.has(id)) {
            animatedFollowUps.delete(id);
        }
    });

    // Check if visibility changed
    let changed = visible.size !== visibleQuestions.size;
    if (!changed) {
        for (let item of visible) {
            if (!visibleQuestions.has(item)) {
                changed = true;
                break;
            }
        }
    }

    if (changed) {
        visibleQuestions = visible;
        render(); // re-render if visibility changed
    }
}

function calculateProgress() {
    let required = 0;
    let answered = 0;
    
    questions.forEach(q => {
        let isVisible = true;
        if (q.showIf) {
            const parentAnswer = answers[q.showIf.questionId];
            if (parentAnswer !== q.showIf.equals) {
                isVisible = false;
            }
        }
        
        if (isVisible) {
            required++;
            if (answers[q.id]) {
                answered++;
            }
        }
    });

    const progress = required ? Math.round((answered / required) * 100) : 0;
    progressText.textContent = progress;
    progressBar.style.width = `${progress}%`;
}

function updateCategoryCounters() {
    const categoryKeys = Object.keys(grouped);
    categoryKeys.forEach(cat => {
        const data = grouped[cat];
        const isSkippedCat = skippedCats.has(cat);
        let totalCatQuestions = 0;
        let answeredCatQuestions = 0;
        const qsList = Object.values(data.subs).flat();
        qsList.forEach(q => {
            if (visibleQuestions.has(q.id)) {
                totalCatQuestions++;
                if (answers[q.id]) {
                    answeredCatQuestions++;
                }
            }
        });
        const isComplete = totalCatQuestions > 0 && totalCatQuestions === answeredCatQuestions;

        const counterContainer = document.querySelector(`.cat-counter[data-cat="${escapeHtml(cat)}"]`);
        if (counterContainer) {
            if (isSkippedCat) {
                counterContainer.innerHTML = `<span class="italic text-[#b0b3b8]">Skipped</span>`;
            } else {
                counterContainer.innerHTML = `
                    <span class="font-medium px-3 py-1 rounded-full ${isComplete ? 'bg-[#1877f2]/20 text-[#1877f2]' : 'bg-[#3a3b3c] text-[#e4e6ea]'} flex items-center gap-1.5 transition-colors">
                        ${answeredCatQuestions} / ${totalCatQuestions} ${isComplete ? 'Completed' : 'Answered'}
                        ${isComplete ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                    </span>
                `;
            }
        }
    });
}

function setAnswer(id, val) {
    if (val === undefined) {
        delete answers[id];
    } else {
        answers[id] = val;
    }
    
    updateVisibleQuestions();
    calculateProgress();
    updateCategoryCounters();
    
    // Update DOM manually to avoid full re-render scroll jumps if render wasn't called
    const radios = document.querySelectorAll(`input[name="q_${id}"]`);
    radios.forEach(r => r.checked = (r.value === val));
    
    const unskipBtn = document.querySelector(`.skip-btn[data-id="${id}"]`);
    if (unskipBtn) {
        unskipBtn.textContent = val === 'Skipped' ? 'Unskip' : 'Skip';
    }
    
    const qItem = document.getElementById(`qitem_${id}`);
    if (qItem) {
        if (val === 'Skipped') {
            qItem.classList.add('opacity-50');
        } else {
            qItem.classList.remove('opacity-50');
        }
    }
}

function toggleSkipQ(id) {
    if (answers[id] === 'Skipped') {
        setAnswer(id, undefined);
    } else {
        setAnswer(id, 'Skipped');
    }
    
    render(); // force render to clean up radio button checked states properly
}

function toggleSkipCat(cat) {
    if (skippedCats.has(cat)) {
        skippedCats.delete(cat);
        const ids = questions.filter(q => q.category === cat).map(q => q.id);
        ids.forEach(id => {
            if (answers[id] === 'Skipped') {
                delete answers[id];
            }
        });
    } else {
        skippedCats.add(cat);
        // Remove answers or set them to 'Skipped' when skipping category
        const ids = questions.filter(q => q.category === cat).map(q => q.id);
        ids.forEach(id => {
            answers[id] = 'Skipped';
        });
    }
    updateVisibleQuestions();
    render();
}

function setActiveTip(id, anchorEl = null) {
    activeTip = id;
    if (!id) {
        tooltipEl.classList.add('hidden');
        return;
    }
    
    const q = questions.find(q => q.id === id);
    if (!q) return;

    tooltipTextEl.textContent = q.infotip;
    tooltipEl.classList.remove('hidden');
    
    updateTooltipPosition();
}

function updateTooltipPosition() {
    if (!activeTip) return;
    const anchorEl = document.getElementById(`info_${activeTip}`);
    if (!anchorEl) return;

    const rect = anchorEl.getBoundingClientRect();
    
    tooltipEl.style.top = `${rect.top - 10}px`;
    tooltipEl.style.left = `${rect.left + rect.width / 2 - 100}px`;
}

// --- Render Logic ---
function escapeHtml(unsafe) {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function renderQuestionItem(q) {
    const answer = answers[q.id];
    const isSkipped = answer === 'Skipped';
    const yesChecked = answer === 'Yes' ? 'checked' : '';
    const noChecked = answer === 'No' ? 'checked' : '';
    const isFollowUp = !!q.showIf;

    // Only animate when the follow-up is newly revealed (not already tracked as visible)
    const isNewlyRevealed = isFollowUp && !animatedFollowUps.has(q.id);
    if (isFollowUp) animatedFollowUps.add(q.id);

    // Follow-up visual treatment: left border, tinted bg, animation only on first reveal
    const followUpClass = isFollowUp
        ? `border-l-2 border-l-[#1877f2] bg-[#1877f2]/5${isNewlyRevealed ? ' followup-question' : ''}`
        : '';
    const followUpBadge = isFollowUp
        ? `<div class="mb-2 flex items-center gap-1">
               <span class="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#1877f2]/15 text-[#6fa8f5] select-none">
                   <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/></svg>
                   Follow-up
               </span>
           </div>`
        : '';
    
    return `
        <div id="qitem_${q.id}" class="p-4 border-b border-[#3a3b3c] ${followUpClass} ${isSkipped ? 'opacity-50' : ''}">
            ${followUpBadge}
            <div class="flex items-start gap-2">
                <span class="flex-1 text-[#e4e6ea]">${escapeHtml(q.question)}</span>
                ${q.infotip ? `
                    <button id="info_${q.id}" class="info-tip-icon w-6 h-6 rounded-full bg-[#1877f2] text-white flex shrink-0 items-center justify-center transition-opacity hover:opacity-80" data-id="${q.id}">
                        ${InfoIcon}
                    </button>
                ` : ''}
            </div>
            ${q.description ? `<p class="mt-2 text-sm italic text-[#b0b3b8]">${escapeHtml(q.description)}</p>` : ''}
            <div class="mt-3 flex gap-6 flex-wrap items-center">
                <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" class="radio-btn accent-[#1877f2]" name="q_${q.id}" value="Yes" data-id="${q.id}" ${yesChecked} />
                    <span>Yes</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" class="radio-btn accent-[#1877f2]" name="q_${q.id}" value="No" data-id="${q.id}" ${noChecked} />
                    <span>No</span>
                </label>
                <button class="skip-btn ml-auto text-xs underline hover:text-[#1877f2]" data-id="${q.id}">
                    ${isSkipped ? 'Unskip' : 'Skip'}
                </button>
            </div>
        </div>
    `;
}

function render() {
    let html = '';
    const categoryKeys = Object.keys(grouped);

    categoryKeys.forEach((cat, catIndex) => {
        const data = grouped[cat];
        const isSkippedCat = skippedCats.has(cat);
        
        // Find existing state of toggle (if this was already rendered)
        let isExpanded = catIndex === 0;
        const existingCatBody = document.querySelector(`.cat-container[data-cat="${escapeHtml(cat)}"] .cat-body`);
        if (existingCatBody) {
            isExpanded = !existingCatBody.classList.contains('hidden');
        }
        
        let questionsHtml = '';
        
        if (showSub) {
            for (const [sub, qs] of Object.entries(data.subs)) {
                let subHtml = '';
                let hasVisibleQuestions = false;
                
                if (sub) {
                    subHtml += `<div class="px-4 py-2 bg-[#343536] text-[#e0e0e0] text-[15px] font-medium">${escapeHtml(sub)}</div>`;
                }
                
                qs.forEach(q => {
                    const isVisible = visibleQuestions.has(q.id) && !isSkippedCat;
                    if (isVisible) {
                        hasVisibleQuestions = true;
                        subHtml += renderQuestionItem(q);
                    }
                });
                
                if (hasVisibleQuestions) {
                    questionsHtml += subHtml;
                }
            }
        } else {
            const qs = Object.values(data.subs).flat();
            qs.forEach(q => {
                const isVisible = visibleQuestions.has(q.id) && !isSkippedCat;
                if (isVisible) {
                    questionsHtml += renderQuestionItem(q);
                }
            });
        }

        html += `
            <div class="cat-container mb-6 border border-[#3a3b3c] rounded bg-[#18191a]" data-cat="${escapeHtml(cat)}">
                <div class="p-4 bg-[#2a2b2d] flex flex-col cursor-pointer cat-header-toggle select-none rounded-t">
                    <div class="flex items-center gap-3">
                        <h2 class="font-semibold transition-colors ${isSkippedCat ? 'line-through text-[#6c6c6d]' : ''}">
                            ${escapeHtml(cat)}
                        </h2>
                        <div class="flex-1"></div>
                        <button class="skip-cat-btn text-xs underline z-10 hover:text-[#1877f2] text-[#b0b3b8]" data-cat="${escapeHtml(cat)}">
                            ${isSkippedCat ? 'Unskip' : 'Skip'} Category
                        </button>
                        <div class="toggle-cat-btn p-1 transition-transform duration-200 text-[#b0b3b8]">
                            <span class="inline-block transform transition-transform duration-200 ${isExpanded ? '' : 'rotate-180'}">
                                ${ChevronDownIcon}
                            </span>
                        </div>
                    </div>
                    ${data.desc ? `<p class="mt-2 text-sm text-[#cfcfcf] italic">${escapeHtml(data.desc)}</p>` : ''}
                </div>
                <div class="cat-body ${isExpanded ? '' : 'hidden'} bg-[#18191a]">
                    ${questionsHtml}
                </div>
                <div class="px-4 py-3 border-t border-[#3a3b3c] flex justify-between items-center text-sm rounded-b bg-[#242526]">
                    <span class="text-[#b0b3b8]">Category Status</span>
                    <div class="cat-counter" data-cat="${escapeHtml(cat)}"></div>
                </div>
            </div>
        `;
    });

    categoriesContainer.innerHTML = html;

    calculateProgress();
    updateCategoryCounters();
    attachEventHandlers();
}

function attachEventHandlers() {
    // Radio changes
    const radios = categoriesContainer.querySelectorAll('.radio-btn');
    radios.forEach(r => {
        r.addEventListener('change', (e) => {
            if (e.target.checked) {
                setAnswer(e.target.dataset.id, e.target.value);
            }
        });
    });

    // Question Skip buttons
    const skipBtns = categoriesContainer.querySelectorAll('.skip-btn');
    skipBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggleSkipQ(e.target.dataset.id);
        });
    });

    // Category Skip buttons
    const skipCatBtns = categoriesContainer.querySelectorAll('.skip-cat-btn');
    skipCatBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggleSkipCat(e.target.dataset.cat);
        });
    });

    // Category Toggle buttons
    const toggleCatBtns = categoriesContainer.querySelectorAll('.cat-header-toggle');
    toggleCatBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent toggle if skip button clicked
            if (e.target.closest('.skip-cat-btn')) return;
            
            const catContainer = e.target.closest('.cat-container');
            const body = catContainer.querySelector('.cat-body');
            const iconSpan = catContainer.querySelector('.toggle-cat-btn span');
            
            if (body && iconSpan) {
                body.classList.toggle('hidden');
                iconSpan.classList.toggle('rotate-180');
            }
        });
    });

    // Info tooltips
    const infoIcons = categoriesContainer.querySelectorAll('.info-tip-icon');
    infoIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            setActiveTip(activeTip === id ? null : id);
        });
    });
}

// --- CSV Export ---
// Escapes CSV cells by wrapping them in quotes and doubling internal quotes
function csvEscape(value) {
    const str = (value ?? '').toString();
    return '"' + str.replace(/"/g, '""') + '"';
}

function exportCSV() {
    const head = ['Category', 'Subcategory', 'Question', 'Weight', 'Answer'].map(csvEscape).join(',') + '\n';
    let rows = [];

    questions.forEach(q => {
        const weight = q.weight ?? 1;
        if (skippedCats.has(q.category)) {
            rows.push([q.category, q.subcategory, q.question, weight, 'Skipped'].map(csvEscape).join(','));
        } else if (visibleQuestions.has(q.id)) {
            rows.push([q.category, q.subcategory, q.question, weight, answers[q.id] ?? ''].map(csvEscape).join(','));
        }
    });

    const csvContent = head + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'results.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Start Application
document.addEventListener('DOMContentLoaded', init);
