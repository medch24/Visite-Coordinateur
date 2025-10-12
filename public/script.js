document.addEventListener('DOMContentLoaded', () => {
    const state = { currentUser: null, currentLang: 'fr' };
    const pages = {
        login: document.getElementById('login-page'),
        coordinator: document.getElementById('coordinator-dashboard'),
        teacher: document.getElementById('teacher-dashboard')
    };
    let EVALUATIONS_DATABASE = [];

    const saveDb = () => localStorage.setItem('evaluationsDatabase', JSON.stringify(EVALUATIONS_DATABASE));
    const loadDb = () => {
        const data = localStorage.getItem('evaluationsDatabase');
        if (data) EVALUATIONS_DATABASE = JSON.parse(data);
    };

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
        }
    };

    const showPage = (pageName) => {
        Object.values(pages).forEach(page => page.classList.remove('active'));
        pages[pageName].classList.add('active');
    };

    const USERS_DATABASE = [
        { username: 'Mohamed', password: 'Mohamed@86', role: 'coordinator', assignedTeachers: ['Morched', 'Kamel', 'Abas', 'Zine', 'Youssef', 'Oumarou', 'Tonga', 'Sylvano', 'Sami', 'Mohamed Ali'] },
        { username: 'Zohra', password: 'Zohra@40', role: 'coordinator', assignedTeachers: ['Aichetou', 'Inas', 'Anwar', 'Souha', 'Amal', 'Shanouja', 'Jana', 'Hiba'] },
        { username: 'Rasha', password: 'Rasha@26', role: 'coordinator', assignedTeachers: ['Amal', 'Rouba', 'Rayan', 'Imane', 'Nesrine', 'Fatima', 'Samar', 'Romana', 'Nour'] },
        ...['Morched', 'Kamel', 'Abas', 'Zine', 'Youssef', 'Oumarou', 'Tonga', 'Sylvano', 'Sami', 'Mohamed Ali', 'Aichetou', 'Inas', 'Anwar', 'Souha', 'Amal', 'Shanouja', 'Jana', 'Hiba', 'Rouba', 'Rayan', 'Imane', 'Nesrine', 'Fatima', 'Samar', 'Romana', 'Nour'].map(name => ({ username: name, password: name, role: 'teacher' }))
    ];

    document.getElementById('lang-en').addEventListener('click', () => changeAndRerenderLanguage('en'));
    document.getElementById('lang-fr').addEventListener('click', () => changeAndRerenderLanguage('fr'));
    
    document.getElementById('toggle-password').addEventListener('click', function() {
        const input = document.getElementById('password');
        const icon = this.querySelector('i');
        input.type = input.type === 'password' ? 'text' : 'password';
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const user = USERS_DATABASE.find(u => u.username === username && u.password === password);
        if (user) {
            if (document.getElementById('remember-me').checked) localStorage.setItem('teacherEvalCredentials', JSON.stringify({ username, password }));
            else localStorage.removeItem('teacherEvalCredentials');
            state.currentUser = user;
            user.role === 'coordinator' ? renderCoordinatorUI() : renderTeacherUI();
            showPage(user.role === 'coordinator' ? 'coordinator' : 'teacher');
        } else {
            document.getElementById('login-error').textContent = state.currentLang === 'fr' ? 'Identifiants invalides.' : 'Invalid credentials.';
        }
    });

    const logout = () => { state.currentUser = null; showPage('login'); };
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('logout-btn-teacher').addEventListener('click', logout);

    document.getElementById('teacher-select').addEventListener('change', (e) => {
        const teacherName = e.target.value;
        document.getElementById('evaluation-form-container').innerHTML = '';
        document.getElementById('previous-evaluations-container').innerHTML = '';
        if (teacherName) {
            renderPreviousEvaluations(teacherName);
            renderEvaluationForm(teacherName);
        }
    });
    
    const modal = document.getElementById('details-modal');
    modal.querySelector('#close-modal-btn').addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    const renderCoordinatorUI = () => {
        document.getElementById('coordinator-welcome').textContent = `${state.currentLang === 'fr' ? 'Bienvenue' : 'Welcome'}, ${state.currentUser.username}`;
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

    const renderTeacherUI = () => {
        document.getElementById('teacher-welcome').textContent = `${state.currentLang === 'fr' ? 'Bienvenue' : 'Welcome'}, ${state.currentUser.username}`;
        renderTeacherDashboard();
    };

    const renderPreviousEvaluations = (teacherName) => {
        const container = document.getElementById('previous-evaluations-container');
        const evals = EVALUATIONS_DATABASE.filter(e => e.teacherName === teacherName).sort((a,b) => new Date(b.date) - new Date(a.date));
        if (evals.length === 0) { container.innerHTML = ''; return; }
        container.innerHTML = `<div class="card">
            <h3 data-lang-en="Previous Evaluations" data-lang-fr="Évaluations Précédentes"></h3>
            <ul class="previous-eval-list">${evals.map(ev => `
                <li data-id="${ev.id}">
                    <div class="eval-info">
                        <i class="fas fa-calendar-alt"></i> ${new Date(ev.date).toLocaleDateString()}
                        <span class="eval-class"><b>${state.currentLang === 'fr' ? 'Classe' : 'Class'}:</b> ${ev.class || 'N/A'}</span>
                        <span><b>Score:</b> ${ev.grandTotal}/100</span>
                    </div>
                    <div class="eval-actions">
                        <button class="view-btn"><i class="fas fa-eye"></i> <span data-lang-en="View" data-lang-fr="Voir"></span></button>
                        <button class="word-btn"><i class="fas fa-file-word"></i> <span data-lang-en="Word" data-lang-fr="Word"></span></button>
                        <button class="delete-btn"><i class="fas fa-trash"></i> <span data-lang-en="Delete" data-lang-fr="Supprimer"></span></button>
                    </div>
                </li>`).join('')}
            </ul></div>`;
        setLanguage(state.currentLang);
    };

    document.getElementById('previous-evaluations-container').addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        const evalId = li.dataset.id;
        if (e.target.closest('.view-btn')) window.showEvaluationDetails(evalId);
        if (e.target.closest('.word-btn')) window.generateTeacherWordReport(evalId);
        if (e.target.closest('.delete-btn')) window.deleteEvaluation(evalId);
    });

    const renderEvaluationForm = (teacherName) => {
        const visitNumber = EVALUATIONS_DATABASE.filter(e => e.teacherName === teacherName).length + 1;
        const criteria = getCriteria();
        let criteriaIndex = 0;
        let formHTML = `<form id="eval-form" class="card">
            <h3><i class="fas fa-clipboard-list"></i> <span data-lang-en="New Evaluation for ${teacherName}" data-lang-fr="Nouvelle Évaluation pour ${teacherName}"></span></h3>
            <div class="evaluation-metadata"><div class="metadata-row">
                <div class="metadata-item"><label data-lang-en="Visit Number" data-lang-fr="Numéro de Visite"></label><input type="text" value="${visitNumber}" readonly></div>
                <div class="metadata-item"><label data-lang-en="Visit Date" data-lang-fr="Date de Visite"></label><input type="date" name="visitDate" required value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="metadata-item"><label data-lang-en="Session (1-8)" data-lang-fr="Séance (1-8)"></label><select name="sessionNumber" required>${Array.from({length: 8}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}</select></div>
                <div class="metadata-item"><label data-lang-en="Class" data-lang-fr="Classe"></label><input type="text" name="class" required placeholder-fr="Ex: 6ème A" placeholder-en="Ex: Grade 6A"></div>
                <div class="metadata-item"><label data-lang-en="Subject" data-lang-fr="Matière"></label><input type="text" name="subject" required placeholder-fr="Ex: Mathématiques" placeholder-en="Ex: Mathematics"></div>
            </div></div>`;
        for(const category in criteria) {
            const cat = criteria[category];
            formHTML += `<fieldset class="criteria-section">
                <legend class="category-header"><span class="category-title" data-lang-en="${cat.title_en}" data-lang-fr="${cat.title_fr}"></span><span class="category-points"><span class="current-score">0</span>/${cat.maxPoints} pts</span></legend>
                <div class="criteria-table"><div class="table-header"><div class="criteria-col" data-lang-en="Criteria" data-lang-fr="Critères"></div><div class="points-col" data-lang-en="Points" data-lang-fr="Points"></div><div class="rating-col" data-lang-en="Rating" data-lang-fr="Éval."></div><div class="score-col">Score</div></div>`;
            cat.items.forEach(item => {
                formHTML += `<div class="criteria-row"><div class="criteria-text" data-lang-en="${item.text_en}" data-lang-fr="${item.text_fr}"></div><div class="max-points">${item.points}</div><div class="rating-controls">${[1,2,3,4,5].map(n => `<input type="radio" id="c${criteriaIndex}-${n}" name="crit${criteriaIndex}" value="${n}" data-max-points="${item.points}" required><label for="c${criteriaIndex}-${n}">${n}</label>`).join('')}</div><div class="calculated-score" data-criteria="${criteriaIndex}">0</div></div>`;
                criteriaIndex++;
            });
            formHTML += `</div></fieldset>`;
        }
        formHTML += `<div class="evaluation-summary"><div class="total-score-section"><div class="score-display"><span class="total-number" id="grand-total-display">0</span><span class="total-max">/100</span></div><div id="performance-level"></div></div></div>
            <div class="comments-section">
                <div class="comment-group"><label for="s"><i class="fas fa-star"></i> <span data-lang-en="Strengths" data-lang-fr="Forces"></span></label><textarea id="s" name="strengths" required></textarea></div>
                <div class="comment-group"><label for="i"><i class="fas fa-arrow-up"></i> <span data-lang-en="Improvements" data-lang-fr="Améliorations"></span></label><textarea id="i" name="toImprove" required></textarea></div>
                <div class="comment-group"><label for="r"><i class="fas fa-lightbulb"></i> <span data-lang-en="Recommendations" data-lang-fr="Recommandations"></span></label><textarea id="r" name="recommendations" required></textarea></div>
            </div>
            <div class="form-actions"><button type="submit" class="submit-btn"><i class="fas fa-save"></i> <span data-lang-en="Save Evaluation" data-lang-fr="Enregistrer"></span></button></div></form>`;
        
        const container = document.getElementById('evaluation-form-container');
        container.innerHTML = formHTML;
        setLanguage(state.currentLang);

        const form = container.querySelector('#eval-form');
        form.addEventListener('change', () => calculateScores(form));
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (form.querySelectorAll('input[type="radio"]:checked').length < criteriaIndex) { alert(state.currentLang === 'fr' ? 'Veuillez noter tous les critères.' : 'Please rate all criteria.'); return; }
            const formData = new FormData(e.target);
            const scores = calculateScores(form);
            const rawCriteria = Array.from(form.querySelectorAll('input[type="radio"]:checked')).reduce((acc, r) => ({...acc, [r.name]: {rating: parseInt(r.value)}}), {});
            EVALUATIONS_DATABASE.push({
                id: Date.now().toString(), teacherName, coordinatorName: state.currentUser.username,
                class: formData.get('class'), subject: formData.get('subject'), sessionNumber: formData.get('sessionNumber'), visitDate: formData.get('visitDate'),
                criteriaDetails: getCriteria(), grandTotal: scores.grandTotal,
                comments: { strengths: formData.get('strengths'), toImprove: formData.get('toImprove'), recommendations: formData.get('recommendations') },
                date: new Date().toISOString(), rawCriteria
            });
            saveDb();
            alert(state.currentLang === 'fr' ? 'Évaluation enregistrée !' : 'Evaluation saved!');
            document.getElementById('teacher-select').value = '';
            container.innerHTML = '';
            document.getElementById('previous-evaluations-container').innerHTML = '';
        });
    };
    
    const calculateScores = (form) => {
        let grandTotal = 0;
        form.querySelectorAll('input[type="radio"]:checked').forEach(r => {
            const score = Math.round((parseInt(r.value) / 5) * parseInt(r.dataset.maxPoints));
            grandTotal += score;
        });
        const perf = getPerformanceLevel(grandTotal);
        form.querySelector('#grand-total-display').textContent = grandTotal;
        const levelEl = form.querySelector('#performance-level');
        levelEl.textContent = perf[`label_${state.currentLang}`];
        levelEl.className = `performance-level ${perf.class}`;
        return { grandTotal };
    };

    const renderTeacherDashboard = () => {
        const container = document.getElementById('evaluation-reports');
        const evals = EVALUATIONS_DATABASE.filter(ev => ev.teacherName === state.currentUser.username).sort((a, b) => new Date(b.date) - new Date(a.date));
        if (evals.length === 0) { container.innerHTML = `<div class="card no-evaluations"><h3 data-lang-en="No evaluations available" data-lang-fr="Aucune évaluation disponible"></h3></div>`; setLanguage(state.currentLang); return; }
        container.innerHTML = evals.map((ev, index) => {
            const perf = getPerformanceLevel(ev.grandTotal);
            return `<div class="evaluation-card ${index === 0 ? 'latest' : ''}">
                <div class="card-header"><div class="eval-date"><i class="fas fa-calendar-check"></i> ${new Date(ev.date).toLocaleDateString()} ${index === 0 ? `<span class="latest-badge">${state.currentLang === 'fr'?'RÉCENT':'LATEST'}</span>` : ''}</div><div class="eval-meta">${state.currentLang === 'fr'?'Évaluateur':'Evaluator'}: ${ev.coordinatorName}</div></div>
                <div class="card-content">
                    <div class="overall-progress">
                        <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${ev.grandTotal}%; background-color: ${perf.color};"></div></div>
                        <div class="score-summary"><span class="score-number">${ev.grandTotal}</span><span class="score-max">/100</span><span class="performance-badge" style="background-color: ${perf.color}">${perf[`label_${state.currentLang}`]}</span></div>
                    </div>
                    <div class="card-actions">
                        <button class="details-btn" onclick="window.showEvaluationDetails('${ev.id}')"><i class="fas fa-search-plus"></i> <span data-lang-en="View Details" data-lang-fr="Voir Détails"></span></button>
                        <button class="word-btn" onclick="window.generateTeacherWordReport('${ev.id}')"><i class="fas fa-file-word"></i> <span data-lang-en="Download" data-lang-fr="Télécharger"></span></button>
                    </div>
                </div>
            </div>`;}).join('');
        setLanguage(state.currentLang);
    };
    
    window.showEvaluationDetails = (evalId) => {
        const ev = EVALUATIONS_DATABASE.find(e => e.id === evalId); if (!ev) return;
        let critIndex = 0;
        document.getElementById('modal-body-content').innerHTML = `
            <div class="detail-grid">
                <div><strong>${state.currentLang === 'fr' ? 'Date' : 'Date'}:</strong> ${new Date(ev.date).toLocaleDateString()}</div>
                <div><strong>${state.currentLang === 'fr' ? 'Classe' : 'Class'}:</strong> ${ev.class || 'N/A'}</div>
                <div><strong>${state.currentLang === 'fr' ? 'Matière' : 'Subject'}:</strong> ${ev.subject || 'N/A'}</div>
                <div><strong>${state.currentLang === 'fr' ? 'Séance N°' : 'Session #'}:</strong> ${ev.sessionNumber || 'N/A'}</div>
            </div>
            <h4>${state.currentLang === 'fr' ? 'Tableau des Scores' : 'Scores Table'}</h4>
            <div class="criteria-table-details">${Object.values(ev.criteriaDetails).map(cat => `
                <div class="category-detail-header">${cat[`title_${state.currentLang}`]}</div>
                ${cat.items.map(item => {
                    const rating = (ev.rawCriteria && ev.rawCriteria[`crit${critIndex}`]) ? ev.rawCriteria[`crit${critIndex}`].rating : 'N/A';
                    const score = (rating !== 'N/A') ? Math.round((rating / 5) * item.points) : 'N/A';
                    critIndex++;
                    return `<div class="criteria-detail-row">
                        <div class="criteria-detail-text">${item[`text_${state.currentLang}`]}</div>
                        <div class="criteria-detail-rating">Note: <strong>${rating}/5</strong></div>
                        <div class="criteria-detail-score">Score: <strong>${score}/${item.points}</strong></div>
                    </div>`;
                }).join('')}`).join('')}
            </div>
            <h4>${state.currentLang === 'fr' ? 'Commentaires' : 'Comments'}</h4>
            <div class="comments-details">
                <div class="comment-item"><h6><i class="fas fa-star"></i> ${state.currentLang === 'fr' ? 'Forces' : 'Strengths'}</h6><p>${ev.comments.strengths || ''}</p></div>
                <div class="comment-item"><h6><i class="fas fa-arrow-up"></i> ${state.currentLang === 'fr' ? 'Améliorations' : 'Improvements'}</h6><p>${ev.comments.toImprove || ''}</p></div>
                <div class="comment-item"><h6><i class="fas fa-lightbulb"></i> ${state.currentLang === 'fr' ? 'Recommandations' : 'Recommendations'}</h6><p>${ev.comments.recommendations || ''}</p></div>
            </div>`;
        document.getElementById('details-modal').style.display = 'flex';
    };

    window.generateTeacherWordReport = async (evalId) => {
        // CORRECTION FINALE : Vérifier si la librairie est chargée et l'utiliser SANS 'window.'
        if (typeof docx === 'undefined' || typeof saveAs === 'undefined') {
            console.error("Erreur critique : Les librairies docx ou FileSaver ne sont pas chargées.");
            alert("Erreur critique : Une librairie nécessaire n'a pas pu être chargée. Veuillez rafraîchir la page et réessayer.");
            return;
        }

        try {
            const data = EVALUATIONS_DATABASE.find(ev => ev.id === evalId);
            if (!data) throw new Error("Évaluation non trouvée !");
            
            const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableCell, TableRow, WidthType, AlignmentType } = docx;
            
            let critIndex = 0;
            const tableRows = Object.values(data.criteriaDetails || {}).flatMap(cat => {
                const categoryRows = [ new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: cat[`title_${state.currentLang}`] || '', bold: true })], columnSpan: 3, shading: { fill: "EAECEE" } })] }) ];
                const itemRows = (cat.items || []).map(item => {
                    const rating = (data.rawCriteria && data.rawCriteria[`crit${critIndex}`]) ? data.rawCriteria[`crit${critIndex}`].rating : 0;
                    critIndex++;
                    return new TableRow({ children: [
                        new TableCell({ children: [new Paragraph(item[`text_${state.currentLang}`] || '')] }),
                        new TableCell({ children: [new Paragraph({ text: rating.toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: `${Math.round((rating / 5) * item.points)}/${item.points}`, alignment: AlignmentType.CENTER })] }),
                    ]});
                });
                return categoryRows.concat(itemRows);
            });

            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({ text: "RAPPORT D'ÉVALUATION PÉDAGOGIQUE", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                        new Paragraph({ text: '' }),
                        new Paragraph({ children: [new TextRun({ text: `Enseignant: `, bold: true }), new TextRun(data.teacherName || '')] }),
                        new Paragraph({ children: [new TextRun({ text: `Date: `, bold: true }), new TextRun(data.visitDate || '')] }),
                        new Paragraph({ children: [new TextRun({ text: `Classe: `, bold: true }), new TextRun(data.class || 'N/A')] }),
                        new Paragraph({ text: '' }),
                        new Paragraph({ children: [new TextRun({ text: `SCORE TOTAL: ${data.grandTotal || 0}/100`, bold: true, size: 28 })] }),
                        new Paragraph({ text: '' }),
                        new Paragraph({ text: 'TABLEAU DÉTAILLÉ DES NOTES', heading: HeadingLevel.HEADING_2 }),
                        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [ new TableRow({ children: [ new TableCell({ children: [new Paragraph({text: 'Critère', bold: true})] }), new TableCell({ children: [new Paragraph({text: 'Note (1-5)', bold: true})] }), new TableCell({ children: [new Paragraph({text: 'Score', bold: true})] })]}), ...tableRows ] }),
                        new Paragraph({ text: '' }), new Paragraph({ text: 'FORCES OBSERVÉES', heading: HeadingLevel.HEADING_2 }), new Paragraph({ text: data.comments.strengths || '' }),
                        new Paragraph({ text: '' }), new Paragraph({ text: 'AXES D\'AMÉLIORATION', heading: HeadingLevel.HEADING_2 }), new Paragraph({ text: data.comments.toImprove || '' }),
                        new Paragraph({ text: '' }), new Paragraph({ text: 'RECOMMANDATIONS', heading: HeadingLevel.HEADING_2 }), new Paragraph({ text: data.comments.recommendations || '' }),
                    ]
                }]
            });
            
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `Evaluation_${data.teacherName}_${data.visitDate}.docx`);

        } catch (error) {
            console.error("Erreur détaillée de la génération Word:", error);
            alert(state.currentLang === 'fr' ? "Erreur: Impossible de générer le document Word. Consultez la console pour plus de détails." : "Error: Could not generate Word document. Check console for details.");
        }
    }

    window.deleteEvaluation = (evalId) => {
        const confirmText = state.currentLang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette évaluation ?' : 'Are you sure you want to delete this evaluation?';
        if (confirm(confirmText)) {
            const index = EVALUATIONS_DATABASE.findIndex(ev => ev.id === evalId);
            if (index > -1) {
                const teacherName = EVALUATIONS_DATABASE[index].teacherName;
                EVALUATIONS_DATABASE.splice(index, 1);
                saveDb();
                renderPreviousEvaluations(teacherName);
                renderEvaluationForm(teacherName);
            }
        }
    }

    const getPerformanceLevel = (score) => {
        if (score >= 90) return { label_en: "Excellent", label_fr: "Excellent", class: "excellent", color: "#27ae60" };
        if (score >= 80) return { label_en: "Very Good", label_fr: "Très Bien", class: "very-good", color: "#2ecc71" };
        if (score >= 70) return { label_en: "Good", label_fr: "Bien", class: "good", color: "#f39c12" };
        if (score >= 60) return { label_en: "Satisfactory", label_fr: "Satisfaisant", class: "satisfactory", color: "#e67e22" };
        return { label_en: "Needs Improvement", label_fr: "À améliorer", class: "needs-improvement", color: "#e74c3c" };
    };
    const getCriteria = () => ({ preparation: { title_en: "PREPARATION AND PLANNING", title_fr: "PRÉPARATION ET PLANIFICATION", maxPoints: 25, items: [{ text_en: "Lesson plans with clear objectives", text_fr: "Plans de cours avec objectifs clairs", points: 5 }, { text_en: "Knowledge of curriculum", text_fr: "Connaissance du curriculum", points: 5 }, { text_en: "Appropriate materials", text_fr: "Matériaux appropriés", points: 5 }, { text_en: "Differentiated instruction", text_fr: "Enseignement différencié", points: 5 }, { text_en: "Assessments aligned with objectives", text_fr: "Évaluations alignées aux objectifs", points: 5 } ]}, activities: { title_en: "TEACHING ACTIVITIES", title_fr: "ACTIVITÉS D'ENSEIGNEMENT", maxPoints: 30, items: [{ text_en: "Clear and structured lessons", text_fr: "Leçons claires et structurées", points: 6 }, { text_en: "Varied teaching strategies", text_fr: "Stratégies d'enseignement variées", points: 6 }, { text_en: "Appropriate use of technology", text_fr: "Usage approprié de la technologie", points: 6 }, { text_en: "Promotes critical thinking", text_fr: "Favorise la pensée critique", points: 6 }, { text_en: "Timely and constructive feedback", text_fr: "Feedback opportun et constructif", points: 6 } ]}, classroomControl: { title_en: "CLASSROOM MANAGEMENT", title_fr: "GESTION DE CLASSE", maxPoints: 20, items: [{ text_en: "Conducive learning environment", text_fr: "Environnement d'apprentissage propice", points: 5 }, { text_en: "Effective student behavior management", text_fr: "Gestion efficace du comportement", points: 5 }, { text_en: "Efficient use of time", text_fr: "Utilisation efficace du temps", points: 5 }, { text_en: "Handles disruptions professionally", text_fr: "Gère les perturbations", points: 5 } ]}, personalCriteria: { title_en: "PROFESSIONAL QUALITIES", title_fr: "QUALITÉS PROFESSIONNELLES", maxPoints: 25, items: [{ text_en: "Professional appearance", text_fr: "Apparence professionnelle", points: 5 }, { text_en: "Punctuality and reliability", text_fr: "Ponctualité et fiabilité", points: 5 }, { text_en: "Effective communication", text_fr: "Communication efficace", points: 5 }, { text_en: "Continuous professional development", text_fr: "Développement professionnel continu", points: 5 }, { text_en: "Dedication to student success", text_fr: "Dévouement au succès des étudiants", points: 5 } ]} });

    loadDb();
    const savedCreds = localStorage.getItem('teacherEvalCredentials');
    if (savedCreds) {
        const { username, password } = JSON.parse(savedCreds);
        document.getElementById('username').value = username;
        document.getElementById('password').value = password;
        document.getElementById('remember-me').checked = true;
    }
    setLanguage('fr');
});
