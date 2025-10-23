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
    const API_BASE = '/api';

    // ===== GESTION MONGODB DIRECTE (SANS LOCALSTORAGE) =====
    const MongoDB = {
        async request(endpoint, options = {}) {
            try {
                // S'assurer que les requêtes API vont vers le bon endpoint Vercel
                const fetchUrl = `${API_BASE}${endpoint}`;
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
                        ? '❌ Erreur: Impossible de se connecter à la base de données MongoDB. Vérifiez votre connexion internet et la configuration MongoDB.' 
                        : '❌ Error: Cannot connect to MongoDB database. Check your internet connection and MongoDB configuration.';
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
                loginError.textContent = lang === 'fr' 
                    ? '❌ Erreur: Impossible de se connecter à la base de données MongoDB. Vérifiez votre connexion internet et la configuration MongoDB.' 
                    : '❌ Error: Cannot connect to MongoDB database. Check your internet connection and MongoDB configuration.';
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
        { username: 'Zohra', password: 'Zohra@40', role: 'coordinator', assignedTeachers: ['Aichetou', 'Inas', 'Anwar', 'Souha', 'Amal', 'Shanouja', 'Jana', 'Samira'] },
        { username: 'Rasha', password: 'Rasha@26', role: 'coordinator', assignedTeachers: ['Amal', 'Rouba', 'Rayan', 'Imane', 'Nesrine', 'Fatima', 'Samar', 'Romana', 'Nour'] },
        ...['Morched', 'Kamel', 'Abas', 'Zine', 'Youssef', 'Oumarou', 'Tonga', 'Sylvano', 'Sami', 'Mohamed Ali', 'Aichetou', 'Inas', 'Anwar', 'Souha', 'Amal', 'Shanouja', 'Jana', 'Samira', 'Rouba', 'Rayan', 'Imane', 'Nesrine', 'Fatima', 'Samar', 'Romana', 'Nour'].map(name => ({ username: name, password: name, role: 'teacher' }))
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
                            <div class="points-col" data-lang-en="Points" data-lang-fr="Points"></div>
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
                        <div class="max-points">${item.points}</div>
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
        
        const levelEl = form
