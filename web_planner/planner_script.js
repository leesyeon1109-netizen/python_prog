/**
 * 고양이 메타케어 미룸 방지 플래너 코어 엔진
 * 보안 코딩 지침 준수: innerHTML/eval 미사용, native alert/confirm 배제
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. Core State & Caching Variables
    // -------------------------------------------------------------
    let appState = {
        activeTab: 'chat',
        wizardStep: 1,
        selectedDistraction: '',
        selectedEmotion: '',
        mainTask: '',
        firstStep: '',
        setupChecked: {
            phone: false,
            tabs: false
        },
        subTasks: [],
        emotionsStats: {
            overwhelm: 0,
            lazy: 0,
            anxiety: 0
        },
        escapeCount: 0,
        stamps: [],
        useGeminiAI: false,
        geminiAPIKey: ''
    };

    // Cute motivational messages from the cat for each stamp slot
    const stampMessages = [
        "집사야, 포기하지 않고 시작해 줘서 고마워! 내 소중한 발도장을 꾹 찍었다냥🐾",
        "첫 걸음을 떼는 게 가장 어려운 법이다옹. 너는 이미 큰 산을 넘었다냥! 😻",
        "5분은 짧아 보이지만 시작의 강력한 시동 단추다냥! 최고라옹! ✨",
        "오늘의 집중력이 아주 날카롭다냥. 참치캔 한 그릇 수준이다옹! 🐟",
        "냥박사의 꾹꾹이 안마를 보낸다냥. 조금 지칠 땐 어깨를 으쓱해 보라옹! 🐾",
        "딴짓의 유혹을 물리치다니, 집사의 의지력이 호랑이급이다냥! 🐯",
        "작은 조각들이 모여 결국 커다란 결과를 만든다냥. 정말 대견하다옹! 💎",
        "한 걸음씩 걷다 보면 어느새 목표에 도달해 있을 거다옹. 힘내라냥! 🐈",
        "포기하지 않고 발자국을 남긴 집사의 하루는 빛나고 있다냥! 💖",
        "완벽하지 않아도 괜찮다옹! 시작했다는 사실 자체가 100점 만점이다냥! 💯",
        "집사의 노력을 지켜보는 게 내 행복이다옹. 쓰다듬어 주겠다냥! 😻",
        "우와아아! 스탬프를 가득 채워줘서 고마워! 넌 이제 프로 집사라냥! 🏆"
    ];

    // Safe Lucide icon rendering wrapper to prevent execution halt
    function safeCreateIcons() {
        if (window.lucide) {
            try {
                lucide.createIcons();
            } catch (error) {
                console.error("Lucide icons generation error:", error);
            }
        }
    }

    // Load state from local storage safely (try-catch exception handling)
    function loadState() {
        const cachedData = localStorage.getItem('nyang-metacare-state');
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                // Schema validation fallbacks
                if (parsed && typeof parsed === 'object') {
                    appState = {
                        activeTab: typeof parsed.activeTab === 'string' ? parsed.activeTab : 'chat',
                        wizardStep: typeof parsed.wizardStep === 'number' ? parsed.wizardStep : 1,
                        selectedDistraction: typeof parsed.selectedDistraction === 'string' ? parsed.selectedDistraction : '',
                        selectedEmotion: typeof parsed.selectedEmotion === 'string' ? parsed.selectedEmotion : '',
                        mainTask: typeof parsed.mainTask === 'string' ? parsed.mainTask : '',
                        firstStep: typeof parsed.firstStep === 'string' ? parsed.firstStep : '',
                        setupChecked: (parsed.setupChecked && typeof parsed.setupChecked === 'object')
                            ? {
                                phone: !!parsed.setupChecked.phone,
                                tabs: !!parsed.setupChecked.tabs
                              }
                            : { phone: false, tabs: false },
                        subTasks: Array.isArray(parsed.subTasks)
                            ? parsed.subTasks.filter(task => task && typeof task === 'object' && typeof task.id === 'string' && typeof task.title === 'string')
                            : [],
                        emotionsStats: (parsed.emotionsStats && typeof parsed.emotionsStats === 'object')
                            ? {
                                overwhelm: typeof parsed.emotionsStats.overwhelm === 'number' ? parsed.emotionsStats.overwhelm : 0,
                                lazy: typeof parsed.emotionsStats.lazy === 'number' ? parsed.emotionsStats.lazy : 0,
                                anxiety: typeof parsed.emotionsStats.anxiety === 'number' ? parsed.emotionsStats.anxiety : 0
                              }
                            : { overwhelm: 0, lazy: 0, anxiety: 0 },
                        escapeCount: typeof parsed.escapeCount === 'number' ? parsed.escapeCount : 0,
                        stamps: Array.isArray(parsed.stamps)
                            ? parsed.stamps.filter(stamp => stamp && typeof stamp === 'object' && typeof stamp.completedAt === 'string' && typeof stamp.note === 'string')
                            : [],
                        useGeminiAI: !!parsed.useGeminiAI,
                        geminiAPIKey: typeof parsed.geminiAPIKey === 'string' ? parsed.geminiAPIKey : ''
                    };
                }
            } catch (error) {
                console.error("로컬 스토리지 상태 로드 오류:", error);
                // If corrupted, fallback is already set by default let appState
            }
        }
    }

    // Save state to local storage
    function saveState() {
        localStorage.setItem('nyang-metacare-state', JSON.stringify(appState));
    }

    // -------------------------------------------------------------
    // 2. DOM Elements Queries
    // -------------------------------------------------------------
    const tabButtons = {
        chat: document.getElementById('nav-btn-chat'),
        todo: document.getElementById('nav-btn-todo'),
        stats: document.getElementById('nav-btn-stats')
    };

    const views = {
        chat: document.getElementById('view-chat'),
        todo: document.getElementById('view-todo'),
        stats: document.getElementById('view-stats')
    };

    // Wizard nodes
    const wizardPrevBtn = document.getElementById('wizard-prev-btn');
    const wizardNextBtn = document.getElementById('wizard-next-btn');
    const wizardInstruction = document.getElementById('wizard-instruction');
    const wizardStepLabel = document.getElementById('wizard-step-label');
    const wizardDots = document.getElementById('wizard-dots');
    const distractionBtns = document.querySelectorAll('.distraction-btn');
    const emotionBtns = document.querySelectorAll('.emotion-btn');
    const wizardMainTaskInput = document.getElementById('wizard-main-task');
    const wizardFirstStepInput = document.getElementById('wizard-first-step');
    const distractionCustomContainer = document.getElementById('distraction-custom-container');
    const distractionCustomInput = document.getElementById('distraction-custom-input');
    const prescriptionDiagnosis = document.getElementById('prescription-diagnosis');
    const prescriptionTask = document.getElementById('prescription-task');
    const prescriptionStep = document.getElementById('prescription-step');
    const prescriptionMsg = document.getElementById('prescription-msg');

    // Settings nodes
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const useGeminiAICheckbox = document.getElementById('use-gemini-ai');
    const apiKeyContainer = document.getElementById('api-key-container');
    const geminiAPIKeyInput = document.getElementById('gemini-api-key');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // Timer variables
    let timerInterval = null;
    let timerSeconds = 300; // 5 minutes default
    let typingIndicator = null;

    // -------------------------------------------------------------
    // 3. SPA Tab Switcher
    // -------------------------------------------------------------
    function switchTab(tabName) {
        if (!views[tabName]) return;
        
        appState.activeTab = tabName;
        saveState();

        // Update nav buttons visually
        Object.keys(tabButtons).forEach(key => {
            if (key === tabName) {
                tabButtons[key].classList.add('active');
                tabButtons[key].classList.add('text-cozy-orange');
                tabButtons[key].classList.remove('text-cozy-lightbrown');
            } else {
                tabButtons[key].classList.remove('active');
                tabButtons[key].classList.remove('text-cozy-orange');
                tabButtons[key].classList.add('text-cozy-lightbrown');
            }
        });

        // Toggle tab content display
        Object.keys(views).forEach(key => {
            if (key === tabName) {
                views[key].classList.add('active');
            } else {
                views[key].classList.remove('active');
            }
        });

        // Trigger individual tab initializers
        if (tabName === 'chat') {
            initWizard();
        } else if (tabName === 'todo') {
            renderTodoTab();
        } else if (tabName === 'stats') {
            renderStatsTab();
        }

        // Re-generate Lucide icon elements safely
        safeCreateIcons();
    }

    // (Old chat rendering logic removed)


    // 4. [셀프 마음 문답] 탭 로직 (Wizard)
    // -------------------------------------------------------------
    let selectedDistraction = '';
    let selectedEmotion = '';

    function initWizard() {
        if (!appState.wizardStep) appState.wizardStep = 1;
        selectedDistraction = appState.selectedDistraction || '';
        selectedEmotion = appState.selectedEmotion || '';
        
        wizardMainTaskInput.value = appState.mainTask || '';
        wizardFirstStepInput.value = appState.firstStep || '';
        
        distractionBtns.forEach(btn => {
            const val = btn.getAttribute('data-value');
            if (val === selectedDistraction) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        
        if (selectedDistraction && !['유튜브/인스타 쇼츠 📱', '모바일/PC 게임 🎮', '웹툰/피드 정독 🌐', '카톡/수다/DM 💬', '누워서 뒹굴거리기 🥱'].includes(selectedDistraction)) {
            const otherBtn = Array.from(distractionBtns).find(btn => btn.getAttribute('data-value') === '기타');
            if (otherBtn) otherBtn.classList.add('selected');
            distractionCustomContainer.classList.remove('hidden');
            distractionCustomInput.value = selectedDistraction;
        } else {
            if (selectedDistraction === '기타') {
                const otherBtn = Array.from(distractionBtns).find(btn => btn.getAttribute('data-value') === '기타');
                if (otherBtn) otherBtn.classList.add('selected');
                distractionCustomContainer.classList.remove('hidden');
                distractionCustomInput.value = '';
            } else {
                distractionCustomContainer.classList.add('hidden');
                distractionCustomInput.value = '';
            }
        }

        emotionBtns.forEach(btn => {
            const val = btn.getAttribute('data-value');
            if (val === selectedEmotion) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        renderWizardStep(appState.wizardStep);
    }

    function renderWizardStep(step) {
        appState.wizardStep = step;
        saveState();

        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById(`wizard-step-${i}`);
            if (i === step) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }

        wizardStepLabel.textContent = `${step}단계 / 4단계`;
        
        const catInstructions = {
            1: '"집사야, 딴짓의 고리를 끊기 위한 셀프 마음 문답을 시작해 보자옹. 차근차근 내 질문에 답하라냥! 🐾"',
            2: '"그 딴짓 뒤에 어떤 마음이 숨어 있었는지 들여다 볼 차례다냥. 솔직해져도 괜찮다옹! 🥺"',
            3: '"마음을 다독였으니, 이제 몸을 움직일 시동 계획을 아주 가볍게 짜 보자냥! 😼"',
            4: '"짜잔! 집사만을 위한 메타인지 처방전이 나왔다옹! 확인하고 바로 시작해 보자냥! 🩺"'
        };
        wizardInstruction.textContent = catInstructions[step] || catInstructions[1];

        const dots = wizardDots.querySelectorAll('span');
        dots.forEach((dot, idx) => {
            const dotStep = idx + 1;
            if (dotStep === step) {
                dot.className = 'w-2.5 h-2.5 rounded-full bg-cozy-orange transition-all duration-300';
            } else if (dotStep < step) {
                dot.className = 'w-2 h-2 rounded-full bg-cozy-orange/50 transition-all duration-300';
            } else {
                dot.className = 'w-2 h-2 rounded-full bg-cozy-beige transition-all duration-300';
            }
        });

        if (step === 1) {
            wizardPrevBtn.classList.add('hidden');
        } else {
            wizardPrevBtn.classList.remove('hidden');
        }

        validateStep(step);
    }

    function validateStep(step) {
        let isValid = false;
        
        if (step === 1) {
            if (selectedDistraction === '기타') {
                isValid = distractionCustomInput.value.trim().length > 0;
            } else {
                isValid = selectedDistraction.length > 0;
            }
        } else if (step === 2) {
            isValid = selectedEmotion.length > 0;
        } else if (step === 3) {
            const tVal = wizardMainTaskInput.value.trim();
            const sVal = wizardFirstStepInput.value.trim();
            isValid = tVal.length > 0 && sVal.length > 0;
        } else if (step === 4) {
            isValid = true;
        }

        if (isValid) {
            wizardNextBtn.classList.remove('opacity-50', 'pointer-events-none');
        } else {
            wizardNextBtn.classList.add('opacity-50', 'pointer-events-none');
        }

        if (step === 4) {
            wizardNextBtn.innerHTML = '처방전대로 할 일 등록 🚀';
        } else {
            wizardNextBtn.innerHTML = '다음 단계 🐾';
        }
    }

    distractionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            distractionBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            const val = btn.getAttribute('data-value');
            if (val === '기타') {
                selectedDistraction = '기타';
                distractionCustomContainer.classList.remove('hidden');
                distractionCustomInput.focus();
            } else {
                selectedDistraction = val;
                distractionCustomContainer.classList.add('hidden');
            }
            appState.selectedDistraction = selectedDistraction;
            saveState();
            validateStep(1);
        });
    });

    distractionCustomInput.addEventListener('input', () => {
        if (selectedDistraction === '기타') {
            appState.selectedDistraction = distractionCustomInput.value.trim();
            saveState();
            validateStep(1);
        }
    });

    emotionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            emotionBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            selectedEmotion = btn.getAttribute('data-value');
            appState.selectedEmotion = selectedEmotion;
            saveState();
            validateStep(2);
        });
    });

    wizardMainTaskInput.addEventListener('input', () => {
        appState.mainTask = wizardMainTaskInput.value.trim();
        saveState();
        validateStep(3);
    });

    wizardFirstStepInput.addEventListener('input', () => {
        appState.firstStep = wizardFirstStepInput.value.trim();
        saveState();
        validateStep(3);
    });

    wizardNextBtn.addEventListener('click', () => {
        const currentStep = appState.wizardStep;
        
        if (currentStep === 1) {
            if (selectedDistraction === '기타') {
                appState.selectedDistraction = distractionCustomInput.value.trim();
            } else {
                appState.selectedDistraction = selectedDistraction;
            }
            saveState();
            renderWizardStep(2);
        } else if (currentStep === 2) {
            renderWizardStep(3);
        } else if (currentStep === 3) {
            generatePrescription();
            renderWizardStep(4);
        } else if (currentStep === 4) {
            finishWizardAndStart();
        }
    });

    wizardPrevBtn.addEventListener('click', () => {
        if (appState.wizardStep > 1) {
            renderWizardStep(appState.wizardStep - 1);
        }
    });

    function generatePrescription() {
        const distraction = appState.selectedDistraction || "딴짓";
        const emotion = appState.selectedEmotion;
        
        const emotionMap = {
            overwhelm: "막막함과 답답함 🥺",
            lazy: "에너지 방전 및 귀찮음 🥱",
            anxiety: "완벽주의 불안과 잘해야 한다는 부담 😰"
        };
        const emotionText = emotionMap[emotion] || "감정적 과부하";
        
        prescriptionDiagnosis.textContent = `${emotionText}으로 인한 [${distraction}] 딴짓`;
        prescriptionTask.textContent = appState.mainTask;
        prescriptionStep.textContent = appState.firstStep;

        const emotionMsgs = {
            overwhelm: '"집사야, 분량이 산더미처럼 많아 보여도 한 줄만 먼저 쓰면 다 무너진다옹. 첫 발자국만 살짝 내딛자냥! 🐾"',
            lazy: '"만사가 나른하고 귀찮은 건 몸이 쉼을 달라고 신호하는 거라옹. 딱 5분만 생기를 채우는 사냥을 시작해보자냥! 😻"',
            anxiety: '"실패하면 어쩌지 하는 불안감은 네가 그만큼 책임감이 깊고 섬세하기 때문이다옹. 30점짜리 낙서 하나 긋는 편안한 마음으로 시작하자냥! 😼"'
        };
        prescriptionMsg.textContent = emotionMsgs[emotion] || '"집사야, 완벽하지 않아도 시작 자체가 100점이다냥! 꾹꾹이 응원을 보낸다옹🐾"';
    }

    function finishWizardAndStart() {
        const finalTask = appState.mainTask;
        const firstStep = appState.firstStep;
        const distraction = appState.selectedDistraction || "딴짓";
        const emotion = appState.selectedEmotion;

        appState.escapeCount++;
        if (emotion === 'overwhelm') appState.emotionsStats.overwhelm++;
        else if (emotion === 'lazy') appState.emotionsStats.lazy++;
        else if (emotion === 'anxiety') appState.emotionsStats.anxiety++;
        
        appState.subTasks = [
            {
                id: 'sub-1-' + Date.now(),
                title: `${firstStep} 세팅하고 가볍게 행동 개시하기 🛠️`,
                duration: 5,
                completed: false
            },
            {
                id: 'sub-2-' + Date.now(),
                title: `방금 하던 [${distraction}] 유혹 완전히 차단하고 10분만 견디기 📱`,
                duration: 10,
                completed: false
            },
            {
                id: 'sub-3-' + Date.now(),
                title: `오늘의 진짜 목표인 [${finalTask}]에 본격적으로 몰두하기 ⏱️`,
                duration: 15,
                completed: false
            },
            {
                id: 'sub-4-' + Date.now(),
                title: `시동 걸기에 멋지게 성공한 나를 칭찬하며 가벼운 스트레칭하기 🐾`,
                duration: 5,
                completed: false
            }
        ];

        saveState();

        const wrapper = document.querySelector('.w-full.max-w-md');
        const nextBtnRect = wizardNextBtn.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const rx = nextBtnRect.left - wrapperRect.left + (Math.random() * nextBtnRect.width);
                const ry = nextBtnRect.top - wrapperRect.top + (Math.random() * nextBtnRect.height) - 30;
                createPawParticle(rx, ry);
            }, i * 80);
        }

        showCozyNotification("메타인지 처방 성공! 할 일 목록으로 이동한다냥🐾");

        setTimeout(() => {
            switchTab('todo');
        }, 600);
    }

    // -------------------------------------------------------------
    // 5. [할 일 목록] 탭 로직 (행동 유도)
    // -------------------------------------------------------------
    function renderTodoTab() {
        const hasTask = !!appState.mainTask;
        const mainTitle = document.getElementById('todo-main-title');
        const subDesc = document.getElementById('todo-sub-desc');
        const setupPhone = document.getElementById('setup-phone');
        const setupTabs = document.getElementById('setup-tabs');
        
        if (hasTask) {
            mainTitle.textContent = appState.mainTask;
            subDesc.textContent = "냥박사가 쪼개준 단계들을 하나씩 격파해 나가자옹!";
            
            // Enable checkboxes
            setupPhone.disabled = false;
            setupPhone.parentNode.classList.remove('opacity-50', 'pointer-events-none');
            setupTabs.disabled = false;
            setupTabs.parentNode.classList.remove('opacity-50', 'pointer-events-none');
            
            // Enable subtask submission form
            document.getElementById('add-subtask-form').classList.remove('opacity-50', 'pointer-events-none');
            document.getElementById('new-subtask-title').disabled = false;
            document.getElementById('new-subtask-time').disabled = false;
        } else {
            mainTitle.textContent = "아직 결정된 진짜 할 일이 없다냥.";
            subDesc.textContent = "SOS 대화 탭에서 고양이와 대화하고 진짜 할 일을 먼저 설정하라옹!";
            
            // Disable checkboxes
            setupPhone.disabled = true;
            setupPhone.checked = false;
            setupPhone.parentNode.classList.add('opacity-50', 'pointer-events-none');
            setupTabs.disabled = true;
            setupTabs.checked = false;
            setupTabs.parentNode.classList.add('opacity-50', 'pointer-events-none');
            
            // Disable subtask submission form
            document.getElementById('add-subtask-form').classList.add('opacity-50', 'pointer-events-none');
            document.getElementById('new-subtask-title').disabled = true;
            document.getElementById('new-subtask-time').disabled = true;
        }
        
        // Render step 1 checkboxes states
        setupPhone.checked = appState.setupChecked.phone;
        setupTabs.checked = appState.setupChecked.tabs;
        
        renderSubtasks();
    }

    // Checkbox state binding listeners
    document.getElementById('setup-phone').addEventListener('change', (e) => {
        appState.setupChecked.phone = e.target.checked;
        saveState();
        if (e.target.checked) {
            const rect = e.target.getBoundingClientRect();
            const wrapperRect = document.querySelector('.w-full.max-w-md').getBoundingClientRect();
            createPawParticle(rect.left - wrapperRect.left + rect.width / 2, rect.top - wrapperRect.top + rect.height / 2);
        }
    });

    document.getElementById('setup-tabs').addEventListener('change', (e) => {
        appState.setupChecked.tabs = e.target.checked;
        saveState();
        if (e.target.checked) {
            const rect = e.target.getBoundingClientRect();
            const wrapperRect = document.querySelector('.w-full.max-w-md').getBoundingClientRect();
            createPawParticle(rect.left - wrapperRect.left + rect.width / 2, rect.top - wrapperRect.top + rect.height / 2);
        }
    });

    // Render Subtasks list safely
    function renderSubtasks() {
        const listContainer = document.getElementById('subtasks-list');
        listContainer.replaceChildren(); // Safe clear
        
        if (appState.subTasks.length === 0) {
            const placeholder = document.createElement('p');
            placeholder.className = 'text-xs text-cozy-lightbrown/60 text-center italic py-4 select-none';
            placeholder.textContent = '등록된 세부 할 일이 없다옹. 직접 아래에 작성해서 쪼개보라냥!';
            listContainer.appendChild(placeholder);
            return;
        }
        
        appState.subTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'flex items-center justify-between p-3 bg-cozy-bg/30 rounded-xl border border-cozy-beige/25 hover:bg-cozy-bg/50 transition-colors gap-2.5';
            
            const label = document.createElement('label');
            label.className = 'flex items-center gap-3 cursor-pointer flex-grow overflow-hidden select-none';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'w-4.5 h-4.5 accent-cozy-orange rounded cursor-pointer shrink-0';
            checkbox.checked = task.completed;
            
            checkbox.addEventListener('change', (e) => {
                task.completed = e.target.checked;
                
                if (task.completed) {
                    // Trigger flying paw particles at coordinates
                    const rect = checkbox.getBoundingClientRect();
                    const wrapperRect = document.querySelector('.w-full.max-w-md').getBoundingClientRect();
                    const rx = rect.left - wrapperRect.left + rect.width / 2;
                    const ry = rect.top - wrapperRect.top + rect.height / 2;
                    
                    for (let i = 0; i < 3; i++) {
                        createPawParticle(rx + (Math.random() * 10 - 5), ry + (Math.random() * 10 - 5));
                    }
                    
                    addStamp(`할 일 해결: ${task.title}`);
                }
                
                saveState();
                renderSubtasks();
                renderStatsTab();
            });
            label.appendChild(checkbox);
            
            const titleSpan = document.createElement('span');
            titleSpan.className = task.completed 
                ? 'text-xs font-medium truncate task-checked-text flex-grow' 
                : 'text-xs font-semibold task-normal-text flex-grow';
            titleSpan.textContent = task.title;
            label.appendChild(titleSpan);
            
            const timeBadge = document.createElement('span');
            timeBadge.className = 'text-[9px] bg-cozy-beige text-cozy-lightbrown font-bold px-2 py-0.5 rounded-md shrink-0';
            timeBadge.textContent = `${task.duration}분`;
            label.appendChild(timeBadge);
            
            card.appendChild(label);
            
            // Delete button
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'text-cozy-lightbrown/40 hover:text-cozy-rose p-1.5 transition-colors rounded-lg hover:bg-cozy-rose/15 active:scale-90';
            
            const delIcon = document.createElement('i');
            delIcon.setAttribute('data-lucide', 'trash-2');
            delIcon.className = 'w-3.5 h-3.5';
            delBtn.appendChild(delIcon);
            
            delBtn.addEventListener('click', () => {
                appState.subTasks = appState.subTasks.filter(t => t.id !== task.id);
                saveState();
                renderSubtasks();
            });
            
            card.appendChild(delBtn);
            listContainer.appendChild(card);
        });
        
        safeCreateIcons();
    }

    // Subtask Form submit listener
    const addSubtaskForm = document.getElementById('add-subtask-form');
    addSubtaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('new-subtask-title');
        const timeSelect = document.getElementById('new-subtask-time');
        
        const titleText = titleInput.value.trim();
        const durationValue = parseInt(timeSelect.value, 10);
        
        if (!titleText || !appState.mainTask) return;
        
        const newSub = {
            id: 'sub-' + Date.now(),
            title: titleText,
            duration: durationValue,
            completed: false
        };
        
        appState.subTasks.push(newSub);
        saveState();
        
        titleInput.value = '';
        renderSubtasks();
        
        // Spawn particle at form position
        const rect = addSubtaskForm.getBoundingClientRect();
        const wrapperRect = document.querySelector('.w-full.max-w-md').getBoundingClientRect();
        createPawParticle(rect.left - wrapperRect.left + rect.width / 2, rect.top - wrapperRect.top);
    });

    // 🐾 Particle generator
    function createPawParticle(x, y) {
        const container = document.getElementById('paw-animation-container');
        if (!container) return;
        
        const particle = document.createElement('span');
        particle.className = 'paw-particle select-none';
        particle.textContent = Math.random() > 0.35 ? '🐾' : '✨';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--paw-random-x', `${(Math.random() * 50 - 25)}px`);
        
        container.appendChild(particle);
        
        // Garbage collection
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }

    // -------------------------------------------------------------
    // 6. 5분 스타터 타이머 로직
    // -------------------------------------------------------------
    const timerDisplay = document.getElementById('timer-display');
    const timerStatusBadge = document.getElementById('timer-status-badge');
    const timerMascot = document.getElementById('timer-mascot');
    const timerSpeech = document.getElementById('timer-speech');
    
    const startTimerBtn = document.getElementById('timer-start');
    const pauseTimerBtn = document.getElementById('timer-pause');
    const resetTimerBtn = document.getElementById('timer-reset');

    function updateTimerDisplay() {
        const mins = Math.floor(timerSeconds / 60);
        const secs = timerSeconds % 60;
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function updateTimerSpeech() {
        if (timerSeconds === 300) {
            timerSpeech.textContent = '"집사야, 딱 5분만 눈 딱 감고 움직여보자옹. 시작 버튼을 누르라냥!"';
        } else if (timerSeconds === 240) {
            timerSpeech.textContent = '"벌써 1분이나 공부/집중했다냥! 사냥꾼다운 몰입력이다냥! 👍"';
        } else if (timerSeconds === 150) {
            timerSpeech.textContent = '"시간의 절반이 흘렀다냥! 냥박사가 집사를 힘껏 지지하고 있다옹! 😻"';
        } else if (timerSeconds === 60) {
            timerSpeech.textContent = '"이제 마지막 1분이다옹! 딴짓 악마를 물리치자냥! 🔥"';
        } else if (timerSeconds === 10) {
            timerSpeech.textContent = '"10초 남았다옹! 꾹꾹이 사냥이 거의 끝났다냥! 🐾"';
        }
    }

    function startTimer() {
        if (!appState.mainTask) {
            showCozyNotification("SOS 대화에서 진짜 할 일을 먼저 설정해 달라옹! 🐱");
            return;
        }
        if (timerInterval) return;

        timerStatusBadge.textContent = '진행중';
        timerStatusBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-cozy-orange/15 text-cozy-orange font-bold animate-pulse';
        
        startTimerBtn.classList.add('hidden');
        pauseTimerBtn.classList.remove('hidden');

        timerMascot.textContent = '🐈';
        timerMascot.classList.add('animate-pulse-slow');
        
        timerSpeech.textContent = '"준비 완료! 5분 몰입 사냥을 시작한다냥! 🐾"';

        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();
            updateTimerSpeech();
            
            if (timerSeconds <= 0) {
                completeTimer();
            }
        }, 1000);
    }

    function pauseTimer() {
        if (!timerInterval) return;

        clearInterval(timerInterval);
        timerInterval = null;

        timerStatusBadge.textContent = '일시정지';
        timerStatusBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-cozy-yellow/15 text-cozy-yellow font-bold';
        
        startTimerBtn.classList.remove('hidden');
        pauseTimerBtn.classList.add('hidden');

        timerMascot.textContent = '🐱';
        timerMascot.classList.remove('animate-pulse-slow');
        timerSpeech.textContent = '"휴식하는 거냥? 힘을 내서 돌아오라옹! 🐾"';
    }

    function resetTimer() {
        pauseTimer();
        timerSeconds = 300;
        updateTimerDisplay();
        
        timerStatusBadge.textContent = '대기중';
        timerStatusBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-cozy-bg text-cozy-lightbrown font-medium';
        timerSpeech.textContent = '"리셋 완료! 언제든 5분 사냥을 새로 시작하라냥! 🐱"';
        timerMascot.textContent = '🐱';
    }

    function completeTimer() {
        pauseTimer();
        timerSeconds = 300;
        updateTimerDisplay();

        timerStatusBadge.textContent = '성공!';
        timerStatusBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-cozy-mint/20 text-cozy-mint font-bold';
        timerSpeech.textContent = '"띵동~! 🎉 5분 눈감고 버티기 성공했다냥! 칭찬 발도장 스탬프를 꾹 찍어줬다냥! 계속 이어가자옹!"';
        timerMascot.textContent = '😻';

        // Trigger particles cascade at timer center
        const timerRect = timerDisplay.getBoundingClientRect();
        const wrapRect = document.querySelector('.w-full.max-w-md').getBoundingClientRect();
        
        for (let i = 0; i < 9; i++) {
            setTimeout(() => {
                const rx = timerRect.left - wrapRect.left + timerRect.width / 2 + (Math.random() * 80 - 40);
                const ry = timerRect.top - wrapRect.top + timerRect.height / 2 + (Math.random() * 30 - 15);
                createPawParticle(rx, ry);
            }, i * 100);
        }

        addStamp("5분 타이머 몰입 성공 ⏱️");
    }

    startTimerBtn.addEventListener('click', startTimer);
    pauseTimerBtn.addEventListener('click', pauseTimer);
    resetTimerBtn.addEventListener('click', resetTimer);

    // -------------------------------------------------------------
    // 7. [기록/분석] 탭 로직 (메타인지 통계 & 스탬프)
    // -------------------------------------------------------------
    function renderStatsTab() {
        // A. Set Escape count
        document.getElementById('stat-escape-count').textContent = appState.escapeCount;

        // B. Calculate Emotion gauge percentages
        const total = appState.emotionsStats.overwhelm + appState.emotionsStats.lazy + appState.emotionsStats.anxiety;
        let oPct = 0, lPct = 0, aPct = 0;

        if (total > 0) {
            oPct = Math.round((appState.emotionsStats.overwhelm / total) * 100);
            lPct = Math.round((appState.emotionsStats.lazy / total) * 100);
            aPct = Math.round((appState.emotionsStats.anxiety / total) * 100);
        }

        // Apply styles safely
        document.getElementById('emotion-overwhelm-pct').textContent = `${oPct}%`;
        document.getElementById('emotion-lazy-pct').textContent = `${lPct}%`;
        document.getElementById('emotion-anxiety-pct').textContent = `${aPct}%`;

        document.getElementById('bar-overwhelm').style.width = `${oPct}%`;
        document.getElementById('bar-lazy').style.width = `${lPct}%`;
        document.getElementById('bar-anxiety').style.width = `${aPct}%`;

        // C. Render Stamp Grid
        renderStampGrid();
    }

    function renderStampGrid() {
        const grid = document.getElementById('stamp-grid');
        grid.replaceChildren(); // Safe clear
        
        const count = appState.stamps.length;
        document.getElementById('stamp-count-text').textContent = count;

        // Stamp grid header button container logic
        const countBadge = document.getElementById('stamp-count-text').parentNode;
        let resetBtn = document.getElementById('stamp-reset-board-btn');
        
        if (count >= 12) {
            if (!resetBtn) {
                resetBtn = document.createElement('button');
                resetBtn.id = 'stamp-reset-board-btn';
                resetBtn.type = 'button';
                resetBtn.className = 'text-[9px] bg-cozy-rose/20 text-cozy-rose hover:bg-cozy-rose hover:text-white font-bold px-2 py-0.5 rounded-full ml-2 transition-all active:scale-95 duration-200';
                resetBtn.textContent = '판 비우기 🔄';
                
                resetBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Custom non-blocking visual reset
                    appState.stamps = [];
                    saveState();
                    renderStatsTab();
                    
                    // Trigger flying paw particles all over the board!
                    const gridRect = grid.getBoundingClientRect();
                    const wrapRect = document.querySelector('.w-full.max-w-md').getBoundingClientRect();
                    for (let i = 0; i < 12; i++) {
                        const rx = gridRect.left - wrapRect.left + (Math.random() * gridRect.width);
                        const ry = gridRect.top - wrapRect.top + (Math.random() * gridRect.height);
                        createPawParticle(rx, ry);
                    }
                    showCozyNotification("스탬프 보드를 비웠다냥! 새로 채워보자옹🐾");
                });
                
                countBadge.appendChild(resetBtn);
            }
        } else {
            if (resetBtn) {
                resetBtn.remove();
            }
        }

        // Draw 12 stamp cards
        for (let i = 0; i < 12; i++) {
            const slot = document.createElement('div');
            
            if (i < count) {
                // Stamp earned
                slot.className = 'stamp-slot filled';
                
                // Varied cat faces
                const faces = ['🐱', '😻', '🐾', '🐈', '😸', '🐾', '😼', '🐾', '😽', '🐾', '😻', '👑'];
                slot.textContent = faces[i % faces.length];
                
                slot.addEventListener('click', () => {
                    // Wiggle effect
                    slot.classList.add('stamp-wiggle');
                    setTimeout(() => slot.classList.remove('stamp-wiggle'), 400);
                    
                    openStampModal(i);
                });
            } else {
                // Empty slot outline
                slot.className = 'stamp-slot text-cozy-lightbrown/30 font-bold select-none';
                slot.textContent = String(i + 1);
            }
            
            grid.appendChild(slot);
        }
    }

    // Award stamp logic
    function addStamp(title) {
        if (appState.stamps.length >= 12) {
            showCozyNotification("스탬프 보드가 꽉 찼다냥! 12번째 스탬프를 확인하고 초기화해달라옹🏆");
            return;
        }

        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const idx = appState.stamps.length;
        const msg = stampMessages[idx % stampMessages.length];

        appState.stamps.push({
            completedAt: dateStr,
            note: `"${title}" - ${msg}`
        });

        saveState();

        if (appState.activeTab === 'stats') {
            renderStatsTab();
        }

        showCozyNotification("🐾 발도장 스탬프가 찍혔다냥! (기록/분석 탭에서 확인옹)");
    }

    // Custom non-blocking stamp letter modal
    const stampModal = document.getElementById('stamp-modal');
    const modalTitle = document.getElementById('modal-stamp-title');
    const modalDate = document.getElementById('modal-stamp-date');
    const modalMessage = document.getElementById('modal-stamp-message');
    const modalCatAvatar = document.getElementById('modal-cat-avatar');
    const closeModalBtn = document.getElementById('close-modal-btn');

    function openStampModal(index) {
        const stamp = appState.stamps[index];
        if (!stamp) return;

        modalTitle.textContent = `냥이의 ${index + 1}번째 칭찬 편지 🐾`;
        modalDate.textContent = stamp.completedAt;
        modalMessage.textContent = stamp.note;

        const avatars = ['🐱', '😻', '😼', '😸', '🐈', '🐾', '😽', '🦁'];
        modalCatAvatar.textContent = avatars[index % avatars.length];

        // Custom modal transitions
        stampModal.classList.remove('opacity-0', 'pointer-events-none');
        stampModal.classList.add('opacity-100', 'pointer-events-auto');
        stampModal.firstElementChild.classList.remove('scale-90');
        stampModal.firstElementChild.classList.add('scale-100');

        // Special celebration at 12th stamp (index 11)
        if (index === 11) {
            modalTitle.textContent = "🏆 미룸 방지 마스터 등극! 🏆";
            modalCatAvatar.textContent = "👑";
            modalMessage.textContent = "우와아아! 12개의 스탬프를 모두 다 모았다냥! 🏆 집사는 이제 미루기 습관을 이겨낸 최고의 집사라옹! 정말 감격했다냥... 판을 새로 비워주겠다옹!";
            
            // Auto-reset stamps on closing 12th stamp
            closeModalBtn.onclick = function() {
                closeStampModal();
                appState.stamps = [];
                saveState();
                renderStatsTab();
                
                // Clear this one-off callback handler
                closeModalBtn.onclick = handleModalCloseClick;
            };
        }
    }

    function closeStampModal() {
        stampModal.classList.add('opacity-0', 'pointer-events-none');
        stampModal.classList.remove('opacity-100', 'pointer-events-auto');
        stampModal.firstElementChild.classList.add('scale-90');
        stampModal.firstElementChild.classList.remove('scale-100');
    }

    function handleModalCloseClick() {
        closeStampModal();
    }
    
    closeModalBtn.onclick = handleModalCloseClick;

    stampModal.addEventListener('click', (e) => {
        if (e.target === stampModal) {
            closeStampModal();
        }
    });

    // Custom toast notification system (Non-blocking replacement for alert)
    function showCozyNotification(text) {
        const appWrapper = document.querySelector('.w-full.max-w-md');
        if (!appWrapper) return;

        const toast = document.createElement('div');
        toast.className = 'absolute top-16 left-1/2 -translate-x-1/2 bg-cozy-brown text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 z-50 animate-chat-bubble border border-cozy-orange/20 max-w-[90%]';
        
        const avatar = document.createElement('span');
        avatar.textContent = '😻';
        toast.appendChild(avatar);
        
        const label = document.createElement('span');
        label.textContent = text;
        toast.appendChild(label);

        appWrapper.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2500);
    }

    // -------------------------------------------------------------
    // 8. Application Initializer & Navigation Hooks
    // -------------------------------------------------------------
    // App soft Reset button inside header
    document.getElementById('reset-app-btn').addEventListener('click', () => {
        // Clear active timer
        pauseTimer();
        timerSeconds = 300;
        updateTimerDisplay();

        // Clear active session, chatbot, and wizard states
        appState.wizardStep = 1;
        appState.selectedDistraction = '';
        appState.selectedEmotion = '';
        appState.mainTask = '';
        appState.firstStep = '';
        appState.subTasks = [];
        appState.setupChecked = { phone: false, tabs: false };

        saveState();

        // Switch to chat (Self Q&A Wizard) and boot fresh
        switchTab('chat');
        initWizard();

        showCozyNotification("새로운 할 일을 계획하러 왔다냥! 문답을 시작하자옹🐾");
    });

    // AI Settings Modal Listeners
    settingsBtn.addEventListener('click', () => {
        useGeminiAICheckbox.checked = appState.useGeminiAI;
        geminiAPIKeyInput.value = appState.geminiAPIKey;
        
        if (appState.useGeminiAI) {
            apiKeyContainer.classList.remove('hidden');
        } else {
            apiKeyContainer.classList.add('hidden');
        }
        
        settingsModal.classList.remove('opacity-0', 'pointer-events-none');
        settingsModal.classList.add('opacity-100', 'pointer-events-auto');
        settingsModal.firstElementChild.classList.remove('scale-90');
        settingsModal.firstElementChild.classList.add('scale-100');
        
        safeCreateIcons();
    });

    function closeSettingsModal() {
        settingsModal.classList.add('opacity-0', 'pointer-events-none');
        settingsModal.classList.remove('opacity-100', 'pointer-events-auto');
        settingsModal.firstElementChild.classList.add('scale-90');
        settingsModal.firstElementChild.classList.remove('scale-100');
    }

    closeSettingsBtn.addEventListener('click', closeSettingsModal);
    
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
    });

    useGeminiAICheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            apiKeyContainer.classList.remove('hidden');
        } else {
            apiKeyContainer.classList.add('hidden');
        }
    });

    saveSettingsBtn.addEventListener('click', () => {
        const enabled = useGeminiAICheckbox.checked;
        const key = geminiAPIKeyInput.value.trim();
        
        if (enabled && !key) {
            showCozyNotification("Gemini AI를 활성화하려면 API 키가 필요하다옹! 🐱");
            return;
        }
        
        appState.useGeminiAI = enabled;
        appState.geminiAPIKey = key;
        saveState();
        
        closeSettingsModal();
        showCozyNotification(enabled ? "Gemini AI 모드가 활성화되었다냥! 😻" : "로컬 분석 엔진 모드로 전환했다옹! 🐾");
    });

    // Load initial storage cached state
    loadState();

    // Set tab triggers
    Object.keys(tabButtons).forEach(key => {
        tabButtons[key].addEventListener('click', () => {
            switchTab(key);
        });
    });

    // Start on correct active tab
    switchTab(appState.activeTab || 'chat');
    
    // Boot wizard logic
    initWizard();
    
    // Format digital face
    updateTimerDisplay();
});
