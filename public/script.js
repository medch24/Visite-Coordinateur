/**
 * Système d'Évaluation des Enseignants - École Internationale Alkawthar
 * Version améliorée avec connexion directe MongoDB
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ===== CONFIGURATION ET ÉTAT =====
    const state = { 
        currentUser: null, 
        currentLang: 'fr',
        isOnline: navigator.onLine
    };
    
    const pages = {
        login: document.getElementById('login-page'),
        coordinator: document.getElementById('coordinator-dashboard'),
        teacher: document.getElementById('teacher-dashboard')
    };
    
    let EVALUATIONS_DATABASE = [];
   const API_BASE = ''; // NOUVEAU

    // ===== GESTION MONGODB DIRECTE (SANS LOCALSTORAGE) =====
    const MongoDB = {
    async request(endpoint, options = {}) {
        try {
            // S'assurer que les requêtes API vont vers le bon endpoint Vercel
            // Ajouter /api si l'endpoint ne commence pas par /api
            const fullEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
            const fetchUrl = fullEndpoint; 
            
            console.log(`FETCH ${options.method || 'GET'}: ${fetchUrl}`);
            
            const response = await fetch(fetchUrl, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        ...options.headers
                    },
                    ...options
                });
                
                if (!response.ok) {
                    // Tenter de lire l'erreur JSON si elle existe
                    let errorData;
                    try {
                        errorData = await response.json();
                    } catch {
                        errorData = await response.text();
                    }
                    console.error('API Error Response:', errorData);
                    
                    const errorMessage = (typeof errorData === 'object' && errorData.message) 
                        ? errorData.message 
                        : (typeof errorData === 'string' && errorData.length < 200) 
                        ? errorData : response.statusText;
                    
                    throw new Error(`HTTP ${response.status}: ${errorMessage}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('❌ Erreur MongoDB:', error);
                throw error;
            }
        },

        async loadEvaluations(teacherName = null) {
            try {
                const endpoint = teacherName 
                    ? `/evaluations?teacherName=${encodeURIComponent(teacherName)}`
                    : '/evaluations';
                
                console.log('🔄 Chargement depuis MongoDB:', endpoint);
                const result = await this.request(endpoint);
                
                if (result.success && result.data) {
                    console.log('✅ Évaluations chargées depuis MongoDB:', result.data.length);
                    return result.data;
                }
                
                return [];
            } catch (error) {
                console.error('❌ ERREUR: Impossible de charger depuis MongoDB', error);
                // Afficher l'erreur dans la modale de connexion si l'utilisateur n'est pas encore connecté
                if (!state.currentUser) {
                    document.getElementById('login-error').textContent = state.currentLang === 'fr' 
                        ? `❌ Erreur: Impossible de se connecter à la base de données MongoDB. ${error.message}` 
                        : `❌ Error: Cannot connect to MongoDB database. ${error.message}`;
                } else {
                     alert(state.currentLang === 'fr' 
                        ? '❌ Erreur: Impossible de charger les évaluations depuis MongoDB. Vérifiez votre connexion.' 
                        : '❌ Error: Cannot load evaluations from MongoDB. Check your connection.');
                }
                return [];
            }
        },

        async saveEvaluation(evaluation) {
            try {
                console.log('💾 Sauvegarde directe dans MongoDB...', evaluation);
                const result = await this.request('/evaluations', {
                    method: 'POST',
                    body: JSON.stringify(evaluation)
                });
                
                if (result.success) {
                    console.log('✅ Évaluation sauvegardée en MongoDB avec succès');
                    return { success: true, source: 'mongodb', data: result.data };
                }
                
                throw new Error('Échec de la sauvegarde');
            } catch (error) {
                console.error('❌ ERREUR: Sauvegarde MongoDB échouée', error);
                alert(state.currentLang === 'fr' 
                    ? '❌ Erreur: Impossible de sauvegarder dans MongoDB. Vérifiez votre connexion.' 
                    : '❌ Error: Cannot save to MongoDB. Check your connection.');
                throw error;
            }
        },

        async deleteEvaluation(evaluationId) {
            try {
                console.log('🗑️ Suppression depuis MongoDB...', evaluationId);
                const result = await this.request(`/evaluations/${evaluationId}`, {
                    method: 'DELETE'
                });
                
                if (result.success) {
                    console.log('✅ Évaluation supprimée de MongoDB');
                    return { success: true };
                }
                
                throw new Error('Échec de la suppression');
            } catch (error) {
                console.error('❌ ERREUR: Suppression MongoDB échouée', error);
                alert(state.currentLang === 'fr' 
                    ? '❌ Erreur: Impossible de supprimer de MongoDB. Vérifiez votre connexion.' 
                    : '❌ Error: Cannot delete from MongoDB. Check your connection.');
                throw error;
            }
        }
    };

    // Surveiller la connectivité
    window.addEventListener('online', () => {
        state.isOnline = true;
        console.log('🌐 Connexion rétablie');
    });
    
    window.addEventListener('offline', () => {
        state.isOnline = false;
        console.log('📴 Mode hors ligne');
    });

    // ===== GESTION DES LANGUES =====
    const setLanguage = (lang) => {
        state.currentLang = lang;
        document.documentElement.lang = lang;
        
        document.querySelectorAll('[data-lang-en], [data-lang-fr]').forEach(el => {
            const text = el.dataset[lang === 'fr' ? 'langFr' : 'langEn'] || '';
            const icon = el.querySelector('i');
            if (icon) {
                let span = el.querySelector('span');
                if (!span) {
                    span = document.createElement('span');
                    el.appendChild(span);
                }
                span.textContent = ` ${text}`;
            } else {
                el.textContent = text;
            }
        });
        
        document.querySelectorAll('[placeholder-fr], [placeholder-en]').forEach(el => {
            el.placeholder = el.getAttribute(lang === 'fr' ? 'placeholder-fr' : 'placeholder-en');
        });
        
        document.getElementById('lang-en').classList.toggle('active', lang === 'en');
        document.getElementById('lang-fr').classList.toggle('active', lang === 'fr');
    };

    const changeAndRerenderLanguage = (lang) => {
        setLanguage(lang);
        if (state.currentUser) {
            const renderer = state.currentUser.role === 'coordinator' ? renderCoordinatorUI : renderTeacherUI;
            renderer();
        } else {
             // S'assurer que le message d'erreur de connexion est mis à jour
            const loginError = document.getElementById('login-error');
            if (loginError.textContent.includes('MongoDB')) {
                // Tenter de relire l'erreur pour la traduire si c'est une erreur MongoDB
                // Nous allons ignorer la traduction pour l'erreur MongoDB pour conserver les détails de l'erreur HTTP si elle a été capturée
                // Sinon, mettre à jour le message "identifiants invalides"
            } else if (loginError.textContent) {
                loginError.textContent = lang === 'fr' ? 'Identifiants invalides.' : 'Invalid credentials.';
            }
        }
    };

    // ===== NAVIGATION =====
    const showPage = (pageName) => {
        Object.values(pages).forEach(page => page.classList.remove('active'));
        pages[pageName].classList.add('active');
    };

    // ===== BASE DE DONNÉES UTILISATEURS =====
    const USERS_DATABASE = [
        { username: 'Mohamed', password: 'Mohamed@86', role: 'coordinator', assignedTeachers: ['Morched', 'Kamel', 'Abas', 'Zine', 'Youssef', 'Oumarou', 'Tonga', 'Sylvano', 'Sami', 'Mohamed Ali'] },
        { username: 'Zohra', password: 'Zohra@40', role: 'coordinator', assignedTeachers: ['Aichetou', 'Inas', 'Anwar', 'Souha', 'Amal', 'Shanouja', 'Hiba', 'Samira'] },
        { username: 'Rasha', password: 'Rasha@26', role: 'coordinator', assignedTeachers: ['Amal', 'Rouba', 'Rayan', 'Nesrine', 'Fatima', 'Romana', 'Nour'] },
        { username: 'روعة', password: 'روعة2025', role: 'coordinator', assignedTeachers: ['نداء اللقماني', 'نسيم الرمثي'] },
        { username: 'عماد', password: 'عماد2025', role: 'coordinator', assignedTeachers: ['ماجد', 'سعيد', 'جابر'] },
        ...['Morched', 'Kamel', 'Abas', 'Zine', 'Youssef', 'Oumarou', 'Tonga', 'Sylvano', 'Sami', 'Mohamed Ali', 'Aichetou', 'Inas', 'Anwar', 'Souha', 'Amal', 'Shanouja', 'Jana', 'Samira', 'Rouba', 'Rayan', 'Nesrine', 'Fatima', 'Romana', 'Nour', 'نداء اللقماني', 'نسيم الرمثي', 'ماجد', 'سعيد', 'جابر'].map(name => ({ username: name, password: name, role: 'teacher' }))
    ];

    // ===== ÉVÉNEMENTS UI =====
    document.getElementById('lang-en').addEventListener('click', () => changeAndRerenderLanguage('en'));
    document.getElementById('lang-fr').addEventListener('click', () => changeAndRerenderLanguage('fr'));
    
    document.getElementById('toggle-password').addEventListener('click', function() {
        const input = document.getElementById('password');
        const icon = this.querySelector('i');
        input.type = input.type === 'password' ? 'text' : 'password';
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // ===== CONNEXION =====
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const user = USERS_DATABASE.find(u => u.username === username && u.password === password);
        
        document.getElementById('login-error').textContent = ''; // Clear previous error
        
        if (user) {
            if (document.getElementById('remember-me').checked) {
                localStorage.setItem('teacherEvalCredentials', JSON.stringify({ username, password }));
            } else {
                localStorage.removeItem('teacherEvalCredentials');
            }
            
            state.currentUser = user;
            user.role === 'coordinator' ? renderCoordinatorUI() : renderTeacherUI();
            showPage(user.role === 'coordinator' ? 'coordinator' : 'teacher');
        } else {
            document.getElementById('login-error').textContent = 
                state.currentLang === 'fr' ? 'Identifiants invalides.' : 'Invalid credentials.';
        }
    });

    // ===== DÉCONNEXION =====
    const logout = () => { 
        state.currentUser = null; 
        showPage('login'); 
        document.getElementById('login-error').textContent = '';
        document.getElementById('teacher-select').value = '';
        document.getElementById('evaluation-form-container').innerHTML = '';
        document.getElementById('previous-evaluations-container').innerHTML = '';
    };
    
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('logout-btn-teacher').addEventListener('click', logout);

    // ===== SÉLECTION ENSEIGNANT =====
    document.getElementById('teacher-select').addEventListener('change', async (e) => {
        const teacherName = e.target.value;
        document.getElementById('evaluation-form-container').innerHTML = '';
        document.getElementById('previous-evaluations-container').innerHTML = '';
        
        if (teacherName) {
            // Charger les évaluations depuis MongoDB
            await renderPreviousEvaluations(teacherName);
            renderEvaluationForm(teacherName);
        }
    });

    // ===== MODAL =====
    const modal = document.getElementById('details-modal');
    modal.querySelector('#close-modal-btn').addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => { 
        if (e.target === modal) modal.style.display = 'none'; 
    });

    // ===== INTERFACE COORDINATEUR =====
    const renderCoordinatorUI = () => {
        document.getElementById('coordinator-welcome').textContent = 
            `${state.currentLang === 'fr' ? 'Bienvenue' : 'Welcome'}, ${state.currentUser.username}`;
        
        const teacherSelect = document.getElementById('teacher-select');
        const currentSelection = teacherSelect.value;
        teacherSelect.innerHTML = `<option value="">${state.currentLang === 'fr' ? '--- Choisir un enseignant ---' : '--- Choose a teacher ---'}</option>`;
        
        state.currentUser.assignedTeachers.sort().forEach(teacher => {
            teacherSelect.innerHTML += `<option value="${teacher}" ${currentSelection === teacher ? 'selected' : ''}>${teacher}</option>`;
        });
        
        const teacherName = teacherSelect.value;
        if (teacherName) {
            renderPreviousEvaluations(teacherName);
            renderEvaluationForm(teacherName);
        }
        
        setLanguage(state.currentLang);
    };

    // ===== ÉVALUATIONS PRÉCÉDENTES (AMÉLIORÉ) =====
    const renderPreviousEvaluations = async (teacherName) => {
        const container = document.getElementById('previous-evaluations-container');
        container.innerHTML = '<div class="card"><p style="text-align:center;">⏳ Chargement des évaluations...</p></div>';
        
        try {
            // Charger depuis MongoDB
            const evals = await MongoDB.loadEvaluations(teacherName);
            EVALUATIONS_DATABASE = evals; // Mettre à jour le cache local
            
            const sortedEvals = evals
                .filter(e => e.teacherName === teacherName)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            if (sortedEvals.length === 0) {
                container.innerHTML = `<div class="card no-evaluations">
                    <h3 data-lang-en="No previous evaluations for this teacher." 
                        data-lang-fr="Aucune évaluation précédente pour cet enseignant."></h3>
                </div>`;
                setLanguage(state.currentLang);
                return;
            }
            
            container.innerHTML = `
                <div class="card">
                    <h3>
                        <i class="fas fa-history"></i>
                        <span data-lang-en="Previous Evaluations (${sortedEvals.length})" 
                              data-lang-fr="Évaluations Précédentes (${sortedEvals.length})"></span>
                    </h3>
                    <ul class="previous-eval-list">
                        ${sortedEvals.map(ev => `
                            <li data-id="${ev.id}">
                                <div class="eval-info">
                                    <i class="fas fa-calendar-alt"></i> 
                                    ${new Date(ev.date).toLocaleDateString(state.currentLang === 'fr' ? 'fr-FR' : 'en-US')}
                                    <span class="eval-class">
                                        <b>${state.currentLang === 'fr' ? 'Classe' : 'Class'}:</b> ${ev.class || 'N/A'}
                                    </span>
                                    <span class="eval-subject">
                                        <b>${state.currentLang === 'fr' ? 'Matière' : 'Subject'}:</b> ${ev.subject || 'N/A'}
                                    </span>
                                    <span><b>Score:</b> ${ev.grandTotal}/100</span>
                                </div>
                                <div class="eval-actions">
                                    <button class="view-btn" title="${state.currentLang === 'fr' ? 'Voir les détails' : 'View details'}">
                                        <i class="fas fa-eye"></i> 
                                        <span data-lang-en="View" data-lang-fr="Voir"></span>
                                    </button>
                                    <button class="word-btn" title="${state.currentLang === 'fr' ? 'Télécharger Word' : 'Download Word'}">
                                        <i class="fas fa-file-word"></i> 
                                        <span data-lang-en="Word" data-lang-fr="Word"></span>
                                    </button>
                                    <button class="delete-btn" title="${state.currentLang === 'fr' ? 'Supprimer' : 'Delete'}">
                                        <i class="fas fa-trash"></i> 
                                        <span data-lang-en="Delete" data-lang-fr="Supprimer"></span>
                                    </button>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            
            setLanguage(state.currentLang);
        } catch (error) {
            console.error('Erreur chargement évaluations:', error);
            container.innerHTML = `
                <div class="card">
                    <p style="color: var(--danger-color); text-align: center;">
                        ⚠️ ${state.currentLang === 'fr' ? 'Erreur de chargement des évaluations' : 'Error loading evaluations'}
                    </p>
                </div>
            `;
        }
    };

    // Gestion des clics sur les évaluations précédentes
    document.getElementById('previous-evaluations-container').addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        
        const evalId = li.dataset.id;
        
        if (e.target.closest('.view-btn')) {
            window.showEvaluationDetails(evalId);
        }
        if (e.target.closest('.word-btn')) {
            window.generateTeacherWordReport(evalId);
        }
        if (e.target.closest('.delete-btn')) {
            window.deleteEvaluation(evalId);
        }
    });

    // ===== FORMULAIRE D'ÉVALUATION =====
    const renderEvaluationForm = (teacherName) => {
        const visitNumber = EVALUATIONS_DATABASE.filter(e => e.teacherName === teacherName).length + 1;
        const criteria = getCriteria();
        let criteriaIndex = 0;
        
        let formHTML = `
            <form id="eval-form" class="card">
                <h3>
                    <i class="fas fa-clipboard-list"></i> 
                    <span data-lang-en="New Evaluation for ${teacherName}" 
                          data-lang-fr="Nouvelle Évaluation pour ${teacherName}"></span>
                </h3>
                <div class="evaluation-metadata">
                    <div class="metadata-row">
                        <div class="metadata-item">
                            <label data-lang-en="Visit Number" data-lang-fr="Numéro de Visite"></label>
                            <input type="text" value="${visitNumber}" readonly>
                        </div>
                        <div class="metadata-item">
                            <label data-lang-en="Visit Date" data-lang-fr="Date de Visite"></label>
                            <input type="date" name="visitDate" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="metadata-item">
                            <label data-lang-en="Session (1-8)" data-lang-fr="Séance (1-8)"></label>
                            <select name="sessionNumber" required>
                                ${Array.from({length: 8}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
                            </select>
                        </div>
                        <div class="metadata-item">
                            <label data-lang-en="Class" data-lang-fr="Classe"></label>
                            <input type="text" name="class" required placeholder-fr="Ex: 6ème A" placeholder-en="Ex: Grade 6A">
                        </div>
                        <div class="metadata-item">
                            <label data-lang-en="Subject" data-lang-fr="Matière"></label>
                            <input type="text" name="subject" required placeholder-fr="Ex: Mathématiques" placeholder-en="Ex: Mathematics">
                        </div>
                    </div>
                </div>
        `;
        
        for (const category in criteria) {
            const cat = criteria[category];
            formHTML += `
                <fieldset class="criteria-section">
                    <legend class="category-header">
                        <span class="category-title" 
                              data-lang-en="${cat.title_en}" 
                              data-lang-fr="${cat.title_fr}"></span>
                        <span class="category-points">
                            <span class="current-score">0</span>/${cat.maxPoints} pts
                        </span>
                    </legend>
                    <div class="criteria-table">
                        <div class="table-header">
                            <div class="criteria-col" data-lang-en="Criteria" data-lang-fr="Critères"></div>
                            <div class="rating-col" data-lang-en="Rating" data-lang-fr="Éval."></div>
                            <div class="score-col">Score</div>
                        </div>
            `;
            
            cat.items.forEach(item => {
                formHTML += `
                    <div class="criteria-row">
                        <div class="criteria-text" 
                             data-lang-en="${item.text_en}" 
                             data-lang-fr="${item.text_fr}"></div>
                        <div class="rating-controls">
                            ${[1, 2, 3, 4, 5].map(n => `
                                <input type="radio" 
                                       id="c${criteriaIndex}-${n}" 
                                       name="crit${criteriaIndex}" 
                                       value="${n}" 
                                       data-max-points="${item.points}" 
                                       required>
                                <label for="c${criteriaIndex}-${n}">${n}</label>
                            `).join('')}
                        </div>
                        <div class="calculated-score" data-criteria="${criteriaIndex}">0</div>
                    </div>
                `;
                criteriaIndex++;
            });
            
            formHTML += `
                    </div>
                </fieldset>
            `;
        }
        
        formHTML += `
                <div class="evaluation-summary">
                    <div class="total-score-section">
                        <div class="score-display">
                            <span class="total-number" id="grand-total-display">0</span>
                            <span class="total-max">/100</span>
                        </div>
                        <div id="performance-level"></div>
                    </div>
                </div>
                
                <div class="comments-section">
                    <div class="comment-group">
                        <label for="s">
                            <i class="fas fa-star"></i> 
                            <span data-lang-en="Strengths" data-lang-fr="Forces"></span>
                        </label>
                        <textarea id="s" name="strengths" required rows="4"></textarea>
                    </div>
                    <div class="comment-group">
                        <label for="i">
                            <i class="fas fa-arrow-up"></i> 
                            <span data-lang-en="Improvements" data-lang-fr="Améliorations"></span>
                        </label>
                        <textarea id="i" name="toImprove" required rows="4"></textarea>
                    </div>
                    <div class="comment-group">
                        <label for="r">
                            <i class="fas fa-lightbulb"></i> 
                            <span data-lang-en="Recommendations" data-lang-fr="Recommandations"></span>
                        </label>
                        <textarea id="r" name="recommendations" required rows="4"></textarea>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="submit-btn">
                        <i class="fas fa-save"></i> 
                        <span data-lang-en="Save Evaluation" data-lang-fr="Enregistrer"></span>
                    </button>
                </div>
            </form>
        `;
        
        const container = document.getElementById('evaluation-form-container');
        container.innerHTML = formHTML;
        setLanguage(state.currentLang);

        const form = container.querySelector('#eval-form');
        form.addEventListener('change', () => calculateScores(form));
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (form.querySelectorAll('input[type="radio"]:checked').length < criteriaIndex) {
                alert(state.currentLang === 'fr' ? 'Veuillez noter tous les critères.' : 'Please rate all criteria.');
                return;
            }
            
            const formData = new FormData(e.target);
            const scores = calculateScores(form);
            const rawCriteria = Array.from(form.querySelectorAll('input[type="radio"]:checked'))
                .reduce((acc, r) => ({
                    ...acc, 
                    [r.name]: { rating: parseInt(r.value) }
                }), {});
            
            const newEvaluation = {
                id: Date.now().toString(),
                teacherName,
                coordinatorName: state.currentUser.username,
                class: formData.get('class'),
                subject: formData.get('subject'),
                sessionNumber: formData.get('sessionNumber'),
                visitDate: formData.get('visitDate'),
                criteriaDetails: getCriteria(),
                grandTotal: scores.grandTotal,
                comments: {
                    strengths: formData.get('strengths'),
                    toImprove: formData.get('toImprove'),
                    recommendations: formData.get('recommendations')
                },
                date: new Date().toISOString(),
                rawCriteria
            };
            
            try {
                const result = await MongoDB.saveEvaluation(newEvaluation);
                EVALUATIONS_DATABASE.push(newEvaluation);
                
                let message = state.currentLang === 'fr' 
                    ? 'Évaluation enregistrée avec succès!' 
                    : 'Evaluation saved successfully!';
                
                if (result.source === 'mongodb') {
                    message += state.currentLang === 'fr' 
                        ? ' (Sauvegardé en base de données)' 
                        : ' (Saved to database)';
                } else {
                    message += state.currentLang === 'fr' 
                        ? ' (Sauvegarde locale)' 
                        : ' (Local save)';
                }
                
                alert(message);
                
                // Réinitialiser l'interface
                document.getElementById('teacher-select').value = '';
                container.innerHTML = '';
                document.getElementById('previous-evaluations-container').innerHTML = '';
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                alert(state.currentLang === 'fr' 
                    ? 'Erreur lors de la sauvegarde' 
                    : 'Save error');
            }
        });
    };

    // ===== CALCUL DES SCORES =====
    const calculateScores = (form) => {
        let grandTotal = 0;
        const radios = form.querySelectorAll('input[type="radio"]:checked');
        
        radios.forEach(r => {
            const score = Math.round((parseInt(r.value) / 5) * parseInt(r.dataset.maxPoints));
            grandTotal += score;
            
            // Mettre à jour le score individuel
            const scoreDisplay = form.querySelector(`.calculated-score[data-criteria="${r.name.replace('crit', '')}"]`);
            if (scoreDisplay) {
                scoreDisplay.textContent = score;
            }
        });
        
        // Mettre à jour les scores par catégorie
        form.querySelectorAll('.criteria-section').forEach(section => {
            const categoryRadios = section.querySelectorAll('input[type="radio"]:checked');
            let categoryScore = 0;
            
            categoryRadios.forEach(r => {
                categoryScore += Math.round((parseInt(r.value) / 5) * parseInt(r.dataset.maxPoints));
            });
            
            const scoreSpan = section.querySelector('.current-score');
            if (scoreSpan) {
                scoreSpan.textContent = categoryScore;
            }
        });
        
        const perf = getPerformanceLevel(grandTotal);
        form.querySelector('#grand-total-display').textContent = grandTotal;
        
        const levelEl = form.querySelector('#performance-level');
        levelEl.textContent = perf[`label_${state.currentLang}`];
        levelEl.className = `performance-level ${perf.class}`;
        
        return { grandTotal };
    };

    // ===== INTERFACE ENSEIGNANT (AMÉLIORÉ) =====
    const renderTeacherUI = async () => {
        document.getElementById('teacher-welcome').textContent = 
            `${state.currentLang === 'fr' ? 'Bienvenue' : 'Welcome'}, ${state.currentUser.username}`;
        
        const container = document.getElementById('evaluation-reports');
        container.innerHTML = '<div class="card"><p style="text-align:center;">⏳ Chargement des évaluations...</p></div>';
        
        try {
            // Charger depuis MongoDB
            const evals = await MongoDB.loadEvaluations(state.currentUser.username);
            EVALUATIONS_DATABASE = evals;
            
            const sortedEvals = evals
                .filter(ev => ev.teacherName === state.currentUser.username)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            if (sortedEvals.length === 0) {
                container.innerHTML = `
                    <div class="card no-evaluations">
                        <h3 data-lang-en="No evaluations available" 
                            data-lang-fr="Aucune évaluation disponible"></h3>
                    </div>
                `;
                setLanguage(state.currentLang);
                return;
            }
            
            container.innerHTML = sortedEvals.map((ev, index) => {
                const perf = getPerformanceLevel(ev.grandTotal);
                return `
                    <div class="evaluation-card ${index === 0 ? 'latest' : ''}">
                        <div class="card-header">
                            <div class="eval-date">
                                <i class="fas fa-calendar-check"></i> 
                                ${new Date(ev.date).toLocaleDateString(state.currentLang === 'fr' ? 'fr-FR' : 'en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                                ${index === 0 ? `
                                    <span class="latest-badge">
                                        ${state.currentLang === 'fr' ? 'RÉCENT' : 'LATEST'}
                                    </span>
                                ` : ''}
                            </div>
                            <div class="eval-meta">
                                <span><b>${state.currentLang === 'fr' ? 'Évaluateur' : 'Evaluator'}:</b> ${ev.coordinatorName}</span>
                                <span><b>${state.currentLang === 'fr' ? 'Classe' : 'Class'}:</b> ${ev.class || 'N/A'}</span>
                                <span><b>${state.currentLang === 'fr' ? 'Matière' : 'Subject'}:</b> ${ev.subject || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="card-content">
                            <div class="overall-progress">
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill" 
                                         style="width: ${ev.grandTotal}%; background-color: ${perf.color};"></div>
                                </div>
                                <div class="score-summary">
                                    <span class="score-number">${ev.grandTotal}</span>
                                    <span class="score-max">/100</span>
                                    <span class="performance-badge" style="background-color: ${perf.color}">
                                        ${perf[`label_${state.currentLang}`]}
                                    </span>
                                </div>
                            </div>
                            <div class="card-actions">
                                <button class="details-btn" onclick="window.showEvaluationDetails('${ev.id}')">
                                    <i class="fas fa-search-plus"></i> 
                                    <span data-lang-en="View Details" data-lang-fr="Voir Détails"></span>
                                </button>
                                <button class="word-btn" onclick="window.generateTeacherWordReport('${ev.id}')">
                                    <i class="fas fa-file-word"></i> 
                                    <span data-lang-en="Download Word" data-lang-fr="Télécharger Word"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            setLanguage(state.currentLang);
        } catch (error) {
            console.error('Erreur chargement évaluations:', error);
            container.innerHTML = `
                <div class="card">
                    <p style="color: var(--danger-color); text-align: center;">
                        ⚠️ ${state.currentLang === 'fr' ? 'Erreur de chargement' : 'Loading error'}
                    </p>
                </div>
            `;
        }
    };

    // ===== MODAL DÉTAILS =====
    window.showEvaluationDetails = (evalId) => {
        const ev = EVALUATIONS_DATABASE.find(e => e.id === evalId);
        if (!ev) return;
        
        let critIndex = 0;
        
        document.getElementById('modal-body-content').innerHTML = `
            <div class="detail-grid">
                <div><strong>${state.currentLang === 'fr' ? 'Date' : 'Date'}:</strong> 
                    ${new Date(ev.date).toLocaleDateString(state.currentLang === 'fr' ? 'fr-FR' : 'en-US')}</div>
                <div><strong>${state.currentLang === 'fr' ? 'Classe' : 'Class'}:</strong> ${ev.class || 'N/A'}</div>
                <div><strong>${state.currentLang === 'fr' ? 'Matière' : 'Subject'}:</strong> ${ev.subject || 'N/A'}</div>
                <div><strong>${state.currentLang === 'fr' ? 'Séance N°' : 'Session #'}:</strong> ${ev.sessionNumber || 'N/A'}</div>
                <div><strong>${state.currentLang === 'fr' ? 'Évaluateur' : 'Evaluator'}:</strong> ${ev.coordinatorName}</div>
                <div><strong>Score Total:</strong> <span style="font-size: 1.2em; color: var(--primary-color);">${ev.grandTotal}/100</span></div>
            </div>
            
            <h4>${state.currentLang === 'fr' ? 'Tableau des Scores' : 'Scores Table'}</h4>
            <div class="criteria-table-details">
                ${Object.values(ev.criteriaDetails).map(cat => `
                    <div class="category-detail-header">${cat[`title_${state.currentLang}`]}</div>
                    ${cat.items.map(item => {
                        const rating = (ev.rawCriteria && ev.rawCriteria[`crit${critIndex}`]) 
                            ? ev.rawCriteria[`crit${critIndex}`].rating 
                            : 'N/A';
                        const score = (rating !== 'N/A') 
                            ? Math.round((rating / 5) * item.points) 
                            : 'N/A';
                        critIndex++;
                        return `
                            <div class="criteria-detail-row">
                                <div class="criteria-detail-text">${item[`text_${state.currentLang}`]}</div>
                                <div class="criteria-detail-rating">
                                    ${state.currentLang === 'fr' ? 'Note' : 'Rating'}: <strong>${rating}/5</strong>
                                </div>
                                <div class="criteria-detail-score">Score: <strong>${score}/${item.points}</strong></div>
                            </div>
                        `;
                    }).join('')}
                `).join('')}
            </div>
            
            <h4>${state.currentLang === 'fr' ? 'Commentaires' : 'Comments'}</h4>
            <div class="comments-details">
                <div class="comment-item">
                    <h6><i class="fas fa-star"></i> ${state.currentLang === 'fr' ? 'Forces' : 'Strengths'}</h6>
                    <p>${ev.comments.strengths || ''}</p>
                </div>
                <div class="comment-item">
                    <h6><i class="fas fa-arrow-up"></i> ${state.currentLang === 'fr' ? 'Améliorations' : 'Improvements'}</h6>
                    <p>${ev.comments.toImprove || ''}</p>
                </div>
                <div class="comment-item">
                    <h6><i class="fas fa-lightbulb"></i> ${state.currentLang === 'fr' ? 'Recommandations' : 'Recommendations'}</h6>
                    <p>${ev.comments.recommendations || ''}</p>
                </div>
            </div>
        `;
        
        document.getElementById('details-modal').style.display = 'flex';
    };

    // ===== GÉNÉRATION WORD PROFESSIONNELLE AMÉLIORÉE (LOGIQUE CORRIGÉE) =====
    window.generateTeacherWordReport = async (evalId) => {
        if (typeof docx === 'undefined' || typeof saveAs === 'undefined') {
            console.error("Erreur: Les librairies docx ou FileSaver ne sont pas chargées.");
            alert("Erreur: Une librairie nécessaire n'a pu être chargée. Veuillez rafraîchir la page.");
            return;
        }

        try {
            const data = EVALUATIONS_DATABASE.find(ev => ev.id === evalId);
            if (!data) throw new Error("Évaluation non trouvée !");
            
            const { 
                Document, Packer, Paragraph, TextRun, HeadingLevel, Table, 
                TableCell, TableRow, WidthType, AlignmentType, BorderStyle 
            } = docx;
            
            const perf = getPerformanceLevel(data.grandTotal);
            
            // Créer un tableau de synthèse par catégorie (CORRECTION LOGIQUE)
            const categorySummary = [];
            let critIndexSummary = 0; // Index global pour accéder à data.rawCriteria (crit0, crit1, ...)
            
            Object.values(data.criteriaDetails || {}).forEach(cat => {
                let categoryTotal = 0;
                
                cat.items.forEach(item => { // Itérer sur chaque item de la catégorie
                    const rating = (data.rawCriteria && data.rawCriteria[`crit${critIndexSummary}`]) 
                        ? data.rawCriteria[`crit${critIndexSummary}`].rating 
                        : 0;
                    
                    // Calculer le score de l'item
                    const score = Math.round((rating / 5) * item.points); 
                    
                    categoryTotal += score;
                    critIndexSummary++; // Incrémenter l'index global pour le critère suivant
                });
                
                categorySummary.push({
                    title: cat[`title_${state.currentLang}`],
                    total: categoryTotal,
                    max: cat.maxPoints
                });
            });
            // FIN DE LA CORRECTION LOGIQUE
            
            let critIndex = 0;
            const tableRows = Object.values(data.criteriaDetails || {}).flatMap(cat => {
                const categoryRows = [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: cat[`title_${state.currentLang}`] || '',
                                                bold: true,
                                                color: 'FFFFFF',
                                                size: 24
                                            })
                                        ],
                                        spacing: { before: 150, after: 150 }
                                    })
                                ],
                                columnSpan: 4,
                                shading: { fill: "005A9E" },
                                margins: { top: 150, bottom: 150, left: 150, right: 150 }
                            })
                        ]
                    })
                ];
                
                const itemRows = (cat.items || []).map(item => {
                    const rating = (data.rawCriteria && data.rawCriteria[`crit${critIndex}`]) 
                        ? data.rawCriteria[`crit${critIndex}`].rating 
                        : 0;
                    const score = Math.round((rating / 5) * item.points);
                    critIndex++;
                    
                    return new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: item[`text_${state.currentLang}`] || ''
                                            })
                                        ],
                                        spacing: { before: 80, after: 80 }
                                    })
                                ],
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                margins: { top: 80, bottom: 80, left: 80, right: 80 }
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `${item.points}`
                                            })
                                        ],
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 80, after: 80 }
                                    })
                                ],
                                width: { size: 15, type: WidthType.PERCENTAGE },
                                shading: { fill: "ECF0F1" },
                                margins: { top: 80, bottom: 80, left: 80, right: 80 }
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: rating.toString(),
                                                bold: true
                                            })
                                        ],
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 80, after: 80 }
                                    })
                                ],
                                width: { size: 15, type: WidthType.PERCENTAGE },
                                shading: { fill: "E8F8F5" },
                                margins: { top: 80, bottom: 80, left: 80, right: 80 }
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `${score}`,
                                                bold: true
                                            })
                                        ],
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 80, after: 80 }
                                    })
                                ],
                                width: { size: 20, type: WidthType.PERCENTAGE },
                                shading: { fill: score >= item.points * 0.8 ? "D5F4E6" : "FADBD8" },
                                margins: { top: 80, bottom: 80, left: 80, right: 80 }
                            })
                        ]
                    });
                });
                
                return categoryRows.concat(itemRows);
            });
            
            const doc = new Document({
                sections: [{
                    properties: {
                        page: {
                            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
                        }
                    },
                    children: [
                        // En-tête principal avec logo symbolique
                        new Paragraph({
                            children: [
                                new TextRun({ text: "🎓" })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 100 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "ÉCOLE INTERNATIONALE ALKAWTHAR",
                                    bold: true,
                                    size: 32
                                })
                            ],
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 100 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: state.currentLang === 'fr' ? "RAPPORT D'ÉVALUATION PÉDAGOGIQUE" : "TEACHER EVALUATION REPORT",
                                    bold: true,
                                    size: 28
                                })
                            ],
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 300 },
                            shading: { fill: "F0F4F8" }
                        }),
                        
                        // Ligne de séparation
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "━".repeat(60),
                                    color: "005A9E"
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 300 }
                        }),
                        
                        // Informations générales
                        new Paragraph({
                            children: [
                                new TextRun({ 
                                    text: state.currentLang === 'fr' ? 'Enseignant : ' : 'Teacher: ', 
                                    bold: true, 
                                    size: 24 
                                }),
                                new TextRun({ 
                                    text: data.teacherName || '', 
                                    size: 24 
                                })
                            ],
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ 
                                    text: state.currentLang === 'fr' ? 'Évaluateur : ' : 'Evaluator: ', 
                                    bold: true, 
                                    size: 24 
                                }),
                                new TextRun({ 
                                    text: data.coordinatorName || '', 
                                    size: 24 
                                })
                            ],
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ 
                                    text: state.currentLang === 'fr' ? 'Date de visite : ' : 'Visit Date: ', 
                                    bold: true, 
                                    size: 24 
                                }),
                                new TextRun({ 
                                    text: data.visitDate || '', 
                                    size: 24 
                                })
                            ],
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ 
                                    text: state.currentLang === 'fr' ? 'Classe : ' : 'Class: ', 
                                    bold: true, 
                                    size: 24 
                                }),
                                new TextRun({ 
                                    text: data.class || 'N/A', 
                                    size: 24 
                                })
                            ],
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ 
                                    text: state.currentLang === 'fr' ? 'Matière : ' : 'Subject: ', 
                                    bold: true, 
                                    size: 24 
                                }),
                                new TextRun({ 
                                    text: data.subject || 'N/A', 
                                    size: 24 
                                })
                            ],
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ 
                                    text: state.currentLang === 'fr' ? 'Séance N° : ' : 'Session #: ', 
                                    bold: true, 
                                    size: 24 
                                }),
                                new TextRun({ 
                                    text: data.sessionNumber || 'N/A', 
                                    size: 24 
                                })
                            ],
                            spacing: { after: 400 }
                        }),
                        
                        // Score total avec badge de performance (amélioration visuelle)
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "━".repeat(60),
                                    color: "005A9E"
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `📊 ${state.currentLang === 'fr' ? 'SCORE TOTAL : ' : 'TOTAL SCORE: '}`,
                                    bold: true,
                                    size: 36
                                }),
                                new TextRun({
                                    text: `${data.grandTotal || 0}/100`,
                                    bold: true,
                                    size: 48,
                                    color: perf.color.replace('#', '')
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 },
                            border: {
                                top: { style: BorderStyle.DOUBLE, size: 6, color: perf.color.replace('#', '') },
                                bottom: { style: BorderStyle.DOUBLE, size: 6, color: perf.color.replace('#', '') }
                            }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `✨ ${state.currentLang === 'fr' ? 'Niveau : ' : 'Level: '}`,
                                    bold: true,
                                    size: 28
                                }),
                                new TextRun({
                                    text: perf[`label_${state.currentLang}`].toUpperCase(),
                                    bold: true,
                                    size: 32,
                                    color: perf.color.replace('#', '')
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 300 },
                            shading: { fill: "F8F9FA" }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "━".repeat(60),
                                    color: "005A9E"
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 }
                        }),
                        
                        // Tableau récapitulatif par catégorie
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: state.currentLang === 'fr' ? '📈 RÉSUMÉ PAR CATÉGORIE' : '📈 SUMMARY BY CATEGORY',
                                    bold: true,
                                    size: 28
                                })
                            ],
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 300, after: 200 }
                        }),
                        
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 2, color: "005A9E" },
                                bottom: { style: BorderStyle.SINGLE, size: 2, color: "005A9E" },
                                left: { style: BorderStyle.SINGLE, size: 2, color: "005A9E" },
                                right: { style: BorderStyle.SINGLE, size: 2, color: "005A9E" },
                                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({ 
                                                children: [
                                                    new TextRun({
                                                        text: state.currentLang === 'fr' ? 'Catégorie' : 'Category',
                                                        bold: true,
                                                        color: 'FFFFFF'
                                                    })
                                                ],
                                                alignment: AlignmentType.CENTER
                                            })],
                                            shading: { fill: "005A9E" }
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ 
                                                children: [
                                                    new TextRun({
                                                        text: state.currentLang === 'fr' ? 'Score Obtenu' : 'Score Obtained',
                                                        bold: true,
                                                        color: 'FFFFFF'
                                                    })
                                                ],
                                                alignment: AlignmentType.CENTER
                                            })],
                                            shading: { fill: "005A9E" }
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ 
                                                children: [
                                                    new TextRun({
                                                        text: state.currentLang === 'fr' ? 'Maximum' : 'Maximum',
                                                        bold: true,
                                                        color: 'FFFFFF'
                                                    })
                                                ],
                                                alignment: AlignmentType.CENTER
                                            })],
                                            shading: { fill: "005A9E" }
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ 
                                                children: [
                                                    new TextRun({
                                                        text: '%',
                                                        bold: true,
                                                        color: 'FFFFFF'
                                                    })
                                                ],
                                                alignment: AlignmentType.CENTER
                                            })],
                                            shading: { fill: "005A9E" }
                                        })
                                    ]
                                }),
                                ...categorySummary.map(cat => new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({ 
                                                children: [
                                                    new TextRun({ text: cat.title, bold: true })
                                                ]
                                            })],
                                            shading: { fill: "F8F9FA" }
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ 
                                                children: [
                                                    new TextRun({
                                                        text: cat.total.toString(),
                                                        bold: true
                                                    })
                                                ],
                                                alignment: AlignmentType.CENTER
                                            })],
                                            shading: { fill: cat.total >= cat.max * 0.8 ? "D5F4E6" : "FEF5E7" }
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ 
                                                children: [
                                                    new TextRun({ text: cat.max.toString() })
                                                ],
                                                alignment: AlignmentType.CENTER 
                                            })]
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ 
                                                children: [
                                                    new TextRun({
                                                        text: Math.round((cat.total / cat.max) * 100) + '%',
                                                        bold: true
                                                    })
                                                ],
                                                alignment: AlignmentType.CENTER
                                            })],
                                            shading: { fill: cat.total >= cat.max * 0.8 ? "D5F4E6" : "FEF5E7" }
                                        })
                                    ]
                                }))
                            ]
                        }),
                        
                        new Paragraph({ text: '', spacing: { after: 400 } }),
                        
                        // Tableau détaillé (design amélioré)
                        new Paragraph({
                            text: state.currentLang === 'fr' ? '📋 TABLEAU DÉTAILLÉ DES NOTES' : '📋 DETAILED SCORES TABLE',
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 400, after: 200 }
                        }),
                        
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.DOUBLE, size: 3, color: "005A9E" },
                                bottom: { style: BorderStyle.DOUBLE, size: 3, color: "005A9E" },
                                left: { style: BorderStyle.SINGLE, size: 2, color: "005A9E" },
                                right: { style: BorderStyle.SINGLE, size: 2, color: "005A9E" },
                                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" },
                                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" }
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [new TextRun({
                                                        text: state.currentLang === 'fr' ? 'Critère d\'Évaluation' : 'Evaluation Criteria',
                                                        bold: true,
                                                        color: 'FFFFFF',
                                                        size: 22
                                                    })],
                                                    alignment: AlignmentType.CENTER
                                                })
                                            ],
                                            shading: { fill: "005A9E" },
                                            margins: { top: 120, bottom: 120, left: 120, right: 120 }
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [new TextRun({
                                                        text: state.currentLang === 'fr' ? 'Max' : 'Max',
                                                        bold: true,
                                                        color: 'FFFFFF',
                                                        size: 22
                                                    })],
                                                    alignment: AlignmentType.CENTER
                                                })
                                            ],
                                            shading: { fill: "005A9E" },
                                            margins: { top: 120, bottom: 120, left: 120, right: 120 }
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [new TextRun({
                                                        text: state.currentLang === 'fr' ? 'Note' : 'Rating',
                                                        bold: true,
                                                        color: 'FFFFFF',
                                                        size: 22
                                                    })],
                                                    alignment: AlignmentType.CENTER
                                                })
                                            ],
                                            shading: { fill: "005A9E" },
                                            margins: { top: 120, bottom: 120, left: 120, right: 120 }
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [new TextRun({
                                                        text: state.currentLang === 'fr' ? 'Score' : 'Score',
                                                        bold: true,
                                                        color: 'FFFFFF',
                                                        size: 22
                                                    })],
                                                    alignment: AlignmentType.CENTER
                                                })
                                            ],
                                            shading: { fill: "005A9E" },
                                            margins: { top: 120, bottom: 120, left: 120, right: 120 }
                                        })
                                    ],
                                    tableHeader: true
                                }),
                                ...tableRows
                            ]
                        }),
                        
                        new Paragraph({ text: '', spacing: { after: 400 } }),
                        
                        // Commentaires (design amélioré avec icônes et boîtes colorées)
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: state.currentLang === 'fr' ? '⭐ FORCES OBSERVÉES' : '⭐ OBSERVED STRENGTHS',
                                    bold: true,
                                    size: 28
                                })
                            ],
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 500, after: 200 },
                            shading: { fill: "D5F4E6" }
                        }),
                        new Paragraph({
                            text: data.comments.strengths || (state.currentLang === 'fr' ? 'Aucun commentaire' : 'No comments'),
                            spacing: { after: 400, before: 100 },
                            indent: { left: 720 },
                            border: {
                                left: { style: BorderStyle.SINGLE, size: 6, color: "27AE60" }
                            }
                        }),
                        
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: state.currentLang === 'fr' ? '📈 AXES D\'AMÉLIORATION' : '📈 AREAS FOR IMPROVEMENT',
                                    bold: true,
                                    size: 28
                                })
                            ],
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 400, after: 200 },
                            shading: { fill: "FEF5E7" }
                        }),
                        new Paragraph({
                            text: data.comments.toImprove || (state.currentLang === 'fr' ? 'Aucun commentaire' : 'No comments'),
                            spacing: { after: 400, before: 100 },
                            indent: { left: 720 },
                            border: {
                                left: { style: BorderStyle.SINGLE, size: 6, color: "F39C12" }
                            }
                        }),
                        
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: state.currentLang === 'fr' ? '💡 RECOMMANDATIONS' : '💡 RECOMMENDATIONS',
                                    bold: true,
                                    size: 28
                                })
                            ],
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 400, after: 200 },
                            shading: { fill: "EBF5FB" }
                        }),
                        new Paragraph({
                            text: data.comments.recommendations || (state.currentLang === 'fr' ? 'Aucun commentaire' : 'No comments'),
                            spacing: { after: 400, before: 100 },
                            indent: { left: 720 },
                            border: {
                                left: { style: BorderStyle.SINGLE, size: 6, color: "3498DB" }
                            }
                        }),
                        
                        // Pied de page professionnel
                        new Paragraph({ text: '', spacing: { before: 600 } }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "━".repeat(60),
                                    color: "005A9E"
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: '📅 ',
                                    size: 20
                                }),
                                new TextRun({
                                    text: state.currentLang === 'fr' 
                                        ? `Document généré le ${new Date().toLocaleDateString('fr-FR', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}` 
                                        : `Document generated on ${new Date().toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}`,
                                    italics: true,
                                    size: 20
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 100 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: state.currentLang === 'fr' 
                                        ? '© École Internationale Alkawthar - Système d\'Évaluation des Enseignants' 
                                        : '© École Internationale Alkawthar - Teacher Evaluation System',
                                    italics: true,
                                    size: 18,
                                    color: "7F8C8D"
                                })
                            ],
                            alignment: AlignmentType.CENTER
                        })
                    ]
                }]
            });
            
            const blob = await Packer.toBlob(doc);
            const fileName = `Evaluation_${data.teacherName.replace(/\s+/g, '_')}_${data.visitDate || new Date().toISOString().split('T')[0]}.docx`;
            saveAs(blob, fileName);
            
            console.log('✅ Document Word professionnel généré avec succès:', fileName);
            
            // Notification visuelle
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; 
                background: #27AE60; color: white; padding: 1rem 2rem; 
                border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 9999; animation: slideIn 0.5s ease;
            `;
            notification.innerHTML = `<i class="fas fa-check-circle"></i> ${state.currentLang === 'fr' ? 'Document téléchargé avec succès!' : 'Document downloaded successfully!'}`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }, 3000);

        } catch (error) {
            console.error("Erreur détaillée de la génération Word:", error);
            alert(state.currentLang === 'fr' 
                ? "Erreur: Impossible de générer le document Word. Consultez la console." 
                : "Error: Could not generate Word document. Check console.");
        }
    };

    // ===== SUPPRESSION =====
    window.deleteEvaluation = async (evalId) => {
        const confirmText = state.currentLang === 'fr' 
            ? 'Êtes-vous sûr de vouloir supprimer cette évaluation ?' 
            : 'Are you sure you want to delete this evaluation?';
        
        if (confirm(confirmText)) {
            const index = EVALUATIONS_DATABASE.findIndex(ev => ev.id === evalId);
            
            if (index > -1) {
                const teacherName = EVALUATIONS_DATABASE[index].teacherName;
                
                try {
                    await MongoDB.deleteEvaluation(evalId);
                    EVALUATIONS_DATABASE.splice(index, 1);
                    
                    // Rafraîchir l'affichage
                    await renderPreviousEvaluations(teacherName);
                    
                    // Si le formulaire était affiché pour cet enseignant, le ré-afficher pour mettre à jour le numéro de visite
                    const currentTeacher = document.getElementById('teacher-select').value;
                    if (currentTeacher === teacherName) {
                        renderEvaluationForm(teacherName);
                    }
                    
                    alert(state.currentLang === 'fr' 
                        ? 'Évaluation supprimée avec succès' 
                        : 'Evaluation deleted successfully');
                } catch (error) {
                    console.error('Erreur lors de la suppression:', error);
                    alert(state.currentLang === 'fr' 
                        ? 'Erreur lors de la suppression' 
                        : 'Delete error');
                }
            }
        }
    };

    // ===== NIVEAUX DE PERFORMANCE =====
    const getPerformanceLevel = (score) => {
        if (score >= 90) return { 
            label_en: "Excellent", 
            label_fr: "Excellent", 
            class: "excellent", 
            color: "#27ae60" 
        };
        if (score >= 80) return { 
            label_en: "Very Good", 
            label_fr: "Très Bien", 
            class: "very-good", 
            color: "#2ecc71" 
        };
        if (score >= 70) return { 
            label_en: "Good", 
            label_fr: "Bien", 
            class: "good", 
            color: "#f39c12" 
        };
        if (score >= 60) return { 
            label_en: "Satisfactory", 
            label_fr: "Satisfaisant", 
            class: "satisfactory", 
            color: "#e67e22" 
        };
        return { 
            label_en: "Needs Improvement", 
            label_fr: "À améliorer", 
            class: "needs-improvement", 
            color: "#e74c3c" 
        };
    };

    // ===== CRITÈRES D'ÉVALUATION =====
    const getCriteria = () => ({
        preparation: {
            title_en: "PREPARATION AND PLANNING",
            title_fr: "PRÉPARATION ET PLANIFICATION",
            maxPoints: 25,
            items: [
                { text_en: "Lesson plans with clear objectives", text_fr: "Plans de cours avec objectifs clairs", points: 5 },
                { text_en: "Knowledge of curriculum", text_fr: "Connaissance du curriculum", points: 5 },
                { text_en: "Appropriate materials", text_fr: "Matériaux appropriés", points: 5 },
                { text_en: "Differentiated instruction", text_fr: "Enseignement différencié", points: 5 },
                { text_en: "Assessments aligned with objectives", text_fr: "Évaluations alignées aux objectifs", points: 5 }
            ]
        },
        activities: {
            title_en: "TEACHING ACTIVITIES",
            title_fr: "ACTIVITÉS D'ENSEIGNEMENT",
            maxPoints: 25,
            items: [
                { text_en: "Clear and structured lessons", text_fr: "Leçons claires et structurées", points: 5 },
                { text_en: "Varied teaching strategies", text_fr: "Stratégies d'enseignement variées", points: 5 },
                { text_en: "Appropriate use of technology", text_fr: "Usage approprié de la technologie", points: 5 },
                { text_en: "Promotes critical thinking", text_fr: "Favorise la pensée critique", points: 5 },
                { text_en: "Timely and constructive feedback", text_fr: "Feedback opportun et constructif", points: 5 }
            ]
        },
        classroomControl: {
            title_en: "CLASSROOM MANAGEMENT",
            title_fr: "GESTION DE CLASSE",
            maxPoints: 25,
            items: [
                { text_en: "Conducive learning environment", text_fr: "Environnement d'apprentissage propice", points: 5 },
                { text_en: "Effective student behavior management", text_fr: "Gestion efficace du comportement", points: 5 },
                { text_en: "Efficient use of time", text_fr: "Utilisation efficace du temps", points: 5 },
                { text_en: "Handles disruptions professionally", text_fr: "Gère les perturbations professionnellement", points: 5 },
                { text_en: "Organized classroom and resources", text_fr: "Classe et ressources organisées", points: 5 }
            ]
        },
        personalCriteria: {
            title_en: "PROFESSIONAL QUALITIES",
            title_fr: "QUALITÉS PROFESSIONNELLES",
            maxPoints: 25,
            items: [
                { text_en: "Professional appearance", text_fr: "Apparence professionnelle", points: 5 },
                { text_en: "Punctual and reliable", text_fr: "Ponctuel et fiable", points: 5 },
                { text_en: "Positive relationships with students", text_fr: "Relations positives avec les élèves", points: 5 },
                { text_en: "Collaboration with colleagues", text_fr: "Collaboration avec les collègues", points: 5 },
                { text_en: "Commitment to growth", text_fr: "Engagement envers le développement", points: 5 }
            ]
        }
    });

    // ===== INITIALISATION (LOGIQUE AJUSTÉE) =====
    const init = async () => {
        setLanguage('fr');
        let autoLoggedIn = false;
        
        // 1. Tenter l'auto-connexion
        const savedCreds = localStorage.getItem('teacherEvalCredentials');
        if (savedCreds) {
            const { username, password } = JSON.parse(savedCreds);
            document.getElementById('username').value = username;
            document.getElementById('password').value = password;
            document.getElementById('remember-me').checked = true;
            
            const user = USERS_DATABASE.find(u => u.username === username && u.password === password);
            if (user) {
                state.currentUser = user;
                user.role === 'coordinator' ? renderCoordinatorUI() : renderTeacherUI();
                showPage(user.role === 'coordinator' ? 'coordinator' : 'teacher');
                autoLoggedIn = true;
            } else {
                 // Si les identifiants sont locaux mais ne correspondent plus (changement de mot de passe), les supprimer
                localStorage.removeItem('teacherEvalCredentials');
            }
        }
        
        // 2. Charger les évaluations initiales (seulement si connecté ou pour le check API général)
        // Ceci va également remplir le champ d'erreur de connexion si le 404 persiste.
        try {
            EVALUATIONS_DATABASE = await MongoDB.loadEvaluations(state.currentUser ? state.currentUser.username : null);
            console.log('✅ Système initialisé:', EVALUATIONS_DATABASE.length, 'évaluations chargées');
            if (document.getElementById('login-error').textContent.includes('MongoDB')) {
                 document.getElementById('login-error').textContent = ''; // Clear error if load was successful
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement initial:', error);
            // L'erreur est déjà propagée à login-error par MongoDB.loadEvaluations
        }
        
        // Assurez-vous d'être sur la page de connexion si l'auto-connexion a échoué
        if (!state.currentUser) {
            showPage('login');
        }
    };

    init();
});
