/**
 * API simulée pour tester l'intégration MongoDB en développement
 * Simule les endpoints MongoDB pour les tests locaux
 */

class MockAPI {
    constructor() {
        this.mockData = JSON.parse(localStorage.getItem('mockMongoDB') || '[]');
        this.setupFetchInterceptor();
    }

    setupFetchInterceptor() {
        // Intercepter les appels fetch vers /api/
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // Vérifier si c'est un appel vers notre API
            if (typeof url === 'string' && url.startsWith('/api/')) {
                return this.handleMockRequest(url, options);
            }
            
            // Pour tous les autres appels, utiliser fetch normal
            return originalFetch(url, options);
        };

        console.log('🔧 Mock API activée pour les tests de développement');
    }

    async handleMockRequest(url, options) {
        console.log('🌐 Mock API Request:', options.method || 'GET', url);
        
        // Ajouter un délai pour simuler une vraie API
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        try {
            if (url === '/api/health') {
                return this.createMockResponse({
                    success: true,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    message: 'Mock MongoDB API is operational',
                    database: 'Mock MongoDB connected'
                });
            }

            if (url === '/api/evaluations') {
                if (options.method === 'POST') {
                    // Créer une nouvelle évaluation
                    const evaluation = JSON.parse(options.body);
                    evaluation.id = evaluation.id || Date.now().toString();
                    evaluation.createdAt = new Date().toISOString();
                    
                    this.mockData.push(evaluation);
                    this.saveMockData();
                    
                    return this.createMockResponse({
                        success: true,
                        message: 'Évaluation créée avec succès (Mock MongoDB)',
                        data: evaluation
                    }, 201);
                } else {
                    // GET - récupérer les évaluations
                    const urlParams = new URLSearchParams(url.split('?')[1]);
                    const teacherName = urlParams.get('teacherName');
                    
                    let data = [...this.mockData];
                    if (teacherName) {
                        data = data.filter(eval => eval.teacherName === teacherName);
                    }
                    
                    data.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    return this.createMockResponse({
                        success: true,
                        data: data
                    });
                }
            }

            if (url.startsWith('/api/evaluations/')) {
                const evalId = url.split('/')[3];
                const evalIndex = this.mockData.findIndex(eval => eval.id === evalId);
                
                if (options.method === 'DELETE') {
                    if (evalIndex === -1) {
                        return this.createMockResponse({
                            success: false,
                            message: 'Évaluation non trouvée'
                        }, 404);
                    }
                    
                    this.mockData.splice(evalIndex, 1);
                    this.saveMockData();
                    
                    return this.createMockResponse({
                        success: true,
                        message: 'Évaluation supprimée avec succès (Mock MongoDB)'
                    });
                }
                
                if (options.method === 'GET') {
                    if (evalIndex === -1) {
                        return this.createMockResponse({
                            success: false,
                            message: 'Évaluation non trouvée'
                        }, 404);
                    }
                    
                    return this.createMockResponse({
                        success: true,
                        data: this.mockData[evalIndex]
                    });
                }
                
                if (options.method === 'PUT') {
                    if (evalIndex === -1) {
                        return this.createMockResponse({
                            success: false,
                            message: 'Évaluation non trouvée'
                        }, 404);
                    }
                    
                    const updateData = JSON.parse(options.body);
                    this.mockData[evalIndex] = { ...this.mockData[evalIndex], ...updateData, updatedAt: new Date().toISOString() };
                    this.saveMockData();
                    
                    return this.createMockResponse({
                        success: true,
                        message: 'Évaluation mise à jour avec succès (Mock MongoDB)'
                    });
                }
            }

            if (url === '/api/sync-data') {
                if (options.method === 'POST') {
                    const { evaluations } = JSON.parse(options.body);
                    
                    // Synchroniser les données
                    evaluations.forEach(eval => {
                        const existingIndex = this.mockData.findIndex(existing => existing.id === eval.id);
                        if (existingIndex === -1) {
                            this.mockData.push({ ...eval, syncedAt: new Date().toISOString() });
                        } else {
                            this.mockData[existingIndex] = { ...eval, syncedAt: new Date().toISOString() };
                        }
                    });
                    
                    this.saveMockData();
                    
                    return this.createMockResponse({
                        success: true,
                        message: `${evaluations.length} évaluations synchronisées avec succès (Mock MongoDB)`
                    });
                }
            }

            if (url === '/api/users') {
                const users = [
                    { username: 'Mohamed', role: 'coordinator', assignedTeachers: ['Morched', 'Kamel', 'Abas', 'Zine', 'Youssef', 'Oumarou', 'Tonga', 'Sylvano', 'Sami', 'Mohamed Ali'] },
                    { username: 'Zohra', role: 'coordinator', assignedTeachers: ['Aichetou', 'Inas', 'Anwar', 'Souha', 'Amal', 'Shanouja', 'Jana', 'Hiba'] },
                    { username: 'Rasha', role: 'coordinator', assignedTeachers: ['Amal', 'Rouba', 'Rayan', 'Imane', 'Nesrine', 'Fatima', 'Samar', 'Romana', 'Nour'] },
                    ...['Morched', 'Kamel', 'Abas', 'Zine', 'Youssef', 'Oumarou', 'Tonga', 'Sylvano', 'Sami', 'Mohamed Ali', 'Aichetou', 'Inas', 'Anwar', 'Souha', 'Amal', 'Shanouja', 'Jana', 'Hiba', 'Rouba', 'Rayan', 'Imane', 'Nesrine', 'Fatima', 'Samar', 'Romana', 'Nour'].map(name => ({ username: name, role: 'teacher' }))
                ];
                
                return this.createMockResponse({
                    success: true,
                    data: users
                });
            }

            // Route non trouvée
            return this.createMockResponse({
                error: 'Endpoint not found (Mock API)',
                message: 'Mock Teacher Evaluation System API',
                availableEndpoints: [
                    '/api/health',
                    '/api/evaluations',
                    '/api/evaluations/:id',
                    '/api/users',
                    '/api/sync-data'
                ]
            }, 404);

        } catch (error) {
            console.error('❌ Mock API Error:', error);
            return this.createMockResponse({
                success: false,
                error: 'Internal mock server error',
                message: error.message
            }, 500);
        }
    }

    createMockResponse(data, status = 200) {
        const response = new Response(JSON.stringify(data), {
            status,
            statusText: status === 200 ? 'OK' : status === 201 ? 'Created' : status === 404 ? 'Not Found' : 'Error',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Ajouter les méthodes manquantes pour compatibilité
        response.ok = status >= 200 && status < 300;
        
        return Promise.resolve(response);
    }

    saveMockData() {
        localStorage.setItem('mockMongoDB', JSON.stringify(this.mockData));
        console.log('💾 Mock MongoDB data saved:', this.mockData.length, 'evaluations');
    }

    // Méthodes utilitaires pour les tests
    clearMockData() {
        this.mockData = [];
        this.saveMockData();
        console.log('🗑️ Mock MongoDB data cleared');
    }

    exportMockData() {
        return {
            evaluations: [...this.mockData],
            timestamp: new Date().toISOString()
        };
    }

    importMockData(data) {
        this.mockData = data.evaluations || [];
        this.saveMockData();
        console.log('📥 Mock MongoDB data imported:', this.mockData.length, 'evaluations');
    }
}

// Initialiser l'API simulée si on est en développement
if (window.location.hostname === 'localhost' || window.location.hostname.includes('sandbox')) {
    window.mockAPI = new MockAPI();
    
    // Ajouter des utilitaires de test à la console
    window.testMongoDB = {
        clear: () => window.mockAPI.clearMockData(),
        export: () => window.mockAPI.exportMockData(),
        import: (data) => window.mockAPI.importMockData(data),
        status: () => window.dbManager ? window.dbManager.getSyncStatus() : 'dbManager not ready'
    };
    
    console.log('🧪 Mode test activé - API MongoDB simulée');
    console.log('🔧 Utilitaires disponibles: window.testMongoDB');
}